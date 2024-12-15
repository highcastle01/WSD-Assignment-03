from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
from datetime import datetime
import random


def get_page_data(driver, url):
    driver.get(url)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, '#listTop > ul > li')))
    time.sleep(random.uniform(2, 4))  # 페이지 로딩 후 추가 대기

    items = driver.find_elements(By.CSS_SELECTOR, '#listTop > ul > li')
    data = []

    for item in items:
        try:
            분야 = item.find_element(By.CSS_SELECTOR, 'a > p.sub_title > span').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > p.sub_title > span') else ''
            채용여부 = item.find_element(By.CSS_SELECTOR, 'a > p.sub_title > em').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > p.sub_title > em') else ''
            타이틀 = item.find_element(By.CSS_SELECTOR, 'a > p.title > em').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > p.title > em') else ''
            회사이름 = item.find_element(By.CSS_SELECTOR,
                                     'a > div > div.txt_detail > p.company_name').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > div > div.txt_detail > p.company_name') else ''
            부서 = item.find_element(By.CSS_SELECTOR,
                                   'a > div > div.txt_detail > p.company_part > em.inpart').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > div > div.txt_detail > p.company_part > em.inpart') else ''
            작성자 = item.find_element(By.CSS_SELECTOR,
                                    'a > div > div.txt_detail > p.company_part > em.inname').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > div > div.txt_detail > p.company_part > em.inname') else ''
            작성일자 = item.find_element(By.CSS_SELECTOR,
                                     'a > div > div.txt_detail > p:nth-child(3) > span:nth-child(1)').text.strip() if item.find_elements(
                By.CSS_SELECTOR, 'a > div > div.txt_detail > p:nth-child(3) > span:nth-child(1)') else ''
            게시글링크 = item.find_element(By.CSS_SELECTOR, 'a').get_attribute('href') if item.find_elements(
                By.CSS_SELECTOR, 'a') else ''

            item_data = {
                '분야': 분야,
                '채용여부': 채용여부,
                '타이틀': 타이틀,
                '회사이름': 회사이름,
                '부서': 부서,
                '작성자': 작성자,
                '작성일자': 작성일자,
                '게시글링크': 게시글링크
            }
            data.append(item_data)
            print(f"수집된 항목: {item_data['타이틀']} - {item_data['회사이름']}")
            time.sleep(random.uniform(0.5, 1.5))  # 각 항목 수집 후 랜덤 대기

        except Exception as e:
            print(f"항목 수집 중 오류 발생: {str(e)}")
            continue

    return data


def save_to_jsonl(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        for item in data:
            json_str = json.dumps(item, ensure_ascii=False)
            f.write(json_str + '\n')
    print(f"데이터가 {filename}에 저장되었습니다.")


def main():
    # 현재 시간을 파일명에 포함
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f'saramin_data_{current_time}.jsonl'

    # Chrome 옵션 설정
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    # User-Agent 설정
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {
        "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    base_url = 'https://www.saramin.co.kr/zf_user/career-information/senior-list'
    all_data = []
    page = 1

    try:
        while len(all_data) < 200:
            url = f'{base_url}?page={page}'
            print(f"\n--- 페이지 {page} 수집 시작 ---")
            page_data = get_page_data(driver, url)
            all_data.extend(page_data)
            print(f"--- 페이지 {page} 수집 완료 (총 {len(all_data)}개 항목) ---")
            page += 1
            time.sleep(random.uniform(3, 7))  # 페이지 간 랜덤 대기

            if len(all_data) >= 200:
                all_data = all_data[:200]
                break

    except Exception as e:
        print(f"크롤링 중 오류 발생: {str(e)}")

    finally:
        driver.quit()

    print(f'\n총 {len(all_data)}개의 항목을 수집했습니다.')
    save_to_jsonl(all_data, output_file)


if __name__ == '__main__':
    main()
