# 웹서비스설계 과제 3

## 제작자
- **202012237 임성혁**

## 사용 프레임워크 및 기술
- **Express**: Node.js 기반 웹 프레임워크
- **MySQL**: 데이터베이스
- **Swagger**: API 문서화 및 테스트
- **환경**: JCloud 서버

---

## 서버 URL
- **Base URL**: `http://113.198.66.75:18225`

---

## API 문서 확인
- **Swagger URL**: `http://113.198.66.75:18225/api-docs`

---

## DB
- **DB URL**: `http://113.198.66.75:13225` 
3000번 포트에 두었습니다. 해당 링크로 접속하기보다 직접 내부 포트로 접속하시는 걸 추천합니다.

---

## 실행 방법
1. **서버 실행**
   ```bash
   npm install
   sudo npm start
2. **DB 실행**
   ```bash
   서버실행하면 바로 실행됩니다.
3. **ENV 파일**
   ```bash
   첨부해두었으나 아래에 다시 적어두었습니다.
   
   DB_HOST=localhost
   DB_PORT=3000
   DB_USER=castle
   DB_PASSWORD=castle
   DB_NAME=wsd03
   PORT=80
   SWAGGER_PORT=4000
   
   JWT_SECRET=1q2w3e4r5t!
   JWT_REFRESH_SECRET=1q2w3e4r5t!
4. **크롤링 파일 실행방법**
   ```bash
   job_cralwer.py : python3 job_cralwer.py
   => 실행하게 되면 채용공고와 회사정보가 크롤링됩니다.
   
   company_review_cralwer.py : python3 company_review_cralwer.py
   => 실행하게 되면 회사리뷰 크롤링이됩니다.(필수 사항 아님)
5. **utils 파일 실행방법**
   ```bash
   company_job.js : node company_job.js
   => 실행하게 되면 채용공고와 회사 데이터베이스가 채워집니다.
   companyreview.js : node companyreview.js
   => 실행하게 되면 회사리뷰 데이터베이스가 채워집니다.

---

## 데이터베이스 구성
- **사용한 데이터베이스**: MySQL
- **주요 테이블**:

| 테이블명           | 설명               |
|--------------------|--------------------|
| **Users**          | 사용자 정보 저장    |
| **Jobs**           | 채용 공고          |
| **Applications**   | 지원 관리          |
| **Bookmarks**      | 북마크 관리        |
| **SearchHistories**| 검색 기록          |
| **CompanyReviews** | 회사 리뷰          |
| **InterviewReviews** | 면접 후기        |

---

## 주요 기능

### 1. 인증 (Auth)
- **회원가입** (`POST /auth/register`)
  - 사용자 등록 기능 제공.
- **로그인** (`POST /auth/login`)
  - 이메일과 비밀번호를 이용해 사용자 인증 및 토큰 발급.
- **토큰 갱신** (`POST /auth/refresh`)
  - 리프레시 토큰을 이용해 새로운 액세스 토큰 발급.
- **프로필 업데이트** (`PUT /auth/profile`)
  - 사용자 이름, 전화번호, 경력 등을 업데이트 가능.

---

### 2. 채용 공고 (Jobs)
- **채용 공고 목록 조회** (`GET /jobs`)
  - 필터링 기능을 통해 페이지 단위로 공고 목록 제공.
- **채용 공고 등록** (`POST /jobs`)
  - 관리자가 공고를 등록할 수 있음 (인증 필요).
- **특정 채용 공고 조회** (`GET /jobs/{id}`)
  - 특정 공고의 상세 정보를 확인 가능.
- **채용 공고 삭제** (`DELETE /jobs/{id}`)
  - 특정 공고 삭제 기능 제공.

---

### 3. 지원 관리 (Applications)
- **지원서 등록** (`POST /applications`)
  - 특정 공고에 대한 지원 기능 제공.
- **내 지원 내역 조회** (`GET /applications`)
  - 사용자가 지원한 내역을 확인 가능.
- **지원서 수정** (`PUT /applications/{id}`)
  - 기존 지원서 내용을 업데이트 가능.
- **지원 취소** (`DELETE /applications/{id}`)
  - 특정 지원을 취소 가능.

---

### 4. 북마크 관리 (Bookmarks)
- **북마크 토글** (`POST /bookmarks`)
  - 채용 공고 또는 회사를 북마크하거나 북마크 해제.
- **북마크 목록 조회** (`GET /bookmarks`)
  - 북마크된 항목들을 조회 가능.

---

### 5. 검색 기록 관리 (Search History)
- **검색 기록 저장** (`POST /search-history`)
  - 검색 기록과 필터링 조건 저장.
- **검색 기록 조회** (`GET /search-history`)
  - 저장된 검색 기록 목록 확인 가능.
- **특정 검색 기록 삭제** (`DELETE /search-history/{id}`)
  - 특정 검색 기록을 삭제 가능.

---

### 6. 회사 리뷰 (Company Reviews)
- **리뷰 작성** (`POST /company-reviews`)
  - 특정 회사에 대한 리뷰 작성 가능.
- **리뷰 조회** (`GET /company-reviews`)
  - 회사 리뷰 목록을 조회 가능.
- **리뷰 수정** (`PUT /company-reviews/{id}`)
  - 작성한 리뷰 수정 기능 제공.
- **리뷰 삭제** (`DELETE /company-reviews/{id}`)
  - 작성한 리뷰 삭제 가능.

---

### 7. 면접 후기 (Interview Reviews)
- **전체 면접 후기 조회** (`GET /interview-reviews`)
  - 모든 사용자의 면접 후기 목록 제공.
- **면접 후기 작성** (`POST /interview-reviews`)
  - 특정 회사 및 직무에 대한 면접 후기 작성.
- **면접 후기 수정** (`PUT /interview-reviews/{id}`)
  - 기존 후기 수정 가능.
- **면접 후기 삭제** (`DELETE /interview-reviews/{id}`)
  - 특정 후기를 삭제 가능.

---
