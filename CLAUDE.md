# CLAUDE.md - HSR (Huni Sales Report System)

## Project Overview

- **Name**: HSR (Huni Sales Report System) - 휴네시온 솔루션사업본부 매출 보고 시스템
- **URL**: https://henesalesreport-v2.web.app
- **Stack**: React 19.2 + TypeScript 5.9 + Vite 7.2 + Firebase 12.9 (Firestore, Auth, Hosting) + Tailwind CSS 3.4
- **Charts**: Recharts 3.5
- **Excel**: ExcelJS 4.4 (매출 데이터 파싱)
- **Icons**: Lucide React
- **Test**: Vitest 4.0 + Testing Library
- **Language**: Korean (UI/comments)

## Commands

```bash
npm run dev          # 개발 서버 (Vite)
npm run build        # tsc -b && vite build
npm run preview      # 빌드 프리뷰
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run deploy       # build + firebase deploy --only hosting
npm run deploy:rules # firebase deploy --only firestore:rules
npm run deploy:all   # build + firebase deploy (전체)
```

## File Structure

```
src/
├── App.tsx                    # Root: ErrorBoundary > AuthProvider > RouterProvider
├── main.tsx                   # ReactDOM entry (StrictMode)
├── router.tsx                 # React Router v7 (React.lazy 코드 분할 적용)
├── index.css                  # Tailwind base + global styles
│
├── components/                # 공통 UI 컴포넌트
│   ├── SolutionBusinessDashboard.tsx  # 메인 대시보드 (항상 로드)
│   ├── achievement/           # 달성률 차트/테이블 (React.memo 적용)
│   ├── auth/                  # ProtectedRoute (adminOnly 지원)
│   ├── charts/                # ChartWrapper, DualAxisChart
│   ├── common/                # KPICardGrid (공통 KPI 카드)
│   ├── error/                 # ErrorBoundary, LoadingSpinner, FirestoreErrorFallback
│   ├── layout/                # MainLayout, Sidebar
│   ├── reports/               # DivisionCharts, ProductCharts, 테이블 등 (React.memo 적용)
│   ├── targets/               # TargetInputTable (오케스트레이터)
│   ├── ui/                    # Badge, Button, Card, Input, Modal, Toast, ViewToggle
│   └── upload/                # ConflictResolutionModal, WeekSelector
│
├── features/                  # 도메인 주도 모듈 (hooks + components + barrel)
│   ├── dashboard/             # useDashboardData + KPI/차트 컴포넌트
│   ├── dataInput/             # useDataInput + MergeModeSelector, DataListTable 등
│   ├── productManagement/     # useProductManagement + ProductAddForm, ProductTable, DeleteConfirmModal
│   ├── userManagement/        # useUserManagement + StatusBadge, UserTable
│   ├── divisionManagement/    # useDivisionManagement + DivisionList, DivisionAddForm
│   └── targetInput/           # useTargetMatrix + ModeToggle, AnnualTargetInputs, RatioInputs, TargetDataTable
│
├── pages/                     # 라우트 엔트리 (React.lazy로 코드 분할)
│   ├── LoginPage.tsx          # 로그인 (5회 실패 시 5분 잠금)
│   ├── RegisterPage.tsx       # 회원가입 (비밀번호 강도 프로그레스 바)
│   ├── DataInputPage.tsx      # 엑셀 업로드 + 데이터 입력
│   ├── DivisionReportPage.tsx # 부문별 리포트
│   ├── ProductReportPage.tsx  # 제품별 리포트
│   ├── AchievementPage.tsx    # 달성률 분석
│   └── admin/                 # 관리자 전용 (ProtectedRoute adminOnly)
│       ├── DivisionManagementPage.tsx
│       ├── ProductManagementPage.tsx
│       ├── UserManagementPage.tsx
│       └── TargetInputPage.tsx
│
├── hooks/                     # 공통 커스텀 훅
│   ├── useReport.ts           # 조합 훅 (useReportData + useReportSnapshots + useReportUpload)
│   ├── useReportData.ts       # Firestore 데이터 페칭
│   ├── useReportSnapshots.ts  # 스냅샷 관리
│   ├── useReportUpload.ts     # 업로드 로직
│   ├── useAchievement.ts      # 달성률 계산
│   ├── useDivisionReport.ts   # 부문 리포트 데이터
│   ├── useTargets.ts          # 목표 데이터
│   ├── useNotification.ts     # 알림 상태 관리 (공통)
│   └── useViewMode.ts         # 차트/테이블 뷰 토글 (공통)
│
├── types/                     # 도메인별 분리된 타입
│   ├── index.ts               # barrel export
│   ├── core.ts, parse.ts, user.ts, product.ts, report.ts, target.ts, snapshot.ts
│
├── firebase/
│   ├── config.ts              # Firebase 초기화 (환경변수)
│   ├── services/              # Firestore CRUD 서비스 (auth, division, product, report, snapshot, target, user, uploadHistory)
│   └── utils/dbRepair.ts      # DB 복구 유틸
│
├── contexts/AuthContext.tsx    # Firebase Auth + 30분 비활동 타임아웃
├── config/appConfig.ts        # 앱 상수 (페이지네이션, 캐시, 타임아웃, 파일 제한)
├── constants/colors.ts        # CHART_COLORS, DIVISION_COLORS, MONTH_COLORS (중앙화)
│
└── utils/
    ├── excelParser.ts         # 매출 엑셀 파싱
    ├── divisionExcelParser.ts # 부문별 엑셀 파싱
    ├── fileValidator.ts       # 4단계 파일 검증 (확장자 + MIME + 크기 + 매직바이트)
    ├── passwordValidator.ts   # 비밀번호 강도 검증 (8자+, 대/소문자, 숫자)
    ├── logger.ts              # 환경 기반 로깅 (DEV에서만 debug/info)
    ├── hashUtils.ts           # 데이터 해시
    ├── periodUtils.ts         # 기간 계산
    ├── weekUtils.ts           # 주차 계산
    ├── formatUtils.ts         # 숫자/통화 포맷
    └── achievementUtils.ts    # 달성률 유틸
```

## Architecture Patterns

### Routing & Code Splitting
- `router.tsx`: 7개 페이지 React.lazy + Suspense 적용
- 항상 즉시 로드: LoginPage, RegisterPage, SolutionBusinessDashboard
- SuspenseWrapper 공통 컴포넌트로 LoadingSpinner fallback 통일

### Feature Module Structure
- 각 feature: `hooks/` + `components/` + `index.ts` (barrel) + `__tests__/`
- 커스텀 훅이 상태/로직 관리, 컴포넌트는 순수 UI 렌더링
- pages 폴더의 Page 컴포넌트가 feature 모듈을 조합하는 오케스트레이터 역할

### State Management
- Firebase Auth: `AuthContext` (Context API)
- Server state: 각 커스텀 훅에서 Firestore 직접 구독/fetch
- Local state: `useState` / 커스텀 훅 (useNotification, useViewMode)

### Path Aliases
- `@/` → `src/` (vite.config.ts resolve alias)

## Performance Optimizations

### Code Splitting (Vite)
- `manualChunks`: exceljs → `vendor-excel`, recharts+d3 → `vendor-charts`
- 7개 페이지 React.lazy 적용 (초기 번들 50%+ 감소)
- `chunkSizeWarningLimit`: 1000KB

### React.memo
- 10개 컴포넌트 적용: Dashboard KPI/차트 4개, Reports 차트/테이블 4개, Achievement 2개
- SolutionBusinessDashboard: useCallback 5개 핸들러 메모이제이션
- shallow comparison 기반, 커스텀 비교 함수 불필요

### 중복 제거
- colors.ts: 차트 색상 팔레트 중앙 관리
- useNotification: 알림 패턴 3개 페이지에서 공통화
- useViewMode + ViewToggle: 뷰 토글 4개 페이지에서 통일
- KPICardGrid: KPI 카드 UI 공통 컴포넌트

## Security Measures

### Firebase Hosting Headers (`firebase.json`)
- CSP (Content-Security-Policy): self + Firebase domains만 허용
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- HSTS: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/microphone/geolocation 차단
- 정적 자산 캐시: `/assets/**` → public, max-age=31536000, immutable

### Firestore Rules (`firestore.rules`)
- 역할 기반 접근 제어: admin, approved user, authenticated user
- 모든 컬렉션에 필드 검증 함수: 필수 필드, 타입, 길이 제한, 열거형 제한
- 공통 헬퍼: `isNonEmptyString()`, `isStringMaxLen()`, `isNonNegativeNumber()`
- catch-all 규칙: 명시적으로 허용하지 않은 문서는 모두 거부

### Client-Side Security
- 비밀번호: 8자 이상 + 대/소문자 + 숫자 필수 (passwordValidator.ts)
- 파일 업로드: 확장자 + MIME + 크기(10MB) + 매직바이트(ZIP/OLE2) 4단계 검증
- 세션: 30분 비활동 시 자동 로그아웃 (mouse/keyboard/touch/scroll 이벤트)
- 로그인: 5회 실패 시 5분 잠금 (localStorage 기반)
- 로깅: 프로덕션에서 debug/info 출력 차단 (logger.ts)
- 환경변수: 관리자 이메일 등 민감 정보 `.env`로 분리 (`VITE_*` prefix)

## Design System

### Color Palette
- Background: `#f1f5f9` (slate-100)
- Primary text: `#1e293b` (slate-800)
- Secondary text: `#64748b` (slate-500)
- Primary action: `#3b82f6` (blue-500) → `#2563eb` (blue-600)
- Accent: `#4f46e5` (indigo-600) → `#4338ca` (indigo-700)
- Success: `#10b981` (emerald-500)
- Warning: `#f59e0b` (amber-500)
- Danger: `#f43f5e` (rose-500)

### Typography
- Font: `'Noto Sans KR', sans-serif` (webdesign 기준) / Tailwind config: `Inter, Nanum Gothic, sans-serif`
- H1: `text-3xl font-bold text-slate-800`
- H2: `text-xl font-bold text-slate-800`
- H3: `text-lg font-bold text-slate-800`
- Subtitle: `text-slate-500`
- Label: `text-xs text-slate-400`

### Component Styles
- Card: `bg-white rounded-xl shadow-soft p-6`, 상단 테두리 강조 `border-t-4 border-{color}`
- Button active: `bg-slate-800 text-white scale(1.05)`
- Table header: `bg-slate-50 text-xs text-slate-700 uppercase`
- Table row: `bg-white border-b hover:bg-slate-50 transition`
- Modal: `fixed inset-0 bg-gray-600 bg-opacity-50 z-50`, content `w-[500px] rounded-md bg-white`

### Chart Colors
- 연도별 막대: 2023=`#cbd5e1`, 2024=`#60a5fa`, 2025=`#4f46e5`
- 성장: `text-emerald-600 ▲`, 하락: `text-rose-600 ▼`
- 산업 부문별: 공공=slate, 국방=slate-800, 금융=blue, 방산=green-700, 클라우드=violet 등

### Responsive Grid
- 4열: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
- 3열: `grid-cols-1 md:grid-cols-3 gap-6`
- 2열: `grid-cols-1 lg:grid-cols-2 gap-6`

### Tailwind Config Extensions
- Custom colors: `primary` (purple series), `accent` (emerald series)
- Custom shadows: `shadow-soft`, `shadow-soft-lg`
- Animations: `fade-in`, `slide-up`, `scale-in`, `bounce-in`
- Dark mode: `class` 기반 (미사용)

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_ADMIN_EMAIL
```

## Coding Conventions

- TypeScript strict mode
- Barrel exports: `index.ts` for each module
- Feature modules: `features/{domain}/hooks/`, `features/{domain}/components/`, `features/{domain}/index.ts`
- Page components: thin orchestrators that compose feature modules
- Custom hooks: `use{Feature}.ts` — business logic + state
- Services: `{domain}Service.ts` in `firebase/services/`
- Types: domain-split files with barrel `types/index.ts`
- Memoization: `React.memo` for expensive render components, `useCallback` for handler props
- Logging: `logger.debug/info/warn/error` — never raw `console.log`
- Colors: import from `constants/colors.ts` — never inline magic strings
- Notifications: use `useNotification` hook — never local implementation
- View mode: use `useViewMode` + `ViewToggle` — never local state

## Testing

- Framework: Vitest + jsdom + @testing-library/react
- Setup: `src/__tests__/setup.ts`
- Pattern: `src/**/*.test.{ts,tsx}` (colocated with source)
- Feature tests: `features/{domain}/__tests__/`
- React.memo tests: verify memo wrapping on chart/table components

## Known Constraints

- Firestore 읽기 제한: 대량 데이터 페칭 시 pagination 필요
- CSP가 strict하여 외부 스크립트/스타일 로딩 시 firebase.json 수정 필요
- `fonts.googleapis.com`이 CSP에 미포함 — Google Fonts 사용 시 style-src 수정 필요
- Dark mode 설정은 있으나 실제 다크 테마 미구현
- Firebase Custom Claims 미도입 (클라이언트 role 기반 — Phase 8 예정)
