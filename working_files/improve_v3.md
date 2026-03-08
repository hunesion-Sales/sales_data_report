# 보고서 트렌드 차트 추가 + 기간 세부선택 기능 (Phase 11)

> **작성일**: 2026-03-08
> **최종 업데이트**: 2026-03-08
> **상태**: **구현 완료**
> **목적**: 보고서 페이지(제품별/부문별/산업군별)에 월별 트렌드 차트 추가 및 기간 필터 세부선택(분기/반기/월 다중 선택) 기능 도입

---

## 배경 및 문제점

1. 대시보드에는 "월별 매출이익 및 예측현황" 차트(전년실적/당년실적/수주잔액 3개 막대)와 PeriodSelector(분기별/반기별 세부 선택)가 있지만, 보고서 페이지에는 없음
2. 보고서 페이지의 기간 필터에서 분기별/반기별 선택 시 세부 분기/반기를 선택할 수 없어, 특정 분기만 보고 싶을 때 불편
3. 보고서 페이지에 전년 대비 트렌드를 시각적으로 확인할 차트가 없어, 분석 능력이 제한적

---

## 구현 순서 (의존성 기반)

| Phase | 항목 | 상태 | 비고 |
|-------|------|------|------|
| 11-1 | 타입 확장 (ReportFilter, IndustryGroupReportFilter) | **완료** | 기반 타입 |
| 11-2 | periodUtils 헬퍼 추가 (getFilteredPeriodInfoList) | **완료** | 유틸리티 |
| 11-3 | 필터바 세부선택 UI (ReportFilterBar, IndustryGroupReportFilterBar) | **완료** | UI 컴포넌트 |
| 11-4 | 보고서 훅/페이지에 세부 기간 필터링 적용 | **완료** | 데이터 필터링 |
| 11-5 | 전년도 데이터 훅 (Division, IndustryGroup) | **완료** | 트렌드 차트 데이터 |
| 11-6 | 트렌드 데이터 훅 + 차트 컴포넌트 | **완료** | 차트 인프라 |
| 11-7 | 각 보고서 페이지에 트렌드 차트 통합 | **완료** | 최종 통합 |

---

## Part 1: 기간 세부선택 기능

### 1-1. 타입 확장

`ReportFilter`와 `IndustryGroupReportFilter`에 세부 기간 선택 필드 추가:

- `months?: number[]` — 월별 선택 시 (1~12, 다중 선택)
- `quarters?: Quarter[]` — 분기별 선택 시 (Q1~Q4, 다중 선택)
- `halfYears?: HalfYear[]` — 반기별 선택 시 (H1/H2, 다중 선택)

대시보드 `DashboardPeriodSelection`과 동일한 패턴 재사용.

### 1-2. periodUtils 헬퍼

`getFilteredPeriodInfoList()` 함수 추가:
- 기존 `getPeriodInfoList()` 결과를 세부 선택 기준으로 필터링
- 세부 선택이 없으면 전체 반환 (기존 동작 유지)
- monthly → selectedMonths로 필터, quarterly → selectedQuarters로 필터, semi-annual → selectedHalfYears로 필터, annual → 항상 전체

### 1-3. 필터바 세부선택 UI

대시보드 `PeriodSelector` 컴포넌트의 세부 기간 선택 UI를 ReportFilterBar/IndustryGroupReportFilterBar에 통합:
- 월별: 1월~12월 버튼 (다중 선택, indigo-600 활성 색상)
- 분기별: 1분기~4분기 버튼 (다중 선택)
- 반기별: 상반기/하반기 버튼 (다중 선택)
- 연간: 세부 선택 없음
- 기간 유형 변경 시 세부 선택 자동 초기화

### 1-4. 보고서 훅/페이지 세부 기간 적용

- `useDivisionReport`: `getPeriodInfoList` → `getFilteredPeriodInfoList` 전환
- `useIndustryGroupReport`: 동일 전환
- `ProductReportPage`: `filteredMonths` 계산에 세부 기간 반영

---

## Part 2: 보고서별 트렌드 차트 추가

### 2-1. 전년도 데이터 훅

- `usePreviousYearDivisionData(year)`: 전년도 `division_data` 서브컬렉션에서 부문별 데이터 fetch
- `usePreviousYearIndustryGroupData(year, industryGroups)`: 전년도 `industry_group_data`에서 산업군별 데이터 fetch + 산업군 설정 기준 재분류(remapping)
- 제품별은 기존 `useYoYReport(year, true)` 재사용

### 2-2. 트렌드 데이터 훅 (`useReportTrendData`)

범용 트렌드 데이터 생성 훅:
- 입력: 당년 항목별 월 데이터, 전년 항목별 월 데이터, 수주잔액 항목별 월 데이터, 선택 항목명, 연도, 뷰모드
- 출력: `MonthlyTrendDataItem[]` (12개월)
- 각 월별 전년실적 + 당년실적 + 수주잔액 계산
- '전체' 선택 시 모든 항목 합산, 특정 항목 선택 시 해당 항목만

### 2-3. 트렌드 차트 컴포넌트 (`ReportTrendChart`)

- 대시보드 `MonthlyTrendChart`와 동일한 형태
- `DualBarLineChart` 재사용 (3개 막대: 전년실적/당년실적/수주잔액, lineCount=0)
- 누적/월별 토글
- 항목 선택 드롭다운 (제품/부문/산업군)
- 차트 제목: "{prefix} 월별 {매출액|매출이익} 및 예측 현황 - {선택 항목명}"
- `React.memo` 적용

### 2-4. 각 보고서 페이지 통합

| 페이지 | 항목 드롭다운 | 전년도 데이터 | 수주잔액 데이터 |
|--------|-------------|-------------|---------------|
| ProductReportPage | 제품명 (mainData 기준) | `useYoYReport` | `useBacklogData.products` |
| DivisionReportPage | 부문명 (divisionItems 기준) | `usePreviousYearDivisionData` | `useBacklogData.divisions` |
| IndustryGroupReportPage | 산업군명 (dataItems 기준) | `usePreviousYearIndustryGroupData` | `useBacklogData.industryGroupsData` |

트렌드 차트 배치 위치: KPICardGrid 아래, 기존 차트 위

---

## 수정 파일 목록

| 파일 | 작업 | 유형 |
|------|------|------|
| `src/types/report.ts` | ReportFilter, IndustryGroupReportFilter 타입 확장 | 수정 |
| `src/utils/periodUtils.ts` | `getFilteredPeriodInfoList` 헬퍼 추가 | 수정 |
| `src/components/reports/ReportFilterBar.tsx` | 세부 기간 선택 UI 추가 | 수정 |
| `src/components/reports/IndustryGroupReportFilterBar.tsx` | 세부 기간 선택 UI 추가 | 수정 |
| `src/hooks/useDivisionReport.ts` | 세부 기간 필터링 적용 + divisionItems 반환 | 수정 |
| `src/hooks/useIndustryGroupReport.ts` | 세부 기간 필터링 적용 | 수정 |
| `src/hooks/usePreviousYearDivisionData.ts` | 전년도 부문 데이터 fetch | **신규** |
| `src/hooks/usePreviousYearIndustryGroupData.ts` | 전년도 산업군 데이터 fetch | **신규** |
| `src/hooks/useReportTrendData.ts` | 트렌드 차트 데이터 생성 | **신규** |
| `src/components/reports/ReportTrendChart.tsx` | 보고서용 트렌드 차트 | **신규** |
| `src/pages/ProductReportPage.tsx` | 트렌드 차트 + 세부 기간 적용 | 수정 |
| `src/pages/DivisionReportPage.tsx` | 트렌드 차트 + 세부 기간 적용 | 수정 |
| `src/pages/IndustryGroupReportPage.tsx` | 트렌드 차트 + 세부 기간 적용 | 수정 |

---

## 재사용 기존 컴포넌트/유틸

- `DualBarLineChart` — 대시보드 공통 차트 컴포넌트 (3막대+라인)
- `MonthlyTrendDataItem` — 트렌드 데이터 인터페이스
- `getMonthsInYear`, `getMonthsInQuarter`, `getMonthsInHalfYear` — periodUtils
- `useYoYReport` — 제품별 전년도 데이터
- `useBacklogData` — 수주잔액 데이터 (제품/부문/산업군)
- `DASHBOARD_BAR_COLORS`, `DASHBOARD_LINE_COLORS` — colors.ts
- `DashboardPeriodSelection` 타입 패턴 — 세부 기간 선택 필드 구조
