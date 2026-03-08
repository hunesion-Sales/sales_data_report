# Phase 11 작업 내역서

> **작업일**: 2026-03-08
> **빌드 검증**: `tsc -b` 통과, `vite build` 성공
> **테스트 검증**: `vitest run` 14파일 89테스트 전체 통과

---

## Phase 11-1: 타입 확장

### `src/types/report.ts`
- `ReportFilter` 인터페이스에 3개 필드 추가:
  - `months?: number[]` — 월별 다중 선택 (1~12)
  - `quarters?: Quarter[]` — 분기별 다중 선택 (Q1~Q4)
  - `halfYears?: HalfYear[]` — 반기별 다중 선택 (H1/H2)
- `IndustryGroupReportFilter` 인터페이스에 동일 3개 필드 추가
- 기존 `DashboardPeriodSelection` 타입과 동일한 패턴 적용

---

## Phase 11-2: periodUtils 헬퍼 추가

### `src/utils/periodUtils.ts`
- `getFilteredPeriodInfoList()` 함수 신규 추가 (line 121~155)
- 시그니처: `(year, periodType, availableMonths, selectedMonths?, selectedQuarters?, selectedHalfYears?) => PeriodInfo[]`
- 내부 동작:
  1. `getPeriodInfoList()` 호출로 전체 목록 생성
  2. periodType에 따라 분기:
     - `monthly`: selectedMonths로 필터 (월 번호 비교)
     - `quarterly`: selectedQuarters로 필터 (key 비교)
     - `semi-annual`: selectedHalfYears로 필터 (key 비교)
     - `annual`: 항상 전체 반환
  3. 선택값이 없으면 (undefined 또는 빈 배열) 전체 반환

---

## Phase 11-3: 필터바 세부선택 UI

### `src/components/reports/ReportFilterBar.tsx`
- 전체 재작성 (109줄 → 199줄)
- 추가된 핸들러:
  - `handlePeriodTypeChange()` — 기간 유형 변경 시 `months/quarters/halfYears` 초기화 (`delete` 사용)
  - `handleMonthToggle(month)` — 월 다중 선택 토글
  - `handleQuarterToggle(quarter)` — 분기 다중 선택 토글
  - `handleHalfYearToggle(halfYear)` — 반기 다중 선택 토글
- 추가된 UI:
  - `periodType === 'monthly'`: 1월~12월 버튼 12개 (px-2 py-1 text-xs, indigo-600 활성)
  - `periodType === 'quarterly'`: Q1~Q4 버튼 4개
  - `periodType === 'semi-annual'`: H1/H2 버튼 2개
  - `periodType === 'annual'`: 세부 선택 없음
- 기간 유형 탭과 세부 선택 사이에 위치, 부문 필터 앞

### `src/components/reports/IndustryGroupReportFilterBar.tsx`
- ReportFilterBar와 동일한 세부 기간 선택 UI 추가
- `IndustryGroupReportFilter` 타입 사용
- 산업군 필터 드롭다운은 세부 기간 선택 뒤에 위치

---

## Phase 11-4: 보고서 훅/페이지 세부 기간 적용

### `src/hooks/useDivisionReport.ts`
- import 변경: `getPeriodInfoList` → `getFilteredPeriodInfoList`
- `periodInfoList` useMemo 수정:
  - `getFilteredPeriodInfoList(filter.year, filter.periodType, availableMonths, filter.months, filter.quarters, filter.halfYears)` 호출
  - deps에 `filter.months, filter.quarters, filter.halfYears` 추가
- `UseDivisionReportReturn` 인터페이스에 `divisionItems: DivisionDataItem[]` 추가
- return 객체에 `divisionItems` 추가 (트렌드 차트에서 원본 월별 데이터 접근용)

### `src/hooks/useIndustryGroupReport.ts`
- import 변경: `getPeriodInfoList` → `getFilteredPeriodInfoList`
- `periodInfoList` useMemo 수정: 동일 패턴
- deps에 세부 기간 필드 추가

### `src/pages/ProductReportPage.tsx`
- import 변경: `getPeriodInfoList` → `getFilteredPeriodInfoList`
- `filteredMonths` useMemo 수정:
  - 기존 `periodType === 'monthly'` 분기 제거
  - 모든 경우 `getFilteredPeriodInfoList()` 사용하여 일관된 필터링
  - deps에 `filter.months, filter.quarters, filter.halfYears` 추가

---

## Phase 11-5: 전년도 데이터 훅

### `src/hooks/usePreviousYearDivisionData.ts` (신규, 37줄)
- `usePreviousYearDivisionData(year)` 훅
- `getReport(year - 1)` → `getDivisionData(reportId)` 순차 호출
- 상태: `data: DivisionDataItem[]`, `isLoading: boolean`
- 에러 시 빈 배열 반환 (silent fail)
- cleanup: `cancelled` 플래그로 race condition 방지

### `src/hooks/usePreviousYearIndustryGroupData.ts` (신규, 43줄)
- `usePreviousYearIndustryGroupData(year, industryGroups)` 훅
- `getReport(year - 1)` → `getIndustryGroupData(reportId)` → `remapIndustryGroupData(rawData, industryGroups)` 순차 호출
- `industryGroups.length === 0` 시 early return (설정 로드 전 실행 방지)
- deps: `[year, industryGroups]`

---

## Phase 11-6: 트렌드 데이터 훅 + 차트 컴포넌트

### `src/hooks/useReportTrendData.ts` (신규, 84줄)
- `useReportTrendData(source, selectedItem, year, viewMode)` 훅
- `TrendDataSource` 인터페이스:
  - `currentItems`: 당년 항목별 월 데이터 (`{name, months}[]`)
  - `previousItems`: 전년 항목별 월 데이터
  - `backlogByItem`: 수주잔액 항목별 월 데이터 (`Record<name, Record<monthKey, {sales, cost}>>`)
- 로직:
  1. `getMonthsInYear(year)` / `getMonthsInYear(year-1)` 로 12개월 키 생성
  2. `selectedItem === '전체'` 시 모든 항목 합산, 아니면 해당 항목만 필터
  3. 각 월별: 당년 실적 합산 + 전년 동월 실적 합산 + 수주잔액 합산
  4. `viewMode === 'sales'` → sales 값, `'profit'` → sales - cost
  5. `MonthlyTrendDataItem[]` 반환 (achievementRate/growthRate는 0)

### `src/components/reports/ReportTrendChart.tsx` (신규, 99줄)
- `ReportTrendChartProps`:
  - `data: MonthlyTrendDataItem[]`
  - `viewMode: 'sales' | 'profit'`
  - `items: {value, label}[]` — 드롭다운 옵션
  - `selectedItem: string` — 현재 선택
  - `onItemChange: (value) => void`
  - `titlePrefix: string` — "제품별", "부문별", "산업군별"
- 내부 상태: `isCumulative` (누적/월별 토글, 기본 누적)
- 누적 데이터 변환: `reduce` 패턴으로 prevYearActual/currentActual/backlog 누적합 계산
- UI 구성:
  - 상단: 제목 + 항목 select + 누적/월별 토글
  - 하단: `DualBarLineChart` (height=380, lineCount=0)
- `React.memo` 래핑

---

## Phase 11-7: 각 보고서 페이지 트렌드 차트 통합

### `src/pages/ProductReportPage.tsx`
- 추가 import: `useYoYReport`, `useBacklogData`, `useReportTrendData`, `ReportTrendChart`
- 추가 훅 호출:
  - `useYoYReport(filter.year, true)` → `previousData`
  - `useBacklogData(filter.year)` → `products: backlogProducts`
- 상태: `trendSelectedProduct` (기본 '전체')
- `trendItems`: mainData의 제품명 기반 드롭다운 옵션
- `trendSource`: data → currentItems, previousData → previousItems, backlogProducts → backlogByItem
- `ReportTrendChart` 배치: KPICardGrid 아래, Main Report Section 위

### `src/pages/DivisionReportPage.tsx`
- 추가 import: `usePreviousYearDivisionData`, `useBacklogData`, `useReportTrendData`, `ReportTrendChart`
- 추가 훅 호출:
  - `usePreviousYearDivisionData(filter.year)` → `prevDivisionData`
  - `useBacklogData(filter.year)` → `divisions: backlogDivisions`
- `trendSource`: divisionItems → currentItems, prevDivisionData → previousItems, backlogDivisions → backlogByItem
- `ReportTrendChart` 배치: KPICardGrid 아래, DivisionCharts 위

### `src/pages/IndustryGroupReportPage.tsx`
- 추가 import: `usePreviousYearIndustryGroupData`, `useBacklogData`, `useReportTrendData`, `ReportTrendChart`
- 추가 훅 호출:
  - `usePreviousYearIndustryGroupData(filter.year, industryGroups)` → `prevIndustryData`
  - `useBacklogData(filter.year, industryGroupConfig)` → `industryGroupsData: backlogIndustryGroups`
- `industryGroupConfig`: `industryGroups.map(g => ({name, keywords}))` (산업군 재분류용)
- `ReportTrendChart` 배치: KPICardGrid 아래, IndustryGroupCharts 위
