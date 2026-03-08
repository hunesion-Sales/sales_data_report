# Gap Detector Agent Memory

## Project: HSR (Huni Sales Report System)
- Stack: React 19.2 + TypeScript 5.9 + Vite 7.2 + Firebase 12.9 + Tailwind CSS 3.4
- Architecture: Dynamic level (features/, hooks/, services/, types/, lib/)

## Key Finding: Firestore Rules Gap (2026-03-02)
- Previously: industry_groups, backlog, product_group_targets had NO security rules
- As of 2026-03-03: product_group_targets now has rules (firestore.rules:298-320)
- industry_groups also has rules (firestore.rules:275-293)
- backlog also has rules (firestore.rules:325-352)
- Catch-all `allow read, write: if false` still exists as safety net

## Dashboard Refactoring Analysis (2026-03-02)
- Overall match rate: 82% (below 90% threshold)
- 4 major gaps: Firestore rules (critical), past month filtering, product group achievement rates, industry group YoY data
- 5 added features not in design: YoY KPI cards, growth rate lines, seed/reset, migration utils
- Design doc: `dashboard_refator.md` (root), Analysis: `docs/03-analysis/dashboard.analysis.md`

## productGroupAchievement Analysis (2026-03-03)
- Overall match rate: 97% (PASSES 90% threshold)
- All 7 verification points passed
- Only deviation: console.error vs logger.error (pre-existing pattern)
- Firestore rules for product_group_targets confirmed present
- Good pattern: useProductGroupAchievement mirrors useAchievement structure exactly
- Future opportunity: shared base hook extraction (~70% code overlap)
- Analysis: `docs/03-analysis/productGroupAchievement.analysis.md`

## Convention Notes
- Uses `console.error` in some hooks instead of `logger.error` (convention violation)
  - Affected: useAchievement.ts, useProductGroupAchievement.ts
- Shared chart module `DualBarLineChart` reused across 4 chart sections (good pattern)
- Feature modules follow hooks + components + barrel + tests structure
- entityLabel prop pattern: optional string with default '부문', used for dynamic labels
