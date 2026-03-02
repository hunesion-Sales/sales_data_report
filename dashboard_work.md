# 대시보드 리팩토링 작업 내역

> **시작일**: 2026-03-02
> **참조**: `dashboard_plan.md`

---

## Phase 0: 공통 인프라 ✅

### 0-1. 새 타입 정의 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/types/industryGroup.ts` (신규) | `IndustryGroup`, `IndustryGroupInput`, `IndustryGroupData` 인터페이스 | ✅ |
| `src/types/backlog.ts` (신규) | `BacklogProductData`, `BacklogDivisionData`, `BacklogIndustryGroupData`, `BacklogMeta` 인터페이스 | ✅ |
| `src/types/productTarget.ts` (신규) | `ProductGroupTarget`, `ProductGroupTargetInput` 인터페이스 | ✅ |
| `src/types/product.ts` (수정) | `ProductMaster`, `ProductMasterInput`에 `productGroup?: string` 추가 | ✅ |
| `src/types/core.ts` (수정) | `ProductData`에 `industryGroupId?: string` 추가 | ✅ |
| `src/types/report.ts` (수정) | `DashboardPeriodSelection` 인터페이스 추가 | ✅ |
| `src/types/index.ts` (수정) | 3개 신규 타입 파일 barrel export 추가 | ✅ |

### 0-2. 공통 유틸리티 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/utils/backlogUtils.ts` (신규) | `getMonthKeysForPeriod()`, `getFutureMonthKeys()`, `sumMonthData()`, `calculateExpectedPerformance()`, `calculateAchievementRate()`, `calculateGrowthRate()` | ✅ |
| `src/utils/industryGroupMapper.ts` (신규) | `matchIndustryGroup()`, `isMaintenanceProduct()`, `getIndustryGroupForRow()`, `DEFAULT_INDUSTRY_GROUPS` 시드 데이터 | ✅ |

### 0-3. 공유 차트 모듈 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/shared/PerformanceTooltip.tsx` (신규) | 5항목 공통 툴팁 (전년실적, 성장율, 당년실적, 수주잔액, 달성율) | ✅ |
| `src/features/dashboard/components/shared/PeriodSelector.tsx` (신규) | 연도 드롭다운 + 기간유형 탭(월별/분기/반기/연간) + 세부기간 선택 | ✅ |
| `src/features/dashboard/components/shared/DualBarLineChart.tsx` (신규) | 바 3개(전년실적/당년실적/수주잔액) + 라인 2개(달성율/성장율) 공통 차트 | ✅ |
| `src/features/dashboard/components/shared/index.ts` (신규) | barrel export | ✅ |

---

## Phase 1: 산업군 관리 (Feature 1) ✅

### 1-1. Firestore 서비스 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/firebase/services/industryGroupService.ts` (신규) | `getIndustryGroups()`, `getIndustryGroup()`, `createIndustryGroup()`, `updateIndustryGroup()`, `deleteIndustryGroup()`, `seedDefaultIndustryGroups()`, `resetToDefaultIndustryGroups()` | ✅ |

### 1-2. Feature 모듈 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/industryGroupManagement/hooks/useIndustryGroupManagement.ts` (신규) | CRUD + 키워드 편집 + 초기화 상태 관리 훅 | ✅ |
| `src/features/industryGroupManagement/components/IndustryGroupList.tsx` (신규) | 산업군 목록 (키워드 태그 표시, 인라인 편집) | ✅ |
| `src/features/industryGroupManagement/components/IndustryGroupAddForm.tsx` (신규) | 산업군 추가 폼 (이름 + 키워드 입력) | ✅ |
| `src/features/industryGroupManagement/components/KeywordTags.tsx` (신규) | 키워드 태그 표시/편집 공통 컴포넌트 | ✅ |
| `src/features/industryGroupManagement/index.ts` (신규) | barrel export | ✅ |

### 1-3. 페이지 & 라우팅 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/pages/admin/IndustryGroupManagementPage.tsx` (신규) | 산업군 관리 관리자 페이지 (DivisionManagementPage 패턴) | ✅ |
| `src/router.tsx` (수정) | `/admin/industry-groups` 라우트 추가 (React.lazy, adminOnly) | ✅ |
| `src/components/layout/Sidebar.tsx` (수정) | adminItems에 '산업군 관리' + Factory 아이콘 추가 | ✅ |

---

## Phase 2: 제품 마스터 수정 + 제품군별 목표 (Features 3 & 4) ✅

### 2-1. 제품 마스터에 제품군 필드 추가 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/firebase/services/productMasterService.ts` (수정) | `docToProductMaster`에 productGroup 필드 추가, `createProductMaster`에 productGroup 지원, `PRODUCT_GROUP_MAPPING` (32개 제품→11개 제품군), `PRODUCT_GROUPS` (11개), `batchUpdateProductGroups()` 추가 | ✅ |
| `src/features/productManagement/components/ProductTable.tsx` (수정) | 제품군 컬럼 추가 (보기/편집 모드 모두), colSpan 5로 수정 | ✅ |
| `src/pages/admin/ProductManagementPage.tsx` (수정) | '제품군 일괄 적용' 버튼 추가 (batchUpdateProductGroups 호출) | ✅ |

### 2-2. 제품군별 목표 관리 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/firebase/services/productGroupTargetService.ts` (신규) | `getProductGroupTargetsByYear()`, `batchUpsertProductGroupTargets()` | ✅ |
| `src/features/productGroupTargetInput/hooks/useProductGroupTargetMatrix.ts` (신규) | 제품군(11행) × Q1~Q4(4열) 매트릭스 상태관리, 로드/저장/합계계산 | ✅ |
| `src/features/productGroupTargetInput/components/ProductGroupTargetTable.tsx` (신규) | 매출/이익 동시 입력 테이블 (both/sales/profit 뷰모드) | ✅ |
| `src/features/productGroupTargetInput/index.ts` (신규) | barrel export | ✅ |
| `src/pages/admin/ProductGroupTargetInputPage.tsx` (신규) | 제품군별 목표 관리 페이지 (연도 선택, 뷰모드 토글, 저장) | ✅ |
| `src/router.tsx` (수정) | `/admin/product-group-targets` 라우트 추가 | ✅ |
| `src/components/layout/Sidebar.tsx` (수정) | adminItems에 '제품군별 목표' 추가 | ✅ |

---

## Phase 3: 수주잔액 데이터 업로드 (Feature 2-2) ✅

### 3-1. Firestore 서비스 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/firebase/services/backlogService.ts` (신규) | `saveBacklogMeta()`, `saveBacklogProducts()`, `getBacklogProducts()`, `saveBacklogDivisions()`, `getBacklogDivisions()`, `saveBacklogIndustryGroups()`, `getBacklogIndustryGroups()` — 3종 서브컬렉션 CRUD | ✅ |

### 3-2. 엑셀 파서 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/utils/backlogExcelParser.ts` (신규) | `parseBacklogExcel()` — 시트명으로 유형 자동 감지(제품별/부문별/산업군별), richText 지원, 월 헤더 탐색, 지난 달 필터 옵션, 산업군별 2섹션(매출코드+유지보수코드) 파싱 | ✅ |

### 3-3. 업로드 통합 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dataInput/components/UploadTypeSelector.tsx` (수정) | `UploadType` 타입 export, 수주잔액(ClipboardList) 버튼 추가, 버튼 배열 기반으로 리팩토링 | ✅ |
| `src/features/dataInput/hooks/useDataInput.ts` (수정) | `backlog` 업로드 분기 추가 — `parseBacklogExcel` → 타입별 저장(`saveBacklogProducts`/`saveBacklogDivisions`/`saveBacklogIndustryGroups`) + 메타 저장 | ✅ |
| `src/features/dataInput/components/MergeModeSelector.tsx` (수정) | `uploadType` 타입을 `string`으로 유연화 | ✅ |
| `src/features/dataInput/index.ts` (수정) | `UploadType` 타입 barrel export 추가 | ✅ |
| `src/pages/DataInputPage.tsx` (수정) | 수주잔액 모드 설명 텍스트, 병합모드 숨기기, 업로드 레이블 분기 | ✅ |
| `src/types/backlog.ts` (수정) | `BacklogMeta`의 `uploadedAt`, `uploadedBy`, `fileName`을 optional로 변경 | ✅ |

---

## Phase 4: 산업군별 데이터 업로드 (Feature 2-1) ✅

### 4-1. Firestore 서비스 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/firebase/services/industryGroupDataService.ts` (신규) | `saveIndustryGroupData()` (overwrite/merge 지원), `getIndustryGroupData()` — `reports/{year}/industry_group_data/` 서브컬렉션 CRUD | ✅ |

### 4-2. 엑셀 파서 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/utils/industryGroupExcelParser.ts` (신규) | `parseIndustryGroupExcelFile()` — 2섹션(매출코드+유지보수코드) 파싱, 유지보수코드 전체→"유지보수" 합산, richText 지원 | ✅ |

### 4-3. 업로드 통합 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dataInput/components/UploadTypeSelector.tsx` (수정) | `UploadType`에 `'industryGroup'` 추가, Factory 아이콘 + '산업군별 데이터' 버튼 | ✅ |
| `src/features/dataInput/hooks/useDataInput.ts` (수정) | `industryGroup` 업로드 분기 추가 — `parseIndustryGroupExcelFile` → `saveIndustryGroupData` | ✅ |
| `src/pages/DataInputPage.tsx` (수정) | 산업군별 설명 텍스트 + 업로드 레이블 분기 | ✅ |

---

## Phase 5: 대시보드 리팩토링 (Feature 5) ✅

### 5-1. 기간 선택 + 업로드 기준일 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/hooks/usePeriodSelector.ts` (신규) | 기간 선택 상태관리 (연간/반기/분기/월별), localStorage 영속화, `selectedMonthKeys`, `backlogMonthKeys`, `periodLabel` 계산 | ✅ |
| `src/features/dashboard/hooks/useUploadDate.ts` (신규) | `uploadHistory` 컬렉션에서 최신 업로드 일자 조회 | ✅ |

### 5-2. 수주잔액 데이터 훅 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/hooks/useBacklogData.ts` (신규) | 3종 서브컬렉션 fetch + 월별/제품군별/부문별/산업군별 집계, `PRODUCT_GROUP_MAPPING` 활용 | ✅ |

### 5-3. KPI 카드 (2행 9카드) ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/DashboardKPICards.tsx` (재작성) | 4카드 → 9카드 (5+4 레이아웃), `DashboardKPIData` 인터페이스 신설 (actual, achievementRate, backlogTotal, expectedPerformance, predictedRate, prevYearActual, periodGrowthRate, prevYearAnnual, annualGrowthRate) | ✅ |

### 5-4. 월별 실적 및 예측 현황 차트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/MonthlyTrendChart.tsx` (재작성) | 누적/월별 토글, DualBarLineChart 사용, `MonthlyTrendDataItem` 인터페이스 | ✅ |

### 5-5. 주요 제품군별 / 산업군별 실적 순위 차트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/ProductGroupChart.tsx` (신규) | 제품군별 누적 실적 순위 (DualBarLineChart, lineCount=2) | ✅ |
| `src/features/dashboard/components/IndustryGroupChart.tsx` (신규) | 산업군별 누적 실적 순위 (DualBarLineChart, lineCount=2) | ✅ |

### 5-6. 부문별 매출이익 목표 및 실적 / 달성율 차트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/DivisionOverviewChart.tsx` (재작성) | "실적만 보기"/"실적+수주잔액" 토글, 목표/실적/수주잔액 3바 + 달성율 1라인, `DivisionChartDataItem` 인터페이스 (target, actual, backlog, achievementRate, achievementRateWithBacklog) | ✅ |

### 5-7. 데이터 훅 확장 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/hooks/useDashboardData.ts` (재작성) | 16개 프로퍼티 `UseDashboardDataOptions` 인터페이스, KPI 계산(실적/달성율/수주잔액/예상실적/YoY 성장율), 월별 트렌드, 제품군별/산업군별/부문별 차트 데이터 생성, `profitTarget ?? 0` 타입 안전 처리 | ✅ |

### 5-8. 오케스트레이터 + barrel export ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/components/SolutionBusinessDashboard.tsx` (재작성) | usePeriodSelector, useBacklogData, useUploadDate 통합, 헤더에 ViewToggle + PeriodSelector + 업로드 기준일, 9카드 KPI + 4차트 섹션 렌더링 | ✅ |
| `src/features/dashboard/index.ts` (재작성) | 새 컴포넌트/훅 barrel export (ProductGroupChart, IndustryGroupChart, PeriodSelector, usePeriodSelector, useBacklogData, useUploadDate) | ✅ |

### 5-9. 테스트 업데이트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/__tests__/dashboard.test.ts` (재작성) | TopProductsChart → ProductGroupChart/IndustryGroupChart, 새 훅 export 테스트 추가 | ✅ |
| `src/features/dashboard/__tests__/useDashboardData.test.ts` (재작성) | 12개 테스트: KPI(sales/profit/achievementRate/backlog/YoY), monthlyTrend, productGroupChartData, industryGroupChartData, divisionChartData, empty data | ✅ |

---

## 갭 분석 수정 (Phase 5 보완) ✅

> 갭 분석 결과: 82% → 수정 후 재검증

### G-04. Firestore 보안 규칙 추가 (Critical) ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `firestore.rules` (수정) | 7개 컬렉션 규칙 추가: `industry_groups`, `product_group_targets`, `backlog/{year}` (+3 서브컬렉션), `reports/{reportId}/industry_group_data` | ✅ |

### G-01. 수주잔액 지난달 필터링 활성화 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dataInput/hooks/useDataInput.ts` (수정) | `parseBacklogExcel(buffer, false)` → `true` 변경 | ✅ |

### G-02. 제품군별 달성율 연동 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/components/SolutionBusinessDashboard.tsx` (수정) | `productGroupTargetByGroup` state 추가, 제품군별 개별 목표 집계 후 전달 | ✅ |
| `src/features/dashboard/hooks/useDashboardData.ts` (수정) | `productGroupTargetByGroup` 인터페이스 추가, `achievementRate: 0` → 실제 달성율 계산 | ✅ |

### G-03. 산업군 전년도 실적 로딩 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/components/SolutionBusinessDashboard.tsx` (수정) | `prevIndustryGroupData` state 추가, 전년 `getIndustryGroupData` 호출 | ✅ |
| `src/features/dashboard/hooks/useDashboardData.ts` (수정) | `prevIndustryGroupData` 인터페이스 추가, 전년도 산업군별 집계 + 성장율 계산 | ✅ |

### C-01. 누적 수주잔액 계산 수정 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/features/dashboard/components/MonthlyTrendChart.tsx` (수정) | 누적 모드에서 수주잔액 누적 제거 → 당월 수주잔액만 표시 | ✅ |

---

## Phase 6: 산업군별 보고서 ✅

> 부문별 보고서와 동일한 구성으로 데이터만 산업군별 데이터로 생성

### 6-1. 타입 추가 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/types/report.ts` (수정) | `IndustryGroupSummary` 인터페이스 (industryGroupName, totalSales, totalCost, totalProfit, periodBreakdown), `IndustryGroupReportFilter` 인터페이스 (year, periodType, industryGroupName?) | ✅ |

### 6-2. 색상 팔레트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/constants/colors.ts` (수정) | `INDUSTRY_GROUP_COLORS` 12색 (emerald-teal-cyan 계열) 추가 | ✅ |

### 6-3. 데이터 훅 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/hooks/useIndustryGroupReport.ts` (신규) | `useDivisionReport` 패턴 복제, `getIndustryGroups()` + `getIndustryGroupData()` + `getOrCreateReport()` 조합, `IndustryGroupSummary[]` 기간별 집계, 매출액 내림차순 정렬 | ✅ |

### 6-4. 컴포넌트 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/components/reports/IndustryGroupReportFilterBar.tsx` (신규) | 연도/기간유형/산업군 필터 바 (ReportFilterBar 패턴) | ✅ |
| `src/components/reports/IndustryGroupCharts.tsx` (신규) | DualAxisChart(산업군별 매출+매출이익률) + PieChart(비중) + 월별 추이 Modal (DivisionCharts 패턴) | ✅ |
| `src/components/reports/IndustryGroupSummaryTable.tsx` (신규) | 기간별 매출/매입/매출이익 테이블 + 정렬 + 합계 footer (DivisionSummaryTable 패턴) | ✅ |

### 6-5. 페이지 & 라우팅 ✅

| 파일 | 작업 | 상태 |
|------|------|------|
| `src/pages/IndustryGroupReportPage.tsx` (신규) | Factory 아이콘 + '산업군별 보고서' 헤더, ViewToggle, KPICardGrid(3카드), IndustryGroupCharts, IndustryGroupSummaryTable | ✅ |
| `src/router.tsx` (수정) | `/industry-group-reports` 라우트 추가 (React.lazy, SuspenseWrapper) | ✅ |
| `src/components/layout/Sidebar.tsx` (수정) | navItems에 '산업군별 보고서' + Factory 아이콘 추가 | ✅ |

---
