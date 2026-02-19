# 대용량 파일 모듈화 및 성능 개선 방안

> **최종 업데이트**: 2026-02-19
> **현재 상태**: 기능 개발 완료, 모듈화 및 보안 강화 미착수

---

## 0. 현재 프로젝트 현황 요약

### 0.1 프로젝트 개요
- **프로젝트명**: HSR (Huni Sales Report System) - 휴네시온 솔루션사업본부 매출 보고 시스템
- **기술 스택**: React 19 + TypeScript 5.9 + Vite 7 + Firebase (Firestore + Auth) + Tailwind CSS 3
- **배포**: Firebase Hosting (hunesalesreport)

### 0.2 코드베이스 메트릭

| 카테고리 | 파일 수 | 총 라인 수 |
|----------|---------|-----------|
| 페이지 (pages/) | 9 | ~2,876 |
| 컴포넌트 (components/) | 19 | ~2,500 |
| Firebase 서비스 (firebase/services/) | 11 | ~1,800 |
| 커스텀 훅 (hooks/) | 4 | ~1,026 |
| 유틸리티 (utils/) | 8 | ~1,000 |
| 설정/타입 (config/, types/) | 3 | ~335 |
| **합계** | **59 파일** | **~11,300 라인** |

### 0.3 최근 변경 이력 (기능 추가/개선)

| 커밋 | 변경 내용 | 상태 |
|------|----------|------|
| 5dd53d1 | 차트 축 포맷팅 및 오버플로우 수정 | 완료 |
| e2cb666 | 환경 변수 변경에 따른 빌드 | 완료 |
| 10d8753 | 개선 계획 및 디자인 가이드라인 추가 | 완료 |
| 34ddac9 | 매출액/매출이익 토글 및 보고서 테이블 개선 | 완료 |
| 397cc18 | 제품 보고서 차트 구현 및 차트 레이아웃 리팩터링 | 완료 |

### 0.4 대용량 파일 현황 (200줄 이상, 최신 기준)

| 순위 | 파일 | 라인 수 | 변화 | 주요 책임 |
|------|------|---------|------|-----------|
| 1 | DataInputPage.tsx | 501 | - | 엑셀 업로드, 파일 처리, 데이터 삭제, 충돌 모달 |
| 2 | SolutionBusinessDashboard.tsx | 489 | 신규 진입 | 대시보드 메인 UI |
| 3 | TargetInputTable.tsx | 489 | - | 분기별 목표 입력, 직접/퍼센트 모드, 행렬 계산 |
| 4 | useReport.ts | 480 | +2 | 보고서 데이터 로드, 병합, 스냅샷 관리 |
| 5 | ProductManagementPage.tsx | 421 | - | 제품 CRUD, 필터링, 유지보수 타입 관리 |
| 6 | UserManagementPage.tsx | 413 | - | 사용자 관리, 승인/거절, 역할/부문 변경 |
| 7 | snapshotService.ts | 408 | - | 스냅샷 관리, 해시 분석, 충돌 감지 |
| 8 | DivisionManagementPage.tsx | 366 | - | 부문 CRUD, 삭제 확인 |
| 9 | ConflictResolutionModal.tsx | 352 | - | 충돌 해결 UI, 데이터 비교 시각화 |
| 10 | ProductReportPage.tsx | 341 | -4 | 제품 보고서, 필터, 차트 |
| 11 | DivisionSummaryTable.tsx | 300 | 신규 진입 | 부문별 요약 테이블 |
| 12 | types/index.ts | 301 | +3 | 타입 정의 및 헬퍼 함수 |
| 13 | useAchievement.ts | 291 | 신규 진입 | 달성 현황 데이터 훅 |
| 14 | productMasterService.ts | 242 | 신규 진입 | 제품 마스터 CRUD |
| 15 | RegisterPage.tsx | 234 | 신규 진입 | 회원가입 페이지 |
| 16 | AchievementPage.tsx | 219 | 신규 진입 | 달성 현황 페이지 |
| 17 | authService.ts | 213 | 신규 진입 | 인증 서비스 |
| 18 | Sidebar.tsx | 210 | 신규 진입 | 사이드바 네비게이션 |
| 19 | excelParser.ts | 204 | 신규 진입 | 엑셀 파일 파싱 |

---

## 1. 개요

### 1.1 목적
- 대용량 파일(200라인 이상)을 기능 단위로 분리하여 유지보수성 향상
- React 코드 분할(lazy loading) 적용으로 초기 로딩 시간 단축
- 커스텀 훅 분리를 통한 로직 재사용성 증가

### 1.2 대상 파일 (상위 10개)

| 순위 | 파일 | 라인 수 | 주요 책임 |
|------|------|---------|-----------|
| 1 | DataInputPage.tsx | 501 | 엑셀 업로드, 파일 처리, 데이터 삭제, 충돌 모달 |
| 2 | TargetInputTable.tsx | 489 | 분기별 목표 입력, 직접/퍼센트 모드, 행렬 계산 |
| 3 | useReport.ts | 478 | 보고서 데이터 로드, 병합, 스냅샷 관리 |
| 4 | ProductManagementPage.tsx | 421 | 제품 CRUD, 필터링, 유지보수 타입 관리 |
| 5 | UserManagementPage.tsx | 413 | 사용자 관리, 승인/거절, 역할/부문 변경 |
| 6 | snapshotService.ts | 408 | 스냅샷 관리, 해시 분석, 충돌 감지 |
| 7 | DivisionManagementPage.tsx | 366 | 부문 CRUD, 삭제 확인 |
| 8 | ConflictResolutionModal.tsx | 352 | 충돌 해결 UI, 데이터 비교 시각화 |
| 9 | ProductReportPage.tsx | 345 | 제품 보고서, 필터, 차트 |
| 10 | types/index.ts | 298 | 타입 정의 및 헬퍼 함수 |

---

## 2. 현재 상태 분석

### 2.1 공통 문제점
1. **단일 책임 원칙 위반**: 한 파일에 여러 관심사가 혼재
2. **중복 코드**: 알림, 로딩 상태, 에러 처리 로직 반복
3. **긴 컴포넌트**: JSX 렌더링과 비즈니스 로직 혼합
4. **테스트 어려움**: 컴포넌트 내부에 로직이 밀접하게 결합

### 2.2 파일별 분석

```
DataInputPage.tsx (501줄)
├── 상태 관리: 8개 useState
├── 콜백 함수: 4개 (handleFileUpload, handleConflictResolve 등)
├── 헬퍼 함수: 3개 (showNotification, getMonthData, matchDivision)
└── JSX: ~250줄 (업로드 섹션, 데이터 테이블, 모달)

TargetInputTable.tsx (489줄)
├── 상태 관리: 3개 useState
├── 계산 로직: distributeTotal, footerTotals 등
├── 이벤트 핸들러: 5개
└── JSX: ~200줄 (컨트롤, 퍼센트 모드, 테이블)

useReport.ts (478줄)
├── 상태 관리: 8개 useState
├── 데이터 로드: useEffect (초기 로드)
├── 업로드 관련: saveUploadedData, mergeProducts
├── 스냅샷 관련: loadSnapshot, refreshSnapshots, analyzeUpload
└── 개별 CRUD: addEntry, removeEntry
```

---

## 3. 모듈화 전략 상세

### 3.1 DataInputPage.tsx (501줄 -> ~150줄)

#### 분할 방안

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

#### 상세 분할 내용

**useDataInput.ts** (신규)
```typescript
// 포함될 기능:
- useState 선언들 (notification, fileInputRef, isUploading, uploadType, mergeMode 등)
- showNotification 함수
- handleFileUpload 콜백
- handleConflictResolve 콜백
- handleDelete 콜백
```

**FileUploadSection.tsx** (신규)
```typescript
// 포함될 기능:
- 드래그 앤 드롭 영역 UI
- 업로드 타입 토글 (제품별/부문별)
- 파일 입력 참조 관리
- 업로드 진행 표시
```

---

### 3.2 TargetInputTable.tsx (489줄 -> ~120줄)

#### 분할 방안

```
src/components/targets/TargetInputTable.tsx (120줄 - 메인 컴포넌트)
├── src/components/targets/
│   ├── hooks/
│   │   └── useTargetMatrix.ts (100줄)      # 행렬 상태 + 계산 로직
│   ├── components/
│   │   ├── TargetInputControls.tsx (80줄)  # 모드 토글 + 비율 입력
│   │   ├── AnnualTargetInputs.tsx (70줄)   # 연간 목표 입력 그리드
│   │   ├── TargetTableHeader.tsx (40줄)    # 테이블 헤더
│   │   ├── TargetTableRow.tsx (60줄)       # 테이블 행 (입력 셀)
│   │   ├── TargetTableFooter.tsx (40줄)    # 합계 행
│   │   └── index.ts
│   ├── utils/
│   │   └── targetCalculations.ts (50줄)    # distributeTotal, cellKey 등
│   └── constants.ts (10줄)                  # QUARTERS, 기본 비율
```

#### 상세 분할 내용

**useTargetMatrix.ts** (신규)
```typescript
// 포함될 기능:
- matrix 상태 관리 (useState<Record<CellKey, CellValue>>)
- ratios 상태 관리
- mode 상태 관리
- handleRatioChange
- handleTotalChange
- handleChange
- hasChanges (useMemo)
- footerTotals (useMemo)
```

**targetCalculations.ts** (신규)
```typescript
// 포함될 함수:
export function cellKey(divisionId: string, quarter: Quarter): string
export function distributeTotal(...)
export function calculateFooterTotals(...)
```

---

### 3.3 useReport.ts (478줄 -> ~150줄)

#### 분할 방안

```
src/hooks/useReport.ts (150줄 - 메인 훅)
├── src/hooks/report/
│   ├── useReportData.ts (80줄)            # 데이터 로드 + 상태
│   ├── useReportUpload.ts (100줄)         # 업로드 + 저장 로직
│   ├── useReportSnapshots.ts (80줄)       # 스냅샷 관련 기능
│   └── utils/
│       └── mergeProducts.ts (50줄)        # 제품 병합 유틸리티
```

#### 상세 분할 내용

**useReportData.ts** (신규)
```typescript
// 포함될 기능:
- data, months, monthLabels 상태
- isLoading, error 상태
- 초기 로드 useEffect
- loadLatest 함수
```

**useReportUpload.ts** (신규)
```typescript
// 포함될 기능:
- saveUploadedData
- addEntry
- removeEntry
- isSaving 상태
```

**useReportSnapshots.ts** (신규)
```typescript
// 포함될 기능:
- currentWeekKey, availableSnapshots, selectedSnapshot 상태
- analyzeUpload
- saveWithConflictResolution
- loadSnapshot
- refreshSnapshots
```

---

### 3.4 Admin 페이지 분할

#### ProductManagementPage.tsx (421줄 -> ~100줄)

```
src/pages/admin/ProductManagementPage.tsx (100줄 - 메인 페이지)
├── src/features/productManagement/
│   ├── hooks/
│   │   └── useProductManagement.ts (100줄)  # CRUD 상태 + 로직
│   ├── components/
│   │   ├── ProductFilterBar.tsx (50줄)      # 필터 + 추가 버튼
│   │   ├── ProductAddForm.tsx (60줄)        # 추가 폼
│   │   ├── ProductTable.tsx (80줄)          # 테이블
│   │   ├── ProductTableRow.tsx (60줄)       # 행 (편집/일반 모드)
│   │   └── DeleteConfirmModal.tsx (50줄)    # 삭제 확인 모달
│   └── index.ts
```

#### UserManagementPage.tsx (413줄 -> ~100줄)

```
src/pages/admin/UserManagementPage.tsx (100줄 - 메인 페이지)
├── src/features/userManagement/
│   ├── hooks/
│   │   └── useUserManagement.ts (100줄)     # 사용자 관리 로직
│   ├── components/
│   │   ├── UserFilterBar.tsx (50줄)         # 상태/부문 필터
│   │   ├── UserTable.tsx (80줄)             # 테이블
│   │   ├── UserTableRow.tsx (80줄)          # 행 (승인/역할 버튼)
│   │   ├── StatusBadge.tsx (30줄)           # 상태 배지 컴포넌트
│   │   └── RoleBadge.tsx (20줄)             # 역할 배지 컴포넌트
│   └── index.ts
```

---

### 3.5 types/index.ts (298줄 -> 도메인별 분리)

#### 분할 방안

```
src/types/
├── index.ts (30줄 - re-export)
├── core.ts (50줄)                    # MonthData, ProductData, ParseResult 등
├── user.ts (40줄)                    # UserProfile, UserRole, AuthState 등
├── division.ts (30줄)                # Division, DivisionSummary 등
├── target.ts (40줄)                  # QuarterlyTarget, TargetAchievement 등
├── snapshot.ts (60줄)                # WeeklySnapshot, MonthConflict, UploadAnalysisResult 등
├── report.ts (30줄)                  # ReportFilter, PeriodInfo 등
└── helpers.ts (20줄)                 # getMonthShortLabel, getMonthFullLabel 등
```

---

## 4. 성능 최적화 기법

### 4.1 React.lazy를 활용한 라우트 기반 코드 분할

**router.tsx 개선안**
```typescript
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoadingSpinner } from '@/components/error';

// Lazy load 적용 대상 페이지
const DataInputPage = lazy(() => import('./pages/DataInputPage'));
const ProductReportPage = lazy(() => import('./pages/ProductReportPage'));
const AchievementPage = lazy(() => import('./pages/AchievementPage'));

// 관리자 전용 페이지 (더 늦게 로드)
const DivisionManagementPage = lazy(() =>
  import('./pages/admin/DivisionManagementPage')
);
const ProductManagementPage = lazy(() =>
  import('./pages/admin/ProductManagementPage')
);
const UserManagementPage = lazy(() =>
  import('./pages/admin/UserManagementPage')
);
const TargetInputPage = lazy(() =>
  import('./pages/admin/TargetInputPage')
);

// Suspense wrapper 컴포넌트
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" message="페이지 로딩 중..." />}>
      {children}
    </Suspense>
  );
}
```

### 4.2 컴포넌트 레벨 lazy loading

```typescript
// 대용량 차트 컴포넌트 지연 로딩
const ProductCharts = lazy(() =>
  import('@/components/reports/ProductCharts')
);

// 사용 시
<Suspense fallback={<ChartSkeleton />}>
  <ProductCharts items={processedData} months={months} viewMode={viewMode} />
</Suspense>
```

### 4.3 useMemo/useCallback 최적화

```typescript
// 메모이제이션이 필요한 계산들
const footerTotals = useMemo(() => {
  const totals = { sales: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, Total: 0 }, ... };
  // 계산 로직
  return totals;
}, [matrix, divisions]);

// 콜백 메모이제이션
const handleRatioChange = useCallback((index: number, value: string) => {
  // 로직
}, [matrix, divisions, ratios]);
```

### 4.4 React.memo를 활용한 렌더링 최적화

```typescript
// TargetTableRow.tsx
import { memo } from 'react';

interface TargetTableRowProps {
  division: Division;
  quarters: Quarter[];
  matrix: Record<CellKey, CellValue>;
  mode: InputMode;
  onChange: (key: CellKey, field: string, value: string) => void;
}

export const TargetTableRow = memo(function TargetTableRow({
  division,
  quarters,
  matrix,
  mode,
  onChange,
}: TargetTableRowProps) {
  // 렌더링 로직
});
```

### 4.5 동적 import를 활용한 라이브러리 분할

```typescript
// excelParser.ts (이미 적용됨)
export async function parseExcelFile(buffer: ArrayBuffer): Promise<ParseResult> {
  const ExcelJS = await import('exceljs'); // 동적 import
  // ...
}

// 차트 라이브러리 최적화 (추가 권장)
export const LazyBarChart = lazy(async () => {
  const { BarChart } = await import('recharts');
  return { default: BarChart };
});
```

---

## 5. 예상 효과

### 5.1 번들 크기 감소

| 항목 | 현재 | 개선 후 | 감소율 |
|------|------|---------|--------|
| 초기 로드 JS | ~850KB | ~400KB | 53% |
| 관리자 페이지 chunk | - | ~200KB | lazy load |
| 보고서 페이지 chunk | - | ~150KB | lazy load |

### 5.2 로딩 시간 개선

| 항목 | 현재 (예상) | 개선 후 | 개선율 |
|------|-------------|---------|--------|
| FCP (First Contentful Paint) | 1.8s | 1.0s | 44% |
| TTI (Time to Interactive) | 3.2s | 1.8s | 44% |
| 라우트 전환 | 200ms | 50ms | 75% |

### 5.3 개발 생산성 향상

- **코드 탐색 시간**: 파일당 평균 500줄 -> 100줄 (80% 감소)
- **테스트 용이성**: 독립된 훅/유틸리티로 단위 테스트 가능
- **병렬 개발**: 기능별 분리로 충돌 최소화
- **재사용성**: 공통 컴포넌트/훅의 다른 페이지 활용

---

## 6. 우선순위별 리팩토링 순서

### Phase 1: 핵심 인프라 (1-2주)

| 우선순위 | 파일 | 이유 | 예상 시간 |
|----------|------|------|-----------|
| 1 | types/index.ts | 다른 모든 파일이 의존, 선행 필수 | 4시간 |
| 2 | useReport.ts | 핵심 데이터 훅, 많은 페이지에서 사용 | 8시간 |
| 3 | snapshotService.ts | useReport와 밀접하게 연관 | 6시간 |

### Phase 2: 데이터 입력 기능 (1주)

| 우선순위 | 파일 | 이유 | 예상 시간 |
|----------|------|------|-----------|
| 4 | DataInputPage.tsx | 가장 복잡한 페이지, 사용 빈도 높음 | 8시간 |
| 5 | ConflictResolutionModal.tsx | DataInputPage와 연관 | 4시간 |
| 6 | excelParser.ts | 업로드 기능의 핵심 | 3시간 |

### Phase 3: 관리자 페이지 (1주)

| 우선순위 | 파일 | 이유 | 예상 시간 |
|----------|------|------|-----------|
| 7 | TargetInputTable.tsx | 복잡한 행렬 계산 로직 | 6시간 |
| 8 | UserManagementPage.tsx | 패턴 유사, 재사용 가능 | 4시간 |
| 9 | ProductManagementPage.tsx | 패턴 유사 | 4시간 |
| 10 | DivisionManagementPage.tsx | 가장 단순한 관리 페이지 | 3시간 |

### Phase 4: 보고서 기능 (1주)

| 우선순위 | 파일 | 이유 | 예상 시간 |
|----------|------|------|-----------|
| 11 | ProductReportPage.tsx | 차트와 테이블 복합 | 4시간 |
| 12 | AchievementPage.tsx | 달성 현황 페이지 | 3시간 |
| 13 | useAchievement.ts | 달성 계산 로직 | 4시간 |
| 14 | AchievementCharts.tsx | 차트 컴포넌트 | 2시간 |

---

## 7. 최종 디렉토리 구조

```
src/
├── components/
│   ├── achievement/
│   │   ├── AchievementCharts.tsx
│   │   ├── AchievementTable.tsx
│   │   └── index.ts
│   ├── charts/
│   │   ├── ChartWrapper.tsx
│   │   ├── LazyCharts.tsx (신규)
│   │   └── index.ts
│   ├── targets/
│   │   ├── TargetInputTable.tsx (축소됨)
│   │   ├── hooks/
│   │   │   └── useTargetMatrix.ts (신규)
│   │   ├── components/
│   │   │   ├── TargetInputControls.tsx (신규)
│   │   │   ├── AnnualTargetInputs.tsx (신규)
│   │   │   ├── TargetTableHeader.tsx (신규)
│   │   │   ├── TargetTableRow.tsx (신규)
│   │   │   └── TargetTableFooter.tsx (신규)
│   │   ├── utils/
│   │   │   └── targetCalculations.ts (신규)
│   │   └── index.ts
│   └── upload/
│       ├── ConflictResolutionModal.tsx (축소됨)
│       ├── conflict/
│       │   ├── ConflictSummary.tsx (신규)
│       │   ├── ConflictItem.tsx (신규)
│       │   └── ConflictActions.tsx (신규)
│       └── index.ts
├── features/
│   ├── dataInput/
│   │   ├── hooks/
│   │   │   └── useDataInput.ts (신규)
│   │   ├── components/
│   │   │   ├── FileUploadSection.tsx (신규)
│   │   │   ├── MergeModeSelector.tsx (신규)
│   │   │   ├── DataManagementTools.tsx (신규)
│   │   │   └── DataListTable.tsx (신규)
│   │   ├── utils/
│   │   │   └── divisionMatcher.ts (신규)
│   │   └── index.ts
│   ├── productManagement/
│   │   ├── hooks/
│   │   │   └── useProductManagement.ts (신규)
│   │   ├── components/
│   │   │   ├── ProductFilterBar.tsx (신규)
│   │   │   ├── ProductAddForm.tsx (신규)
│   │   │   ├── ProductTable.tsx (신규)
│   │   │   └── ProductTableRow.tsx (신규)
│   │   └── index.ts
│   └── userManagement/
│       ├── hooks/
│       │   └── useUserManagement.ts (신규)
│       ├── components/
│       │   ├── UserFilterBar.tsx (신규)
│       │   ├── UserTable.tsx (신규)
│       │   ├── UserTableRow.tsx (신규)
│       │   └── StatusBadge.tsx (신규)
│       └── index.ts
├── hooks/
│   ├── report/
│   │   ├── useReportData.ts (신규)
│   │   ├── useReportUpload.ts (신규)
│   │   ├── useReportSnapshots.ts (신규)
│   │   └── utils/
│   │       └── mergeProducts.ts (신규)
│   └── useReport.ts (축소됨)
├── pages/
│   ├── admin/
│   │   ├── DivisionManagementPage.tsx (축소됨)
│   │   ├── ProductManagementPage.tsx (축소됨)
│   │   ├── TargetInputPage.tsx
│   │   └── UserManagementPage.tsx (축소됨)
│   ├── DataInputPage.tsx (축소됨)
│   └── ProductReportPage.tsx (축소됨)
├── types/
│   ├── index.ts (re-export만)
│   ├── core.ts (신규)
│   ├── user.ts (신규)
│   ├── division.ts (신규)
│   ├── target.ts (신규)
│   ├── snapshot.ts (신규)
│   ├── report.ts (신규)
│   └── helpers.ts (신규)
└── utils/
    ├── excelParser.ts
    ├── formatUtils.ts
    └── hashUtils.ts
```

---

## 8. 결론

### 8.1 요약

- **총 10개 대용량 파일** 모듈화 대상
- **약 50개 신규 파일** 생성 예정
- **평균 파일 크기**: 500줄 -> 100줄 (80% 감소)
- **예상 작업 기간**: 4주 (Phase 1-4)

### 8.2 기대 효과

1. **유지보수성**: 단일 책임 원칙 준수, 코드 탐색 용이
2. **성능**: 초기 로딩 53% 감소, 라우트 전환 75% 개선
3. **테스트**: 독립된 훅/유틸리티로 단위 테스트 가능
4. **협업**: 기능별 분리로 병렬 개발 가능

---

## 9. 보고서 페이지 간 중복 코드 분석 및 모듈화 방안

### 9.1 개요

제품별 보고서(ProductReportPage), 부문별 보고서(DivisionReportPage), 달성 현황(AchievementPage) 페이지에서 동일한 기능이 개별적으로 구현되어 있어 모듈화가 필요합니다.

### 9.2 발견된 중복 패턴

#### 패턴 1: viewMode 상태 관리 (3개 페이지 동일)

| 파일 | 라인 | 코드 |
|------|------|------|
| ProductReportPage.tsx | 159 | `useState<'sales' \| 'profit'>('sales')` |
| DivisionReportPage.tsx | 28 | `useState<'sales' \| 'profit'>('sales')` |
| AchievementPage.tsx | 28 | `useState<'sales' \| 'profit'>('sales')` |

#### 패턴 2: 매출액/매출이익 토글 버튼 UI (3개 페이지 거의 동일)

**ProductReportPage.tsx (Line 170-190)**
```tsx
<div className="flex bg-slate-100 p-1 rounded-lg">
    <button onClick={() => setViewMode('sales')}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}>
        매출액 보기
    </button>
    <button onClick={() => setViewMode('profit')}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            viewMode === 'profit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}>
        매출이익 보기
    </button>
</div>
```

**DivisionReportPage.tsx (Line 48-68)** - 위와 동일한 구조

**AchievementPage.tsx (Line 107-128)** - 아이콘 추가된 약간 다른 버전

#### 패턴 3: KPI 카드 구조 (2개 페이지 동일)

**ProductReportPage.tsx (Line 215-236)**, **DivisionReportPage.tsx (Line 103-128)**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-avoid-break">
    <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${
        viewMode === 'sales' ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'
    }`}>
        <p className="text-sm text-slate-500 mb-1">총 매출액 (백만원)</p>
        <p className="text-2xl font-bold text-slate-900">{formatMillionWon(totals.totalSales)}</p>
    </div>
    <!-- 매출이익, 이익률 카드 동일 구조 -->
</div>
```

#### 패턴 4: 차트 컴포넌트의 viewMode 기반 데이터 변환

| 파일 | 반복 로직 |
|------|-----------|
| ProductCharts.tsx | `viewMode === 'sales' ? md.sales : md.profit` |
| DivisionCharts.tsx | `viewMode === 'sales' ? pd?.sales : (pd?.sales - pd?.cost)` |
| AchievementCharts.tsx | `isSalesMode ? a.actualSales : a.actualProfit` |

#### 패턴 5: 색상 팔레트 중복 정의 (4개 파일)

| 파일 | 색상 수 | 비고 |
|------|---------|------|
| ProductCharts.tsx (Line 23-36) | 12개 | 가장 완전한 버전 |
| DivisionCharts.tsx (Line 25-36) | 10개 | 일부 누락 |
| AchievementCharts.tsx (Line 22-25) | 3개 | 다른 색상 세트 |
| ProductReportPage.tsx (Line 17-30) | 12개 | 월별 배경색 팔레트 |

### 9.3 모듈화 방안

#### 방안 1: `useViewMode` 커스텀 훅 생성

```typescript
// src/hooks/useViewMode.ts
export type ViewMode = 'sales' | 'profit';

export function useViewMode(defaultMode: ViewMode = 'sales') {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

    const isSalesMode = viewMode === 'sales';
    const isProfitMode = viewMode === 'profit';

    const getMetricLabel = () => isSalesMode ? '매출액' : '매출이익';
    const getMetricColor = () => isSalesMode ? 'indigo' : 'emerald';

    return {
        viewMode,
        setViewMode,
        isSalesMode,
        isProfitMode,
        getMetricLabel,
        getMetricColor,
    };
}
```

#### 방안 2: `ViewModeToggle` 공통 컴포넌트 생성

```typescript
// src/components/common/ViewModeToggle.tsx
interface ViewModeToggleProps {
    viewMode: 'sales' | 'profit';
    onModeChange: (mode: 'sales' | 'profit') => void;
    showIcons?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function ViewModeToggle({ viewMode, onModeChange, showIcons = false, size = 'md' }: ViewModeToggleProps) {
    return (
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
                onClick={() => onModeChange('sales')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'sales'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {showIcons && <DollarSign className="w-4 h-4" />}
                매출액 보기
            </button>
            <button
                onClick={() => onModeChange('profit')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'profit'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {showIcons && <TrendingUp className="w-4 h-4" />}
                매출이익 보기
            </button>
        </div>
    );
}
```

#### 방안 3: `KPICardGrid` 공통 컴포넌트 생성

```typescript
// src/components/common/KPICardGrid.tsx
interface KPICardData {
    label: string;
    value: string | number;
    highlight?: boolean;
    color?: 'default' | 'indigo' | 'emerald';
}

interface KPICardGridProps {
    cards: KPICardData[];
    columns?: 2 | 3 | 4;
}

export function KPICardGrid({ cards, columns = 3 }: KPICardGridProps) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 print-avoid-break`}>
            {cards.map((card, index) => (
                <KPICard key={index} {...card} />
            ))}
        </div>
    );
}
```

#### 방안 4: 색상 상수 중앙화

```typescript
// src/constants/colors.ts
export const CHART_COLORS = {
    primary: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    extended: ['#f97316', '#ec4899', '#84cc16', '#14b8a6', '#3b82f6', '#f43f5e'],
} as const;

export const METRIC_COLORS = {
    sales: { primary: 'indigo-600', border: 'indigo-200', ring: 'indigo-100' },
    profit: { primary: 'emerald-600', border: 'emerald-200', ring: 'emerald-100' },
} as const;

export const MONTH_BACKGROUND_COLORS = [
    'bg-red-50', 'bg-orange-50', 'bg-amber-50', 'bg-yellow-50',
    'bg-lime-50', 'bg-green-50', 'bg-emerald-50', 'bg-teal-50',
    'bg-cyan-50', 'bg-sky-50', 'bg-blue-50', 'bg-indigo-50'
] as const;
```

#### 방안 5: `useMetricData` 훅으로 데이터 변환 통합

```typescript
// src/hooks/useMetricData.ts
export function useMetricData<T>(
    data: T[],
    viewMode: 'sales' | 'profit',
    getSalesValue: (item: T) => number,
    getProfitValue: (item: T) => number
) {
    return useMemo(() => {
        return data.map(item => ({
            ...item,
            displayValue: viewMode === 'sales' ? getSalesValue(item) : getProfitValue(item)
        }));
    }, [data, viewMode]);
}
```

### 9.4 우선순위별 적용 순서

| 우선순위 | 작업 | 영향 범위 | 예상 시간 |
|----------|------|-----------|-----------|
| 1 | `colors.ts` 상수 파일 생성 | 4개 파일 | 1시간 |
| 2 | `ViewModeToggle` 컴포넌트 | 3개 페이지 | 2시간 |
| 3 | `useViewMode` 훅 생성 | 3개 페이지 | 1시간 |
| 4 | `KPICardGrid` 컴포넌트 | 2개 페이지 | 2시간 |
| 5 | 차트 컴포넌트 viewMode 로직 통합 | 3개 차트 | 3시간 |

### 9.5 모듈화 후 예상 구조

```
src/
├── components/
│   └── common/
│       ├── ViewModeToggle.tsx (신규)
│       ├── KPICard.tsx (신규)
│       ├── KPICardGrid.tsx (신규)
│       └── index.ts
├── constants/
│   ├── colors.ts (신규)
│   └── index.ts
├── hooks/
│   ├── useViewMode.ts (신규)
│   ├── useMetricData.ts (신규)
│   └── index.ts
```

### 9.6 기대 효과

1. **코드 중복 제거**: 약 300줄의 중복 코드 제거
2. **일관성 향상**: 모든 보고서 페이지에서 동일한 UI/UX 보장
3. **유지보수 용이**: 스타일/로직 변경 시 한 곳만 수정
4. **개발 속도 향상**: 신규 보고서 페이지 추가 시 재사용 가능

---

## 10. 보안 현황 분석 및 강화 방안

> **분석 일자**: 2026-02-19
> **분석 범위**: 인증/인가, Firestore 보안 규칙, 입력 검증, 호스팅 보안, 코드 보안

### 10.1 현재 보안 아키텍처 개요

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
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 10.2 현재 보안 강점 (이미 구현됨)

#### A. Firestore 보안 규칙 (firestore.rules - 157줄)

| 항목 | 상태 | 설명 |
|------|------|------|
| 인증 확인 헬퍼 (isAuthenticated) | ✅ 구현됨 | `request.auth != null` 체크 |
| 관리자 권한 확인 (isAdmin) | ✅ 구현됨 | 문서 존재 확인 후 role 체크 |
| 승인 상태 확인 (isApproved) | ✅ 구현됨 | status == 'approved' 체크 |
| 부문 소속 확인 (belongsToDivision) | ✅ 구현됨 | divisionId 매칭 |
| 기본 거부 정책 (Catch-all) | ✅ 구현됨 | `match /{document=**} { allow: false }` |
| 순환 참조 방지 | ✅ 구현됨 | userExists() 선행 체크 |
| 감사 로그 불변성 | ✅ 구현됨 | uploadHistory: update/delete 금지 |
| 사용자 자기 문서 생성 제한 | ✅ 구현됨 | `request.auth.uid == userId` |

#### B. 인증 시스템 (AuthContext + authService)

| 항목 | 상태 | 설명 |
|------|------|------|
| Firebase Auth 기반 인증 | ✅ 구현됨 | Email/Password 방식 |
| 인증 상태 감시 | ✅ 구현됨 | onAuthStateChanged + cancelled 플래그 |
| 승인 대기/거절 게이트 | ✅ 구현됨 | ProtectedRoute에서 상태별 UI |
| 관리자 전용 라우트 | ✅ 구현됨 | adminOnly prop |
| Firebase 에러 한국어 번역 | ✅ 구현됨 | 7개 에러 코드 번역 |
| 메모리 누수 방지 | ✅ 구현됨 | useEffect cleanup + cancelled 플래그 |

#### C. 코드 보안

| 항목 | 상태 | 설명 |
|------|------|------|
| XSS 방지 | ✅ 안전 | dangerouslySetInnerHTML 미사용, React 자동 이스케이프 |
| eval/Function 미사용 | ✅ 안전 | 동적 코드 실행 없음 |
| 환경 변수 관리 | ✅ 안전 | VITE_ 접두사, .gitignore 포함 |
| SHA-256 해싱 | ✅ 구현됨 | Web Crypto API 사용 (hashUtils.ts) |
| 입력 검증 (Excel) | ✅ 구현됨 | Regex 기반 헤더 검증, 숫자 폴백 |
| 에러 상세 정보 숨김 | ✅ 구현됨 | DEV 환경에서만 스택트레이스 표시 |
| autoComplete 속성 | ✅ 구현됨 | email, current-password, new-password |

#### D. 호스팅 보안 헤더 (firebase.json)

| 헤더 | 값 | 효과 |
|------|-----|------|
| X-Content-Type-Options | nosniff | MIME 스니핑 방지 |
| X-Frame-Options | DENY | 클릭재킹 방지 |
| X-XSS-Protection | 1; mode=block | 반사형 XSS 방지 |
| Cache-Control | immutable (assets) | 정적 자원 캐싱 |

### 10.3 보안 취약점 및 개선 필요 사항

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

// reports/products 서브컬렉션 예시
match /reports/{reportId}/products/{productDocId} {
  function isValidProductData() {
    let data = request.resource.data;
    return data.name is string && data.name.size() <= 100
      && (!('months' in data.keys()) || data.months is map);
  }

  allow create, update: if (isAdmin() || isApproved()) && isValidProductData();
}
```

---

#### 🔴 S-03. 관리자 이메일 하드코딩

**현황**: `authService.ts:20`에 `const ADMIN_EMAIL = 'hclim@hunesion.com'` 하드코딩
**위험**: 소스 코드 노출 시 관리자 이메일 타겟팅 가능, 관리자 변경 시 코드 수정 필요
**영향 범위**: 인증 시스템

**개선안**:
1. **환경 변수로 이동**: `VITE_ADMIN_EMAIL`로 변경
2. **Firestore 설정 문서 활용**: `settings/admin` 문서에 관리자 이메일 목록 관리
3. **Firebase Custom Claims 활용** (장기):
```typescript
// Firebase Admin SDK (Cloud Functions에서)
admin.auth().setCustomUserClaims(uid, { admin: true });

// 클라이언트에서 확인
const token = await user.getIdTokenResult();
if (token.claims.admin) { /* 관리자 */ }
```

---

#### 🟡 S-04. 비밀번호 정책 미흡

**현황**: Firebase 기본 정책 (6자 이상)만 적용, RegisterPage에서 길이만 검증
**위험**: 약한 비밀번호로 인한 무차별 대입 공격 위험
**영향 범위**: 회원가입

**개선안**: 클라이언트 측 비밀번호 강도 검증 추가
```typescript
// src/utils/passwordValidator.ts
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: '8자 이상이어야 합니다' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: '대문자를 포함해야 합니다' };
  if (!/[a-z]/.test(password)) return { valid: false, message: '소문자를 포함해야 합니다' };
  if (!/[0-9]/.test(password)) return { valid: false, message: '숫자를 포함해야 합니다' };
  if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: '특수문자를 포함해야 합니다' };
  return { valid: true, message: '' };
}
```

---

#### 🟡 S-05. 세션 타임아웃 미설정

**현황**: Firebase Auth 기본 세션 유지 (장기 유지, 새로고침 시에도 로그인 유지)
**위험**: 공용 PC에서 로그아웃 하지 않을 경우 다른 사용자가 접근 가능
**영향 범위**: 전체 인증 흐름

**개선안**:
```typescript
// AuthContext.tsx에 비활동 타임아웃 추가
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분

useEffect(() => {
  let timeout: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      logout();
      // 세션 만료 알림
    }, INACTIVITY_TIMEOUT);
  };

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => window.addEventListener(event, resetTimer));
  resetTimer();

  return () => {
    clearTimeout(timeout);
    events.forEach(event => window.removeEventListener(event, resetTimer));
  };
}, [logout]);
```

---

#### 🟡 S-06. 엑셀 파일 업로드 검증 강화 필요

**현황**: 파일 확장자만 검증 (.xlsx, .xls), MIME 타입 미확인, 파일 크기 제한 설정은 있으나 미적용
**위험**: 악의적 파일 업로드 (확장자 위조)
**영향 범위**: DataInputPage

**개선안**:
```typescript
// src/utils/fileValidator.ts
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  // 1. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다` };
  }

  // 2. MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다 (.xlsx, .xls만 가능)' };
  }

  // 3. 파일 매직 바이트 검증
  // xlsx: PK (50 4B 03 04), xls: D0 CF 11 E0

  return { valid: true };
}
```

---

#### 🟡 S-07. 클라이언트 측 권한 우회 가능성

**현황**: 관리자 기능 버튼이 클라이언트 렌더링으로만 제어됨 (isAdmin 상태)
**위험**: DevTools로 상태 변조 시 관리자 UI 접근 가능 (실제 동작은 Firestore 규칙이 차단)
**영향 범위**: 관리자 페이지

**현재 대응**: Firestore 규칙에서 서버 측 권한 검증 → **실질적 데이터 유출 위험은 낮음**
**개선안**: 추가 방어 레이어로 Firebase Custom Claims 활용
```typescript
// ID 토큰에서 직접 권한 확인 (클라이언트 상태보다 신뢰도 높음)
const tokenResult = await auth.currentUser?.getIdTokenResult();
const isRealAdmin = tokenResult?.claims.admin === true;
```

---

#### 🟡 S-08. Referrer-Policy 헤더 미설정

**현황**: firebase.json에 Referrer-Policy 헤더 없음
**위험**: 외부 링크 클릭 시 페이지 URL이 전달될 수 있음
**영향 범위**: 호스팅

**개선안**: firebase.json headers에 추가
```json
{
  "key": "Referrer-Policy",
  "value": "strict-origin-when-cross-origin"
}
```

---

#### 🟡 S-09. Permissions-Policy 헤더 미설정

**현황**: 브라우저 기능(카메라, 마이크, 위치 등) 접근 정책 미설정
**위험**: 악성 스크립트가 브라우저 API에 접근할 가능성
**영향 범위**: 호스팅

**개선안**: firebase.json headers에 추가
```json
{
  "key": "Permissions-Policy",
  "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
}
```

---

#### 🟢 S-10. 로그인 시도 횟수 제한 (클라이언트 측)

**현황**: Firebase Auth 자체 rate limiting은 있으나 (`auth/too-many-requests`), 클라이언트 측 추가 보호 없음
**위험**: UI에서 반복 로그인 시도 가능
**영향 범위**: LoginPage

**개선안**:
```typescript
// 로그인 실패 횟수 추적
const [failCount, setFailCount] = useState(0);
const [lockUntil, setLockUntil] = useState<Date | null>(null);

const handleLogin = async () => {
  if (lockUntil && new Date() < lockUntil) {
    setError('너무 많은 시도입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  try {
    await login(email, password);
    setFailCount(0);
  } catch {
    const newCount = failCount + 1;
    setFailCount(newCount);
    if (newCount >= 5) {
      setLockUntil(new Date(Date.now() + 5 * 60 * 1000)); // 5분 잠금
    }
  }
};
```

---

#### 🟢 S-11. divisions 컬렉션 공개 읽기

**현황**: `allow read: if true;` (인증 없이 누구나 읽기 가능)
**사유**: 회원가입 시 부문 목록 조회 필요
**위험**: 조직 구조 정보 노출 (낮은 위험)
**영향 범위**: firestore.rules

**개선안** (선택적):
```
// 옵션 A: 인증 사용자만 허용 + 회원가입 시 공개 API로 목록 제공
allow read: if isAuthenticated();

// 옵션 B: 현재 상태 유지 (부문 이름만 노출, 민감 정보 아님)
// 리스크 수용 가능
```

---

#### 🟢 S-12. Strict-Transport-Security (HSTS) 확인

**현황**: Firebase Hosting은 기본적으로 HTTPS 강제 + HSTS 적용
**확인 필요**: 커스텀 도메인 사용 시 HSTS preload 등록 여부
**영향 범위**: 호스팅

**개선안**: 명시적 HSTS 헤더 추가 (방어적)
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains; preload"
}
```

---

#### 🟢 S-13. authService 내 중복 주석 정리

**현황**: `authService.ts:42-46`에 불필요한 중복 주석 존재
```typescript
// ... (existing imports)
// ... (existing imports, but getDivision is new)
// ...
```
**영향**: 코드 품질 (보안 직접 영향은 없음)
**개선안**: 중복 주석 제거

---

### 10.4 보안 강화 우선순위 및 실행 계획

#### Phase S-1: 즉시 조치 (1-2일)

| 항목 | 작업 | 파일 | 난이도 |
|------|------|------|--------|
| S-01 | CSP 헤더 추가 | firebase.json | ★★☆ |
| S-08 | Referrer-Policy 헤더 추가 | firebase.json | ★☆☆ |
| S-09 | Permissions-Policy 헤더 추가 | firebase.json | ★☆☆ |
| S-12 | HSTS 헤더 명시적 추가 | firebase.json | ★☆☆ |
| S-13 | authService 중복 주석 제거 | authService.ts | ★☆☆ |

#### Phase S-2: 단기 조치 (1주)

| 항목 | 작업 | 파일 | 난이도 |
|------|------|------|--------|
| S-02 | Firestore 필드 검증 규칙 추가 | firestore.rules | ★★★ |
| S-03 | 관리자 이메일 환경변수 이동 | authService.ts, .env | ★★☆ |
| S-04 | 비밀번호 강도 검증 추가 | RegisterPage.tsx, 신규 util | ★★☆ |
| S-06 | 파일 업로드 검증 강화 | DataInputPage.tsx, 신규 util | ★★☆ |

#### Phase S-3: 중기 조치 (2-4주)

| 항목 | 작업 | 파일 | 난이도 |
|------|------|------|--------|
| S-05 | 세션 비활동 타임아웃 | AuthContext.tsx | ★★☆ |
| S-07 | Firebase Custom Claims 도입 | Cloud Functions (신규) | ★★★ |
| S-10 | 클라이언트 로그인 시도 제한 | LoginPage.tsx | ★★☆ |

### 10.5 보안 체크리스트 요약

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

## 11. 전체 개선 로드맵 (통합)

### Phase 1: 보안 긴급 조치 + 인프라 정비 (1주)

| 순서 | 영역 | 작업 | 예상 시간 |
|------|------|------|-----------|
| 1 | 보안 | firebase.json 보안 헤더 추가 (CSP, Referrer, Permissions, HSTS) | 2시간 |
| 2 | 보안 | Firestore 필드 검증 규칙 추가 | 4시간 |
| 3 | 보안 | 관리자 이메일 환경변수 이동 | 1시간 |
| 4 | 보안 | 비밀번호 강도 검증 추가 | 2시간 |
| 5 | 보안 | 파일 업로드 검증 강화 (MIME, 크기) | 2시간 |
| 6 | 코드 | authService.ts 중복 주석 정리 | 30분 |
| 7 | 모듈화 | types/index.ts 도메인별 분리 | 4시간 |

### Phase 2: 핵심 모듈화 (1-2주)

| 순서 | 영역 | 작업 | 예상 시간 |
|------|------|------|-----------|
| 8 | 모듈화 | useReport.ts 분할 | 8시간 |
| 9 | 모듈화 | snapshotService.ts 분할 | 6시간 |
| 10 | 모듈화 | DataInputPage.tsx 분할 | 8시간 |
| 11 | 보안 | 세션 비활동 타임아웃 추가 | 3시간 |
| 12 | 보안 | 클라이언트 로그인 시도 제한 | 2시간 |

### Phase 3: 관리자 페이지 + 중복 제거 (1주)

| 순서 | 영역 | 작업 | 예상 시간 |
|------|------|------|-----------|
| 13 | 모듈화 | TargetInputTable.tsx 분할 | 6시간 |
| 14 | 모듈화 | Admin 페이지 분할 (User, Product, Division) | 11시간 |
| 15 | 중복제거 | colors.ts 상수 중앙화 | 1시간 |
| 16 | 중복제거 | ViewModeToggle + useViewMode 컴포넌트/훅 | 3시간 |
| 17 | 중복제거 | KPICardGrid 공통 컴포넌트 | 2시간 |

### Phase 4: 성능 최적화 + 보고서 (1주)

| 순서 | 영역 | 작업 | 예상 시간 |
|------|------|------|-----------|
| 18 | 성능 | React.lazy 라우트 기반 코드 분할 | 4시간 |
| 19 | 성능 | 차트 컴포넌트 lazy loading | 2시간 |
| 20 | 모듈화 | 보고서 페이지 분할 (Product, Achievement) | 7시간 |
| 21 | 중복제거 | 차트 viewMode 로직 통합 | 3시간 |
| 22 | 보안 | Firebase Custom Claims 도입 (Cloud Functions) | 8시간 |
