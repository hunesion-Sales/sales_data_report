# UI/UX 개선 기획서 (Phase 10)

> **작성일**: 2026-03-01
> **최종 업데이트**: 2026-03-01
> **상태**: **구현 완료**
> **목적**: 데이터 량 증가(12개월)에 따른 테이블 UI 개선, 차트 가독성 향상, 전년 동기 대비(YoY) 비교 기능 설계

---

## 구현 순서 (의존성 기반)

| Phase | 항목 | 상태 | 비고 |
|-------|------|------|------|
| 10-1 | 항목 4: 과거 연도 업로드 | **완료** | 기반 인프라 |
| 10-2 | 항목 5: 제품별 기간 필터링 + 항목 6-A: 훅 분리 | **완료** | |
| 10-3 | 항목 2: 차트 가독성 + 항목 1: 테이블 UI | **완료** | |
| 10-4 | 항목 3: YoY 비교 | **완료** | 가장 복잡, 전년 데이터 필요 |

---

## 1. 테이블 UI 개선 (Sticky Column + 분기별 그룹핑) -- **완료**

**배경 및 문제점**:
1월부터 12월까지 모든 월별 실적 데이터가 단일 테이블에 표시될 경우, 가로 스크롤이 불가피하게 길어지며 전체 데이터의 흐름을 한눈에 파악하기 힘듭니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| 좌측 컬럼 sticky | O (기존) | `sticky left-0 z-10` |
| 우측 Total 열 sticky | **O (신규)** | `sticky right-0/right-[100px]/right-[200px] z-[5]` |
| 분기별 그룹핑 | **O (신규)** | `enableQuarterGrouping` prop, `expandedQuarters` 상태 |
| Expand/Collapse | **O (신규)** | 분기 헤더 클릭으로 토글 |
| 전체 펼치기/접기 버튼 | **O (신규)** | `ChevronsDown`/`ChevronsRight` 아이콘 버튼 |

**수정 파일**: `ProductReportTable.tsx`, `ProductReportPage.tsx`

---

## 2. 막대 차트 가독성 향상 (총합 숫자 표시) -- **완료**

**배경 및 문제점**:
막대 그래프(Bar Chart) 특성상 분포 파악은 쉽지만 정확한 수치나 전체 규모를 직관적으로 파악하기 어렵습니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| 모든 차트 상단 수치 표시 | **O (신규)** | `Recharts`의 `LabelList` 활용하여 모든 막대 위 총합(백만원) 표시 |
| Y축 단위 라벨 | **O (신규)** | `YAxis label={{ value: '(백만원)' }}` |
| 툴팁 총계 표시 | **O (신규)** | 커스텀 Tooltip 컴포넌트, 하단에 총계 |

**수정 파일**: `ProductCharts.tsx`, `DivisionCharts.tsx`, `MonthlyTrendChart.tsx`, `DivisionOverviewChart.tsx`, `TopProductsChart.tsx`, `DashboardDetailModal.tsx`, `AchievementCharts.tsx`, `DualAxisChart.tsx`

---

## 3. 전년도 데이터 비교(YoY) 설계 및 UI 구성 -- **완료**

**배경 및 문제점**:
올해의 단편적인 실적만으로는 비즈니스 성장에 대한 체감과 유의미한 인사이트를 얻기 부족합니다. 과거 실적과 나란히 배치하여 비교 뷰를 제공해야 합니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| YoY 유틸리티 | **O (신규)** | `yoyUtils.ts` - calculateYoYRate, formatYoYRate, getYoYColorClass |
| 전년 데이터 병렬 조회 | **O (신규)** | `useYoYReport.ts` - year-1 자동 조회 |
| Dashboard KPI 뱃지 | **O (신규)** | 전년 값 + 증감률 뱃지 (매출/이익 카드) |
| 트렌드 비교 차트 | **O (신규)** | 전년도 투명 막대 오버레이 |
| 테이블 전년 비교 열 | **O (신규)** | `previousTotals` prop, 전년 총계 + 증감률 2열 |

**신규 파일**: `yoyUtils.ts`, `useYoYReport.ts`, `yoyUtils.test.ts`
**수정 파일**: `DashboardKPICards.tsx`, `MonthlyTrendChart.tsx`, `ProductReportTable.tsx`, `SolutionBusinessDashboard.tsx`

---

## 4. 과거 년도 (2025년) 데이터 업로드 지원 -- **완료**

**배경 및 문제점**:
현재 시스템의 데이터 입력 페이지(`useReportData.ts`)는 상수 `CURRENT_YEAR`(2026)에 의존하고 있어, 사용자가 2025년 형식의 엑셀 템플릿을 업로드하더라도 2026년 DB에 덮어써질 위험이 있습니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| CURRENT_YEAR 중앙화 | **O (신규)** | `appConfig.ts`에 `CURRENT_YEAR` + `VALID_YEAR_RANGE` |
| 엑셀 헤더 연도 추출 | **O (신규)** | `ParseResult.detectedYear`, months[0]에서 추출 |
| 연도 범위 검증 | **O (신규)** | 2020~2030 범위 벗어나면 `throw Error` |
| 올바른 연도 DB 저장 | **O (신규)** | `targetYear` 파라미터 전파 (saveUploadedData, analyzeUpload, saveWithConflictResolution) |
| 감지 연도 UI 뱃지 | **O (신규)** | DataInputPage에 초록/주황 뱃지 표시 |

**수정 파일**: `appConfig.ts`, `excelParser.ts`, `parse.ts`, `useReportData.ts`, `useReportUpload.ts`, `useReport.ts`, `useDataInput.ts`, `DataInputPage.tsx`

---

## 5. 제품별 보고서 - 기간 필터링 기능 추가 -- **완료**

**배경 및 문제점**:
부문별 보고서에는 상단에 "월별/분기별/반기별/연간" 탭을 제공하여 데이터 탐색이 용이하지만, 제품별 보고서(`ProductReportPage.tsx`)에는 이 기능이 누락되어 있습니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| ReportFilterBar 부착 | **O (신규)** | `divisions={[]}` 전달하여 부문 필터 숨김 |
| 기간 유형 탭 동작 | **O (신규)** | `getPeriodInfoList()` + `filteredMonths` useMemo |
| 연도 선택 | **O (신규)** | `getAvailableYears()` 기반 드롭다운 |
| 차트/테이블 기간 반응 | **O (신규)** | `filteredMonths` prop 전달 |

**수정 파일**: `ProductReportPage.tsx`

---

## 6. 설계 패턴 적용 (SRP, 공통 UI, 보안) -- **완료**

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| ProductReportPage 로직 분리 | **O (신규)** | `useProductReport.ts` 훅 추출 (mainData/cloudData/totals/cloudTotals) |
| YoY 병합 유틸리티 | **O (신규)** | `yoyUtils.ts` 순수 함수 분리 |
| 필터 바 재사용 | **O (신규)** | `ReportFilterBar` 그대로 재사용, divisions=[] |
| 업로드 연도 파싱 검증 | **O (신규)** | `VALID_YEAR_RANGE` 정규식 + 범위 검증 |

**신규 파일**: `useProductReport.ts`

---

## 7. 제품 마스터 데이터베이스 업데이트 및 마이그레이션 -- **완료**

**배경 및 문제점**:
신규 제품명 누락 및 기존 DB의 제품 유형 분류가 단순히 유지보수 여부(`isMaintenanceType`)로만 관리되어, 클라우드 등 다양한 제품 유형을 올바르게 필터링하고 분석하기 어려웠습니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| 제품군 유형 세분화 | **O (신규)** | `ProductType` 속성 도입 (`General`, `Cloud`, `Maintenance`) |
| 누락된 제품 DB 추가 | **O (신규)** | 제공된 목록을 반영해 누락된 제품 및 Cloud 명칭 등록 |
| 제품 자동 분류 로직 | **O (신규)** | 이름 내 `_MA`는 유지보수, `Cloud`는 클라우드로 자동 할당 |
| UI/마이그레이션 지원 | **O (신규)** | 시스템 관리자 화면에 동기화 및 마이그레이션 버튼 구축 |

**수정 파일**: `types/product.ts`, `productMasterService.ts`, `useProductManagement.ts`, `ProductAddForm.tsx`, `ProductTable.tsx`, `ProductManagementPage.tsx`

---

## 8. 차트 시각화 및 UX 세부 개선 -- **완료**

**배경 및 문제점**:
제품별 누락 막대 차트의 항목 순서가 정렬되지 않아 시각적 인지가 불편했으며, 부문별 보고서의 달성율 차트 색상이 단조롭고 차트 간 크기가 불일치하여 UI 완성도가 떨어졌습니다. 또한 X축 라벨이 길어질 경우 이름이 잘리는 문제가 있었습니다.

**구현 완료 항목**:

| 기획 항목 | 구현 상태 | 구현 내용 |
|-----------|-----------|-----------|
| 누적 막대 차트 정렬 | **O (신규)** | 매출액/이익 크기에 따라 내림차순 정렬되도록 데이터 전처리 (큰 값이 위로) |
| 차트 툴팁 정렬 | **O (신규)** | 마우스 오버 시 표시되는 툴팁 값 역시 내림차순 정렬 동기화 |
| 부문별 달성율 차트 색상 | **O (신규)** | 막대마다 `DIVISION_COLORS` 맵핑 (`Cell` 활용) |
| 부문별 달성율 범례(Legend) | **O (신규)** | 파이 차트와 동일하게 하단에 '색상 + 부문명 + (금액)' 표시하는 커스텀 범례 적용 |
| 그리드 및 차트 높이 통일 | **O (신규)** | DualAxisChart와 PieChart 모두 `height={400}` 적용 |
| X축 라벨 숨김 및 가독성 | **O (신규)** | 하단 커스텀 범례 표시로 인해 중복되는 X축 라벨(`tick={false}`) 제거로 깔끔한 여백 확보 |

**수정 파일**: `ProductCharts.tsx`, `DivisionCharts.tsx`, `DualAxisChart.tsx`
