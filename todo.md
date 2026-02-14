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
- [ ] **인쇄/PDF 최적화**: `@media print` CSS 스타일 없음 -> 인쇄 시 레이아웃 깨짐 예상
- [ ] **반응형 테이블**: 모바일에서 상세 보고서 테이블 가독성 개선
- [ ] **로딩 상태 표시**: 파일 업로드 중 로딩 인디케이터 없음
  - sales-app의 `LoadingSpinner` 컴포넌트 패턴 참조
- [ ] **에러 바운더리**: sales-app의 `ErrorBoundary` 컴포넌트 패턴 적용
- [ ] **알림 시스템**: 현재 자체 구현 -> sales-app의 `NotificationContext` 패턴 참조 가능

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

### Phase 5: 인증 & 라우팅 기반 구축

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

17. [ ] 의존성 추가 및 Firebase Auth 설정
    - `npm install react-router-dom`
    - `src/firebase/config.ts`에 `getAuth(app)` export 추가
18. [ ] 인증 서비스 및 컨텍스트 구현
    - `src/firebase/services/authService.ts`: 회원가입, 로그인, 로그아웃, 사용자 승인/거절
      - `ensureAdminUser(uid, email)`: `hclim@hunesion.com` 첫 로그인 시 admin+approved 자동 생성
      - 이후 가입자는 `status: 'pending'` → 관리자 승인 필요
    - `src/contexts/AuthContext.tsx`: `onAuthStateChanged` + Firestore `users/{uid}` 프로필 연동
    - `src/hooks/useAuth.ts`: AuthContext wrapper hook
19. [ ] 영업부문 서비스 구현
    - `src/firebase/services/divisionService.ts`: 부문 CRUD + 기본 5개 부문 seed
    - 기본값: 공공사업부문(0), 융합사업부문(1), 전략사업부문(2), 금융기업사업부문(3), 유지보수(4)
20. [ ] 로그인/가입 페이지 구현
    - `src/pages/LoginPage.tsx`: 이메일/비밀번호 로그인 폼
    - `src/pages/RegisterPage.tsx`: 가입 신청 (이름, 이메일, 비밀번호, 부문 선택)
    - `src/components/auth/ProtectedRoute.tsx`: 미인증 리다이렉트, adminOnly prop
21. [ ] 라우팅 설정 및 컴포넌트 분리
    - `src/router.tsx`: 전체 라우트 정의
    - `src/App.tsx`: `AuthProvider` + `RouterProvider` 래핑
    - `SolutionBusinessDashboard.tsx` 670줄 분할:
      - `src/components/dashboard/DashboardView.tsx` (대시보드 뷰 추출)
      - `src/components/dashboard/InputView.tsx` (입력 뷰 추출)
      - `src/components/layout/AppLayout.tsx` (헤더/네비/푸터 Outlet 레이아웃)
      - `src/utils/formatters.ts` (formatCurrency 등 유틸 추출)
      - `src/constants/index.ts` (MONTH_COLORS, INITIAL_DATA 등 상수 추출)
22. [ ] 기존 타입 및 서비스 수정
    - `src/types/index.ts`: `UserProfile`, `Division`, `UserRole`, `UserStatus` 타입 추가
    - `src/firebase/services/uploadHistoryService.ts`: `uploadedBy`에 실제 uid 전달

### Phase 6: 영업부문 & 제품 마스터 관리 (CRUD)

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

23. [ ] 제품 마스터 서비스 구현
    - `src/firebase/services/productMasterService.ts`: 제품 마스터 CRUD, 부문별 필터
24. [ ] 관리자 페이지 구현
    - `src/pages/admin/DivisionManagementPage.tsx`: 부문 목록/추가/수정/삭제 (삭제 시 소속 제품 체크)
    - `src/pages/admin/ProductManagementPage.tsx`: 제품 목록, 부문 배정, 유지보수 타입 토글
    - `src/pages/admin/UserManagementPage.tsx`: 사용자 승인/거절, 역할 변경
25. [ ] 기존 데이터 모델 확장
    - `ProductData` 타입에 `divisionId?`, `productMasterId?` 추가
    - `productService.ts`: `saveProducts()`, `addProduct()`에 divisionId 포함
    - `getProducts()`에 divisionId 필터 옵션 추가
26. [ ] 마이그레이션 지원
    - divisionId 없는 기존 제품 → "미분류" 표시
    - 관리자가 제품 관리 페이지에서 부문 배정
    - 기존 `_MA` suffix → `isMaintenanceType: true` 매핑
    - 엑셀 업로드 시 제품 마스터 매칭하여 divisionId 자동 배정

### Phase 7: 부문별 보고 & 기간별 집계

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

27. [ ] 기간 유틸리티 구현
    - `src/utils/periodUtils.ts`: 분기/반기/연간 변환 및 집계 함수
28. [ ] 부문별 보고 훅 구현
    - `src/hooks/useDivisionReport.ts`: divisions + products → DivisionSummary[] 집계
    - admin: 전체 부문 조회 / 일반 user: 본인 소속 부문만 조회
29. [ ] 부문별 보고 페이지 및 컴포넌트
    - `src/pages/DivisionReportPage.tsx`: 필터바 + 테이블 + 차트
    - `src/components/reports/ReportFilterBar.tsx`: 연도, 기간유형(월/분기/반기/연간) 탭, 부문 필터
    - `src/components/reports/DivisionSummaryTable.tsx`: 부문별 확장 가능 테이블
    - `src/components/reports/DivisionCharts.tsx`: Stacked bar + Pie 차트

### Phase 8: 분기별 목표 & 달성율

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

30. [ ] 목표 서비스 및 훅 구현
    - `src/firebase/services/targetService.ts`: 목표 CRUD
    - `src/hooks/useTargets.ts`: 목표 데이터 훅
    - `src/hooks/useAchievement.ts`: 목표 + 실적 결합 → 달성율 계산
31. [ ] 목표 입력 페이지
    - `src/pages/admin/TargetInputPage.tsx`: 부문 × 분기 매트릭스 테이블
    - `src/components/targets/TargetInputTable.tsx`: 편집 가능한 입력 테이블
32. [ ] 달성율 대시보드
    - `src/pages/AchievementPage.tsx`: 달성율 KPI + 테이블 + 차트
    - `src/components/achievement/AchievementTable.tsx`: 진행률 바 + 색상 코딩
    - `src/components/achievement/AchievementCharts.tsx`: 게이지/Grouped bar 차트
33. [ ] 기존 대시보드 연동
    - DashboardView KPI 카드에 "분기 목표 달성율" 카드 추가 (현재 분기 기준, 목표 설정 시에만 표시)

### Phase 9: UI/UX 안정화 & 배포

34. [ ] 인쇄용 CSS 강화
    - `@media print` 스타일: 네비게이션 숨기기, 테이블 페이지 나눔, 폰트 크기 조정
35. [ ] 에러 핸들링 강화
    - `ErrorBoundary` 컴포넌트, Firestore 연결 실패 시 fallback UI
36. [ ] 엑셀 업로드 병합 모드
    - 새 파일 업로드 시 "덮어쓰기 / 병합" 선택 옵션
37. [ ] Firestore 보안 규칙 적용
    - `isApproved()`, `isAdmin()` 헬퍼 함수 기반 규칙 적용
38. [ ] Firebase Hosting 배포
    - `firebase.json`: SPA rewrite, 캐시 헤더
    - `.firebaserc`: `hunesalesreport` 프로젝트 연결
39. [ ] GitHub Actions CI/CD (선택)
    - PR 시 빌드 검증, main 머지 시 자동 배포

---

## 5. 엑셀 파일 구조 참고 (sales_data_2_4.xlsx)

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

## 7. 전체 파일 구조 (Phase 5~8 완료 후 예상)

```
src/
├── App.tsx                                    # AuthProvider + RouterProvider
├── router.tsx                                 # 라우트 정의
├── main.tsx
├── constants/
│   └── index.ts                               # MONTH_COLORS, INITIAL_DATA 등
├── contexts/
│   └── AuthContext.tsx                         # Auth 상태 관리
├── firebase/
│   ├── config.ts                              # app, db, auth export
│   └── services/
│       ├── authService.ts                     # 인증 관련
│       ├── divisionService.ts                 # 부문 CRUD
│       ├── productMasterService.ts            # 제품 마스터 CRUD
│       ├── productService.ts                  # 매출 데이터 CRUD (divisionId 확장)
│       ├── reportService.ts                   # 보고서 CRUD
│       ├── targetService.ts                   # 분기별 목표 CRUD
│       └── uploadHistoryService.ts            # 업로드 이력
├── hooks/
│   ├── useAuth.ts                             # AuthContext wrapper
│   ├── useReport.ts                           # 매출 데이터 (divisionId 필터)
│   ├── useDivisionReport.ts                   # 부문별 집계
│   ├── useTargets.ts                          # 분기 목표
│   └── useAchievement.ts                      # 달성율 계산
├── types/
│   └── index.ts                               # 모든 TypeScript 인터페이스
├── utils/
│   ├── excelParser.ts                         # 엑셀 파싱
│   ├── formatters.ts                          # 통화 포맷 유틸
│   └── periodUtils.ts                         # 분기/반기/연간 유틸
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   ├── layout/
│   │   └── AppLayout.tsx                      # 공통 레이아웃 (Outlet)
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   └── InputView.tsx
│   ├── reports/
│   │   ├── ReportFilterBar.tsx
│   │   ├── DivisionSummaryTable.tsx
│   │   └── DivisionCharts.tsx
│   ├── targets/
│   │   └── TargetInputTable.tsx
│   └── achievement/
│       ├── AchievementTable.tsx
│       └── AchievementCharts.tsx
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
```
