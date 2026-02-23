# 대용량 파일 모듈화 및 성능 개선 방안

> **최종 업데이트**: 2026-02-23 (Phase 5 완료)
> **현재 상태**: Phase 1-5 완료 (보안 헤더 + 코드 품질 + 코드 분할 + 중복 제거 + 보안 강화 + 핵심 모듈화), Phase 6 미착수

---

## 0. 현재 프로젝트 현황 요약

### 0.1 프로젝트 개요
- **프로젝트명**: HSR (Huni Sales Report System) - 휴네시온 솔루션사업본부 매출 보고 시스템
- **기술 스택**: React 19.2 + TypeScript 5.9 + Vite 7.2 + Firebase 12.9 (Firestore + Auth + Hosting) + Tailwind CSS 3.4
- **배포**: Firebase Hosting (`hunesalesreport.web.app`)
- **빌드 도구**: Vite 7.2.4, `@vitejs/plugin-react`
- **경로 별칭**: `@/` → `./src/`

### 0.2 코드베이스 메트릭 (2차 분석 기준)

| 카테고리 | 파일 수 | 총 라인 수 |
|----------|---------|-----------|
| 페이지 (pages/) | 10 | ~2,877 |
| 컴포넌트 (components/) | 30 | ~4,110 |
| Firebase (firebase/) | 12 | ~1,831 |
| 커스텀 훅 (hooks/) | 4 | ~1,028 |
| 유틸리티 (utils/) | 7 | ~1,012 |
| 설정/타입/컨텍스트 (config/, types/, contexts/) | 4 | ~532 |
| 엔트리 (App, main, router, css, vite-env.d.ts) | 5 | ~255 |
| **합계** | **72 파일** | **~11,645 라인** |

### 0.3 빌드 산출물 현황

| 청크 | 파일명 | 크기 (비압축) | 역할 |
|------|--------|-------------|------|
| **메인 번들** | `index-69k542gp.js` | **929 KB** | 앱 전체 (라우트 분할 없음) |
| **차트 벤더** | `vendor-charts-D_q7upV1.js` | 396 KB | Recharts + D3 |
| **엑셀 벤더** | `vendor-excel-CJTj21kL.js` | 937 KB | ExcelJS (동적 import) |
| **스타일** | `index-BwqY2z-R.css` | 45 KB | Tailwind CSS |
| **이미지** | 2개 | 285 KB | 로고 + 배경 |
| **합계** | - | **~2.6 MB** | - |

> **핵심 문제**: 메인 번들 929KB에 모든 페이지가 정적 import로 포함됨. 라우트 기반 코드 분할 미적용.

### 0.4 최근 커밋 이력

| 커밋 | 변경 내용 | 상태 |
|------|----------|------|
| 3418618 | pie chart legend sorted, tooltip format | 완료 |
| fcae7f2 | pie chart readability - hide labels, add legend | 완료 |
| 6714b37 | remove chart limits (Top10/상위15), profit sorting | 완료 |
| d3c3711 | center bar charts on X-axis labels | 완료 |

### 0.5 대용량 파일 현황 (150줄 이상, 최신 기준)

| 순위 | 파일 | 라인 수 | 주요 책임 | 의존 파일 수 |
|------|------|---------|-----------|-------------|
| 1 | DataInputPage.tsx | 501 | 엑셀 업로드, 파일 처리, 데이터 삭제, 충돌 모달 | 9 |
| 2 | SolutionBusinessDashboard.tsx | 492 | 대시보드 메인 UI, KPI, 차트, 모달 | 11 |
| 3 | TargetInputTable.tsx | 489 | 분기별 목표 입력, 직접/퍼센트 모드, 행렬 계산 | 2 |
| 4 | useReport.ts | 480 | 보고서 데이터 로드, 병합, 스냅샷 관리 | 6 |
| 5 | ProductManagementPage.tsx | 421 | 제품 CRUD, 필터링, 유지보수 타입 관리 | 2 |
| 6 | UserManagementPage.tsx | 413 | 사용자 관리, 승인/거절, 역할/부문 변경 | 4 |
| 7 | snapshotService.ts | 408 | 스냅샷 관리, 해시 분석, 충돌 감지 | 2 |
| 8 | DivisionManagementPage.tsx | 366 | 부문 CRUD, 삭제 확인 | 2 |
| 9 | ConflictResolutionModal.tsx | 352 | 충돌 해결 UI, 데이터 비교 시각화 | 3 |
| 10 | ProductReportPage.tsx | 341 | 제품 보고서, 필터, 차트 | 6 |
| 11 | types/index.ts | 301 | 타입 정의 및 헬퍼 함수 | 0 (30+ 파일이 의존) |
| 12 | DivisionSummaryTable.tsx | 300 | 부문별 요약 테이블 | 3 |
| 13 | useAchievement.ts | 293 | 달성 현황 데이터 훅 | 7 |
| 14 | DivisionCharts.tsx | 255 | 부문별 차트 (Stacked bar, Pie, Horizontal) | 4 |
| 15 | periodUtils.ts | 244 | 기간 유틸 (분기/반기/연간) | 1 |
| 16 | productMasterService.ts | 242 | 제품 마스터 CRUD | 1 |
| 17 | RegisterPage.tsx | 234 | 회원가입 페이지 | 4 |
| 18 | AchievementPage.tsx | 219 | 달성 현황 페이지 | 5 |
| 19 | authService.ts | 213 | 인증 서비스 | 3 |
| 20 | ProductCharts.tsx | 212 | 제품별 차트 (Bar, Pie) | 3 |
| 21 | Sidebar.tsx | 210 | 사이드바 네비게이션 | 2 |
| 22 | excelParser.ts | 204 | 엑셀 파일 파싱 | 1 |
| 23 | AuthContext.tsx | 197 | 인증 컨텍스트 프로바이더 | 2 |
| 24 | AchievementTable.tsx | 196 | 달성 현황 테이블 | 2 |
| 25 | WeekSelector.tsx | 187 | 주차 선택기 컴포넌트 | 1 |
| 26 | ProductReportTable.tsx | 183 | 제품 보고서 테이블 | 2 |
| 27 | divisionExcelParser.ts | 180 | 부문별 엑셀 파싱 | 1 |
| 28 | divisionService.ts | 177 | 부문 서비스 | 1 |
| 29 | useDivisionReport.ts | 175 | 부문별 보고 훅 | 5 |
| 30 | weekUtils.ts | 162 | 주차 유틸리티 | 0 |
| 31 | reportService.ts | 155 | 보고서 서비스 | 2 |
| 32 | DivisionReportPage.tsx | 141 | 부문별 보고서 페이지 | 5 |
| 33 | LoginPage.tsx | 137 | 로그인 페이지 | 2 |
| 34 | dbRepair.ts | 136 | DB 복구 유틸 | 2 |

---

## 1. 개요

### 1.1 목적
- 대용량 파일(200라인 이상)을 기능 단위로 분리하여 유지보수성 향상
- React 코드 분할(lazy loading) 적용으로 초기 로딩 시간 단축 (929KB → ~400KB)
- 커스텀 훅 분리를 통한 로직 재사용성 증가
- 중복 코드 통합으로 일관성 확보
- 프로덕션 환경 보안 헤더 및 규칙 강화

### 1.2 핵심 문제 요약

| 영역 | 현재 상태 | 영향 |
|------|----------|------|
| **번들 크기** | 메인 929KB (라우트 분할 없음) | 초기 로딩 느림 |
| **코드 분할** | React.lazy 미사용, React.memo 미사용 | 불필요한 코드/렌더링 |
| **중복 코드** | viewMode 4곳, COLORS 4곳, showNotification 3곳, MONTH_COLORS 2곳 | 유지보수 부담 |
| **console.log/warn** | 19개 파일에 디버깅 로그 31건 잔존 | 프로덕션 정보 노출 |
| **보안 헤더** | CSP, Referrer-Policy, Permissions-Policy 미설정 | 보안 취약 |
| **커플링** | formatMillionWon 12파일, useAuth 12파일, types/index.ts 30+파일 의존 | 변경 파급 효과 |

---

## 2. 현재 상태 분석

### 2.1 공통 문제점
1. **단일 책임 원칙 위반**: 한 파일에 여러 관심사가 혼재
2. **중복 코드**: 알림, 로딩 상태, 에러 처리, viewMode, 색상 팔레트 로직 반복
3. **긴 컴포넌트**: JSX 렌더링과 비즈니스 로직 혼합
4. **테스트 어려움**: 컴포넌트 내부에 로직이 밀접하게 결합
5. **코드 분할 미적용**: 모든 페이지가 단일 번들에 포함

### 2.2 높은 커플링 파일 (의존하는 파일이 많은 순)

| 파일 | 의존하는 파일 수 | 역할 |
|------|----------------|------|
| `types/index.ts` | 30+ | 모든 타입 정의의 단일 진입점 |
| `formatUtils.ts` | 12 | 금액 포맷팅 (formatMillionWon 등) |
| `AuthContext.tsx` | 12 | useAuth() 훅 제공 |
| `useReport.ts` | 5 | 보고서 데이터 훅 |

### 2.3 파일별 분석 (상위 5개)

```
DataInputPage.tsx (501줄)
├── 상태 관리: 8개 useState
├── 콜백 함수: 4개 (handleFileUpload, handleConflictResolve 등)
├── 헬퍼 함수: 3개 (showNotification, getMonthData, matchDivision)
├── 외부 의존: 9개 프로젝트 모듈
└── JSX: ~250줄 (업로드 섹션, 데이터 테이블, 모달)

SolutionBusinessDashboard.tsx (492줄)
├── 상태 관리: 6개 useState
├── 계산 로직: 3개 useMemo (processedData, totals, monthlyTrend)
├── 외부 의존: 11개 프로젝트 모듈 (가장 높은 커플링)
├── 차트: 4개 (월별 추이, 부문별, 제품별, 모달 상세)
└── JSX: ~300줄 (KPI, 차트 그리드, 모달)

TargetInputTable.tsx (489줄)
├── 상태 관리: 3개 useState (matrix, ratios, mode)
├── 계산 로직: distributeTotal, footerTotals 등
├── 이벤트 핸들러: 5개
├── 외부 의존: 2개 프로젝트 모듈 (낮은 커플링)
└── JSX: ~200줄 (컨트롤, 퍼센트 모드, 테이블)

useReport.ts (480줄)
├── 상태 관리: 8개 useState
├── 데이터 로드: useEffect (초기 로드)
├── 업로드 관련: saveUploadedData, mergeProducts (useCallback)
├── 스냅샷 관련: loadSnapshot, refreshSnapshots, analyzeUpload (useCallback)
├── 외부 의존: 6개 Firebase 서비스
└── 개별 CRUD: addEntry, removeEntry

ProductManagementPage.tsx (421줄)
├── 상태 관리: 7개 useState
├── CRUD 로직: 추가/수정/삭제/필터링
├── 외부 의존: 2개 프로젝트 모듈 (낮은 커플링)
└── JSX: ~200줄 (필터바, 추가 폼, 테이블)
```

---

## 3. 중복 코드 분석 (2차 정밀 분석)

### 3.1 viewMode 상태 관리 — 4개 파일에서 동일 패턴

| 파일 | 라인 | 기본값 |
|------|------|--------|
| SolutionBusinessDashboard.tsx | 35 | `'profit'` |
| ProductReportPage.tsx | 188 | `'sales'` |
| AchievementPage.tsx | 29 | `'profit'` |
| DivisionReportPage.tsx | 18 | `'sales'` |

> 기존 분석(3곳)에서 **4곳**으로 확인됨. `SolutionBusinessDashboard.tsx`에도 동일 패턴 존재.

### 3.2 색상 팔레트 중복 — 4개 파일

| 파일 | 상수명 | 색상 수 | 비고 |
|------|--------|---------|------|
| ProductCharts.tsx:23-36 | `COLORS` | 12개 | blue-indigo 계열 |
| DivisionCharts.tsx:29-40 | `COLORS` | 10개 | blue-sky 계열 (다른 세트) |
| ProductReportPage.tsx:18-31 | `MONTH_COLORS` | 12개 | 월별 배경색 |
| ProductReportTable.tsx:18-31 | `MONTH_COLORS` | 12개 | **완전 중복** (위와 동일) |

### 3.3 showNotification 패턴 — 3개 파일에서 동일 구현

```typescript
// 동일 패턴이 3곳에서 반복됨
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
};
```

| 파일 | 위치 |
|------|------|
| TargetInputPage.tsx | 상단 |
| UserManagementPage.tsx | 38-41 |
| DataInputPage.tsx | 내부 |

### 3.4 KPI 카드 구조 — 2개 페이지에서 동일 마크업

- ProductReportPage.tsx (215-236)
- DivisionReportPage.tsx (103-128)

### 3.5 차트 viewMode 분기 로직 — 3개 차트 파일

| 파일 | 반복 로직 |
|------|-----------|
| ProductCharts.tsx | `viewMode === 'sales' ? md.sales : md.profit` |
| DivisionCharts.tsx | `viewMode === 'sales' ? pd?.sales : (pd?.sales - pd?.cost)` |
| AchievementCharts.tsx | `isSalesMode ? a.actualSales : a.actualProfit` |

---

## 4. 성능 최적화 분석

### 4.1 현재 성능 현황

#### useMemo/useCallback — 양호 (18개 파일에서 활용)

| 파일 | 패턴 | 평가 |
|------|------|------|
| SolutionBusinessDashboard.tsx:74-211 | useMemo 3개 (processedData, totals, monthlyTrend) | ✅ 적절 |
| useAchievement.ts:119-273 | useMemo 3개 (divisionActuals, achievements, overall) | ✅ 적절 |
| useReport.ts:244-451 | useCallback 6개 (save, add, remove, snapshot ops) | ✅ 적절 |
| AuthContext.tsx:88-137 | useCallback 3개 (login, register, logout) | ✅ 적절 |
| ProductCharts.tsx:43-76 | useMemo 1개 (차트 데이터 변환) | ✅ 적절 |

#### React.lazy — 미사용 ⚠️

- `src/router.tsx`에서 모든 10개 페이지를 **정적 import**
- 관리자 페이지 4개 + 보고서 페이지 3개 = **7개 페이지를 lazy load 가능**
- 예상 메인 번들 감소: 929KB → ~400KB (57% 감소)

#### React.memo — 미사용 ⚠️

- **대상 컴포넌트** (props 기반 렌더링, 부모 리렌더링 시 불필요한 재렌더링 가능):
  - `ProductCharts`, `DivisionCharts`, `AchievementCharts`
  - `ProductReportTable`, `DivisionSummaryTable`, `AchievementTable`
  - `TargetInputTable` 내부의 행 컴포넌트 (분할 시)
  - `ViewToggle`, `Modal`, `ChartWrapper`

### 4.2 번들 분석

```
현재 Vite 청크 분할 설정:
├── vendor-excel: exceljs (937 KB) — 동적 import로 분리됨 ✅
├── vendor-charts: recharts + d3 (396 KB) — 별도 청크 ✅
└── index: 나머지 전부 (929 KB) — 분할 필요 ⚠️

문제:
- 모든 페이지 컴포넌트가 index 청크에 포함
- 관리자 전용 페이지 (4개, ~1,600줄)도 일반 사용자에게 전송
- 보고서 페이지 (3개, ~700줄)도 대시보드만 보는 사용자에게 전송
```

### 4.3 React.lazy 적용 계획

```typescript
// src/router.tsx — 개선안
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/error';

// 항상 로드 (초기 화면)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SolutionBusinessDashboard from './components/SolutionBusinessDashboard';

// Lazy load — 일반 사용자 페이지
const DataInputPage = lazy(() => import('./pages/DataInputPage'));
const ProductReportPage = lazy(() => import('./pages/ProductReportPage'));
const DivisionReportPage = lazy(() => import('./pages/DivisionReportPage'));
const AchievementPage = lazy(() => import('./pages/AchievementPage'));

// Lazy load — 관리자 전용 페이지
const DivisionManagementPage = lazy(() => import('./pages/admin/DivisionManagementPage'));
const ProductManagementPage = lazy(() => import('./pages/admin/ProductManagementPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const TargetInputPage = lazy(() => import('./pages/admin/TargetInputPage'));
```

### 4.4 예상 번들 크기 변화

| 청크 | 현재 | 개선 후 | 로드 시점 |
|------|------|---------|----------|
| **메인 (index)** | 929 KB | ~350 KB | 항상 |
| **일반 페이지 chunk** | - | ~200 KB | 해당 페이지 접근 시 |
| **관리자 chunk** | - | ~250 KB | 관리자 페이지 접근 시 |
| **차트 벤더** | 396 KB | 396 KB | 변경 없음 |
| **엑셀 벤더** | 937 KB | 937 KB | 엑셀 파싱 시 (이미 동적) |

---

## 5. 모듈화 전략 상세

### 5.1 DataInputPage.tsx (501줄 → ~150줄)

```
src/pages/DataInputPage.tsx (150줄 - 메인 페이지)
├── src/features/dataInput/
│   ├── hooks/
│   │   └── useDataInput.ts (120줄)       # 상태 관리 + 비즈니스 로직
│   ├── components/
│   │   ├── FileUploadSection.tsx (80줄)  # 파일 업로드 영역
│   │   ├── MergeModeSelector.tsx (60줄)  # 병합 모드 선택
│   │   ├── DataManagementTools.tsx (50줄)# 데이터 관리 도구
│   │   ├── DataListTable.tsx (80줄)      # 데이터 목록 테이블
│   │   └── index.ts                      # barrel export
│   ├── utils/
│   │   └── divisionMatcher.ts (20줄)     # 부문 매칭 로직
│   └── index.ts
```

### 5.2 SolutionBusinessDashboard.tsx (492줄 → ~150줄)

```
src/components/SolutionBusinessDashboard.tsx (150줄 - 메인 대시보드)
├── src/features/dashboard/
│   ├── hooks/
│   │   └── useDashboardData.ts (80줄)        # processedData, totals, monthlyTrend
│   ├── components/
│   │   ├── DashboardKPICards.tsx (80줄)       # KPI 카드 그리드
│   │   ├── MonthlyTrendChart.tsx (60줄)       # 월별 매출 추이
│   │   ├── DivisionOverviewChart.tsx (60줄)   # 부문별 개요
│   │   ├── TopProductsChart.tsx (60줄)        # 제품별 순위
│   │   ├── DivisionDetailModal.tsx (80줄)     # 부문 상세 모달
│   │   └── index.ts
│   └── index.ts
```

### 5.3 TargetInputTable.tsx (489줄 → ~120줄)

```
src/components/targets/TargetInputTable.tsx (120줄 - 메인 컴포넌트)
├── src/components/targets/
│   ├── hooks/
│   │   └── useTargetMatrix.ts (100줄)      # 행렬 상태 + 계산 로직
│   ├── components/
│   │   ├── TargetInputControls.tsx (80줄)  # 모드 토글 + 비율 입력
│   │   ├── AnnualTargetInputs.tsx (70줄)   # 연간 목표 입력 그리드
│   │   ├── TargetTableRow.tsx (60줄)       # 테이블 행 (React.memo 적용)
│   │   ├── TargetTableFooter.tsx (40줄)    # 합계 행
│   │   └── index.ts
│   ├── utils/
│   │   └── targetCalculations.ts (50줄)    # distributeTotal, cellKey 등
│   └── constants.ts (10줄)                  # QUARTERS, 기본 비율
```

### 5.4 useReport.ts (480줄 → ~150줄)

```
src/hooks/useReport.ts (150줄 - 메인 훅, 통합 인터페이스)
├── src/hooks/report/
│   ├── useReportData.ts (80줄)            # 데이터 로드 + 상태
│   ├── useReportUpload.ts (100줄)         # 업로드 + 저장 로직
│   ├── useReportSnapshots.ts (80줄)       # 스냅샷 관련 기능
│   └── utils/
│       └── mergeProducts.ts (50줄)        # 제품 병합 유틸리티
```

### 5.5 Admin 페이지 분할

#### ProductManagementPage.tsx (421줄 → ~100줄)

```
src/pages/admin/ProductManagementPage.tsx (100줄)
├── src/features/productManagement/
│   ├── hooks/useProductManagement.ts (100줄)
│   ├── components/
│   │   ├── ProductFilterBar.tsx (50줄)
│   │   ├── ProductAddForm.tsx (60줄)
│   │   ├── ProductTable.tsx (80줄)
│   │   ├── ProductTableRow.tsx (60줄)
│   │   └── DeleteConfirmModal.tsx (50줄)
│   └── index.ts
```

#### UserManagementPage.tsx (413줄 → ~100줄)

```
src/pages/admin/UserManagementPage.tsx (100줄)
├── src/features/userManagement/
│   ├── hooks/useUserManagement.ts (100줄)
│   ├── components/
│   │   ├── UserFilterBar.tsx (50줄)
│   │   ├── UserTable.tsx (80줄)
│   │   ├── UserTableRow.tsx (80줄)
│   │   └── StatusBadge.tsx (30줄)
│   └── index.ts
```

### 5.6 types/index.ts (301줄 → 도메인별 분리)

```
src/types/
├── index.ts (30줄 - re-export만)
├── core.ts (50줄)                    # MonthData, ProductData, ParseResult 등
├── user.ts (40줄)                    # UserProfile, UserRole, AuthState 등
├── division.ts (30줄)                # Division, DivisionSummary 등
├── target.ts (40줄)                  # QuarterlyTarget, TargetAchievement 등
├── snapshot.ts (60줄)                # WeeklySnapshot, MonthConflict, UploadAnalysisResult 등
├── report.ts (30줄)                  # ReportFilter, PeriodInfo 등
└── helpers.ts (20줄)                 # getMonthShortLabel, getMonthFullLabel 등
```

> **중요**: `index.ts`에서 모든 타입을 re-export하여 기존 `import { ... } from '@/types'` 구문 호환성 유지.

---

## 6. 중복 제거 전략

### 6.1 `colors.ts` 상수 중앙화

```typescript
// src/constants/colors.ts
export const CHART_COLORS = [
    '#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#1d4ed8', '#4338ca', '#059669', '#d97706', '#7c3aed',
] as const;

export const DIVISION_COLORS = [
    '#2563eb', '#0ea5e9', '#6366f1', '#06b6d4', '#1d4ed8',
    '#0284c7', '#4f46e5', '#0891b2', '#60a5fa', '#818cf8',
] as const;

export const MONTH_BACKGROUND_COLORS = [
    'bg-red-50', 'bg-orange-50', 'bg-amber-50', 'bg-yellow-50',
    'bg-lime-50', 'bg-green-50', 'bg-emerald-50', 'bg-teal-50',
    'bg-cyan-50', 'bg-sky-50', 'bg-blue-50', 'bg-indigo-50',
] as const;

export const METRIC_COLORS = {
    sales: { primary: 'indigo-600', border: 'indigo-200', ring: 'indigo-100' },
    profit: { primary: 'emerald-600', border: 'emerald-200', ring: 'emerald-100' },
} as const;
```

**영향**: ProductCharts.tsx, DivisionCharts.tsx, ProductReportPage.tsx, ProductReportTable.tsx (4개 파일)

### 6.2 `useNotification` 커스텀 훅

```typescript
// src/hooks/useNotification.ts
interface Notification { message: string; type: 'success' | 'error'; }

export function useNotification(duration = 3000) {
    const [notification, setNotification] = useState<Notification | null>(null);

    const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    }, [duration]);

    return { notification, showNotification: show };
}
```

**영향**: TargetInputPage.tsx, UserManagementPage.tsx, DataInputPage.tsx (3개 파일)

### 6.3 `ViewModeToggle` 컴포넌트 + `useViewMode` 훅

> 이미 `src/components/ui/ViewToggle.tsx` (35줄)가 존재하나, 4개 페이지 중 일부만 사용.
> 기존 `ViewToggle`을 확장하고 모든 페이지에서 통일하여 사용.

```typescript
// src/hooks/useViewMode.ts
export type ViewMode = 'sales' | 'profit';

export function useViewMode(defaultMode: ViewMode = 'sales') {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
    const isSalesMode = viewMode === 'sales';
    return { viewMode, setViewMode, isSalesMode, isProfitMode: !isSalesMode };
}
```

**영향**: SolutionBusinessDashboard.tsx, ProductReportPage.tsx, AchievementPage.tsx, DivisionReportPage.tsx (4개 파일)

### 6.4 `KPICardGrid` 공통 컴포넌트

```typescript
// src/components/common/KPICardGrid.tsx
interface KPICardData {
    label: string;
    value: string | number;
    highlight?: boolean;
    color?: 'default' | 'indigo' | 'emerald';
}

export function KPICardGrid({ cards, columns = 3 }: { cards: KPICardData[]; columns?: 2 | 3 | 4 }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 print-avoid-break`}>
            {cards.map((card, i) => <KPICard key={i} {...card} />)}
        </div>
    );
}
```

**영향**: ProductReportPage.tsx, DivisionReportPage.tsx (2개 파일)

### 6.5 중복 제거 요약

| 항목 | 영향 파일 수 | 제거 라인 (추정) | 신규 파일 |
|------|-------------|-----------------|----------|
| colors.ts 상수 중앙화 | 4 | ~60줄 | 1 |
| useNotification 훅 | 3 | ~30줄 | 1 |
| useViewMode 훅 | 4 | ~40줄 | 1 |
| KPICardGrid 컴포넌트 | 2 | ~60줄 | 1 |
| MONTH_COLORS 통합 | 2 | ~15줄 | 0 (colors.ts에 포함) |
| **합계** | - | **~205줄** | 4 |

---

## 7. 프로덕션 코드 품질

### 7.1 console.log/warn 잔존 현황 (19개 파일)

#### 제거 대상 (디버깅용 — 프로덕션에서 불필요, 31건)

| 파일 | console 사용 수 | 유형 |
|------|----------------|------|
| excelParser.ts | 12 | console.log (파서 디버깅) |
| divisionExcelParser.ts | 5 | console.log (파서 디버깅) |
| useReport.ts | 6 | console.log ×5 + console.warn ×1 (Firestore 작업) |
| dbRepair.ts | 3 | console.log (복구 작업) |
| AuthContext.tsx | 1 | console.warn (프로필 조회 실패) |
| authService.ts | 1 | console.warn (부문명 조회 실패) |
| productService.ts | 1 | console.log (Firestore 조회) |
| reportService.ts | 1 | console.log (데이터 클리어) |
| firebase/config.ts | 1 | console.log (Config 확인) |

#### 유지 가능 (에러 핸들링용 — console.error, 13개 파일 36건)

| 파일 | 유형 |
|------|------|
| useReport.ts | console.error (8곳) |
| DivisionManagementPage.tsx | console.error (6곳) |
| UserManagementPage.tsx | console.error (5곳) |
| ProductManagementPage.tsx | console.error (4곳) |
| DataInputPage.tsx | console.error (3곳) |
| useAchievement.ts | console.error (2곳) |
| useTargets.ts | console.error (2곳) |
| useDivisionReport.ts | console.error |
| RegisterPage.tsx | console.error |
| dbRepair.ts | console.error |
| AuthContext.tsx | console.error |
| ErrorBoundary.tsx | console.error |
| Sidebar.tsx | console.error |

### 7.2 개선안: 환경 기반 로깅 유틸리티

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
    debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
    info: (...args: unknown[]) => isDev && console.info('[INFO]', ...args),
    warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
    error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};
```

- 디버깅 로그 31건 → `logger.debug()`/`logger.warn()`로 교체 (프로덕션에서 자동 제거)
- 에러 로그 → `logger.error()`로 교체 (프로덕션에서도 유지)

---

## 8. 보안 현황 분석 및 강화 방안

> **분석 일자**: 2026-02-19 (2차 정밀 분석)
> **분석 범위**: 인증/인가, Firestore 보안 규칙, 입력 검증, 호스팅 보안, 코드 보안

### 8.1 현재 보안 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ AuthCtx  │  │ Protected │  │ Error Boundary   │  │
│  │ (상태관리)│  │ Route     │  │ (런타임 에러)     │  │
│  └────┬─────┘  └─────┬─────┘  └──────────────────┘  │
│       │              │                                │
│  ┌────┴──────────────┴──────────────────────────┐   │
│  │          Firebase Auth SDK                    │   │
│  │  - Email/Password 인증                        │   │
│  │  - onAuthStateChanged 감시                    │   │
│  └──────────────────┬───────────────────────────┘   │
└─────────────────────┼───────────────────────────────┘
                      │ HTTPS
┌─────────────────────┼───────────────────────────────┐
│              Firebase Backend                        │
│  ┌──────────────────┴───────────────────────────┐   │
│  │          Firestore Security Rules             │   │
│  │  - isAuthenticated() 인증 확인                │   │
│  │  - isAdmin() 관리자 권한 확인                  │   │
│  │  - isApproved() 승인 상태 확인                │   │
│  │  - belongsToDivision() 부문 소속 확인          │   │
│  │  - 기본 거부 정책 (Catch-all deny)             │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │          Firebase Hosting                     │   │
│  │  - X-Content-Type-Options: nosniff            │   │
│  │  - X-Frame-Options: DENY                      │   │
│  │  - X-XSS-Protection: 1; mode=block            │   │
│  │  - Cache-Control: immutable (assets)           │   │
│  │  ✗ CSP, Referrer-Policy, Permissions-Policy   │   │
│  │  ✗ HSTS (명시적)                               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 8.2 현재 보안 강점 (이미 구현됨)

#### A. Firestore 보안 규칙

| 항목 | 상태 | 설명 |
|------|------|------|
| 인증 확인 헬퍼 (isAuthenticated) | ✅ | `request.auth != null` 체크 |
| 관리자 권한 확인 (isAdmin) | ✅ | 문서 존재 확인 후 role 체크 |
| 승인 상태 확인 (isApproved) | ✅ | status == 'approved' 체크 |
| 부문 소속 확인 (belongsToDivision) | ✅ | divisionId 매칭 |
| 기본 거부 정책 (Catch-all) | ✅ | `match /{document=**} { allow: false }` |
| 순환 참조 방지 | ✅ | userExists() 선행 체크 |
| 감사 로그 불변성 | ✅ | uploadHistory: update/delete 금지 |
| 사용자 자기 문서 생성 제한 | ✅ | `request.auth.uid == userId` |

#### B. 인증 시스템

| 항목 | 상태 | 설명 |
|------|------|------|
| Firebase Auth 기반 인증 | ✅ | Email/Password 방식 |
| 인증 상태 감시 | ✅ | onAuthStateChanged + cancelled 플래그 |
| 승인 대기/거절 게이트 | ✅ | ProtectedRoute에서 상태별 UI |
| 관리자 전용 라우트 | ✅ | adminOnly prop |
| Firebase 에러 한국어 번역 | ✅ | 7개 에러 코드 번역 |
| 메모리 누수 방지 | ✅ | useEffect cleanup + cancelled 플래그 |

#### C. 코드 보안

| 항목 | 상태 | 설명 |
|------|------|------|
| XSS 방지 | ✅ | dangerouslySetInnerHTML 미사용 확인 (2차 검증) |
| eval/Function 미사용 | ✅ | 동적 코드 실행 없음 확인 (2차 검증) |
| 환경 변수 관리 | ✅ | VITE_ 접두사, .gitignore 포함 |
| SHA-256 해싱 | ✅ | Web Crypto API (hashUtils.ts) |
| 입력 검증 (Excel) | ✅ | Regex 기반 헤더 검증, 숫자 폴백 |
| 에러 상세 정보 숨김 | ✅ | DEV 환경에서만 스택트레이스 표시 |
| autoComplete 속성 | ✅ | email, current-password, new-password |

### 8.3 보안 취약점 및 개선 필요 사항

#### 등급 기준
- 🔴 **높음**: 즉시 조치 필요 (데이터 유출/변조 위험)
- 🟡 **중간**: 가능한 빠른 시일 내 조치 권장
- 🟢 **낮음**: 추후 개선 권장 (방어 심화)

---

#### 🔴 S-01. Content-Security-Policy (CSP) 헤더 미설정

**현황**: firebase.json에 CSP 헤더가 없음
**위험**: 인라인 스크립트 주입, 외부 악성 스크립트 로드 가능
**영향 범위**: 전체 애플리케이션

**개선안**: firebase.json headers에 CSP 추가
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com; font-src 'self'; frame-ancestors 'none'"
}
```

**참고**: Vite 빌드 시 인라인 스크립트 사용 여부 확인 후 `'unsafe-inline'` 또는 nonce 기반 설정 필요

---

#### 🔴 S-02. Firestore 필드 레벨 검증 부재

**현황**: Firestore 규칙에서 문서 생성/수정 시 필드 값 유효성 검증 없음
**위험**: 악의적 클라이언트가 임의 필드 주입 또는 잘못된 타입의 데이터 저장 가능
**영향 범위**: 모든 컬렉션

**개선안**: 주요 컬렉션에 필드 검증 규칙 추가
```
// users 컬렉션 예시
match /users/{userId} {
  function isValidUserData() {
    let data = request.resource.data;
    return data.keys().hasAll(['email', 'displayName', 'role', 'status'])
      && data.email is string
      && data.displayName is string && data.displayName.size() <= 50
      && data.role in ['admin', 'user']
      && data.status in ['pending', 'approved', 'rejected']
      && data.email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  }

  allow create: if isAuthenticated()
    && request.auth.uid == userId
    && isValidUserData();
}
```

---

#### 🔴 S-03. 관리자 이메일 하드코딩

**현황**: `authService.ts`에 관리자 이메일 하드코딩
**위험**: 소스 코드 노출 시 관리자 이메일 타겟팅 가능
**영향 범위**: 인증 시스템

**개선안**:
1. **환경 변수로 이동**: `VITE_ADMIN_EMAIL`로 변경
2. **Firestore 설정 문서 활용**: `settings/admin` 문서에 관리자 이메일 목록 관리
3. **Firebase Custom Claims 활용** (장기)

---

#### 🔴 S-14. (신규) 프로덕션 console.log 정보 노출

**현황**: 19개 파일에 console.log/warn/error 잔존, 디버깅 로그 31건 포함 (console.log 28건 + console.warn 3건)
**위험**: Firestore 작업 정보, 인증 상태, 파싱 구조 등이 브라우저 콘솔에 노출
**영향 범위**: 전체 애플리케이션

**개선안**: `logger.ts` 유틸리티 도입 (상세 내용 7.2 참조)

---

#### 🟡 S-04. 비밀번호 정책 미흡

**현황**: Firebase 기본 정책 (6자 이상)만 적용, RegisterPage에서 길이만 검증
**위험**: 약한 비밀번호로 인한 무차별 대입 공격 위험

**개선안**: 클라이언트 측 비밀번호 강도 검증 추가
```typescript
// src/utils/passwordValidator.ts
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: '8자 이상이어야 합니다' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: '대문자를 포함해야 합니다' };
  if (!/[a-z]/.test(password)) return { valid: false, message: '소문자를 포함해야 합니다' };
  if (!/[0-9]/.test(password)) return { valid: false, message: '숫자를 포함해야 합니다' };
  return { valid: true, message: '' };
}
```

---

#### 🟡 S-05. 세션 타임아웃 미설정

**현황**: Firebase Auth 기본 세션 유지 (장기 유지, 새로고침 시에도 로그인 유지)
**위험**: 공용 PC에서 로그아웃 하지 않을 경우 다른 사용자가 접근 가능

**개선안**: AuthContext.tsx에 비활동 타임아웃 추가 (30분)

---

#### 🟡 S-06. 엑셀 파일 업로드 검증 강화 필요

**현황**: 파일 확장자만 검증 (.xlsx, .xls), MIME 타입 미확인, 파일 크기 제한 미적용
**위험**: 악의적 파일 업로드 (확장자 위조)

**개선안**: `src/utils/fileValidator.ts` — MIME 타입 + 매직 바이트 + 크기 검증

---

#### 🟡 S-07. 클라이언트 측 권한 우회 가능성

**현황**: 관리자 기능 버튼이 클라이언트 렌더링으로만 제어됨
**현재 대응**: Firestore 규칙에서 서버 측 권한 검증 → 실질적 데이터 유출 위험은 낮음
**개선안**: Firebase Custom Claims 활용

---

#### 🟡 S-08. Referrer-Policy 헤더 미설정

**개선안**: firebase.json에 `"Referrer-Policy": "strict-origin-when-cross-origin"` 추가

---

#### 🟡 S-09. Permissions-Policy 헤더 미설정

**개선안**: firebase.json에 `"Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()"` 추가

---

#### 🟢 S-10. 로그인 시도 횟수 제한 (클라이언트 측)

**현황**: Firebase Auth 자체 rate limiting은 있으나 클라이언트 측 추가 보호 없음
**개선안**: 5회 실패 시 5분 잠금

---

#### 🟢 S-11. divisions 컬렉션 공개 읽기

**현황**: `allow read: if true;` (인증 없이 누구나 읽기 가능)
**사유**: 회원가입 시 부문 목록 조회 필요
**판단**: 리스크 수용 가능 (부문 이름만 노출, 민감 정보 아님)

---

#### 🟢 S-12. Strict-Transport-Security (HSTS)

**현황**: Firebase Hosting 기본 HSTS 적용
**개선안**: 명시적 HSTS 헤더 추가 (커스텀 도메인 대응)

---

#### 🟢 S-13. authService 내 불필요한 주석

**개선안**: 중복 주석 제거

---

### 8.4 보안 체크리스트 요약

| 카테고리 | 항목 | 현재 상태 |
|----------|------|----------|
| **인증** | Firebase Auth Email/Password | ✅ |
| | 인증 상태 감시 및 cleanup | ✅ |
| | 승인/거절 게이트 | ✅ |
| | 비밀번호 강도 정책 | ⚠️ 기본만 |
| | 세션 타임아웃 | ❌ 미구현 |
| | 로그인 시도 제한 (클라이언트) | ❌ 미구현 |
| **인가** | Firestore 역할 기반 접근 제어 | ✅ |
| | 관리자 전용 라우트 보호 | ✅ |
| | 기본 거부 정책 | ✅ |
| | 필드 레벨 검증 | ❌ 미구현 |
| | Custom Claims (토큰 기반) | ❌ 미구현 |
| **입력 검증** | Excel 파서 헤더 검증 | ✅ |
| | 파일 업로드 MIME/크기 검증 | ⚠️ 부분적 |
| | 비밀번호 확인 (재입력) | ✅ |
| **코드 보안** | XSS 방지 (React 이스케이프) | ✅ |
| | eval/innerHTML 미사용 | ✅ |
| | 환경 변수 분리 | ✅ |
| | 에러 상세 숨김 (프로덕션) | ✅ |
| | console.log/warn 프로덕션 제거 | ❌ 미구현 (19파일 31건 잔존) |
| **호스팅** | X-Content-Type-Options | ✅ |
| | X-Frame-Options | ✅ |
| | X-XSS-Protection | ✅ |
| | Content-Security-Policy | ❌ 미구현 |
| | Referrer-Policy | ❌ 미구현 |
| | Permissions-Policy | ❌ 미구현 |
| | HSTS | ⚠️ Firebase 기본 |
| **데이터 무결성** | SHA-256 해싱 | ✅ |
| | 감사 로그 불변성 | ✅ |
| | 서버 타임스탬프 사용 | ✅ |

---

## 9. 예상 효과

### 9.1 번들 크기 변화

| 항목 | 현재 | 개선 후 | 감소율 |
|------|------|---------|--------|
| 메인 번들 (index.js) | 929 KB | ~350 KB | 62% |
| 관리자 페이지 chunk | 포함됨 | ~250 KB (lazy) | 분리 |
| 일반 페이지 chunk | 포함됨 | ~200 KB (lazy) | 분리 |
| 차트 벤더 | 396 KB | 396 KB | - |
| 엑셀 벤더 | 937 KB | 937 KB | - (이미 동적) |

### 9.2 개발 생산성 향상

| 지표 | 현재 | 개선 후 |
|------|------|---------|
| 평균 파일 크기 (상위 10개) | 436줄 | ~130줄 |
| 대용량 파일 (200줄+) | 23개 | ~10개 |
| 중복 코드 | ~205줄 | 0줄 |
| 색상 상수 정의 위치 | 4곳 | 1곳 |
| 알림 패턴 구현 | 3곳 | 1곳 |
| console.log/warn (프로덕션) | 31건 | 0건 |

---

## 10. 전체 개선 로드맵 (통합)

### Phase 1: 보안 긴급 조치 + 코드 품질 (1-2일) — ✅ 완료 (2026-02-20)

| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 1 | 보안 | firebase.json 보안 헤더 추가 (CSP, Referrer, Permissions, HSTS) | firebase.json | ✅ 완료 |
| 2 | 보안 | 관리자 이메일 환경변수 이동 | authService.ts, .env | ✅ 완료 |
| 3 | 품질 | logger.ts 유틸리티 생성 + console.log/warn 31건 교체 | 8개 파일 | ✅ 완료 |
| 4 | 품질 | authService.ts 중복 주석 제거 | authService.ts | ✅ 완료 |

**Phase 1 변경 요약:**
- `firebase.json`: CSP, Referrer-Policy, Permissions-Policy, HSTS 4개 보안 헤더 추가
- `authService.ts`: 하드코딩된 관리자 이메일 → `VITE_ADMIN_EMAIL` 환경변수로 이동, 중복 주석 제거
- `src/utils/logger.ts`: 환경 기반 로깅 유틸리티 신규 생성 (DEV 환경에서만 debug/info 출력)
- console.log/warn 31건 → logger.debug/logger.warn으로 교체 (8개 파일)
  - `excelParser.ts` (12건), `divisionExcelParser.ts` (5건), `useReport.ts` (6건)
  - `dbRepair.ts` (3건), `config.ts` (1건 삭제), `authService.ts` (1건)
  - `productService.ts` (1건), `reportService.ts` (1건), `AuthContext.tsx` (1건)
- 빌드 검증: ✅ 성공 (928KB 메인 번들, 기존과 동일)

### Phase 2: 성능 최적화 — 코드 분할 (1일) — ✅ 완료 (2026-02-20)

| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 5 | 성능 | React.lazy 라우트 기반 코드 분할 (7개 페이지) | router.tsx | ✅ 완료 |
| 6 | 성능 | Suspense fallback + LoadingSpinner 통합 | router.tsx | ✅ 완료 |

**Phase 2 변경 요약:**
- `router.tsx`: 7개 페이지에 React.lazy + Suspense 적용 (DataInput, DivisionReport, ProductReport, Achievement, DivisionManagement, ProductManagement, UserManagement, TargetInput)
- SuspenseWrapper 컴포넌트 생성 (LoadingSpinner size="lg" + "페이지를 불러오는 중..." 메시지)
- 항상 로드: LoginPage, RegisterPage, SolutionBusinessDashboard (초기 화면)
- 빌드 결과: 메인 번들 929KB → 803KB (-14%), 7개 lazy 청크 ~124KB 분리
- 공통 훅/서비스가 메인 번들에 남아 있어 추가 분리는 Phase 5-6 모듈화 시 가능

### Phase 3: 중복 제거 + 공통화 (2-3일) — ✅ 완료 (2026-02-20)

| 순서 | 영역 | 작업 | 영향 파일 | 상태 |
|------|------|------|----------|------|
| 7 | 중복 | colors.ts 상수 중앙화 | 4개 파일 | ✅ 완료 |
| 8 | 중복 | useNotification 훅 생성 | 3개 파일 | ✅ 완료 |
| 9 | 중복 | useViewMode 훅 + ViewToggle 통합 | 4개 파일 | ✅ 완료 |
| 10 | 중복 | KPICardGrid 공통 컴포넌트 | 2개 파일 | ✅ 완료 |

**Phase 3 변경 요약:**
- `src/constants/colors.ts`: CHART_COLORS (12색), DIVISION_COLORS (10색), MONTH_COLORS (12월) 상수 중앙화
  - `ProductCharts.tsx`, `DivisionCharts.tsx`: 로컬 COLORS 제거 → 중앙 상수 import
  - `ProductReportTable.tsx`, `ProductReportPage.tsx`: 로컬 MONTH_COLORS 제거 → 중앙 상수 import
- `src/hooks/useNotification.ts`: showNotification 패턴 공통 훅으로 추출
  - `TargetInputPage.tsx`, `UserManagementPage.tsx`, `DataInputPage.tsx`: 로컬 구현 제거 → 훅 사용
- `src/hooks/useViewMode.ts`: viewMode 상태 관리 공통 훅
  - `SolutionBusinessDashboard.tsx`, `AchievementPage.tsx`, `DivisionReportPage.tsx`, `ProductReportPage.tsx`: useState 제거 → useViewMode 훅 사용
  - `ProductReportPage.tsx`: 인라인 토글 버튼 → ViewToggle 컴포넌트로 통일
- `src/components/common/KPICardGrid.tsx`: 공통 KPI 카드 그리드 컴포넌트
  - `DivisionReportPage.tsx`, `ProductReportPage.tsx`: 수동 KPI 마크업 → KPICardGrid 사용
- 빌드 검증: ✅ tsc 에러 0건, vite build 성공 (4.03s, 메인 번들 803KB 유지)

### Phase 4: 보안 강화 (3-5일) — ✅ 완료 (2026-02-20)

| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 11 | 보안 | Firestore 필드 검증 규칙 추가 | firestore.rules | ✅ 완료 |
| 12 | 보안 | 비밀번호 강도 검증 추가 | RegisterPage.tsx, passwordValidator.ts | ✅ 완료 |
| 13 | 보안 | 파일 업로드 검증 강화 (MIME, 크기, 매직 바이트) | DataInputPage.tsx, fileValidator.ts | ✅ 완료 |
| 14 | 보안 | 세션 비활동 타임아웃 (30분) | AuthContext.tsx | ✅ 완료 |
| 15 | 보안 | 클라이언트 로그인 시도 제한 | LoginPage.tsx | ✅ 완료 |

**Phase 4 변경 요약:**
- `firestore.rules`: 주요 컬렉션에 필드 검증 함수 추가 (users, divisions, products_master, reports, targets, uploadHistory)
  - 필수 필드 존재 확인 (`hasAll`), 타입 검증 (`is string`, `is number`, `is map`)
  - 문자열 길이 제한, 열거형 값 검증 (`role in ['admin', 'user']`), 숫자 범위 검증
  - 공통 헬퍼: `isNonEmptyString()`, `isStringMaxLen()`, `isNonNegativeNumber()`
- `src/utils/passwordValidator.ts`: 비밀번호 유효성 검증 + 강도 분석 유틸리티 신규 생성
  - `validatePassword()`: 8자+, 대/소문자, 숫자 필수 검증
  - `getPasswordStrength()`: 0-4 점수, 실시간 체크리스트 (UI용)
- `RegisterPage.tsx`: 비밀번호 강도 프로그레스 바 + 체크리스트 UI 추가, 기존 6자 검증 → 8자+강도 검증으로 강화
- `src/utils/fileValidator.ts`: 엑셀 파일 종합 검증 유틸리티 신규 생성
  - 확장자 + MIME 타입 + 파일 크기(10MB 제한) + 매직 바이트(ZIP/OLE2 헤더) 4단계 검증
- `DataInputPage.tsx`: 기존 확장자만 체크 → `validateExcelFile()` 종합 검증으로 교체
- `AuthContext.tsx`: 30분 비활동 타임아웃 추가 (mousedown/keydown/touchstart/scroll 이벤트 기반)
- `LoginPage.tsx`: 5회 실패 시 5분 잠금 (localStorage 기반 시도 횟수 관리, 카운트다운 UI)
- 빌드 검증: ✅ tsc 에러 0건, vite build 성공 (4.13s, 메인 번들 807KB)

### Phase 5: 핵심 모듈화 + 단위 테스트 — ✅ 완료 (2026-02-23)

| 순서 | 영역 | 작업 | 현재 → 목표 | 상태 |
|------|------|------|-----------|------|
| 16 | 모듈화 | types/index.ts 도메인별 분리 | 302줄 → 7파일 + barrel | ✅ 완료 |
| 17 | 모듈화 | snapshotService.ts 분할 | 408줄 → 3파일 (query, write, orchestration) | ✅ 완료 |
| 18 | 모듈화 | useReport.ts 분할 | 482줄 → 4파일 (data, snapshots, upload, composite) | ✅ 완료 |
| 19 | 모듈화 | DataInputPage.tsx 분할 | 499줄 → 6파일 (hook + 4 components + barrel) | ✅ 완료 |
| 20 | 모듈화 | SolutionBusinessDashboard.tsx 분할 | 494줄 → 7파일 (hook + 5 components + barrel) | ✅ 완료 |
| 21 | 테스트 | vitest 도입 + Phase 5 단위 테스트 | 신규 7 테스트 파일, 48 테스트 | ✅ 완료 |

**Phase 5 변경 요약:**

**5.1 types/index.ts 도메인별 분리 (302줄 → 7파일 + barrel)**
- `src/types/core.ts`: MonthData, ProductData, ProcessedProduct, Totals 등 핵심 데이터 타입
- `src/types/parse.ts`: Notification, ParseResult, getMonthShortLabel(), getMonthFullLabel()
- `src/types/user.ts`: UserRole, UserStatus, UserProfile, Division, AuthState
- `src/types/product.ts`: ProductMaster, ProductMasterInput, ProductDataExtended
- `src/types/report.ts`: PeriodType, Quarter, DivisionSummary, PeriodInfo 등
- `src/types/target.ts`: AchievementStatus, QuarterlyTarget, TargetAchievement 등
- `src/types/snapshot.ts`: WeekKey, WeeklySnapshot, MonthConflict, UploadAnalysisResult 등
- `src/types/index.ts` → barrel re-export (7줄), 기존 `from '@/types'` import 41개 파일 하위 호환성 100% 유지

**5.2 snapshotService.ts 분할 (408줄 → 3파일)**
- `src/firebase/services/snapshotQueryService.ts` (~100줄): getSnapshot, getSnapshots, getSnapshotProducts, getLatestMonthHashes
- `src/firebase/services/snapshotWriteService.ts` (~90줄): saveWeeklySnapshot, saveSnapshotOnly (dynamic import 패턴 유지)
- `src/firebase/services/snapshotService.ts` (~200줄): analyzeUpload, saveWithResolutions + re-export

**5.3 useReport.ts 분할 (482줄 → 4파일)**
- `src/hooks/useReportData.ts` (~200줄): 핵심 상태, 초기 로드, mergeProducts, saveUploadedData, addEntry, removeEntry, ReportDataInternals 인터페이스
- `src/hooks/useReportSnapshots.ts` (~80줄): 스냅샷 상태, refreshSnapshots, loadSnapshot, loadLatest
- `src/hooks/useReportUpload.ts` (~80줄): analyzeUpload, saveWithConflictResolution
- `src/hooks/useReport.ts` (~80줄): 3개 서브훅 조합 composite hook, UploadMergeMode re-export

**5.4 DataInputPage.tsx 분할 (499줄 → 6파일)**
- `src/features/dataInput/hooks/useDataInput.ts` (~150줄): 로컬 상태, handleFileUpload, handleConflictResolve, matchDivision
- `src/features/dataInput/components/UploadTypeSelector.tsx` (~30줄)
- `src/features/dataInput/components/MergeModeSelector.tsx` (~60줄)
- `src/features/dataInput/components/DataManagementTools.tsx` (~60줄)
- `src/features/dataInput/components/DataListTable.tsx` (~50줄)
- `src/features/dataInput/index.ts`: barrel export
- `src/pages/DataInputPage.tsx` (~150줄): 위 컴포넌트들 조합

**5.5 SolutionBusinessDashboard.tsx 분할 (494줄 → 7파일)**
- `src/features/dashboard/hooks/useDashboardData.ts` (~140줄): processedData, totals, monthlyTrendData, allProducts, divisionChartData, monthRangeText
- `src/features/dashboard/components/DashboardKPICards.tsx` (~80줄)
- `src/features/dashboard/components/MonthlyTrendChart.tsx` (~30줄)
- `src/features/dashboard/components/TopProductsChart.tsx` (~30줄)
- `src/features/dashboard/components/DivisionOverviewChart.tsx` (~30줄)
- `src/features/dashboard/components/DashboardDetailModal.tsx` (~100줄)
- `src/features/dashboard/index.ts`: barrel export
- `src/components/SolutionBusinessDashboard.tsx` (~120줄): 위 컴포넌트들 조합

**5.6 vitest 테스트 인프라 도입 + Phase 5 단위 테스트**
- vitest v4, @testing-library/react, @testing-library/jest-dom, jsdom 설치
- `vite.config.ts`: test 설정 추가 (globals, jsdom, setupFiles)
- `package.json`: `test`, `test:watch` 스크립트 추가
- 테스트 파일 7개 (48 테스트):
  - `types/__tests__/types.test.ts` (11): barrel re-export, getMonthShortLabel, getMonthFullLabel
  - `types/__tests__/domain-files.test.ts` (7): 7개 도메인 파일 직접 import, 타입 간 의존관계
  - `firebase/services/__tests__/snapshotService.test.ts` (5): query/write/orchestration re-export
  - `hooks/__tests__/useReport.test.ts` (6): composite hook + 3개 서브훅 모듈 해석
  - `features/dataInput/__tests__/dataInput.test.ts` (7): matchDivision 로직 + barrel export
  - `features/dashboard/__tests__/dashboard.test.ts` (3): barrel export (hook + 5 components)
  - `features/dashboard/__tests__/useDashboardData.test.ts` (9): processedData, totals, 정렬, 집계, 월 범위 텍스트

- 검증: ✅ tsc 에러 0건, vite build 성공 (3.83s, 메인 번들 808KB), vitest 48/48 통과 (1.56s)

### Phase 6: 관리자 페이지 + 보고서 모듈화 (1주)

| 순서 | 영역 | 작업 | 현재 → 목표 | 난이도 |
|------|------|------|-----------|--------|
| 22 | 모듈화 | TargetInputTable.tsx 분할 | 489줄 → 120줄 + 5파일 | ★★★ |
| 23 | 모듈화 | ProductManagementPage.tsx 분할 | 421줄 → 100줄 + 5파일 | ★★☆ |
| 24 | 모듈화 | UserManagementPage.tsx 분할 | 413줄 → 100줄 + 5파일 | ★★☆ |
| 25 | 모듈화 | DivisionManagementPage.tsx 분할 | 366줄 → 100줄 + 4파일 | ★★☆ |
| 26 | 성능 | React.memo 적용 (차트/테이블 컴포넌트) | 6개 컴포넌트 | ★☆☆ |

### Phase 7: 장기 보안 (선택적)

| 순서 | 영역 | 작업 | 파일 | 난이도 |
|------|------|------|------|--------|
| 27 | 보안 | Firebase Custom Claims 도입 | Cloud Functions (신규) | ★★★ |

---

## 11. 최종 디렉토리 구조 (모듈화 완료 후)

```
src/
├── App.tsx
├── main.tsx
├── router.tsx (lazy imports)
├── index.css
│
├── components/
│   ├── common/
│   │   ├── KPICard.tsx (신규)
│   │   ├── KPICardGrid.tsx (신규)
│   │   └── index.ts
│   ├── ui/
│   │   ├── Badge.tsx, Button.tsx, Card.tsx, Input.tsx
│   │   ├── Modal.tsx, Toast.tsx, ViewToggle.tsx (확장)
│   │   └── index.ts
│   ├── charts/
│   │   ├── ChartWrapper.tsx
│   │   ├── DualAxisChart.tsx
│   │   └── index.ts
│   ├── achievement/
│   │   ├── AchievementCharts.tsx (React.memo 적용)
│   │   ├── AchievementTable.tsx (React.memo 적용)
│   │   └── index.ts
│   ├── reports/
│   │   ├── DivisionCharts.tsx (React.memo, colors.ts 참조)
│   │   ├── DivisionSummaryTable.tsx (React.memo)
│   │   ├── ProductCharts.tsx (React.memo, colors.ts 참조)
│   │   ├── ProductReportTable.tsx (React.memo, colors.ts 참조)
│   │   ├── ReportFilterBar.tsx
│   │   └── index.ts
│   ├── targets/
│   │   ├── TargetInputTable.tsx (축소됨)
│   │   ├── hooks/useTargetMatrix.ts (신규)
│   │   ├── components/
│   │   │   ├── TargetInputControls.tsx (신규)
│   │   │   ├── AnnualTargetInputs.tsx (신규)
│   │   │   ├── TargetTableRow.tsx (신규, React.memo)
│   │   │   └── TargetTableFooter.tsx (신규)
│   │   ├── utils/targetCalculations.ts (신규)
│   │   └── index.ts
│   ├── upload/
│   │   ├── ConflictResolutionModal.tsx
│   │   ├── WeekSelector.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   └── Sidebar.tsx
│   ├── auth/
│   │   └── ProtectedRoute.tsx
│   └── error/
│       ├── ErrorBoundary.tsx
│       ├── FirestoreErrorFallback.tsx
│       ├── LoadingSpinner.tsx
│       └── index.ts
│
├── features/
│   ├── dashboard/
│   │   ├── hooks/useDashboardData.ts (신규)
│   │   ├── components/
│   │   │   ├── DashboardKPICards.tsx (신규)
│   │   │   ├── MonthlyTrendChart.tsx (신규)
│   │   │   ├── DivisionOverviewChart.tsx (신규)
│   │   │   ├── TopProductsChart.tsx (신규)
│   │   │   └── DivisionDetailModal.tsx (신규)
│   │   └── index.ts
│   ├── dataInput/
│   │   ├── hooks/useDataInput.ts (신규)
│   │   ├── components/
│   │   │   ├── FileUploadSection.tsx (신규)
│   │   │   ├── MergeModeSelector.tsx (신규)
│   │   │   ├── DataManagementTools.tsx (신규)
│   │   │   └── DataListTable.tsx (신규)
│   │   ├── utils/divisionMatcher.ts (신규)
│   │   └── index.ts
│   ├── productManagement/
│   │   ├── hooks/useProductManagement.ts (신규)
│   │   ├── components/
│   │   │   ├── ProductFilterBar.tsx, ProductAddForm.tsx
│   │   │   ├── ProductTable.tsx, ProductTableRow.tsx
│   │   │   └── DeleteConfirmModal.tsx
│   │   └── index.ts
│   └── userManagement/
│       ├── hooks/useUserManagement.ts (신규)
│       ├── components/
│       │   ├── UserFilterBar.tsx, UserTable.tsx
│       │   ├── UserTableRow.tsx, StatusBadge.tsx
│       └── index.ts
│
├── hooks/
│   ├── useReport.ts (축소됨)
│   ├── report/
│   │   ├── useReportData.ts (신규)
│   │   ├── useReportUpload.ts (신규)
│   │   ├── useReportSnapshots.ts (신규)
│   │   └── utils/mergeProducts.ts (신규)
│   ├── useAchievement.ts
│   ├── useDivisionReport.ts
│   ├── useTargets.ts
│   ├── useViewMode.ts (신규)
│   └── useNotification.ts (신규)
│
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DataInputPage.tsx (축소됨)
│   ├── ProductReportPage.tsx
│   ├── DivisionReportPage.tsx
│   ├── AchievementPage.tsx
│   └── admin/
│       ├── DivisionManagementPage.tsx (축소됨)
│       ├── ProductManagementPage.tsx (축소됨)
│       ├── UserManagementPage.tsx (축소됨)
│       └── TargetInputPage.tsx
│
├── constants/
│   ├── colors.ts (신규)
│   └── index.ts
│
├── types/
│   ├── index.ts (re-export)
│   ├── core.ts, user.ts, division.ts (신규)
│   ├── target.ts, snapshot.ts, report.ts (신규)
│   └── helpers.ts (신규)
│
├── utils/
│   ├── formatUtils.ts
│   ├── excelParser.ts
│   ├── divisionExcelParser.ts
│   ├── weekUtils.ts
│   ├── periodUtils.ts
│   ├── achievementUtils.ts
│   ├── hashUtils.ts
│   ├── logger.ts (신규)
│   ├── passwordValidator.ts (신규)
│   └── fileValidator.ts (신규)
│
├── firebase/
│   ├── config.ts
│   ├── utils/dbRepair.ts
│   └── services/
│       ├── authService.ts
│       ├── productService.ts, divisionService.ts
│       ├── divisionDataService.ts, targetService.ts
│       ├── reportService.ts, snapshotService.ts
│       ├── productMasterService.ts
│       ├── uploadHistoryService.ts, userService.ts
│
├── contexts/
│   └── AuthContext.tsx
│
└── config/
    ├── appConfig.ts
    └── index.ts
```

---

## 12. 결론

### 12.1 요약

| 항목 | 수치 |
|------|------|
| 모듈화 대상 파일 | 10개 (200줄+ 주요 파일) |
| 신규 생성 파일 | ~40개 |
| 제거 중복 코드 | ~205줄 |
| console.log/warn 정리 | 31건 → 0건 (프로덕션) |
| 메인 번들 감소 | 929KB → ~350KB (62%) |
| 보안 헤더 추가 | 4개 (CSP, Referrer, Permissions, HSTS) |
| 총 Phase | 7단계 |

### 12.2 우선순위 핵심 요약

1. **즉시 실행** (Phase 1-2): 보안 헤더 + console.log 정리 + React.lazy 코드 분할
2. **단기** (Phase 3-4): 중복 제거 + 보안 강화 (Firestore 규칙, 비밀번호, 파일 검증)
3. **중기** (Phase 5-6): 대규모 파일 모듈화 + React.memo 적용
4. **장기** (Phase 7): Firebase Custom Claims
