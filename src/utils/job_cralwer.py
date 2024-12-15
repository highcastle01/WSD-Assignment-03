import time
import json
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium_stealth import stealth

def random_wait(min_sec=3, max_sec=8):
    time.sleep(random.uniform(min_sec, max_sec))

# Selenium WebDriver 설정
options = webdriver.ChromeOptions()
options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36')
options.add_argument('--headless')
options.add_argument("--window-size=1920,1080")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=options)

# Stealth 설정
stealth(driver,
        languages=["ko-KR", "ko"],
        vendor="Google Inc.",
        platform="Win32",
        webgl_vendor="Intel Inc.",
        renderer="Intel Iris OpenGL Engine",
        fix_hairline=True,
        )

# 기본 URL
base_url = "https://www.saramin.co.kr/zf_user/jobs/list/job-category"

# 페이지별 URL 템플릿
url_template = (
    f"{base_url}?page={{page}}&cat_mcls=16%2C14%2C3%2C5%2C4%2C2%2C15%2C8%2C21%2C18%2C12%2C7%2C10%2C11%2C22%2C6%2C9%2C19%2C13%2C17%2C20"
    "&search_optional_item=n&search_done=y&panel_count=y&preview=y&isAjaxRequest=0&page_count=50&sort=RL&type=job-category"
)

# 상세 정보를 수집하는 함수
def scrape_job_details(jobs):
    detailed_jobs = []
    for job in jobs:
        try:
            driver.get(job["job_href"])
            random_wait(4, 10)

            # 첫 섹션 로드 대기
            first_section = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="content"]/div[3]/section[1]'))
            )

            details = {
                "회사": first_section.find_element(By.CSS_SELECTOR, "div.wrap_jv_header > div > h1").text.strip(),
                "제목": first_section.find_element(By.CSS_SELECTOR, "div.wrap_jv_header > div > div.title_inner > a.company").text.strip(),
                "경력": first_section.find_element(By.CSS_SELECTOR, "div.jv_summary > div > div:nth-child(1) > dl:nth-child(1) > dd > strong").text.strip(),
                "급여": first_section.find_element(By.CSS_SELECTOR, "div.jv_summary > div > div:nth-child(2) > dl:nth-child(1) > dd").text.strip(),
                "학력": first_section.find_element(By.CSS_SELECTOR, "div.jv_summary > div > div:nth-child(1) > dl:nth-child(2) > dd > strong").text.strip(),
                "직급": first_section.find_element(By.CSS_SELECTOR, "div.jv_summary > div > div:nth-child(2) > dl:nth-child(2) > dd").text.strip(),
                "근무형태": first_section.find_element(By.CSS_SELECTOR, "div.jv_summary > div > div:nth-child(1) > dl:nth-child(3) > dd > strong").text.strip(),
                "근무지역": first_section.find_element(By.XPATH, '//*[@id="content"]/div[3]/section[1]/div[1]/div[2]/div/div[2]/dl[3]/dd').text.strip(),
                "시작일": first_section.find_element(By.CSS_SELECTOR, "div.jv_howto > div > div > dl > dd:nth-child(2)").text.strip(),
                "마감일": first_section.find_element(By.CSS_SELECTOR, "div.jv_howto > div > div > dl > dd:nth-child(4)").text.strip(),
            }

            company_info = {}
            info_elements = first_section.find_elements(By.CSS_SELECTOR, "div.jv_company > div.cont.box > div > div.info_area > dl")
            for info in info_elements:
                try:
                    key = info.find_element(By.TAG_NAME, "dt").text.strip()
                    value = info.find_element(By.TAG_NAME, "dd").text.strip()
                    company_info[key] = value
                except:
                    continue

            job.update({
                "details": details,
                "company_info": company_info,
            })
            detailed_jobs.append(job)

            random_wait(3, 7)

        except Exception as e:
            print(f"Error extracting job details for {job['job_title']}: {e}")
            continue

    return detailed_jobs

# 모든 페이지의 공고 수집
def scrape_jobs_and_details():
    all_jobs = []
    page = 1

    while len(all_jobs) < 500:
        try:
            # 페이지 URL 생성
            page_url = url_template.format(page=page)
            driver.get(page_url)
            random_wait(4, 10)

            # 현재 페이지 로딩 대기
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "#default_list_wrap > section > div"))
            )

            job_elements = driver.find_elements(By.CSS_SELECTOR, "#default_list_wrap > section > div > div")
            print(f"\nPage {page}: Found {len(job_elements)} jobs")

            page_jobs = []
            for job in job_elements:
                try:
                    job_id = job.get_attribute("id")
                    if not job_id.startswith("rec-"):
                        continue

                    company_nm_elem = job.find_element(By.CSS_SELECTOR, "div.box_item > div.col.company_nm > a")
                    company_name = company_nm_elem.text.strip()
                    company_href = company_nm_elem.get_attribute("href")

                    job_title_elem = job.find_element(By.CSS_SELECTOR, "div.box_item > div.col.notification_info > a.job_tit")
                    job_title = job_title_elem.get_attribute("title")
                    job_href = job_title_elem.get_attribute("href")

                    tech_stack = [tech.text.strip() for tech in job.find_elements(By.CSS_SELECTOR, "div.box_item > div.col.notification_info > div.job_meta > span")]

                    page_jobs.append({
                        "company_name": company_name,
                        "company_href": company_href,
                        "job_title": job_title,
                        "job_href": job_href,
                        "tech_stack": tech_stack,
                    })

                    if len(all_jobs) >= 500:
                        break

                except Exception as e:
                    print(f"  Error extracting job data: {e}")
                    continue

            # 상세정보 수집
            print(f"Collecting details for {len(page_jobs)} jobs on page {page}...")
            page_detailed_jobs = scrape_job_details(page_jobs)
            all_jobs.extend(page_detailed_jobs)

            if len(all_jobs) >= 500:
                break

            # 다음 페이지로 이동
            page += 1

        except Exception as e:
            print(f"Error on page {page}: {e}")
            break

    return all_jobs

# 실행
try:
    print("Starting job collection...")
    all_jobs = scrape_jobs_and_details()

    # 결과를 JSON으로 저장
    with open("jobs.json", "w", encoding="utf-8") as f:
        json.dump(all_jobs, f, ensure_ascii=False, indent=4)

    print("\nJob details saved to jobs.json")
finally:
    driver.quit()
