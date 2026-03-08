# Phase 10 작업 내역서

> **작업일**: 2026-03-01
> **빌드 검증**: `tsc --noEmit` 통과, `vite build` 성공

---

## Phase 10-1: 과거 연도 업로드 지원 (항목 4)

### 4-A. CURRENT_YEAR 중앙화
- **파일**: `src/config/appConfig.ts`
- `CURRENT_YEAR = new Date().getFullYear()` 동적 연도 설정 추가
- `VALID_YEAR_RANGE = { min: 2020, max: 2030 }` 범위 상수 추가
- 기존 `useReportData.ts`와 `useReportUpload.ts`의 하드코딩 `const CURRENT_YEAR = 2026` 제거, import로 교체

### 4-B. 엑셀 파싱 연도 추출
- **파일**: `src/types/parse.ts`
- `ParseResult` 인터페이스에 `detectedYear: number` 필드 추가

- **파일**: `src/utils/excelParser.ts`
- `VALID_YEAR_RANGE` import 추가
- `parseExcelFile()` 반환 시 `months[0]`에서 연도 추출: `parseInt(months[0].split('-')[0], 10)`
- fallback: 월 데이터 없으면 `new Date().getFullYear()` 사용
- 범위 검증: `2020 <= detectedYear <= 2030` 벗어나면 `throw new Error()` 발생

### 4-C. 업로드 훅 연도 파라미터화
- **파일**: `src/hooks/useReportData.ts`
  - `saveUploadedData()` 시그니처에 `targetYear?: number` 추가
  - `getOrCreateReport(targetYear ?? CURRENT_YEAR)` 호출로 변경

- **파일**: `src/hooks/useReportUpload.ts`
  - `analyzeUpload()` 시그니처에 `targetYear?: number` 추가
  - `saveWithConflictResolution()` 시그니처에 `targetYear?: number` 추가
  - 모든 `getOrCreateReport()` 호출에 `targetYear ?? CURRENT_YEAR` 적용

- **파일**: `src/hooks/useReport.ts`
  - `UseReportReturn` 인터페이스의 `saveUploadedData`, `analyzeUpload`, `saveWithConflictResolution` 타입 시그니처에 `targetYear?: number` 추가

### 4-D. useDataInput 연도 감지 + UI
- **파일**: `src/features/dataInput/hooks/useDataInput.ts`
  - `UseDataInputOptions` 인터페이스의 모든 함수 시그니처에 `targetYear?: number` 추가
  - `detectedYear` state 추가 (`useState<number | null>(null)`)
  - `handleFileUpload` 내부에서 `result.detectedYear` 저장 및 `yearForUpload`로 전파
  - 알림 메시지에 `[${yearForUpload}년]` 프리픽스 추가 (과거 연도일 때)
  - return에 `detectedYear` 추가

- **파일**: `src/pages/DataInputPage.tsx`
  - `CURRENT_YEAR` import, `CalendarDays` 아이콘 import
  - `detectedYear` 구조 분해 할당
  - `MergeModeSelector` 아래에 연도 감지 뱃지 UI 추가:
    - 현재 연도: 초록색 `bg-emerald-100 text-emerald-800`
    - 과거 연도: 주황색 `bg-amber-100 text-amber-800` + "(과거 데이터)" 레이블

---

## Phase 10-2: 제품별 기간 필터링 + 훅 분리 (항목 5, 6-A)

### 6-A. useProductReport 훅 추출
- **신규 파일**: `src/hooks/useProductReport.ts` (127줄)
- `ProductReportPage.tsx`에서 데이터 가공 로직 전체 추출:
  - `mainData` 계산: 일반 제품 + Cloud서비스 소계 + 유지보수 합산 + 기타 합산
  - `cloudData` 계산: Cloud 개별 항목
  - `totals`: mainData 기반 전체 합계
  - `cloudTotals`: cloudData 기반 클라우드 합계
- 훅 시그니처: `useProductReport(data: ProductData[], months: string[])`
- 반환: `{ mainData, cloudData, totals, cloudTotals }`

### 5-A~D. ProductReportPage 리팩토링
- **파일**: `src/pages/ProductReportPage.tsx` (284줄 → 140줄)
- 변경 사항:
  - `useProductReport` 훅 사용으로 인라인 `useMemo` 3개 블록 제거
  - `ReportFilter` 상태 추가: `{ year: CURRENT_YEAR, periodType: 'monthly' }`
  - `ReportFilterBar` 컴포넌트 추가 (부문 필터 숨김: `divisions={[]}`)
  - `getAvailableYears(months)` 기반 연도 드롭다운
  - `filteredMonths` useMemo: 기간 필터 적용 (월별/분기별/반기별/연간)
  - 모든 자식 컴포넌트에 `filteredMonths` 전달
  - `enableQuarterGrouping={filteredMonths.length > 6}` 조건부 활성화

---

## Phase 10-3: 차트 가독성 + 테이블 UI 개선 (항목 2, 1)

### 2-A. 모든 막대 차트 상단 총합 표시
- **파일**: `src/components/reports/ProductCharts.tsx`, `DivisionCharts.tsx`, `MonthlyTrendChart.tsx`, `DivisionOverviewChart.tsx`, `TopProductsChart.tsx`, `DashboardDetailModal.tsx`, `AchievementCharts.tsx`, `DualAxisChart.tsx`
- `LabelList` import 추가 및 모든 `<Bar>` 컴포넌트 내부에 삽입
- 커스텀 `formatter`: `formatter={(val: any) => formatMillionWonChart(val)}` 처리를 통해 TypeScript 에러 해결 및 백만원 단위 축소 변환 적용
- `textAnchor="middle"`, `fontSize={10}`, `fill="#64748b"` 등 가독성 최적화 스타일 부여

### 2-B. 커스텀 Tooltip (총계 포함)
- **파일**: `src/components/reports/ProductCharts.tsx`
- 기존 `<Tooltip formatter={...}>` → `<Tooltip content={...}>` 교체
- 인라인 커스텀 Tooltip 컴포넌트:
  - 각 제품별 값 표시 (색상 매핑)
  - `<hr>` 구분선 후 `총계: {formatMillionWonTooltip(total)}` 표시
  - 스타일: `bg-white border rounded-lg shadow-lg p-3 text-sm`

### 2-C. Y축 단위 라벨
- **파일**: `src/components/reports/ProductCharts.tsx`
- `<YAxis>` 에 `label` prop 추가: `{ value: '(백만원)', angle: -90, position: 'insideLeft' }`

### 1-A. Total 열 Sticky Right
- **파일**: `src/components/reports/ProductReportTable.tsx`
- 헤더 합계 3열: `sticky right-0/right-[100px]/right-[200px] z-[5]`
- 데이터 행 합계 3열: `sticky right-0/right-[100px]/right-[200px] z-[5] bg-slate-50`
- 푸터 합계 3열: `sticky right-0/right-[100px]/right-[200px] z-[5] bg-slate-900`

### 1-B. 분기별 그룹핑
- **파일**: `src/components/reports/ProductReportTable.tsx`
- 신규 Props: `enableQuarterGrouping?: boolean` (기본 false)
- 신규 imports: `ChevronRight`, `ChevronDown`, `ChevronsRight`, `ChevronsDown`, `getQuarterForMonth`, `getQuarterLabel`
- `QuarterGroup` 인터페이스: `{ quarter: Quarter, label: string, months: string[] }`
- `expandedQuarters: Set<string>` 상태 (기본: 모두 접힘)
- `quarterGroups` useMemo: months를 Q1~Q4로 그룹화
- 헤더 렌더링:
  - 1단 헤더: 분기명 + 토글 아이콘 (`ChevronRight`/`ChevronDown`)
  - 2단 헤더: 접힌 상태 → 매출/매입/이익 3열, 펼친 상태 → 월별 3열 x N개월
- 데이터 셀: `expandedQuarters.has(quarter)` 기준 월별 or 분기합계
- 분기 합계 계산: `getQuarterSum()` / `getQuarterTotalSum()` 헬퍼 함수
- 푸터도 동일 패턴 적용

### 1-C. 전체 펼치기/접기 버튼
- 테이블 헤더 영역에 2개 버튼 추가 (no-print):
  - `[전체 펼치기]`: `setExpandedQuarters(new Set(quarterGroups.map(...)))`
  - `[분기별 요약]`: `setExpandedQuarters(new Set())`

---

## Phase 10-4: YoY 전년도 비교 기능 (항목 3)

### 3-A. YoY 유틸리티 함수
- **신규 파일**: `src/utils/yoyUtils.ts`
  - `calculateYoYRate(current, previous)`: 증감률 계산 (previous=0 처리, null 반환)
  - `formatYoYRate(rate)`: `▲ 15.5%` / `▼ 10.3%` / `-` 포맷
  - `getYoYColorClass(rate)`: `text-emerald-600` / `text-rose-600` / `text-slate-400`

### 3-B. 전년도 데이터 조회 훅
- **신규 파일**: `src/hooks/useYoYReport.ts`
  - `useYoYReport(year, enabled)` 훅
  - `enabled=true`일 때 `getReport(year - 1)` + `getProducts(reportId)` 호출
  - 반환: `{ previousData, previousMonths, isLoading, error }`
  - cleanup 함수로 race condition 방지 (`cancelled` flag)

### 3-C. Dashboard KPI 카드 YoY 뱃지
- **파일**: `src/features/dashboard/components/DashboardKPICards.tsx`
  - `YoYMetrics` 인터페이스: `{ salesRate, profitRate, previousSales, previousProfit }`
  - `yoyMetrics?: YoYMetrics` optional prop 추가
  - 누적 매출액 카드: 전년 값 + 증감률 뱃지 추가
  - 누적 매출이익 카드: 전년 값 + 증감률 뱃지 추가

### 3-D. 트렌드 비교 차트 확장
- **파일**: `src/features/dashboard/components/MonthlyTrendChart.tsx`
  - data 타입에 `previousSales?`, `previousProfit?` 추가
  - `showYoY?: boolean` prop 추가
  - `hasPreviousData` 계산: 전년도 데이터 존재 여부
  - 조건부 Bar 2개 추가: `previousSales` (fill=#cbd5e1, opacity=0.5), `previousProfit` (fill=#a7f3d0, opacity=0.5)
  - Tooltip formatter에 전년 데이터 이름 처리 추가

### 3-E. 테이블 전년 비교 열
- **파일**: `src/components/reports/ProductReportTable.tsx`
  - `previousTotals?: Totals` optional prop 추가
  - 헤더: `전체 합계` 옆에 `전년 비교` colSpan=2 추가 (조건부)
  - 서브헤더: `전년 총계` + `증감률` 2열 추가 (bg-amber-50)
  - 데이터 행: 전년 총 매출 + YoY 증감률 표시
  - 푸터: 전체 전년 총계 + 증감률 표시

### 3-F. Dashboard 연동
- **파일**: `src/components/SolutionBusinessDashboard.tsx`
  - `useYoYReport(CURRENT_YEAR, true)` 훅 연결
  - `yoyMetrics` useMemo: 전년 데이터에서 총 매출/이익 집계 + YoY율 계산
  - `enrichedTrendData` useMemo: 월별 트렌드 데이터에 전년도 매출/이익 병합 (월 번호 매칭)
  - `DashboardKPICards`에 `yoyMetrics` prop 전달
  - `MonthlyTrendChart`에 `enrichedTrendData` + `showYoY` prop 전달

---

## Phase 10-5: 제품 마스터 DB 업데이트 및 마이그레이션 (신규)

### 5-A. ProductType 도입
- **파일**: `src/types/product.ts`, `src/features/productManagement/hooks/useProductManagement.ts`
- 기존 boolean 형태의 `isMaintenanceType`을 `'General' | 'Cloud' | 'Maintenance'` 유니온 타입인 `ProductType`으로 개선

### 5-B. 누락 데이터 추가 및 마이그레이션 로직
- **파일**: `src/firebase/services/productMasterService.ts`
- `docToProductMaster` 내 구버전 데이터 호환성 처리 (fallback) 추가
- `seedInitialProductMasters` 및 `seedProductMastersFromProducts`: 이름 내 `_MA`, `Cloud` 파싱 로직 적용해 자동 분류
- `updateAllProductTypes`: 단일 스크립트로 기존 Firestore 문서의 타입을 일괄 업데이트

### 5-C. UI 및 관리 도구
- **파일**: `src/pages/admin/ProductManagementPage.tsx`, `src/features/productManagement/components/ProductTable.tsx`, `src/features/productManagement/components/ProductAddForm.tsx`
- 제품 등록 폼 및 테이블에서 새 `ProductType`을 Select Dropdown을 통해 관리할 수 있도록 개선
- 어드민 페이지 상단에 [신규제품 DB 연동] 및 [기존 데이터 마이그레이션] 유틸리티 액션 버튼 지원

---

## Phase 10-6: 차트 시각화 및 UX 세부 개선 (신규)

### 6-A. 제품별 누적 막대 차트(Stacked Bar) 데이터 정렬
- **파일**: `src/components/reports/ProductCharts.tsx`
- `stackedBarData` `useMemo` 블록 내에서 값이 0 이상인 제품만 필터링한 뒤, 수치가 큰 항목이 상단에 렌더링되도록 값 기준 오름차순(렌더링 역순 반영) 정렬 적용
- `Tooltip` 내 표시 내용 역시 내림차순(가장 큰 값이 맨 위) 정렬된 복사본(`sortedPayload`)을 만들어 사용자 인지 동기화 완료

### 6-B. 부문별 차트 높이 동기화 및 가독성 개선
- **파일**: `src/components/reports/DivisionCharts.tsx`, `src/components/charts/DualAxisChart.tsx`
- **크기 통일**: 부문별 달성율 복합 차트(`DualAxisChart`)와 부문별 비중 파이 차트(`PieChart`)의 `height`를 모두 `400`으로 통일하여 그리드 디자인 일관성 확보
- **달성율 차트 색상 분리**: 단일 색상(파랑/초록)으로만 구성되던 막대 차트에 `DIVISION_COLORS` 배열과 `Cell` 렌더링을 맵핑하여 부문마다 각각 고유의 색상을 갖도록 구현
- **커스텀 범례(Legend) 추가**: 기존의 단순한 '달성율/매출액' 텍스트 범례를 제거하고, 파이 차트와 동일한 포맷의 커스텀 범례 (색상 사각형 + 부문명 + 금액) 컴포넌트를 주입하여 가독성을 극대화함
- **X축 라벨 제거**: 하단 커스텀 범례에 부문명이 명확히 표시됨에 따라, 중복되는 X축 부문명 라벨(`tick={false}`, `tickLine={false}`)을 숨겨 시각적 여백을 확보함

---

## 전체 파일 변경 목록

### 신규 파일 (5개)
| 파일 | 설명 |
|------|------|
| `src/hooks/useProductReport.ts` | 제품별 보고서 데이터 가공 훅 |
| `src/hooks/useYoYReport.ts` | 전년도 데이터 조회 훅 |
| `src/utils/yoyUtils.ts` | YoY 증감률 계산/포맷 유틸리티 |
| `src/utils/__tests__/yoyUtils.test.ts` | YoY 유틸리티 단위 테스트 |
| `improve_work_v2.md` | 작업 내역서 (본 파일) |

### 수정 파일 (14개)
| 파일 | 변경 내용 |
|------|-----------|
| `src/config/appConfig.ts` | CURRENT_YEAR, VALID_YEAR_RANGE 추가 |
| `src/types/parse.ts` | ParseResult에 detectedYear 추가 |
| `src/utils/excelParser.ts` | 연도 추출 + 범위 검증 |
| `src/hooks/useReportData.ts` | CURRENT_YEAR import, targetYear 파라미터 |
| `src/hooks/useReportUpload.ts` | CURRENT_YEAR import, targetYear 파라미터 |
| `src/hooks/useReport.ts` | 타입 시그니처 targetYear 추가 |
| `src/features/dataInput/hooks/useDataInput.ts` | detectedYear 상태, 연도 감지 로직 |
| `src/pages/DataInputPage.tsx` | 연도 감지 뱃지 UI |
| `src/pages/ProductReportPage.tsx` | 기간 필터 + useProductReport 훅 적용 |
| `src/components/reports/ProductCharts.tsx` | LabelList, 커스텀 Tooltip, Y축 라벨 |
| `src/components/reports/ProductReportTable.tsx` | sticky right, 분기 그룹핑, YoY 열 |
| `src/features/dashboard/components/DashboardKPICards.tsx` | yoyMetrics prop, YoY 뱃지 |
| `src/features/dashboard/components/MonthlyTrendChart.tsx` | showYoY, 전년도 Bar |
| `src/components/SolutionBusinessDashboard.tsx` | useYoYReport 연동, 데이터 병합 |
