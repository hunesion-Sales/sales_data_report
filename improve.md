# 대용량 파일 모듈화 및 성능 개선 방안

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
