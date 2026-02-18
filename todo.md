# 매출 보고 웹 대시보드 - 검증 결과 및 TODO

> 검증일: 2026-02-13
> 대상 파일: `sales_data_weekly` (React JSX 컴포넌트), `sales_data_2_4.xlsx`
> 참조 프로젝트: `/Volumes/hclim_SSD/sales-app` (SalesFlow - React+Firebase+Vite 웹앱)

---

## 0. 참조 프로젝트(sales-app) 기술 스택 요약

| 항목 | sales-app 사용 기술 | 이 프로젝트 적용 방향 |
|------|---------------------|----------------------|
| Framework | React 19 + TypeScript 5.9 | React 19 + TypeScript (`.tsx`) |
| Build | Vite 7.2 | Vite (동일) |
| Styling | TailwindCSS 3.4 + PostCSS + autoprefixer | TailwindCSS (동일) |
| Charts | recharts 3.5 | recharts (동일) |
| Icons | lucide-react 0.555 | lucide-react (동일) |
| Excel | **exceljs 4.4** (동적 import) | exceljs (sales-app과 통일, SheetJS 대신) |
| Backend | Firebase (Firestore, Auth, Storage, Functions) | Firestore (데이터) + Auth (인증) + Hosting (배포) |
| Routing | react-router-dom v7 | 페이지별 라우팅 (로그인/대시보드/관리자/보고) |
| State | React Context | AuthContext + useReport/useDivisionReport/useTargets 훅 |
| Font | Inter + Nanum Gothic | 동일 적용 |
| PWA | vite-plugin-pwa | 선택적 적용 |
| Error | Sentry + ErrorBoundary | ErrorBoundary만 적용 |
| Validation | Zod | 엑셀 파싱 시 데이터 검증용 선택적 적용 |

---

## 1. 데이터 검증 결과

### 정상 확인 항목
- **INITIAL_DATA <-> Excel 데이터 일치**: 코드의 22개 제품 데이터가 엑셀(B16:G37)과 정확히 일치
- **그룹화 로직 정상**: `_MA` -> 유지보수, `H/W`+`기타` -> 기타 합산 로직 올바름
- **이익 계산 정상**: 매출액 - 매입액 = 이익 수식 정확
- **합계 행 계산 정상**: processedData 기반 reduce 합계 로직 올바름

### 검증 참고사항
- Excel 전체 합계(row 38): 매출 699,085,307 / 매입 162,104,392 / 이익 536,980,915 (1월)
- Excel 전체 합계(row 38): 매출 337,862,343 / 매입 40,041,146 / 이익 297,821,197 (2월)
- 코드의 INITIAL_DATA 합산 시 위 수치와 동일하게 산출됨 -> **데이터 정합성 확인 완료**

---

## 2. 발견된 문제점 (Critical)

### P0 - 프로젝트 구조 미비 -- RESOLVED
- [x] **프로젝트 초기화 완료**: `package.json`, `vite.config.ts`, `tsconfig.json/app.json` 생성
- [x] **파일 확장자 및 구조 변경 완료**: `src/components/`, `src/utils/`, `src/types/` 구조
- [x] **의존성 설치 완료**: sales-app과 버전 통일 (271 packages)

### P0 - JSX 문법 오류 (빌드 불가) -- RESOLVED
- [x] **JSX 공백 오류 100건+ 수정 완료**
- [x] **자체 닫힘 태그 오류 수정 완료**
- [x] **TypeScript 타입 추가 및 tsc 컴파일 통과**

### P0 - 엑셀 파일 업로드 미지원 -- RESOLVED
- [x] **엑셀 파일(.xlsx/.xls) 업로드 지원**: `accept=".xlsx,.xls,.txt"`, `readAsArrayBuffer()` 사용
- [x] **exceljs 라이브러리 도입** (sales-app과 동일)
  - `src/utils/excelParser.ts` 생성: 동적 import `await import('exceljs')`
  - 월 헤더 자동 감지, "전체" 행 자동 제외, 수식 결과값 처리
- [x] 엑셀 파싱 시 헤더 행 자동 감지, 데이터 행 파싱, 합계 행("전체") 제외 로직 구현 완료
- [x] 업로드 중 로딩 스피너 표시, 기존 .txt 파싱 하위 호환 유지

---

## 3. 발견된 문제점 (Major)

### P1 - 기능 개선 필요
- [x] **월 데이터 하드코딩**: ~~현재 1월/2월만 지원~~ -> **동적 월 구조로 전환 완료 (Phase 3)**
  - `months: Record<string, MonthData>` 구조로 전환, 월 키: `"2026-01"`, `"2026-02"`, ...
  - 엑셀 업로드 시 새 월(3월, 4월...) 컬럼이 자동으로 추가됨
  - 테이블 헤더, KPI 카드, 차트, 입력폼 모두 동적 월 지원 완료
- [x] **데이터 영속성 해결**: Firebase Firestore 연동 완료 (Phase 4)
  - Firestore를 1차 저장소로 사용, 초기 로드 시 Firestore 우선 → INITIAL_DATA fallback
  - 엑셀 업로드/수동 입력/삭제 시 자동 동기화
- [x] **엑셀 업로드 시 컬럼 매핑 취약**: ~~`columns[1]`, `columns[4]` 등 인덱스 하드코딩~~
  - **월 헤더 기반 동적 매핑으로 전환 완료** (`parseMonthLabel()` 함수로 "1월 2026" -> "2026-01" 변환)
- [ ] **엑셀 업로드 시 기존 데이터 덮어쓰기**: 새 파일 업로드 시 기존 데이터를 완전 교체함
  - 누적/병합 옵션 제공 필요

### P1 - UI/UX 개선
- [x] **인쇄/PDF 최적화**: `@media print` CSS 스타일 적용 완료 (Phase 9)
- [x] **반응형 테이블**: 모바일 화면 최적화 완료
- [x] **로딩 상태 표시**: `LoadingSpinner` 컴포넌트 적용 완료 (Phase 9)
  - sales-app의 `LoadingSpinner` 컴포넌트 패턴 참조
- [x] **에러 바운더리**: sales-app의 `ErrorBoundary` 컴포넌트 패턴 적용 (Phase 9)
- [x] **알림 시스템**: `Notification` 상태 관리 적용 완료

### P2 - TypeScript 전환 -- RESOLVED (Phase 3에서 완료)
- [x] **타입 정의 추가**: `src/types/index.ts` 생성 완료
  - `MonthData` 인터페이스 (sales, cost)
  - `ProductData` 인터페이스 (id, product, months: Record<string, MonthData>)
  - `MonthProcessed` 인터페이스 (profit 포함)
  - `ProcessedProduct` 인터페이스 (월별 가공 + totalSales/totalCost/totalProfit)
  - `Totals` 인터페이스 (byMonth + 전체 합계)
  - `ParseResult` 인터페이스 (data, months, monthLabels)
  - `getMonthShortLabel()`, `getMonthFullLabel()` 유틸 함수
- [ ] **Zod 스키마 추가** (선택): 엑셀 파싱 데이터 검증용

---

## 4. 권장 작업 순서 (sales-app 패턴 기준)

### Phase 1: 프로젝트 셋업 및 기본 동작 -- COMPLETED (2026-02-13)
1. [x] Vite + React + TypeScript 프로젝트 초기화
   - `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json` 생성
   - sales-app의 `vite.config.ts` 경량 버전 적용 (PWA, Sentry 제외)
   - exceljs, recharts 별도 chunk 분리 설정 완료
2. [x] TailwindCSS 설정
   - `tailwind.config.js`: Inter + Nanum Gothic 폰트, fade-in/bounce-in 애니메이션
   - `postcss.config.js`: tailwindcss + autoprefixer
   - `src/index.css`: `@media print` CSS 포함
3. [x] `sales_data_weekly` -> `src/components/SolutionBusinessDashboard.tsx` 변환
   - JSX 공백 오류 100건+ 전체 수정 (`< div` -> `<div`)
   - 자체 닫힘 태그 오류 수정 (`/ >` -> `/>`)
   - TypeScript 타입 추가: `ProductData`, `ProcessedProduct`, `Totals`, `Notification`
   - Recharts Tooltip formatter 타입 오류 수정
4. [x] `src/App.tsx`, `src/main.tsx`, `index.html` 생성
   - index.html: 한국어 lang, viewport, 메타태그 설정
5. [x] 의존성 설치 및 빌드/실행 테스트
   - `npm install` 완료 (271 packages)
   - `tsc -b` 컴파일 에러 없음
   - `vite build` 성공 (경고 없음)
   - 번들 크기: JS 206KB + charts 380KB, CSS 17KB

### Phase 2: 엑셀 업로드 기능 구현 -- COMPLETED (2026-02-13)
6. [x] `exceljs@^4.4.0` 설치 (Phase 1에서 완료, sales-app과 동일)
7. [x] `src/utils/excelParser.ts` 생성
   - 동적 import 패턴: `const ExcelJS = await import('exceljs')`
   - 엑셀 구조 자동 감지 (row 10~20 범위에서 월 헤더 탐색, 제품군 컬럼 자동 감지)
   - "전체" 행 자동 제외, 수식 결과값(`.result`) 처리 지원
8. [x] 파일 업로드 핸들러 수정: `.xlsx` 파일 지원
   - accept 속성: `.xlsx,.xls,.txt` (하위 호환)
   - `file.arrayBuffer()` + `parseExcelFile()` 사용
   - 업로드 중 로딩 스피너 표시 (`isUploading` 상태)
   - 감지된 월 정보를 알림 메시지에 표시
9. [x] Vite 빌드 최적화: exceljs 별도 chunk 분리 (Phase 1에서 설정 완료)
   - 빌드 결과: `vendor-excel` 937KB (gzip 269KB) 별도 분리 확인

### Phase 3: 동적 월 지원 & 데이터 구조 개선 -- COMPLETED (2026-02-14)
10. [x] `src/types/index.ts` 생성: 동적 월 타입 정의
    - `MonthData`, `ProductData`, `ProcessedProduct`, `Totals`, `ParseResult` 등 타입 정의
    - `getMonthShortLabel("2026-01")` -> `"1월"`, `getMonthFullLabel("2026-01")` -> `"2026년 1월"` 유틸
11. [x] 엑셀 헤더에서 월 자동 감지 및 동적 매핑
    - `parseMonthLabel()`: "1월 2026" -> `{ key: "2026-01", display: "1월 2026" }`
    - `excelParser.ts` 반환 타입: `{ data: ProductData[], months: string[], monthLabels: Record<string, string> }`
    - 하드코딩된 `janSales/febSales` 구조 제거 -> `months: Record<string, MonthData>` 전환
12. [x] 테이블/차트/KPI/입력폼 동적 월 기반으로 전면 수정
    - KPI 카드: 누적 합계 + 최근 2개월 매출 동적 표시
    - 상세 보고서 테이블: `months.map()` 기반 동적 컬럼 생성, 12색 팔레트 자동 배분
    - 월별 매출 추이 차트: `monthlyTrend` 동적 생성
    - 개별 입력 폼: 월 수에 따라 입력 필드 자동 생성
    - 데이터 목록: 월별 매출 컬럼 동적 표시
    - INITIAL_DATA 22건 동적 월 구조로 마이그레이션 완료
    - `tsc -b` 컴파일 에러 0건, `vite build` 성공 (7.26s)

### Phase 4: Firebase Firestore 데이터베이스 연동 (확장성 설계) -- COMPLETED (2026-02-14)

> **Firebase 프로젝트**: huneSalesReport (ID: `hunesalesreport`)
> **목표**: localStorage 임시 저장 대신, Firestore를 1차 저장소로 채택하여 향후 멀티유저/멀티디바이스 확장에 대비

#### 4-1. Firestore 데이터 모델 설계

```
firestore/
├── reports/{reportId}                    # 보고서 문서 (연도별 또는 기간별)
│   ├── year: number                      # 2026
│   ├── title: string                     # "2026년 매출 보고"
│   ├── months: string[]                  # ["2026-01", "2026-02", ...]
│   ├── monthLabels: map                  # { "2026-01": "1월 2026", ... }
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── createdBy: string                 # (향후 Auth 연동 시 uid)
│
│   └── products/{productId}              # 서브컬렉션: 제품별 데이터
│       ├── product: string               # "NGS", "CamPASS", ...
│       ├── months: map                   # { "2026-01": { sales: 123, cost: 45 }, ... }
│       ├── sortOrder: number             # 정렬 순서
│       └── updatedAt: timestamp
│
├── metadata/config                       # 앱 전역 설정
│   ├── currentReportId: string           # 현재 활성 보고서 ID
│   ├── productMaster: string[]           # 제품 마스터 목록 (22개)
│   └── groupRules: map                   # 그룹화 규칙 { "_MA": "유지보수", "H/W": "기타" }
│
└── uploadHistory/{historyId}             # 업로드 이력 (감사 추적)
    ├── reportId: string
    ├── fileName: string
    ├── uploadedAt: timestamp
    ├── monthsAffected: string[]          # ["2026-03"]
    ├── productCount: number
    └── uploadedBy: string                # (향후 Auth 연동 시 uid)
```

**설계 원칙:**
- **서브컬렉션 사용**: `reports/{id}/products/{id}` 구조로, 제품 수가 늘어도 문서 크기 제한(1MB) 걱정 없음
- **연도별 보고서 분리**: 연도가 바뀌면 새 report 문서 생성 → 과거 데이터와 독립 관리
- **제품 마스터**: 제품 목록을 `metadata/config`에 별도 관리 → 일관성 유지
- **업로드 이력**: 누가 언제 어떤 데이터를 올렸는지 추적 가능 (감사 로그)

#### 4-2. Firestore 보안 규칙 (초기)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Phase 4: 인증 없이 읽기/쓰기 허용 (개발 단계)
    // Phase 6: Auth 연동 후 인증된 사용자만 허용으로 전환
    match /reports/{reportId} {
      allow read, write: if true;
      match /products/{productId} {
        allow read, write: if true;
      }
    }
    match /metadata/{docId} {
      allow read, write: if true;
    }
    match /uploadHistory/{historyId} {
      allow read, write: if true;
    }
  }
}
```

#### 4-3. 작업 항목

13. [x] Firebase 프로젝트 연결 및 설정
    - `firebaseConfig.js` → `src/firebase/config.ts`로 이동 (TypeScript 전환)
    - `hunesalesreport` 프로젝트의 실제 config 값 `.env`에서 로드
    - Firestore 초기화 코드 작성 (`getFirestore()`)
    - `.env` 파일로 민감 정보 분리 (`.gitignore` 이미 적용됨)
14. [x] Firestore 서비스 레이어 구현
    - `src/firebase/services/reportService.ts`: 보고서 CRUD
      - `getOrCreateReport(year)`: 연도별 보고서 가져오기/생성
      - `updateReportMonths(reportId, months, monthLabels)`: 월 메타 업데이트
    - `src/firebase/services/productService.ts`: 제품 데이터 CRUD
      - `saveProducts(reportId, products[])`: 제품 데이터 일괄 저장 (batch write, 450건 단위)
      - `getProducts(reportId)`: 제품 데이터 조회 (sortOrder 정렬)
      - `addProduct(reportId, product, sortOrder)`: 개별 추가
      - `deleteProduct(reportId, productId)`: 개별 삭제
    - `src/firebase/services/uploadHistoryService.ts`: 업로드 이력 기록
15. [x] 커스텀 훅 구현 (React ↔ Firestore 연결)
    - `src/hooks/useReport.ts`: 보고서 데이터 로드/저장 훅
      - 초기 로드: Firestore에서 데이터 fetch → state 세팅
      - 저장 트리거: 엑셀 업로드/수동 입력/삭제 시 자동 Firestore 동기화
      - 로딩/에러 상태 관리, Firestore 실패 시 로컬 데이터 fallback
16. [x] 기존 SolutionBusinessDashboard 연동
    - `useState` → `useReport` 훅으로 교체
    - 엑셀 업로드 핸들러에 Firestore 저장 로직 추가
    - 수동 입력/삭제 시 Firestore 동기화
    - 초기 로드 시 Firestore 데이터 우선, 없으면 INITIAL_DATA fallback
    - 헤더에 동기화 상태 표시 (Cloud/CloudOff/Loader2 아이콘)
    - 로딩 중 스피너 화면 추가
    - `tsc -b` 에러 0건, `vite build` 성공 (8.75s)

### Phase 5: 인증 & 라우팅 기반 구축 -- COMPLETED (2026-02-14)

> **목표**: Firebase Auth 기반 로그인/가입 시스템, react-router-dom 라우팅, 670줄 메가 컴포넌트 분리
> **첫 관리자**: `hclim@hunesion.com` (Firebase Auth에 이미 존재) → 자동 admin+approved 설정

#### 5-1. Firestore 신규 컬렉션

```
users/{uid}
├── uid, email, displayName
├── divisionId: string          → divisions/{divisionId}
├── role: 'admin' | 'user'
├── status: 'pending' | 'approved' | 'rejected'
├── createdAt, updatedAt

divisions/{divisionId}
├── name: string                # 공공사업부문, 융합사업부문, 전략사업부문, 금융기업사업부문, 유지보수
├── sortOrder: number
├── createdAt, updatedAt
```

#### 5-2. 라우트 구조

```
/login          → LoginPage (공개)
/register       → RegisterPage (공개)
/               → ProtectedRoute → DashboardPage
/input          → ProtectedRoute → InputPage
/reports        → ProtectedRoute → DivisionReportPage
/achievement    → ProtectedRoute → AchievementPage
/admin/divisions → ProtectedRoute(adminOnly) → DivisionManagementPage
/admin/products  → ProtectedRoute(adminOnly) → ProductManagementPage
/admin/users     → ProtectedRoute(adminOnly) → UserManagementPage
/admin/targets   → ProtectedRoute(adminOnly) → TargetInputPage
```

#### 5-3. 작업 항목

17. [x] 의존성 추가 및 Firebase Auth 설정
    - `bun add react-router-dom` 완료 (v7.13.0)
    - `src/firebase/config.ts`에 `getAuth(app)` export 추가 완료
18. [x] 인증 서비스 및 컨텍스트 구현
    - `src/firebase/services/authService.ts`: 회원가입, 로그인, 로그아웃, 사용자 승인/거절
      - `hclim@hunesion.com` 첫 로그인 시 admin+approved 자동 생성
      - 이후 가입자는 `status: 'pending'` → 관리자 승인 필요
    - `src/contexts/AuthContext.tsx`: `onAuthStateChanged` + Firestore `users/{uid}` 프로필 연동
    - `useAuth()` 훅을 AuthContext 내에 포함
19. [x] 영업부문 서비스 구현
    - `src/firebase/services/divisionService.ts`: 부문 CRUD + 기본 5개 부문 seed
    - 기본값: 공공사업부문(0), 융합사업부문(1), 전략사업부문(2), 금융기업사업부문(3), 유지보수(4)
    - `seedDefaultDivisions()`: 앱 초기화 시 divisions 컬렉션이 비어있으면 자동 생성
20. [x] 로그인/가입 페이지 구현
    - `src/pages/LoginPage.tsx`: 이메일/비밀번호 로그인 폼, 에러 한국어 번역
    - `src/pages/RegisterPage.tsx`: 가입 신청 (이름, 이메일, 비밀번호, 부문 선택), 승인 대기 안내
    - `src/components/auth/ProtectedRoute.tsx`: 미인증 리다이렉트, adminOnly prop, 승인대기/거절 상태 UI
21. [x] 라우팅 설정 및 컴포넌트 분리
    - `src/router.tsx`: 전체 라우트 정의 (/login, /register, /)
    - `src/App.tsx`: `AuthProvider` + `RouterProvider` 래핑
    - `SolutionBusinessDashboard.tsx`에 로그아웃 버튼 및 사용자 정보 표시 추가
    - (컴포넌트 세부 분리는 Phase 6+ 또는 필요 시 진행)
22. [x] 기존 타입 및 서비스 수정
    - `src/types/index.ts`: `UserProfile`, `Division`, `UserRole`, `UserStatus`, `AuthState` 타입 추가
    - `src/firebase/services/uploadHistoryService.ts`: `uploadedBy`에 실제 uid 전달 (Phase 6에서 완료 예정)

### Phase 6: 영업부문 & 제품 마스터 관리 (CRUD) -- COMPLETED (2026-02-14)

> **목표**: 영업부문/제품 마스터 데이터 관리, 사용자 관리 페이지, 기존 데이터 부문 배정

#### 6-1. Firestore 신규 컬렉션 및 기존 확장

```
products_master/{productId}
├── name: string               # NGS, i-oneNet 등
├── divisionId: string         → divisions/{divisionId}
├── isMaintenanceType: boolean  # 기존 _MA suffix 대체
├── sortOrder: number
├── createdAt, updatedAt

reports/{reportId}/products/{productId}  (기존 확장)
├── divisionId: string         # NEW (optional, 마이그레이션 전 null 허용)
├── productMasterId: string    # NEW (optional)
├── product, months, sortOrder, updatedAt  (기존 유지)
```

#### 6-2. 작업 항목

23. [x] 제품 마스터 서비스 구현
    - `src/firebase/services/productMasterService.ts`: 제품 마스터 CRUD, 부문별 필터
    - `src/firebase/services/userService.ts`: 사용자 목록 조회 (상태별, 부문별 필터)
24. [x] 관리자 페이지 구현
    - `src/pages/admin/DivisionManagementPage.tsx`: 부문 목록/추가/수정/삭제 (삭제 시 소속 제품/사용자 체크)
    - `src/pages/admin/ProductManagementPage.tsx`: 제품 목록, 부문 배정, 유지보수 타입 토글, 필터링
    - `src/pages/admin/UserManagementPage.tsx`: 사용자 승인/거절, 역할 변경, 부문 배정
25. [x] 라우팅 및 네비게이션 업데이트
    - `src/router.tsx`: `/admin/divisions`, `/admin/products`, `/admin/users` 라우트 추가
    - `SolutionBusinessDashboard.tsx`: 관리자용 드롭다운 메뉴 추가 (Settings 아이콘)
26. [x] 타입 확장
    - `src/types/index.ts`: `ProductMaster`, `ProductMasterInput`, `ProductDataExtended` 타입 추가
    - 빌드 테스트 통과 (6.65s, JS 699KB + charts 380KB + excel 937KB)

### Phase 7: 부문별 보고 & 기간별 집계 -- COMPLETED (2026-02-14)

> **목표**: 영업부문별, 월/분기/반기/연간 매출액·매출이익 보고, 권한별 데이터 접근 제어

#### 7-1. 기간 유틸리티 및 타입

```typescript
// src/utils/periodUtils.ts
getQuarterForMonth("2026-01") → "Q1"
getHalfYearForMonth("2026-01") → "H1"
getMonthsInQuarter(2026, "Q1") → ["2026-01","2026-02","2026-03"]
getMonthsInHalfYear(2026, "H1") → ["2026-01"~"2026-06"]
aggregateByPeriod(products, months, periodType) → Record<string, {sales, cost, profit}>

// src/types/index.ts 추가
type PeriodType = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type HalfYear = 'H1' | 'H2';

interface DivisionSummary {
  divisionId: string; divisionName: string;
  totalSales: number; totalProfit: number;
  products: ProcessedProduct[];
  periodBreakdown: Record<string, { sales: number; profit: number }>;
}


interface ReportFilter { year: number; periodType: PeriodType; divisionId?: string; }
```

#### 7-2. 작업 항목

27. [x] 기간 유틸리티 구현
    - `src/utils/periodUtils.ts`: 분기/반기/연간 변환 및 집계 함수
    - `getQuarterForMonth`, `getHalfYearForMonth`, `getMonthsInQuarter`, `getMonthsInHalfYear`
    - `getPeriodInfoList`, `aggregateByPeriod`, `getAvailableYears`
28. [x] 부문별 보고 훅 구현
    - `src/hooks/useDivisionReport.ts`: divisions + products + productMasters → DivisionSummary[] 집계
    - 제품명 기준 divisionId 매핑, 미분류 제품 별도 표시
    - admin: 전체 부문 조회 / 일반 user: 본인 소속 부문만 조회
29. [x] 부문별 보고 페이지 및 컴포넌트
    - `src/pages/DivisionReportPage.tsx`: 필터바 + KPI 카드 + 테이블 + 차트
    - `src/components/reports/ReportFilterBar.tsx`: 연도, 기간유형(월/분기/반기/연간) 탭, 부문 필터
    - `src/components/reports/DivisionSummaryTable.tsx`: 부문별 확장 가능 테이블 (제품 상세 토글)
    - `src/components/reports/DivisionCharts.tsx`: Stacked bar + Pie + Horizontal bar 차트
30. [x] 라우팅 및 네비게이션 업데이트
    - `src/router.tsx`: `/reports` 라우트 추가
    - `SolutionBusinessDashboard.tsx`: "부문별 보고서" 버튼 추가
    - 빌드 테스트 통과 (6.39s, JS 717KB + charts 395KB + excel 937KB)

### Phase 8: 분기별 목표 & 달성율 -- COMPLETED (2026-02-14)

> **목표**: 영업부문별 분기 목표 입력 및 달성율 시각화
> **목표 단위**: 영업부문별만 (제품별 세부 목표 없음)

#### 8-1. Firestore 신규 컬렉션

```
targets/{year}-{quarter}-{divisionId}
├── year: number               # 2026
├── quarter: 'Q1'~'Q4'
├── divisionId: string         → divisions/{divisionId}
├── salesTarget: number
├── profitTarget?: number      # (선택)
├── createdBy: string          → users/{uid}
├── createdAt, updatedAt
```

#### 8-2. 달성율 계산 로직

```typescript
interface TargetAchievement {
  target: QuarterlyTarget;
  divisionName: string;
  actualSales: number; actualProfit: number;
  salesAchievementRate: number;  // 0~100+%
  status: 'exceeded' | 'on-track' | 'behind' | 'critical';
  // exceeded: ≥100%, on-track: ≥75%, behind: ≥50%, critical: <50%
}
```

#### 8-3. 작업 항목

30. [x] 타입 정의
    - `src/types/index.ts`: `AchievementStatus`, `QuarterlyTarget`, `QuarterlyTargetInput`, `TargetAchievement` 4개 타입 추가
31. [x] 목표 서비스 및 훅 구현
    - `src/firebase/services/targetService.ts`: 목표 CRUD (deterministic doc ID: `{year}-{quarter}-{divisionId}`)
      - `getTargetsByYear()`, `getTargetsByYearQuarter()`, `upsertTarget()`, `batchUpsertTargets()`, `deleteTarget()`
    - `src/hooks/useTargets.ts`: divisions + targets 병렬 fetch, year 변경 시 자동 재로드, `saveTargets()` batch upsert
    - `src/hooks/useAchievement.ts`: 목표 + 실적 결합 → 달성율 계산
      - `productDivisionMap` (useMemo): 제품명 → divisionId 매핑 (useDivisionReport 패턴 재사용)
      - `divisionActuals` (useMemo): `getMonthsInQuarter()` 기반 부문별 분기 실적 합산
      - `achievements` (useMemo): targets + actuals 결합, status 판정 (exceeded/on-track/behind/critical)
      - `overallAchievementRate`: 전체 달성율 (대시보드 KPI용, 목표 없으면 null)
      - role-based: admin 전체 부문, 일반 사용자 자기 부문만
32. [x] 목표 입력 페이지 (admin 전용)
    - `src/pages/admin/TargetInputPage.tsx`: 뒤로가기 + Target 아이콘 + "분기별 목표 관리" + 연도 선택, 저장 성공 시 토스트
    - `src/components/targets/TargetInputTable.tsx`: 부문(행) × Q1~Q4(열) 매트릭스, 매출/이익 목표 number input
      - matrix state, 기존 targets 초기화, 변경 감지, salesTarget > 0인 셀만 저장
33. [x] 달성율 대시보드
    - `src/pages/AchievementPage.tsx`: 연도/분기 필터 + KPI 4개(분기 목표/실적/달성율/이익) + 차트 + 테이블
    - `src/components/achievement/AchievementTable.tsx`: progress bar + 상태 badge (emerald/blue/amber/red)
    - `src/components/achievement/AchievementCharts.tsx`: Grouped bar(목표 vs 실적) + RadialBar(부문별 달성율 게이지)
34. [x] 라우팅 & 기존 대시보드 연동
    - `src/router.tsx`: `/admin/targets` (adminOnly), `/achievement` (전체 승인 사용자) 라우트 추가
    - `SolutionBusinessDashboard.tsx`: 4개 변경
      - `Target` 아이콘 + `useAchievement` 훅 + `getCurrentQuarter`/`getQuarterLabel` import
      - 달성율 KPI 카드 (overallAchievementRate !== null일 때 조건부 표시, 클릭 시 /achievement 이동)
      - "달성 현황" 네비게이션 버튼 추가
      - 관리자 드롭다운에 "목표 관리" 메뉴 항목 추가
    - `tsc -b` 에러 0건, `vite build` 성공 (6.06s)

### Phase 9: UI/UX 안정화 & 배포 -- COMPLETED (2026-02-14)

#### 9-1. 인쇄용 CSS 강화 (기존 Phase 9.1에서 완료)
- [x] `@media print` 스타일: 네비게이션 숨기기, 테이블 페이지 나눔, 폰트 크기 조정

#### 9-2. 에러 핸들링 강화
40. [x] ErrorBoundary 및 Fallback UI 구현
    - `src/components/error/ErrorBoundary.tsx`: React Error Boundary 컴포넌트
      - 하위 컴포넌트 에러 캐치, "다시 시도" / "홈으로" 버튼, DEV 모드 상세 정보 표시
    - `src/components/error/FirestoreErrorFallback.tsx`: Firestore 연결 실패 UI
      - 네트워크/인증/할당량 초과 에러 유형별 안내, "다시 시도" 버튼
    - `src/components/error/LoadingSpinner.tsx`: 공통 로딩 스피너 (sm/md/lg 사이즈)
    - `src/components/error/index.ts`: 컴포넌트 re-export
    - `src/App.tsx`: 최상위 `<ErrorBoundary>` 적용
    - `src/pages/DivisionReportPage.tsx`: `FirestoreErrorFallback`, `LoadingSpinner` 적용
    - `src/pages/AchievementPage.tsx`: `FirestoreErrorFallback`, `LoadingSpinner` 적용
    - `src/hooks/useAchievement.ts`: `refresh()` 함수 추가

#### 9-3. 엑셀 업로드 병합 모드
41. [x] 덮어쓰기/병합 선택 옵션 구현
    - `src/hooks/useReport.ts`:
      - `UploadMergeMode` 타입 추가 (`'overwrite' | 'merge'`)
      - `mergeProducts()` 함수: 기존 데이터와 새 데이터 병합 로직
        - 같은 제품명은 월별 데이터 업데이트, 새 제품은 추가
        - 월 정보도 자동 병합 (중복 제거 및 정렬)
      - `saveUploadedData()`: `mergeMode` 파라미터 추가, `{ newCount, updatedCount }` 반환
    - `src/components/SolutionBusinessDashboard.tsx`:
      - `mergeMode` state 추가
      - "업로드 방식" 라디오 버튼 UI (덮어쓰기/병합)
      - 병합 시 "신규 N건, 업데이트 N건" 알림 표시

#### 9-4. Firestore 보안 규칙
42. [x] 인증 기반 접근 제어 규칙 적용
    - `firestore.rules`: 보안 규칙 파일 생성
      - `isAuthenticated()`: 인증 여부 확인
      - `isAdmin()`: 관리자 권한 확인 (users/{uid}.role == 'admin')
      - `belongsToDivision()`: 부문 소속 확인 (향후 확장용)
      - 컬렉션별 규칙:
        - `users`: 인증 읽기, 본인/admin만 수정 가능
        - `divisions`, `products`: 인증 읽기, admin만 CRUD
        - `reports`, `reports/products`, `reports/division_data`: 인증 읽기, admin만 CRUD
        - `reports/upload_history`: 생성만 가능, 수정/삭제 불가 (감사 로그)
        - `targets`: 인증 읽기, admin만 CRUD
    - `firestore.indexes.json`: 복합 인덱스 설정
      - `targets`: year+quarter, divisionId+year 인덱스
      - `products`: order 인덱스

#### 9-5. Firebase Hosting 배포 설정
43. [x] Hosting 구성 파일 생성
    - `firebase.json`: Hosting + Firestore 설정
      - `public: "dist"`: Vite 빌드 출력 디렉토리
      - SPA rewrite: 모든 경로 → `/index.html`
      - 보안 헤더: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
      - `/assets/**` 캐시: 1년 immutable
    - `package.json` 스크립트 추가:
      - `npm run deploy`: 빌드 후 Hosting만 배포
      - `npm run deploy:rules`: Firestore 규칙만 배포
      - `npm run deploy:all`: 전체 배포 (빌드 + Hosting + Rules)

#### 9-6. GitHub Actions CI/CD
44. [x] 자동 배포 워크플로우 구성
    - `.github/workflows/firebase-hosting.yml`: main 브랜치 자동 배포
      - Node.js 20, npm ci, npm run build, Firebase Hosting 배포
      - GitHub Secrets: `FIREBASE_SERVICE_ACCOUNT`, `VITE_FIREBASE_*` 환경 변수
    - `.github/workflows/firebase-hosting-preview.yml`: PR 프리뷰 배포
      - PR 생성 시 프리뷰 URL 자동 생성 (PR 코멘트로 URL 표시)
    - `.github/DEPLOYMENT.md`: 배포 설정 가이드
      - GitHub Secrets 설정 방법
      - Firebase Service Account 생성 방법
      - 수동/자동 배포 명령어

#### 9-7. 인증/권한 버그 수정 (2026-02-14)
45. [x] Firestore 권한 오류 해결 (`Missing or insufficient permissions`)
    - **문제**: 로그인 직후 Firestore 쿼리 시 권한 오류 발생
    - **원인 분석**:
      - `isAdmin()` 함수가 `getUserData()`를 호출하면서 순환 참조 발생
      - `useAchievement`, `useReport` 훅이 인증 완료 전에 Firestore 쿼리 실행
      - `products_master` 컬렉션 규칙 누락
    - **해결책**:
      1. `firestore.rules` 수정:
         - `userExists()` 함수 추가: 문서 존재 여부 먼저 체크
         - `isAdmin()` 함수: `userExists() && getUserData().role == 'admin'` 패턴
         - `users` 컬렉션 읽기: `isAuthenticated()` 만으로 허용 (순환 참조 방지)
         - `products_master` 컬렉션 규칙 추가
      2. `src/contexts/AuthContext.tsx` 개선:
         - `authReady` 플래그 추가: Auth 상태 결정 여부 명시
         - 취소 가능한 비동기 로직 (`cancelled` 플래그)
         - 프로필 없을 때 에러 대신 `null` 반환
      3. `src/hooks/useReport.ts` 수정:
         - `UseReportOptions` 인터페이스 추가 (`firebaseUser`, `authReady`)
         - `authReady && firebaseUser` 조건 충족 후에만 Firestore 쿼리
         - `loadedRef` 중복 로드 방지
      4. `src/hooks/useAchievement.ts` 수정:
         - 자체 `onAuthStateChanged` 제거 → `useAuth()` 훅 사용
         - `authReady && firebaseUser` 조건 충족 후에만 데이터 로드
      5. `src/components/SolutionBusinessDashboard.tsx` 수정:
         - `useReport` 호출 시 `{ firebaseUser, authReady }` 옵션 전달

### Phase 10: 디자인 시스템 적용 및 차트 안정화 -- COMPLETED (2026-02-16)

#### 10-1. 디자인 가이드라인 적용
46. [x] **TailwindCSS 설정 업데이트**:
    - `tailwind.config.js`: Primary(Purple), Accent(Emerald) 컬러 팔레트 추가
    - 애니메이션(`fade-in`, `slide-up`) 및 `boxShadow` 프리셋 추가
47. [x] **글로벌 스타일 적용**: `src/index.css`에 body 배경 그라데이션 적용
48. [x] **컴포넌트 리팩토링**:
    - `SolutionBusinessDashboard.tsx`: 하드코딩된 색상(`blue-600` 등)을 시맨틱 토큰(`primary-600` 등)으로 교체
    - `AchievementCharts.tsx`: 차트 색상 팔레트 업데이트 (Purple 계열)

#### 10-2. 차트 렌더링 안정화 (Critical Fix)
49. [x] **Recharts Dimension Error 수정**: `width(-1) and height(-1)` 에러 해결
    - `ChartWrapper.tsx`: 마운트 딜레이를 100ms -> 400ms로 증가 (부모 페이드인 애니메이션 300ms 대기)
    - `ResponsiveContainer`: `height` prop에 고정 픽셀값 전달 (`100%` -> `height={320}`)
    - `minWidth`: `1px` (Container) 및 `100px` (ResponsiveContainer) 설정으로 0 div 방지

---


### Phase 11: 레이아웃 리디자인 (Sidebar Navigation) -- COMPLETED (2026-02-16)

#### 11-1. 사이드바 레이아웃 적용
50. [x] **레이아웃 컴포넌트 구현**:
    - `src/components/layout/Sidebar.tsx`: 반응형 사이드바, 네비게이션 링크, 관리자 메뉴, 사용자 프로필
    - `src/components/layout/MainLayout.tsx`: 사이드바 + 메인 컨텐츠 영역 구조
51. [x] **페이지 분리 및 라우팅**:
    - `src/pages/DataInputPage.tsx`: 대시보드 내 "개별 데이터 입력" 기능을 별도 페이지로 분리
    - `src/router.tsx`: `MainLayout`을 보호된 라우트의 부모로 설정, `/input` 라우트 추가
52. [x] **대시보드 리팩토링**:
    - `SolutionBusinessDashboard.tsx`: 상단 헤더 및 탭 네비게이션 제거, 순수 대시보드 뷰로 전환
    - `authService.ts`: 사용자 프로필 로드 시 `divisionName` 매핑 추가 (사이드바 표시용)

---

## 5. 추가 개선 사항 (Completed)

### P1 - 데이터 정합성 강화
- [x] **부문별 엑셀 파싱 로직 개선**: 기존 하드코딩된 월/컬럼 인덱스 제거
    - 월별 4개 컬럼(매출, 매입, 이익, 달성율) 구조 지원
    - `parseDivisionExcelFile` 리팩토링 및 동적 헤더 감지 적용
- [x] **데이터 표시 오류 수정**: `dbRepair.ts` 유틸리티 추가
    - 메타데이터(months) 누락 시 제품 데이터 기반 복구 로직 구현
    - `DataInputPage`에 데이터 동기화 및 점검 기능 추가

### P2 - 제품 마스터 관리 개선
- [x] **제품-부문 연관 관계 제거**: 유저 요청에 따라 Product Master에서 Division 제외
    - `ProductManagementPage.tsx` UI 수정 (필터, 입력폼, 테이블)
    - `productMasterService.ts` 로직 수정 (divisionId 저장/조회 제거)
    - `types/index.ts` 타입 정의 업데이트 (`divisionId` optional 처리)

---

## 6. 엑셀 파일 구조 참고 (sales_data_2_4.xlsx)

```
Row 2:  제목 - ['26년_예상매출이익_90%~100%]제품별
Row 3:  작성일시/작성자
Row 6-12: 필터 조건 메타정보
Row 14: 월 헤더 (B: "계산서일자 ->", C: "1월 2026", F: "2월 2026", I: "전체")
Row 15: 컬럼 헤더 (B: "제품군", C: "매출액 합계", D: "매입액 합계", E: "매출이익", ...)
Row 16-37: 데이터 (22개 제품)
Row 38: 전체 합계
```

**컬럼 매핑:**
| 엑셀 컬럼 | 내용 | 비고 |
|-----------|------|------|
| B | 제품군 | 필수 |
| C | 1월 매출액 | 파싱 대상 |
| D | 1월 매입액 | 파싱 대상 |
| E | 1월 매출이익 | 계산값 (C-D), 파싱 불필요 |
| F | 2월 매출액 | 파싱 대상 |
| G | 2월 매입액 | 파싱 대상 |
| H | 2월 매출이익 | 계산값 (F-G), 파싱 불필요 |
| I | 전체 매출액 | 계산값, 파싱 불필요 |
| J | 전체 매입액 | 계산값, 파싱 불필요 |
| K | 전체 매출이익 | 계산값, 파싱 불필요 |

**엑셀 파싱 전략:**
- row 14에서 월 헤더 감지: "1월 2026", "2월 2026" 등
- 각 월은 3컬럼(매출액, 매입액, 매출이익) 단위로 반복
- "매출이익" 컬럼과 "전체" 섹션은 앱에서 자체 계산하므로 파싱 생략
- "전체" 행(제품군 값이 "전체")은 제외

---

## 6. sales-app에서 재활용 가능한 코드/패턴

| 항목 | sales-app 소스 | 적용 방법 |
|------|---------------|-----------|
| Excel 동적 import | `src/utils/excelExport.ts` | excelParser.ts에 동일 패턴 적용 |
| 숫자 포맷팅 | `src/utils/formatters.ts` | 통화 포맷 유틸 참조 |
| ErrorBoundary | `src/components/common/ErrorBoundary.tsx` | 그대로 복사 적용 |
| LoadingSpinner | `src/components/common/LoadingSpinner.tsx` | 업로드 중 표시용 |
| Vite 청크 분리 | `vite.config.ts` manualChunks | exceljs 별도 청크 |
| index.html 메타태그 | `index.html` | 한국어, viewport, PWA 메타 |
| TailwindCSS 설정 | `tailwind.config.js` | 폰트, 색상 체계 |
| Firebase Hosting | `firebase.json` | 배포 설정 |
| Firebase Auth | `src/contexts/AuthContext.tsx` | 인증 컨텍스트 패턴 참조 |
| baseService 패턴 | `src/firebase/services/baseService.ts` | Firestore CRUD 공통 패턴 참조 |

---

## 7. 전체 파일 구조 (Phase 9 완료)

```
.
├── .github/
│   ├── DEPLOYMENT.md                          # 배포 설정 가이드
│   └── workflows/
│       ├── firebase-hosting.yml               # main 브랜치 자동 배포
│       └── firebase-hosting-preview.yml       # PR 프리뷰 배포
├── firebase.json                              # Firebase Hosting 설정
├── firestore.rules                            # Firestore 보안 규칙 + products_master (Phase 9.7)
├── firestore.indexes.json                     # Firestore 복합 인덱스
├── .firebaserc                                # Firebase 프로젝트 연결
├── package.json                               # deploy 스크립트 포함
└── src/
    ├── App.tsx                                # ErrorBoundary + AuthProvider + RouterProvider
    ├── router.tsx                             # 라우트 정의
    ├── main.tsx
    ├── contexts/
    │   └── AuthContext.tsx                    # Auth 상태 관리 + authReady 플래그 (Phase 9.7)
    ├── firebase/
    │   ├── config.ts                          # app, db, auth export
    │   └── services/
    │       ├── authService.ts                 # 인증 관련
    │       ├── divisionService.ts             # 부문 CRUD
    │       ├── divisionDataService.ts         # 부문별 데이터 CRUD
    │       ├── productMasterService.ts        # 제품 마스터 CRUD
    │       ├── productService.ts              # 매출 데이터 CRUD
    │       ├── reportService.ts               # 보고서 CRUD
    │       ├── targetService.ts               # 분기별 목표 CRUD
    │       ├── uploadHistoryService.ts        # 업로드 이력
    │       └── userService.ts                 # 사용자 관리
    ├── hooks/
    │   ├── useReport.ts                       # 매출 데이터 + 병합 모드 + authReady 체크 (Phase 9.7)
    │   ├── useDivisionReport.ts               # 부문별 집계
    │   ├── useTargets.ts                      # 분기 목표
    │   └── useAchievement.ts                  # 달성율 계산 + useAuth 연동 (Phase 9.7)
    ├── types/
    │   └── index.ts                           # 모든 TypeScript 인터페이스
    ├── utils/
    │   ├── excelParser.ts                     # 제품별 엑셀 파싱
    │   ├── divisionExcelParser.ts             # 부문별 엑셀 파싱
    │   └── periodUtils.ts                     # 분기/반기/연간 유틸
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx
    │   ├── error/                             # NEW (Phase 9)
    │   │   ├── ErrorBoundary.tsx              # React Error Boundary
    │   │   ├── FirestoreErrorFallback.tsx     # Firestore 에러 UI
    │   │   ├── LoadingSpinner.tsx             # 로딩 스피너
    │   │   └── index.ts
    │   ├── reports/
    │   │   ├── ReportFilterBar.tsx
    │   │   ├── DivisionSummaryTable.tsx
    │   │   └── DivisionCharts.tsx
    │   ├── targets/
    │   │   └── TargetInputTable.tsx
    │   ├── achievement/
    │   │   ├── AchievementTable.tsx
    │   │   └── AchievementCharts.tsx
    │   └── SolutionBusinessDashboard.tsx      # 메인 대시보드 (병합 모드 UI 포함)
    └── pages/
        ├── LoginPage.tsx
        ├── RegisterPage.tsx
        ├── DivisionReportPage.tsx
        ├── AchievementPage.tsx
        └── admin/
            ├── DivisionManagementPage.tsx
            ├── ProductManagementPage.tsx
            ├── UserManagementPage.tsx
            └── TargetInputPage.tsx
```

---

## 8. Firestore 전체 스키마 (Phase 5~8 완료 후)

```
Firestore Root
├── users/{uid}                                # Phase 5
│   ├── uid, email, displayName
│   ├── divisionId → divisions/{id}
│   ├── role: 'admin' | 'user'
│   ├── status: 'pending' | 'approved' | 'rejected'
│   └── createdAt, updatedAt
│
├── divisions/{divisionId}                     # Phase 5
│   ├── name: string
│   ├── sortOrder: number
│   └── createdAt, updatedAt
│
├── products_master/{productId}                # Phase 6
│   ├── name, divisionId, isMaintenanceType
│   ├── sortOrder
│   └── createdAt, updatedAt
│
├── reports/{reportId}                         # Phase 4 (기존)
│   ├── year, title, months[], monthLabels{}
│   ├── createdAt, updatedAt
│   └── products/{productId}                   # Phase 4 + 6 확장
│       ├── product, months{}, sortOrder
│       ├── divisionId (NEW Phase 6)
│       └── productMasterId (NEW Phase 6)
│
├── targets/{year-quarter-divisionId}          # Phase 8
│   ├── year, quarter, divisionId
│   ├── salesTarget, profitTarget?
│   ├── createdBy → users/{uid}
│   └── createdAt, updatedAt
│
└── uploadHistory/{id}                         # Phase 4 (기존)
    ├── reportId, fileName, monthsAffected[]
    ├── productCount, uploadedAt
    └── uploadedBy → users/{uid}

---

### Phase 12: 데이터 관리 및 편의성 개선 -- COMPLETED (2026-02-17)

#### 12-1. 제품 마스터 초기 데이터 등록
53. [x] **22종 제품 일괄 등록 기능**:
    - `src/firebase/services/productMasterService.ts`: `seedInitialProductMasters` 함수 구현
    - `src/pages/DataInputPage.tsx`: "제품 마스터 초기화 (22종)" 버튼 추가
    - `src/firebase/utils/dbRepair.ts`: 데이터베이스 복구 유틸리티 연동

#### 12-2. 솔루션사업본부 추가 및 자동 권한
54. [x] **신규 부문 추가**:
    - `src/firebase/services/divisionService.ts`: `DEFAULT_DIVISIONS`에 "솔루션사업본부" 추가
    - `seedDefaultDivisions` 로직 개선: 누락된 기본 부문 자동 생성 보장
55. [x] **자동 관리자 권한 부여**:
    - `src/pages/admin/UserManagementPage.tsx`: "솔루션사업본부" 배정 시 `admin` 권한 자동 부여

### Phase 13: 분기별 이익 목표 관리 -- COMPLETED (2026-02-17)
56. [x] **이익 목표 추가**:
    - `src/types/index.ts`: `QuarterlyTarget`에 `profitTarget` 필드 추가
    - `src/components/targets/TargetInputTable.tsx`: 매출 목표와 함께 이익 목표 입력 UI 추가
    - `src/pages/AchievementPage.tsx`: 이익 달성율 차트 및 테이블 컬럼 추가
57. [x] **인덱스 최적화**:
    - `firestore.indexes.json`: `targets` 컬렉션 복합 인덱스 (year-quarter-divisionId) 추가 및 배포

### Phase 14: 엑셀 파싱 헤더 위치 수정 -- COMPLETED (2026-02-17)
58. [x] **헤더 검색 범위 확대**:
    - `src/utils/excelParser.ts`: 헤더 행 검색 범위를 Row 2까지 확대 (기존 Row 10)
    - 상단(Row 3)에 위치한 월 헤더도 정상 인식하도록 개선

### Phase 15: 데이터 업로드 권한 개선 -- COMPLETED (2026-02-17)
59. [x] **Firestore 규칙 완화**:
    - `firestore.rules`: `reports`, `products`, `division_data` 컬렉션에 대해 `isApproved()` 사용자도 `create/update` 허용
    - 관리자 외 승인된 사용자도 데이터 업로드 가능하도록 개선

### Phase 16: 업로드 기록(History) 권한 수정 -- COMPLETED (2026-02-17)
60. [x] **History 쓰기 권한 부여**:
    - `firestore.rules`: `uploadHistory` 컬렉션에 `isApproved()` 사용자의 `create` 권한 추가
    - 업로드 시 기록 저장 실패로 인한 전체 트랜잭션 롤백 방지

### Phase 17: 스냅샷(Smart Mode) 권한 수정 -- COMPLETED (2026-02-17)
61. [x] **스냅샷 하위 컬렉션 규칙 추가**:
    - `firestore.rules`: `reports/{reportId}/snapshots` 및 하위 `products` 컬렉션 규칙 명시
    - 스마트 모드 업로드 시 스냅샷 생성 권한 오류 해결

### Phase 18: 데이터 표시 누락 해결 및 디버깅 -- COMPLETED (2026-02-17)
62. [x] **데이터 로딩 레이스 컨디션 수정**:
    - `src/hooks/useReport.ts`: `loadedRef` 로직 제거하여 빠른 인증 상태 변경 시 로딩 스킵 방지
    - 데이터가 존재함에도 화면에 표시되지 않는 문제 해결
63. [x] **제품 데이터 타입 수정**:
    - `src/types/index.ts`: `ProductData` 인터페이스에 `sortOrder` 속성 추가 (TS 에러 해결)

### Phase 19: 데이터 리셋 및 파싱 로직 전면 수정 -- COMPLETED (2026-02-18)
64. [x] **데이터 초기화 기능 안정화**:
    - `src/firebase/services/reportService.ts`: `clearReportData(reportId)` 구현 (모든 하위 컬렉션 재귀 삭제)
    - `src/pages/DataInputPage.tsx`:
      - "데이터 초기화 (전체 삭제)" 버튼 및 이중 경고창 추가
      - **Critical Fix**: `TypeError: n.indexOf` 수정 (문서 ID 타입 불일치 해결: `2026` -> `'report-2026'`)
      - **Critical Fix**: `BloomFilterError` 해결 (데이터 대량 삭제 후 `terminate(db)` 및 `clearIndexedDbPersistence(db)` 호출로 로컬 캐시 초기화)
65. [x] **엑셀 컬럼 매핑 로직 지능화 (Data Overwrite 해결)**:
    - `src/utils/excelParser.ts`:
      - **Off-by-One Fix**: 컬럼 스캔 범위를 `+3`에서 `+2`로 축소하여 다음 달 데이터(3칸 뒤) 침범 방지
      - **Duplicate Header Fix**: 병합된 셀이나 반복된 헤더로 인해 동일 월 키가 중복 감지될 경우, **이미 등록된 월은 무시**하도록 로직 강화
      - 월 헤더 하단 행(Sub-header) 스캔 로직 추가 ("매출", "매입" 키워드 직접 매핑)
      - 상세 디버깅 로그(`[ExcelParser]`) 추가로 파싱 과정 투명화
    - 권한 변경 알림 시스템 적용

#### 12-3. 버그 수정 및 안정화
56. [x] **회원가입 페이지 부문 목록 표시 수정**:
    - `firestore.rules`: `divisions` 컬렉션 읽기 권한을 모든 사용자(`true`)에게 허용 (로그인 전 조회 가능하도록)
57. [x] **영업부문 관리 페이지 오류 수정**:
    - `DivisionManagementPage.tsx`: 삭제된 `getProductMastersByDivision` 함수 의존성 제거 및 구문 오류 수정
    - 부문 삭제 시 제품 연동 체크 로직 제거 (더 이상 종속되지 않음)

---

### Phase 13: 주차별 스냅샷 저장 및 월별 충돌 해결 -- COMPLETED (2026-02-17)

> **목표**:
> - 매주 업로드되는 데이터를 주차별로 구분하여 스냅샷 저장
> - 과거 월 데이터 변동 감지 및 중복 저장 방지
> - 월 단위 충돌 시 사용자가 기존 유지 또는 신규 대체 선택 가능
> - 웹페이지에서 각 주별 스냅샷 데이터 조회 기능

#### 13-1. 데이터베이스 스키마 확장

```
reports/report-{year}/
  latestWeekKey: string                 # 최신 업로드 주차 키 (예: "2026-W07")
  products/{productId}                  # 현재 활성 데이터 (기존 유지)

  snapshots/{weekKey}/                  # 신규: 주차별 스냅샷
    weekKey: string                     # ISO 주차 키
    uploadedAt: Timestamp
    uploadedBy: string
    fileName: string
    monthsIncluded: string[]
    monthLabels: Record<string, string>
    productCount: number
    monthHashes: Record<string, string> # 월별 데이터 해시 (변경 감지용)

    products/{productId}                # 해당 주차 시점의 제품 데이터
      product, months, sortOrder
```

#### 13-2. 작업 항목

58. [x] **타입 정의 추가**:
    - `src/types/index.ts`: `WeekKey`, `WeeklySnapshot`, `MonthDataHash`, `MonthConflict`, `UploadAnalysisResult`, `ConflictResolution`, `ConflictResolutionSaveResult` 타입 추가

59. [x] **주차/해시 유틸리티 구현**:
    - `src/utils/weekUtils.ts`: ISO 주차 계산, 주차 키 생성/파싱, 주차 라벨 생성
    - `src/utils/hashUtils.ts`: SHA-256 해시 생성, 월별 데이터 해시 계산

60. [x] **스냅샷 서비스 구현**:
    - `src/firebase/services/snapshotService.ts`:
      - `saveWeeklySnapshot()`: 주차별 스냅샷 저장
      - `getSnapshots()`: 스냅샷 목록 조회
      - `getSnapshotProducts()`: 특정 주차 제품 데이터 조회
      - `analyzeUpload()`: 업로드 데이터 분석 (충돌 감지)
      - `saveWithResolutions()`: 충돌 해결 후 저장

61. [x] **useReport 훅 확장**:
    - `src/hooks/useReport.ts`:
      - `currentWeekKey`, `availableSnapshots`, `selectedSnapshot` 상태 추가
      - `analyzeUpload()`, `saveWithConflictResolution()`, `loadSnapshot()`, `loadLatest()` 메서드 추가

62. [x] **주차 선택 UI 컴포넌트**:
    - `src/components/upload/WeekSelector.tsx`: 주차 선택 드롭다운, 현재(최신) 옵션, 스냅샷 목록 표시

63. [x] **충돌 해결 모달 컴포넌트**:
    - `src/components/upload/ConflictResolutionModal.tsx`:
      - 분석 결과 요약 (신규 월, 변경 없음, 충돌 발생)
      - 월별 충돌 항목 (기존/신규 데이터 비교)
      - 개별 선택: "기존 유지" / "신규로 대체"
      - 전체 선택 버튼

64. [x] **DataInputPage 통합**:
    - `src/pages/DataInputPage.tsx`:
      - 업로드 모드에 'smart' 추가 (자동 충돌 감지)
      - WeekSelector 컴포넌트 연동
      - ConflictResolutionModal 연동

#### 13-3. 충돌 해결 플로우

```
파일 업로드 → 파싱 → analyzeUpload() 호출
                 ↓
     ┌──────────────────────────┐
     │ 충돌 있음?               │
     │ NO  → 바로 저장          │
     │ YES → 충돌 모달 표시     │
     └──────────────────────────┘
                 ↓ (충돌 시)
사용자가 월별로 "기존 유지" 또는 "신규 대체" 선택
                 ↓
saveWithConflictResolution() 호출
                 ↓
스냅샷 저장 + 활성 데이터 업데이트
```

```
