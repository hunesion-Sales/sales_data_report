# Dashboard Refactoring - Design-Implementation Gap Analysis Report

> **Summary**: Comprehensive gap analysis between `dashboard_refator.md` design specification and actual implementation for all 5 features of the dashboard refactoring project.
>
> **Author**: gap-detector (automated)
> **Created**: 2026-03-02
> **Last Modified**: 2026-03-02
> **Status**: Review

---

## Analysis Overview

- **Analysis Target**: Dashboard Refactoring (5 Features)
- **Design Document**: `/Volumes/hclim_SSD/sales_data_weekly/sales-data-weekly/dashboard_refator.md`
- **Implementation Path**: `src/` (multiple modules)
- **Analysis Date**: 2026-03-02

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Feature 1: Industry Group Management | 95% | OK |
| Feature 2: Data Management (Upload) | 92% | OK |
| Feature 3: Product Master (Product Group) | 95% | OK |
| Feature 4: Product Group Targets | 95% | OK |
| Feature 5: Dashboard Refactoring | 88% | WARN |
| Firestore Security Rules | 25% | CRITICAL |
| **Overall** | **82%** | WARN |

---

## Feature 1: Industry Group Management

### Design Requirements

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 1-1 | Industry group CRUD (Create/Read/Update/Delete) | OK | `src/firebase/services/industryGroupService.ts` |
| 1-2 | Keyword-based industry group assignment from data items | OK | `src/utils/industryGroupMapper.ts` + `KeywordTags.tsx` |
| 1-3 | Statistics by assigned industry group (sales, cost, profit) | OK | `useDashboardData.ts` industryGroupChartData |
| 1-4 | Admin menu entry: Settings > Industry Group Management | OK | `Sidebar.tsx:51` `/admin/industry-groups` |
| 1-5 | Route `/admin/industry-groups` with admin-only protection | OK | `router.tsx:127-135` |

### Assessment: 95% Match

**Strengths:**
- Full CRUD with Firestore service layer (`getIndustryGroups`, `createIndustryGroup`, `updateIndustryGroup`, `deleteIndustryGroup`)
- Keyword-based matching mechanism with `KeywordTags` component for editable tag management
- Seed/reset functionality (`seedDefaultIndustryGroups`, `resetToDefaultIndustryGroups`)
- Feature module structure follows project conventions (`features/industryGroupManagement/` with hooks + components + barrel index)

**Minor Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Statistics display | "Statistics by assigned industry group" | Statistics are shown on dashboard IndustryGroupChart but not on the management page itself | Minor | Low -- statistics are accessible via the dashboard |

---

## Feature 2: Data Management (Upload)

### Feature 2-1: Industry Group Data Upload

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 2-1a | "Industry Group Data" button in data upload | OK | `UploadTypeSelector.tsx:15` - `industryGroup` type |
| 2-1b | Excel parser for industry group data | OK | `src/utils/industryGroupExcelParser.ts` |
| 2-1c | Firestore service for industry group data | OK | `src/firebase/services/industryGroupDataService.ts` |
| 2-1d | Upload logic integration in useDataInput | OK | `useDataInput.ts:117-126` - `industryGroup` branch |
| 2-1e | 2-section parsing (sales code + maintenance code) | OK | `industryGroupExcelParser.ts:90-137` |
| 2-1f | Maintenance section auto-classified as "maintenance" | OK | `industryGroupExcelParser.ts:115` |

### Feature 2-2: Backlog Data Upload

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 2-2a | "Backlog" button in data upload | OK | `UploadTypeSelector.tsx:16` - `backlog` type |
| 2-2b | 3-type support: product/division/industry group backlog | OK | `backlogExcelParser.ts` - auto-detects type from sheet name |
| 2-2c | Past month data ignored | PARTIAL | `backlogExcelParser.ts:141-145` - `filterPastMonths` param exists but called with `false` at `useDataInput.ts:85` |
| 2-2d | Separate database for backlog | OK | `backlogService.ts` - `backlog/{year}/` collection |
| 2-2e | Backlog data used for dashboard KPI | OK | `useBacklogData.ts` -> `useDashboardData.ts` |
| 2-2f | Firestore service (save/query per type) | OK | `backlogService.ts` - `saveBacklogProducts/Divisions/IndustryGroups` |

### Assessment: 92% Match

**Gaps Found:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Past month filtering | "Past month data should be ignored" | `filterPastMonths` is `false` when called in `useDataInput.ts:85`. The param exists in the parser but is not activated. | Major | Past month backlog data will be stored rather than filtered out. |
| Merge mode for industry group upload | Follows existing patterns | Uses report-level `mergeMode` state which works for `overwrite`/`merge`/`smart`, but only `overwrite` and `merge` paths are implemented in `industryGroupDataService.ts`. Smart mode falls through to merge. | Minor | Functionally acceptable; smart mode should ideally have its own logic. |

---

## Feature 3: Product Master Management (Product Group)

### Design Requirements

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 3-1 | Product group assignment (32 products -> 11 groups) | OK | `productMasterService.ts:301-336` `PRODUCT_GROUP_MAPPING` |
| 3-2 | Product group field in product master | OK | `productMasterService.ts` `productGroup` field, `ProductTable.tsx:36-37` column |
| 3-3 | Batch update button for product group assignment | OK | `ProductManagementPage.tsx:133-147` "Product Group Batch Apply" button |
| 3-4 | Product group list (11 unique groups) | OK | `productMasterService.ts:341-353` `PRODUCT_GROUPS` |
| 3-5 | Dashboard statistics use product group | OK | `useDashboardData.ts:174-218` productGroupChartData uses `PRODUCT_GROUP_MAPPING` |

### Assessment: 95% Match

**Minor Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Product group display in table | Shows product group column | Column is read-only in `ProductTable.tsx:57,92-99`. Cannot edit product group per-product; only batch update. | Minor | Batch update covers the use case, but individual editing would be more flexible. |

---

## Feature 4: Product Group Target Setting

### Design Requirements

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 4-1 | Same pattern as division target management | OK | `useProductGroupTargetMatrix.ts` mirrors `useTargetMatrix.ts` pattern |
| 4-2 | Product group x quarterly target matrix | OK | `ProductGroupTargetTable.tsx` - 11 groups x Q1-Q4 matrix |
| 4-3 | Sales target + profit target per cell | OK | `ProductGroupTargetInput` type with `salesTarget` + `profitTarget` |
| 4-4 | Firestore service with batch upsert | OK | `productGroupTargetService.ts:58-81` `batchUpsertProductGroupTargets` |
| 4-5 | Route `/admin/product-group-targets` | OK | `router.tsx:137-145` |
| 4-6 | Sidebar menu entry | OK | `Sidebar.tsx:55` "Product Group Targets" |
| 4-7 | Year selector | OK | `ProductGroupTargetInputPage.tsx:91-99` |
| 4-8 | View mode toggle (sales/profit/both) | OK | `ProductGroupTargetInputPage.tsx:103-121` |

### Assessment: 95% Match

**Minor Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Annual total display | Expected per-group annual totals | Implemented in `ProductGroupTargetTable.tsx:112-125` and grand total row. All correct. | -- | -- |
| Connection to dashboard KPI | Target data should flow to dashboard | `SolutionBusinessDashboard.tsx:92-104` fetches `productGroupTargetTotal` and passes to `useDashboardData` for KPI calculation. Fully connected. | -- | -- |

---

## Feature 5: Dashboard Refactoring

### Feature 5-1: Common Criteria

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-1a | Sales/Profit toggle changes entire dashboard data | OK | `ViewToggle.tsx` + `viewMode` passed to all charts and `useDashboardData` |
| 5-1b | Data upload reference date display | OK | `useUploadDate.ts` -> `SolutionBusinessDashboard.tsx:172-176` |
| 5-1c | Year/Monthly/Quarterly/Semi-annual selection | OK | `usePeriodSelector.ts` + `PeriodSelector.tsx` with all 4 period types |

### Feature 5-2: Real-time Sales KPI

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-2a | Performance (period sales/profit sum, millions) | OK | `DashboardKPICards.tsx:59-67` Card 1 |
| 5-2b | Annual achievement rate (annual target vs performance %) | OK | `DashboardKPICards.tsx:69-79` Card 2 |
| 5-2c | Backlog total (millions) | OK | `DashboardKPICards.tsx:81-89` Card 3 |
| 5-2d | Expected annual performance (performance + backlog) | OK | `DashboardKPICards.tsx:91-99` Card 4 |
| 5-2e | Predicted achievement rate (target vs expected %) | OK | `DashboardKPICards.tsx:101-111` Card 5 |

**Additional KPI cards (not in design):**
- Card 6: Previous year performance (same period)
- Card 7: Period growth rate (YoY)
- Card 8: Previous year annual performance
- Card 9: Predicted annual growth rate

These 4 additional KPI cards are **added features** not specified in the design (Yellow items).

### Feature 5-4: Monthly Performance and Forecast

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-4a | Cumulative/Monthly toggle | OK | `MonthlyTrendChart.tsx:26,49-66` |
| 5-4b | Cumulative: prev month + current month + backlog | OK | `MonthlyTrendChart.tsx:29-40` reduce accumulation |
| 5-4c | Monthly: current month + backlog | OK | `MonthlyTrendChart.tsx:41` raw data pass-through |
| 5-4d | 2025 (prev year) + 2026 (current year) + backlog monthly display | OK | `useDashboardData.ts:130-171` monthlyTrendData with prevYearActual + currentActual + backlog |
| 5-4e | Achievement rate: annual target vs monthly cumulative actual | OK | `useDashboardData.ts:159` achievementRate calculation |
| 5-4f | Hover shows performance, backlog, achievement rate | OK | `PerformanceTooltip.tsx` shared tooltip |

**Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Cumulative backlog calculation | "prev month cumulative + current actual + current backlog" | In cumulative mode, backlog is also accumulated (`prev?.backlog ?? 0) + item.backlog`), which means each month adds ALL previous months' backlog values rather than showing only the current month's backlog added to the running total. | Major | Cumulative backlog display may show inflated values. The design implies only the current month's actual should be added to the running total with the current month's backlog. |

### Feature 5-5: Product Group Performance Ranking

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-5a | X-axis: product groups, sorted by 2026 performance (descending) | OK | `useDashboardData.ts:218` `.sort((a, b) => b.currentActual - a.currentActual)` |
| 5-5b | Per-group: 2025 actual + 2026 actual + backlog | OK | `useDashboardData.ts:174-218` |
| 5-5c | Shared tooltip/hover module from 5-4 | OK | `ProductGroupChart.tsx` uses `DualBarLineChart` which uses `PerformanceTooltip` |

**Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Achievement rate per product group | "Achievement rate like 5-4" | `achievementRate: 0` hardcoded at `useDashboardData.ts:214` with comment "product group targets to be connected later" | Major | Product group achievement rate always shows 0%. Per-product-group target data exists in `productGroupTargetService` but is not yet broken down and connected to individual product groups. Only the total is used for KPI cards. |

### Feature 5-6: Industry Group Cumulative Performance Ranking

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-6a | X-axis: industry groups, sorted by 2026 performance (descending) | OK | `useDashboardData.ts:255` `.sort((a, b) => b.currentActual - a.currentActual)` |
| 5-6b | Per-group: 2025 actual + 2026 actual + backlog | PARTIAL | `useDashboardData.ts:248` `prevYearActual: 0` -- previous year data is always 0 |
| 5-6c | Shared tooltip/hover module from 5-4 | OK | `IndustryGroupChart.tsx` uses `DualBarLineChart` |

**Gap:**

| Item | Design | Implementation | Severity | Impact |
|------|--------|----------------|:--------:|--------|
| Previous year industry group data | "2025 actual + 2026 actual" | `prevYearActual: 0` at line 248, with comment "Previous year industry group data not available". Only current year data from `industryGroupData`. | Major | Industry group chart lacks YoY comparison. Previous year industry group data would need to be loaded similarly (e.g., `getIndustryGroupData(report-2025)`). |
| Achievement rate for industry groups | "Achievement rate like 5-4" | `achievementRate: 0` hardcoded. No industry-group-level target system exists. | Minor | No target system for industry groups was specified in the design either, so this may be acceptable. |

### Feature 5-7: Division Performance and Achievement

| # | Requirement | Status | Implementation Location |
|---|-------------|:------:|------------------------|
| 5-7a | "Performance only" / "Performance + Backlog" toggle | OK | `DivisionOverviewChart.tsx:27,42-59` `includeBacklog` state |
| 5-7b | X-axis: divisions (existing layout maintained) | OK | Division names from `divisionAchievements` |
| 5-7c | Per-division: actual + backlog graph | OK | `useDashboardData.ts:259-279` divisionChartData with actual + backlog |
| 5-7d | Toggle changes achievement rate | OK | `DivisionOverviewChart.tsx:35` switches between `achievementRate` and `achievementRateWithBacklog` |

### Assessment: 88% Match

---

## Firestore Security Rules Gap (Critical)

### Missing Collection Rules

The following collections are used in the implementation but have **no corresponding Firestore security rules** in `firestore.rules`:

| Collection Path | Used By | Severity |
|-----------------|---------|:--------:|
| `industry_groups/{groupId}` | `industryGroupService.ts` | CRITICAL |
| `backlog/{year}` | `backlogService.ts` | CRITICAL |
| `backlog/{year}/products/{docId}` | `backlogService.ts` | CRITICAL |
| `backlog/{year}/divisions/{docId}` | `backlogService.ts` | CRITICAL |
| `backlog/{year}/industry_groups/{docId}` | `backlogService.ts` | CRITICAL |
| `product_group_targets/{docId}` | `productGroupTargetService.ts` | CRITICAL |
| `reports/{reportId}/industry_group_data/{docId}` | `industryGroupDataService.ts` | CRITICAL |

**Impact**: The catch-all rule at `firestore.rules:277-279` (`allow read, write: if false;`) will **deny all access** to these collections in production. This means:

1. Industry group management (Feature 1) will fail with permission denied errors
2. Backlog data upload and retrieval (Feature 2-2) will fail
3. Product group target management (Feature 4) will fail
4. Industry group data upload and dashboard display (Features 2-1 & 5) will fail

**This is the single most critical gap in the entire implementation.**

---

## Shared Module Reuse Analysis

| Shared Module | Design Requirement | Implementation | Status |
|---------------|-------------------|----------------|:------:|
| `DualBarLineChart` | Common chart for 5-4, 5-5, 5-6, 5-7 | Used by `MonthlyTrendChart`, `ProductGroupChart`, `IndustryGroupChart`, `DivisionOverviewChart` | OK |
| `PerformanceTooltip` | Common hover tooltip for 5-4, 5-5, 5-6, 5-7 | Shared component used by `DualBarLineChart` for all 4 chart sections | OK |
| `PeriodSelector` | Year/Monthly/Quarterly/Semi-annual selection | Used in `SolutionBusinessDashboard.tsx` header area | OK |
| `ViewToggle` | Sales/Profit toggle changes dashboard data | `ViewToggle.tsx` passes `viewMode` to all charts and data hooks | OK |

All 4 specified shared modules are properly implemented and reused across chart sections as designed.

---

## Differences Summary

### Missing Features (Design exists, Implementation missing/incomplete)

| # | Item | Design Location | Description | Severity |
|---|------|-----------------|-------------|:--------:|
| G-01 | Past month backlog filtering | design:9 | `filterPastMonths` is called with `false`; past months are not filtered | Major |
| G-02 | Product group per-item achievement rate | design:44 | `achievementRate: 0` hardcoded in product group chart data | Major |
| G-03 | Industry group previous year data | design:47-48 | `prevYearActual: 0` for all industry groups; no YoY data loaded | Major |
| G-04 | Firestore rules for new collections | implied | 7 collection paths missing from `firestore.rules` | Critical |

### Added Features (Implementation exists, Design does not mention)

| # | Item | Implementation Location | Description | Severity |
|---|------|------------------------|-------------|:--------:|
| A-01 | 4 additional KPI cards (YoY comparison) | `DashboardKPICards.tsx:115-163` | Previous year actual, period growth rate, previous year annual, predicted growth rate | Info |
| A-02 | Growth rate line in charts | `DualBarLineChart.tsx:137-149` | Second line showing growth rate in monthly/product/industry charts | Info |
| A-03 | Industry group seed/reset functionality | `industryGroupService.ts:102-156` | Default industry group data initialization | Info |
| A-04 | Product type migration utilities | `productMasterService.ts:269-295` | `updateAllProductTypes()` migration function | Info |
| A-05 | `DashboardDetailModal` component | `features/dashboard/components/DashboardDetailModal.tsx` | Detail modal component (exported but not used in main dashboard) | Info |

### Changed Features (Design differs from Implementation)

| # | Item | Design | Implementation | Severity |
|---|------|--------|----------------|:--------:|
| C-01 | Cumulative backlog calculation | Monthly: actual + backlog per month | Cumulative mode also accumulates backlog across months | Major |
| C-02 | KPI target source | Design implies product-level targets | Uses `productGroupTargetTotal` (sum of product group targets) for annual target in KPI | Minor |

---

## Data Flow Verification

### Backlog Data Flow

```
Excel Upload -> backlogExcelParser.ts -> backlogService.ts (Firestore)
                                              |
                                              v
useBacklogData.ts -> backlogByMonth / backlogByProductGroup / backlogByDivision / backlogByIndustryGroup
                                              |
                                              v
useDashboardData.ts -> kpiData / monthlyTrendData / productGroupChartData / industryGroupChartData / divisionChartData
                                              |
                                              v
SolutionBusinessDashboard.tsx -> DashboardKPICards / MonthlyTrendChart / ProductGroupChart / IndustryGroupChart / DivisionOverviewChart
```

**Verdict**: Data flow is correctly wired from upload to dashboard display for all chart sections.

### Industry Group Data Flow

```
Excel Upload -> industryGroupExcelParser.ts -> industryGroupDataService.ts (Firestore reports/{year}/industry_group_data)
                                                        |
                                                        v
SolutionBusinessDashboard.tsx (useEffect) -> getIndustryGroupData(reportId)
                                                        |
                                                        v
useDashboardData.ts -> industryGroupChartData
                                                        |
                                                        v
IndustryGroupChart.tsx -> DualBarLineChart (shared)
```

**Verdict**: Data flow is correct but lacks previous year loading (G-03).

### ViewMode Toggle Flow

```
ViewToggle (sales/profit) -> viewMode state in SolutionBusinessDashboard
     |
     v
useDashboardData(viewMode) -> getValue() selects sales or (sales - cost) for profit
     |
     v
All chart data recalculated -> All chart components re-render
```

**Verdict**: ViewMode toggle correctly propagates to all 5 KPI cards and 4 chart sections.

---

## Architecture Compliance

| Check | Status | Details |
|-------|:------:|---------|
| Feature module structure | OK | `features/dashboard/` with hooks + components + barrel + tests |
| Shared component reuse | OK | `shared/DualBarLineChart`, `shared/PerformanceTooltip`, `shared/PeriodSelector` |
| React.memo optimization | OK | All 5 chart components wrapped in `React.memo` |
| Barrel exports | OK | `features/dashboard/index.ts` exports all public APIs |
| TypeScript types | OK | Domain types in `types/backlog.ts`, `types/industryGroup.ts`, `types/productTarget.ts`, `types/report.ts` |
| Naming conventions | OK | PascalCase components, camelCase hooks, UPPER_SNAKE_CASE constants |
| Logger usage | WARN | `console.error` used in some hooks instead of `logger.error` (e.g., `useIndustryGroupManagement.ts:44`) |

---

## Recommended Actions

### Immediate Actions (Critical)

**1. Add Firestore security rules for all new collections** (G-04)

The following rules must be added to `firestore.rules` before deployment:

```
- industry_groups/{groupId} - admin write, authenticated read
- backlog/{year} - admin/approved write, authenticated read
- backlog/{year}/products/{docId} - admin/approved write, authenticated read
- backlog/{year}/divisions/{docId} - admin/approved write, authenticated read
- backlog/{year}/industry_groups/{docId} - admin/approved write, authenticated read
- product_group_targets/{docId} - admin write, authenticated read
- reports/{reportId}/industry_group_data/{docId} - admin/approved write, authenticated read
```

Without these rules, all new features will return permission denied errors in production.

### High Priority Actions (Major)

**2. Enable past month filtering for backlog upload** (G-01)

In `src/features/dataInput/hooks/useDataInput.ts:85`, change:
```typescript
const result = await parseBacklogExcel(buffer, false);
// should be:
const result = await parseBacklogExcel(buffer, true);
```
Or make it configurable via a checkbox in the upload UI.

**3. Connect per-product-group achievement rates** (G-02)

In `src/features/dashboard/hooks/useDashboardData.ts`, the product group chart data currently hardcodes `achievementRate: 0`. The `productGroupTargetService` already stores per-group per-quarter targets. These should be fetched, aggregated per group, and passed to the chart data calculation.

**4. Load previous year industry group data** (G-03)

In `src/components/SolutionBusinessDashboard.tsx`, add a second `getIndustryGroupData()` call for the previous year:
```typescript
const prevReportId = `report-${selection.year - 1}`;
```
Then pass both current and previous year data to `useDashboardData`.

**5. Fix cumulative backlog calculation** (C-01)

In `src/features/dashboard/components/MonthlyTrendChart.tsx:35`, the cumulative mode accumulates backlog across months. The design specifies that each month should show `cumulative actual + current month backlog`, not cumulative backlog.

### Documentation Updates

**6. Update design document to include added features** (A-01, A-02)

The 4 additional YoY KPI cards and growth rate chart lines should be documented in the design specification.

**7. Replace `console.error` with `logger.error`**

Per project conventions, `logger.error` should be used instead of raw `console.error` in:
- `src/features/industryGroupManagement/hooks/useIndustryGroupManagement.ts`
- `src/features/productGroupTargetInput/hooks/useProductGroupTargetMatrix.ts`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-02 | Initial gap analysis | gap-detector |

---

## Related Documents

- Design: [dashboard_refator.md](../../dashboard_refator.md)
- Analysis: This document
