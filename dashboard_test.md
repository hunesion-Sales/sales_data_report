# 대시보드 리팩토링 테스트 결과

> **시작일**: 2026-03-02

---

## Phase 0: 공통 인프라

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.30s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| Vite 빌드 | ✅ 성공 | 번들 정상 생성 |

### 수정 이력
- `DualBarLineChart.tsx`: LabelList formatter 타입 `(v: number)` → `(v: any)` 수정 (Recharts 타입 호환)

---

## Phase 1: 산업군 관리

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.04s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| 코드 분할 | ✅ 정상 | `IndustryGroupManagementPage-D0YhozO-.js` (12.31 KB) 별도 청크 |
| 라우팅 등록 | ✅ 확인 | `/admin/industry-groups` adminOnly |
| 사이드바 메뉴 | ✅ 확인 | Factory 아이콘 + '산업군 관리' |

### 생성 파일 수
- 서비스: 1개 (industryGroupService.ts)
- Feature 모듈: 5개 (hooks 1 + components 3 + index 1)
- 페이지: 1개 (IndustryGroupManagementPage.tsx)
- 기존 수정: 2개 (router.tsx, Sidebar.tsx)

---

## Phase 2: 제품 마스터 수정 + 제품군별 목표

### Phase 2-1 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 4.81s |
| TypeScript 타입 에러 | 0건 | |
| 제품군 컬럼 추가 | ✅ | ProductTable에 제품군 표시 |
| 일괄 매핑 함수 | ✅ | 32개 제품 → 11개 제품군 |

### Phase 2-2 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 4.82s |
| 코드 분할 | ✅ | `ProductGroupTargetInputPage-DvlWbxEI.js` (10.22 KB) |
| 매트릭스 입력 UI | ✅ | 11 제품군 × 4분기, 매출+이익 동시 입력 |
| 연간 합계 계산 | ✅ | 분기별/제품군별/전체 합계 |
| 라우팅 | ✅ | `/admin/product-group-targets` adminOnly |

---

## Phase 3: 수주잔액 데이터 업로드

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 4.82s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| DataInputPage 청크 | ✅ | 33.31 KB → 38.78 KB (수주잔액 코드 포함) |
| 수주잔액 업로드 버튼 | ✅ | UploadTypeSelector에 '수주잔액' 추가 |
| 병합모드 숨김 | ✅ | 수주잔액 선택 시 MergeModeSelector 비표시 |

### 수정 이력
- `BacklogMeta.uploadedAt/uploadedBy/fileName` → optional 변경 (saveBacklogMeta에서 serverTimestamp 자동 설정)

### 생성 파일 수
- 서비스: 1개 (backlogService.ts)
- 파서: 1개 (backlogExcelParser.ts)
- 기존 수정: 5개 (UploadTypeSelector, useDataInput, MergeModeSelector, DataInputPage, backlog.ts)

---

## Phase 4: 산업군별 데이터 업로드

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 4.84s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| DataInputPage 청크 | ✅ | 38.78 KB → 42.60 KB (산업군 파서 코드 포함) |
| 산업군 업로드 버튼 | ✅ | UploadTypeSelector에 '산업군별 데이터' 추가 |
| 2섹션 파싱 | ✅ | 매출코드(산업군별) + 유지보수코드(→유지보수 합산) |

### 생성 파일 수
- 서비스: 1개 (industryGroupDataService.ts)
- 파서: 1개 (industryGroupExcelParser.ts)
- 기존 수정: 3개 (UploadTypeSelector, useDataInput, DataInputPage)

---

## Phase 5: 대시보드 리팩토링

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.28s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| `npm run test` | ✅ 성공 | 14 files, 89 tests passed (2.71s) |
| 메인 번들 | ✅ | `index-9VeeYxgU.js` (826.91 KB, gzip 254.43 KB) |
| DataInputPage 청크 | ✅ | 40.62 KB (산업군+수주잔액 업로드 코드 포함) |

### 수정 이력
- `useDashboardData.ts`: `ach.target.profitTarget` → `ach.target.profitTarget ?? 0` (optional 타입 안전 처리)
- `dashboard.test.ts`: `TopProductsChart` → `ProductGroupChart`/`IndustryGroupChart`, 새 훅 export 테스트 추가 (9개 테스트)
- `useDashboardData.test.ts`: 전면 재작성 — 새 API 기반 12개 테스트 (KPI, 차트 데이터, YoY, empty data)

### 새 테스트 목록 (useDashboardData.test.ts — 12개)

| 테스트 | 검증 내용 |
|--------|-----------|
| `kpiData actual (sales mode)` | 매출 합계 = 4,550,000 |
| `kpiData actual (profit mode)` | 이익 합계 = 1,920,000 |
| `achievementRate correctly` | 연간 달성율 = 45.5% |
| `backlog in expectedPerformance` | 예상실적 = 실적 + 수주잔액 |
| `YoY growth rate` | 전년 대비 성장율 계산 |
| `monthRangeText` | "1월~2월" 포맷 |
| `12 monthly trend data points` | 12개 월별 데이터 생성 |
| `monthly trend currentActual` | 1월=1,600,000, 2월=2,950,000 |
| `productGroupChartData sorted` | 당년실적 내림차순 정렬 |
| `industryGroupChartData` | 산업군 집계 및 정렬 |
| `divisionChartData` | 부문별 목표/실적/달성율 |
| `empty data gracefully` | 빈 데이터 안전 처리 |

### 신규 파일 수
- 훅: 3개 (usePeriodSelector, useBacklogData, useUploadDate)
- 컴포넌트: 2개 (ProductGroupChart, IndustryGroupChart)
- 재작성: 4개 (DashboardKPICards, MonthlyTrendChart, DivisionOverviewChart, useDashboardData)
- 오케스트레이터: 2개 (SolutionBusinessDashboard, dashboard/index.ts)
- 테스트: 2개 (dashboard.test.ts, useDashboardData.test.ts)

---

## 갭 분석 수정 결과

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.57s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| `npm run test` | ✅ 성공 | 14 files, 89 tests passed (2.96s) |

### 수정 항목 (5건)

| 갭 ID | 심각도 | 수정 내용 | 상태 |
|--------|:------:|-----------|:----:|
| G-04 | Critical | Firestore 보안 규칙 7개 컬렉션 추가 | ✅ |
| G-01 | Major | 수주잔액 지난달 필터링 `true` 활성화 | ✅ |
| G-02 | Major | 제품군별 달성율 실제 계산 연동 | ✅ |
| G-03 | Major | 산업군 전년도 실적 데이터 로딩 + YoY 성장율 | ✅ |
| C-01 | Major | 누적 모드 수주잔액 당월만 표시 (누적 제거) | ✅ |

### 예상 Match Rate 변동

| 카테고리 | 수정 전 | 수정 후 |
|----------|:-------:|:-------:|
| Feature 1 (산업군 관리) | 95% | 95% |
| Feature 2 (데이터 관리) | 92% | 98% |
| Feature 3 (제품 마스터) | 95% | 95% |
| Feature 4 (제품군 목표) | 95% | 95% |
| Feature 5 (대시보드) | 88% | 96% |
| Firestore 보안 규칙 | 25% | 95% |
| **Overall** | **82%** | **~96%** |

---

## Phase 6: 산업군별 보고서

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.26s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| `npm run test` | ✅ 성공 | 14 files, 89 tests passed (2.72s) |
| 코드 분할 | ✅ 정상 | `IndustryGroupReportPage-D5omUKT3.js` (14.81 KB) 별도 청크 |
| 라우팅 등록 | ✅ 확인 | `/industry-group-reports` |
| 사이드바 메뉴 | ✅ 확인 | Factory 아이콘 + '산업군별 보고서' |

### 생성 파일 수
- 타입: `IndustryGroupSummary`, `IndustryGroupReportFilter` (`report.ts`에 추가)
- 색상: `INDUSTRY_GROUP_COLORS` 12색 (`colors.ts`에 추가)
- 훅: 1개 (`useIndustryGroupReport.ts`)
- 컴포넌트: 3개 (`IndustryGroupReportFilterBar`, `IndustryGroupCharts`, `IndustryGroupSummaryTable`)
- 페이지: 1개 (`IndustryGroupReportPage.tsx`)
- 기존 수정: 2개 (`router.tsx`, `Sidebar.tsx`)

### 수주잔액 분리 업로드 확인

| 항목 | 결과 | 비고 |
|------|------|------|
| 별도 버튼 필요 여부 | ❌ 불필요 | 기존 "수주잔액" 단일 버튼으로 3종 처리 |
| 자동 감지 방식 | ✅ 시트명 기반 | `제품별`/`부문별`/`산업군별` 키워드 |
| 제품별 저장 | ✅ | `backlog/{year}/products/` |
| 부문별 저장 | ✅ | `backlog/{year}/divisions/` |
| 산업군별 저장 | ✅ | `backlog/{year}/industry_groups/` |

---

## Phase 7: 데이터 입력 개선 및 매핑 로직

### 빌드 테스트

| 항목 | 결과 | 비고 |
|------|------|------|
| `npm run build` | ✅ 성공 | 5.05s |
| TypeScript 타입 에러 | 0건 | tsc -b 통과 |
| `npm run test` | ✅ 성공 | 14 files, 89 tests passed (3.13s) |
| DataInputPage 청크 | ✅ | 42.28 KB (산업군 매핑 로직 포함) |
| ProductGroupTargetInputPage 청크 | ✅ | 11.38 KB (엑셀 가져오기 + 숫자 포맷 포함) |
| IndustryGroupManagementPage 청크 | ✅ | 12.75 KB (엑셀 가져오기 포함) |

### 주요 변경 사항

| 항목 | 설명 | 상태 |
|------|------|------|
| 업로드 통합 | 4버튼 → 2버튼 (시트명 자동 감지) | ✅ |
| 제품군 목표 엑셀 | Import 버튼 + ExcelJS 파싱 | ✅ |
| 숫자 포맷 | FormattedInput (포커스/블러 콤마 포맷) | ✅ |
| 산업군 엑셀 | Import 버튼 + writeBatch 일괄 생성 | ✅ |
| 산업군 매핑 | mapToIndustryGroups() — 키워드 매칭 → 합산 | ✅ |
| Firestore ID 수정 | `/` → `_` 치환 (DD/DX 제품군) | ✅ |
| 쿼리 최적화 | orderBy 제거 → 클라이언트 정렬 | ✅ |

### 수정 이력

- `productGroupTargetService.ts`: `getDocId()`에서 `productGroup.replace(/\//g, '_')` 추가 (i-oneNet DD/DX 문서 ID 오류 수정)
- `productGroupTargetService.ts`: `getProductGroupTargetsByYear()`에서 `orderBy` 제거, 클라이언트 사이드 `QUARTER_ORDER` 정렬로 변경
- `ProductGroupTargetTable.tsx`: `FormattedInput` 컴포넌트 추가 (focus: raw number, blur: comma formatted)
- `useDataInput.ts`: `mapToIndustryGroups()` — 산업군 키워드 매칭 후 동일 산업군 합산 (정확 매칭 → 키워드 매칭 → "기타" 폴백)

### 산업군 매핑 검증 결과 (14개 고객구분 → 10개 산업군)

| 고객구분 (raw) | 매핑된 산업군 |
|----------------|---------------|
| 공공기관, 공기업 | 공공 |
| 2금융, 보험, 금융 | 금융 |
| 국방 | 국방 |
| 대기업 | 대기업 |
| 중견기업 | 중견기업 |
| 중소기업 | 중소기업 |
| 외자기업 | 외자기업 |
| 부,청 | 중앙부처 |
| 클라우드 | 클라우드 |
| 유지보수 (섹션 합산) | 유지보수 |

---
