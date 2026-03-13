# HSR (Huni Sales Report System) 프로젝트 매뉴얼

## 1. 프로젝트 개요 (Overview)
- **프로젝트명**: HSR (Huni Sales Report System) - 휴네시온 솔루션사업본부 매출 보고 시스템
- **주요 기능**: 주간 매출 데이터 보고 및 시각화, 부문별/제품별/영업대표별 실적 대시보드 제공
- **배포 주소**: [https://henesalesreport-v2.web.app](https://henesalesreport-v2.web.app)

## 2. 사용 기술 스택 (Tech Stack)
### 2.1 프론트엔드 (Frontend)
- **프레임워크 라이브러리**: React 19.2, TypeScript 5.9, Vite 7.2
- **스타일링**: Tailwind CSS 3.4
- **데이터 시각화 (Charts)**: Recharts 3.5
- **엑셀 파싱 (Excel Parsing)**: ExcelJS 4.4
- **상태 관리**: React Context API (`AuthContext`), 커스텀 훅 (비즈니스 로직 캡슐화)

### 2.2 인프라 및 백엔드 서비스 (Firebase)
- **Firestore**: 실시간 NoSQL 데이터베이스
- **Firebase Authentication**: 사용자 인증 및 권한 관리 연동
- **Firebase Hosting**: 정적 웹 애플리케이션 프론트엔드 호스팅 자산 서빙
- **Cloud Functions (`/functions/`)**: 백엔드 서버리스 로직 구현 환경

### 2.3 테스트 및 품질 (Testing)
- Vitest 4.0, React Testing Library

## 3. 디렉토리 구조 및 역할 (Directory Structure)
- **`src/`**: 프론트엔드 핵심 소스 코드 폴더
  - **`components/`**: UI 조각 및 차트/테이블 공통 컴포넌트 (`Dashboard`, `Reports` 등)
  - **`features/`**: 도메인 기반 모듈. 각 피처(대시보드, 데이터 입력, 제품 관리 등)별로 `hooks`, `components` 응집
  - **`pages/`**: 라우트에 매핑될 엔트리 페이지 (Lazy Loading 적용)
  - **`hooks/`**: 비즈니스 로직(`useReportData`), 상태 관리(`useViewMode`), 스냅샷 등 커스텀 훅
  - **`firebase/`**: 파이어베이스 앱 설정(`config.ts`) 및 각 도메인 DB 조작 컨트롤러(`services/`)
  - **`utils/`**: 매출 및 부문 액셀 파싱, 포맷, 해싱, 기간 산출 등 공용 유틸함수
- **`functions/`**: 배포용 Cloud Functions 코드가 들어있는 디렉토리
- **`firebase.json`**: 호스팅 설정(보안 헤더 포함), 리라이트 룰 등을 정의
- **`firestore.rules`**: 데이터 접근 권한 규칙(Collection Rules)을 정의 (role-based 접근 제어)

## 4. 아키텍처 및 성능 최적화 패턴
- **Page 라우팅 + Lazy Loading**: `React.lazy`를 이용한 페이지별 코드 스플리팅이 적용되어 초기 번들 사이즈를 50% 이상 줄였습니다.
- **도메인(Feature) 모듈 아키텍처**: 페이지는 껍데기(오케스트레이터) 역할에 불과하며, 실제 비즈니스 로직과 UI 컴포넌트는 관련된 `features/` 하위에 배치하여 유지보수성을 극대화합니다.
- **메모이제이션(Memoization)**: 렌더링 비용이 큰 차트나 테이블 등은 `React.memo` 및 `useCallback`을 적극 사용하여 성능 낭비를 줄였습니다.
- **의존성 모듈 청크 분할**: ExcelJS, Recharts 등 코드가 무거운 종속성을 Vite `manualChunks` 설정으로 로드 부하를 나눴습니다.

## 5. 보안 정책 메커니즘 (Security)
- **Firebase 룰 체계**: `firestore.rules`를 통해 읽기 쓰기 권한을 제어하며 모든 컬렉션에서 데이터 필수값 검증 및 제한 사항을 부여합니다.
- **사용자 인증 한계**: 인증은 암호의 정규성(대소문자 혼합 및 8자 이상)을 따르며, 최대 5회 실패 시 계정 5분 잠금 기능이 설정되어 있습니다. 화면에는 30분 비활성 제어로 자동 로그아웃이 발동됩니다.
- **클라이언트 검증**: 엑셀 업로드 시 파일 확장자 / MIME 변조 / 크기 (10MB 제한) / 매직바이트를 분석하는 4단계 검증 프로세스를 거칩니다.
- **CSP (Content Security Policy)**: `firebase.json`의 헤더 규정에 XSS 및 프레임 교차 공격 차단 룰이 엄격히 적용되어 있습니다.

## 6. 개발 로컬 환경 실행 가이드 (Setup & Run)
\`\`\`bash
# 1. 패키지 의존성 설치 (루트 디렉토리 기준)
npm install

# 2. 로컬 개발 서버 접속
npm run dev
# URL (기본): http://localhost:5173 / 콘솔에서 접속 링크 제공

# 3. 로컬 테스트 및 관찰
npm run test          # 전체 실행
npm run test:watch    # 감시 모드
\`\`\`

## 7. 빌드 및 배포 안내 (Build & Deploy)
프로젝트는 Firebase를 주요 서버리스 인터페이스로 두고 있으므로 `npm` 스크립트 기반으로 배포합니다:
\`\`\`bash
# 프로덕션 번들 빌드
npm run build

# 빌드 산출물 로컬 프리뷰 구동
npm run preview

# 전체 배포 (Build 수행 후 Hosting, Functions 모두)
npm run deploy:all

# 호스팅에 해당되는 프론트엔드 자산만 배포 (Build 수행 후 Hosting)
npm run deploy

# 백엔드(Firestore DB 규칙) 설정만 배포
npm run deploy:rules
\`\`\`
