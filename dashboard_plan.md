# 대시보드 리팩토링 및 설정 기능 확장 계획

> **작성일**: 2026-03-02
> **상태**: 계획 완료 — Phase 0부터 착수
> **원본 요구사항**: `dashboard_refator.md`
> **참조 파일**: `dashboard.pdf` (UI 설계), `산업군 분류.xlsx`, `제품별 구분 및 목표_2026.xlsx`, 수주잔액 엑셀 3종

## Context

`dashboard_refator.md`에 명시된 5개 대규모 기능을 구현하는 프로젝트입니다.
현재 HSR 시스템에는 산업군, 수주잔액, 제품군, 제품군별 목표 개념이 없으며, 대시보드도 이에 맞춰 리팩토링이 필요합니다.

---

## 참조 데이터 분석 결과

### A. 산업군 분류 (10개 — `산업군 분류.xlsx`)

| 산업군 | 매칭 키워드 (엑셀 데이터의 항목) |
|--------|-------------------------------|
| 공공 | 공공기관, 공기업, 부,청 |
| 지자체 | 지자체 |
| 국방 | 국방 |
| 금융 | 금융(공공), 금융(기업), 1금융, 2금융 |
| 기업 | 기업 |
| 한전 | 본사, 발전자회사, 전력그룹사 |
| 방산 | 방산 |
| 교육/병원 | 교육, 병원 |
| 유지보수 | *_MA (제품명이 _MA로 끝나는 항목)|
| 기타 | 변경필요 (위에 해당하지 않는 나머지) |

### B. 제품군 분류 (11개 — `제품별 구분 및 목표_2026.xlsx`)

| 제품군 | 소속 제품명 |
|--------|------------|
| i-oneNet | i-oneNet, i-oneNet UC |
| i-oneNet DD/DX | i-oneNet DX, i-oneNet DD |
| NGS | NGS |
| i-oneNAC & Safe IP | i-oneNAC, Safe IP |
| i-oneJTac | i-oneJTac |
| CamPASS | CamPASS |
| i-Spector | i-Spector |
| MoBiCa | MoBiCa, ViSiCa |
| Cloud (NGS, ION, Jtac) | NGS CLOUD, i-oneNet CLOUD, i-oneJTac CLOUD |
| 기타 | 기타, Multi Anti Virus, S/W, KCDS-GUARD, OtoRAS |
| 유지보수 | *_MA (12개 제품) |

### C. 제품군별 분기 목표 (단위: 원)

| 제품군 | Q1 매출 | Q2 매출 | Q3 매출 | Q4 매출 | Q1 이익 | Q2 이익 | Q3 이익 | Q4 이익 |
|--------|---------|---------|---------|---------|---------|---------|---------|---------|
| i-oneNet | 1,615M | 3,805M | 2,685M | 7,545M | 985M | 1,995M | 1,465M | 3,855M |
| i-oneNet DD/DX | 850M | 1,750M | 1,300M | 3,400M | 186M | 423M | 305M | 856M |
| NGS | 190M | 430M | 310M | 870M | 310M | 670M | 490M | 1,330M |
| i-oneNAC & Safe IP | 132M | 264M | 198M | 506M | 156M | 362M | 234M | 598M |
| i-oneJTac | 60M | 120M | 90M | 230M | 28M | 55M | 41M | 106M |
| CamPASS | 48M | 96M | 72M | 184M | 66M | 132M | 99M | 253M |
| i-Spector | 48M | 96M | 72M | 184M | 7M | 14M | 11M | 28M |
| MoBiCa | 72M | 144M | 108M | 276M | 25M | 50M | 38M | 97M |
| Cloud | 525M | 525M | 425M | 425M | 500M | 500M | 400M | 400M |
| 유지보수 | 840M | 1,680M | 1,260M | 3,220M | 768M | 1,536M | 1,152M | 2,944M |
| 기타 | 252M | 354M | 428M | 916M | 203M | 280M | 391M | 656M |
| **합계** | **4,632M** | **9,264M** | **6,948M** | **17,756M** | **3,234M** | **6,018M** | **4,626M** | **11,122M** |

### D. 수주잔액 엑셀 파일 구조 (3종)

**1) 제품별 잔액** (`제품별 잔액.xlsx`)
- 시트명: `'26_70%~80%단계 매출금액 제품별`
- 구조: Row 2 = 월 헤더 (2월~12월 2026 + 전체), Row 3 = 컬럼 유형 (매출액 합계, 매입액 합계, 매출이익)
- 데이터: Row 4~ = 제품명별 월별 매출/매입/이익 (25개 제품)
- 마지막 행 = "전체" 합계
- 월당 3컬럼: 매출액 합계 | 매입액 합계 | 매출이익

**2) 부문별 잔액** (`부문별 잔액.xlsx`)
- 시트명: `'26_70%~80%단계 매출금액 부문별`
- 구조: 동일 패턴, 월당 4컬럼: 매출액 합계 | 매입액 합계 | 매출이익 | 달성율
- 부문: 공공사업부, 금융기업사업부, 서비스사업팀, 솔루션사업본부, 융합사업부

**3) 산업군별 잔액** (`산업군별 잔액.xlsx`)
- 시트명: `'26년_70%~80% 인더스트리별`
- 구조: 2단계 분류 — "매출코드" 섹션 + "유지보수코드" 섹션
  - **매출코드**: 신규 매출 (제품 판매) 데이터
  - **유지보수코드**: 유지보수 매출 데이터 (동일한 산업군 키워드로 분류)
  - **산업군별 합계 = 매출코드 부분합 + 유지보수코드 부분합** (두 섹션을 산업군 키워드별로 합산)
- 분류 키: `[거래처]고객구분(중)` = 산업군 분류의 매칭 키워드와 동일
- 월당 3컬럼: 매출액 합계 | 매입액 합계 | 매출이익
- 각 섹션 "부분합" + 전체 "전체" 합계

---

## 대시보드 UI 설계 분석 (`dashboard.pdf`)

### 페이지 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│ 매출 현황 (1월~3월)                  [매출액 보기][매출이익 보기][동기화됨] │
│ [2026년 v] [월별] [분기별] [반기별] [연간]    데이터 업로드 기준 일자: ...  │
├─────────────────────────────────────────────────────────────────┤
│ ■ 실적 종합 비교 현황                                              │
│                                                                 │
│ ○ 실시간 매출 현황 (5카드)                                         │
│ [실적 1,428] [연간달성율 5.7%] [수주잔액] [연간예상실적] [연간달성율(예측)] │
│                                                                 │
│ ○ 전년 대비 현황 (4카드)                                           │
│ [전년실적] [기간대비 성장율] [전년연간실적] [연간대비 성장율(예측)]        │
├─────────────────────────────────────────────────────────────────┤
│ ■ 월별 실적 및 예측 현황               [누적실적][월별실적]             │
│ 바: 2025실적(회색) + 2026실적(남색) + 2026수주잔액(베이지)              │
│ 라인: 2026목표대비 달성율(남색) + 2025실적대비 성장율(주황)              │
│ 툴팁: 25년실적, 25년대비성장율, 26년실적, 수주잔액, 목표대비달성율       │
├─────────────────────────────────────────────────────────────────┤
│ ■ 주요 제품군별 실적 순위 현황                                      │
│ 동일 바/라인 패턴 — X축: 제품군 (2026 실적 높은순 정렬)                │
├─────────────────────────────────────────────────────────────────┤
│ ■ 주요 산업군별 누적 실적 순위 현황                                   │
│ 동일 바/라인 패턴 — X축: 산업군 (2026 실적 높은순 정렬)                │
├─────────────────────────────────────────────────────────────────┤
│ ■ 부문별 매출이익 목표 및 실적 / 달성율                               │
│ 바: 2026목표(베이지) + 2026실적(남색) + 2026수주잔액(연한색)            │
│ 라인: 2026목표대비 달성율(남색) ← 라인 1개만                          │
│ 툴팁: 25년실적, 25년대비성장율, 26년실적, 수주잔액, 목표대비달성율       │
└─────────────────────────────────────────────────────────────────┘
```

### 기간 선택 동작 규칙
- 실적 데이터: 선택한 기간의 통계 값 적용
- 수주잔액: 선택한 기간+1 ~ 12월까지
- 전년도 데이터: 선택한 연도 - 1

### 차트 공통 패턴 (4개 차트 모두 동일)
- Y축 좌: 백만원 (바 차트)
- Y축 우: % (라인 차트)
- 툴팁: 25년 실적, 25년대비 성장율, 26년 실적, 수주잔액, 목표대비 달성율
- 바 위에 수치 레이블 표시

---

## Phase 0: 공통 인프라

### 0-1. 새 타입 정의

| 파일 | 작업 |
|------|------|
| `src/types/industryGroup.ts` (신규) | `IndustryGroup` { id, name, keywords: string[], sortOrder }, `IndustryGroupInput` |
| `src/types/backlog.ts` (신규) | `BacklogProductData` { product, months: Record<string, MonthData> }, `BacklogMeta` { year, uploadedAt, fileName, monthsIncluded } |
| `src/types/productTarget.ts` (신규) | `ProductGroupTarget` { year, quarter, productGroup, salesTarget, profitTarget } — **제품군 단위 목표** |
| `src/types/product.ts` (수정) | `ProductMaster`에 `productGroup?: string` 필드 추가 |
| `src/types/core.ts` (수정) | `ProductData`에 `industryGroupId?: string` 필드 추가 |
| `src/types/report.ts` (수정) | `DashboardPeriodSelection` { periodType, year, month?, quarter?, halfYear? } 추가 |
| `src/types/index.ts` (수정) | 새 타입 파일 barrel export 추가 |

### 0-2. 공통 유틸리티

| 파일 | 작업 |
|------|------|
| `src/utils/backlogUtils.ts` (신규) | `filterFutureMonths()`, `combineActualAndBacklog()`, `calculateExpectedPerformance()` |
| `src/utils/industryGroupMapper.ts` (신규) | 키워드 기반 산업군 매칭 로직 — 엑셀 데이터의 "항목" → 산업군 매핑 |

### 0-3. 공유 차트 모듈

| 파일 | 작업 |
|------|------|
| `src/features/dashboard/components/shared/PerformanceTooltip.tsx` (신규) | 5개 항목 공통 툴팁: 25년실적, 성장율, 26년실적, 수주잔액, 달성율 |
| `src/features/dashboard/components/shared/PeriodSelector.tsx` (신규) | 연간/반기/분기/월별 기간 선택 + 연도 드롭다운 |
| `src/features/dashboard/components/shared/DualBarLineChart.tsx` (신규) | 공통 차트 래퍼: 바 3개 + 라인 2개 패턴 재사용 |

---

## Phase 1: 산업군 관리 (Feature 1)

### 1-1. Firestore
- 새 컬렉션: `industry_groups/{groupId}`
```
{
  name: string,           // "공공", "금융" 등
  keywords: string[],     // ["공공기관", "공기업", "부,청"]
  sortOrder: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```
- `firestore.rules`에 `industry_groups` 규칙 추가
- **기본 시드 데이터**: 위 분석 결과의 10개 산업군 + 키워드

### 1-2. 서비스
- `src/firebase/services/industryGroupService.ts` (신규)
  - `divisionService.ts` 패턴 — CRUD + `seedDefaultIndustryGroups()`
  - `matchIndustryGroup(keyword, groups)` — 키워드로 산업군 ID 찾기

### 1-3. Feature 모듈
- `src/features/industryGroupManagement/` (신규)
  - `hooks/useIndustryGroupManagement.ts` — CRUD + 키워드 편집
  - `components/IndustryGroupList.tsx` — 산업군 목록 (키워드 태그 표시)
  - `components/IndustryGroupAddForm.tsx` — 산업군 추가 (이름 + 키워드 입력)
  - `index.ts`

### 1-4. 페이지 & 라우팅
- `src/pages/admin/IndustryGroupManagementPage.tsx` (신규)
- `src/router.tsx` — `/admin/industry-groups` (React.lazy, adminOnly)
- `src/components/layout/Sidebar.tsx` — adminItems에 '산업군 관리' 추가

---

## Phase 2: 제품 마스터 수정 + 제품군별 목표 (Features 3 & 4)

### 2-1. 제품 마스터에 제품군 필드 추가 (Feature 3)
- `src/firebase/services/productMasterService.ts` — `productGroup` 필드 CRUD 지원 + `batchUpdateProductGroups()`
- `src/features/productManagement/` — 제품군 필터/입력/표시 추가
- **초기 데이터 로드**: 위 분석 결과의 11개 제품군 매핑을 기존 products_master에 일괄 적용

### 2-2. 제품군별 목표 관리 (Feature 4 — 제품군 단위, 개별 제품 아님)

**중요**: 엑셀 분석 결과, 목표는 **제품군(11개) 단위**임 (개별 제품 아님)

**Firestore**: `product_group_targets/{year}-{quarter}-{productGroup}`
```
{
  year: number,
  quarter: 'Q1'~'Q4',
  productGroup: string,     // "i-oneNet", "NGS" 등 제품군명
  salesTarget: number,      // 매출 목표 (원)
  profitTarget: number,     // 매출이익 목표 (원)
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

| 파일 | 작업 |
|------|------|
| `src/firebase/services/productGroupTargetService.ts` (신규) | CRUD + batchUpsert |
| `src/features/productGroupTargetInput/` (신규) | 제품군(행) × Q1~Q4(열) 매트릭스 — 매출/이익 동시 입력 |
| `src/pages/admin/ProductGroupTargetInputPage.tsx` (신규) | TargetInputPage 패턴 |
| `src/router.tsx` | `/admin/product-group-targets` 라우트 추가 |
| `src/components/layout/Sidebar.tsx` | '제품군별 목표 관리' 추가 |

- **초기 데이터 로드**: 위 분석 결과의 분기별 목표 데이터 일괄 입력 기능

---

## Phase 3: 수주잔액 데이터 업로드 (Feature 2-2)

### 3-1. Firestore
- `backlog/{year}` (메타) + `backlog/{year}/products/{docId}` (제품별)
- `backlog/{year}/divisions/{docId}` (부문별)
- `backlog/{year}/industry_groups/{docId}` (산업군별)

### 3-2. 서비스
- `src/firebase/services/backlogService.ts` (신규)
  - `saveBacklogProducts(year, data)` — 제품별 잔액 저장
  - `saveBacklogDivisions(year, data)` — 부문별 잔액 저장
  - `saveBacklogIndustryGroups(year, data)` — 산업군별 잔액 저장
  - `getBacklogProducts(year)`, `getBacklogDivisions(year)`, `getBacklogIndustryGroups(year)`

### 3-3. 엑셀 파서 (3종)
- `src/utils/backlogExcelParser.ts` (신규)
  - **제품별 파서**: 시트명 `제품별` 감지, 월당 3컬럼(매출/매입/이익), Row 2 월 헤더 파싱, Row 3 컬럼유형, Row 4~ 제품 데이터
  - **부문별 파서**: 시트명 `부문별` 감지, 월당 4컬럼(+달성율)
  - **산업군별 파서**: 시트명 `인더스트리별` 감지, "매출코드"/"유지보수코드" 2개 섹션을 산업군 키워드별로 합산 (부분합/전체 행 제외)
- 핵심 로직: 지난 달 데이터 무시 — 현재월 또는 현재+1 ~ 12월만 저장
- **재사용**: 수주잔액 파일과 실적 파일의 엑셀 구조가 동일 (기존 `excelParser.ts` 패턴 재사용)

> **운영 참고**: 실적 데이터(90~100% 단계)와 수주잔액 데이터(70~80% 단계)는 설정 > 데이터관리에서 매주 업로드하여 갱신. 동일 파서 구조이므로 시트명/파일 유형으로 자동 분류 가능.

### 3-4. 업로드 통합
- `src/features/dataInput/` — 업로드 타입에 `'backlog-product'`, `'backlog-division'`, `'backlog-industry'` 추가
- 또는 단일 `'backlog'` 타입으로 시트명 자동 감지하여 3종 자동 분류

---

## Phase 4: 산업군별 데이터 업로드 (Feature 2-1)

### 4-1. 동작 방식
- 기존 제품별/부문별 엑셀 업로드와 동일 패턴에 "산업군별 데이터" 버튼 추가
- 엑셀의 데이터 항목(고객구분) 컬럼을 산업군 분류의 키워드와 매칭하여 산업군 ID 자동 할당
- `industry_groups` 컬렉션의 keywords 배열 기반 매칭

### 4-2. Firestore
- `reports/{year}/industry_group_data/{docId}` 서브컬렉션
```
{
  industryGroupId: string,
  industryGroupName: string,
  months: Record<string, { sales: number, cost: number }>,
  updatedAt: timestamp
}
```

### 4-3. 서비스 & 파서
- `src/firebase/services/industryGroupDataService.ts` (신규)
- `src/utils/industryGroupExcelParser.ts` (신규)
- `src/features/dataInput/` — uploadType에 `'industryGroup'` 추가

---

## Phase 5: 대시보드 리팩토링 (Feature 5)

### 5-1. 공통 기반
| 항목 | 파일 | 작업 |
|------|------|------|
| 매출/이익 토글 | 기존 `useViewMode` + `ViewToggle` | **변경 없음** |
| 기간 선택기 | `usePeriodSelector.ts` + `PeriodSelector.tsx` | 연간/반기/분기/월별, localStorage |
| 업로드 기준일 | `useUploadDate.ts` (신규) | uploadHistory 최신 일자 |

### 5-2. KPI 카드 (2행 — 9카드)

**1행: 실시간 매출 현황 (5카드)**
| # | KPI | 계산 |
|---|-----|------|
| 1 | 실적 | 선택 기간의 매출(or 이익) 합계 (백만원) |
| 2 | 연간 달성율 | 연간 제품군별 목표 합계 대비 실적 (%) |
| 3 | 수주잔액 | 선택기간+1~12월 수주잔액 총합 (백만원) |
| 4 | 연간 예상 실적 | 실적 + 수주잔액 (백만원) |
| 5 | 연간 달성율(예측) | 연간 목표 대비 예상 실적 (%) |

**2행: 전년 대비 현황 (4카드)**
| # | KPI | 계산 |
|---|-----|------|
| 1 | 전년 실적 | 전년도 같은 기간 실적 합계 (백만원) |
| 2 | 기간 대비 성장율 | (당년 실적 - 전년 실적) / 전년 실적 × 100 (%) |
| 3 | 전년 연간 실적 | 전년도 연간 전체 실적 (백만원) |
| 4 | 연간 대비 성장율(예측) | (당년 예상 실적 - 전년 연간 실적) / 전년 연간 실적 × 100 (%) |

### 5-3. 차트 섹션 (4개)

**차트 1: 월별 실적 및 예측 현황**
- 토글: [누적 실적] [월별 실적]
- 바: 2025실적(회색) + 2026실적(남색) + 2026수주잔액(베이지)
- 라인: 목표달성율(남색) + 전년성장율(주황)
- X축: 1월~12월

**차트 2: 주요 제품군별 실적 순위 현황**
- 바: 2025실적 + 2026실적 + 2026수주잔액
- 라인: 목표달성율 + 전년성장율
- X축: 11개 제품군 (2026 실적 높은 순)

**차트 3: 주요 산업군별 누적 실적 순위 현황**
- 바: 2025실적 + 2026실적 + 2026수주잔액
- 라인: 목표달성율 + 전년성장율
- X축: 10개 산업군 (2026 실적 높은 순)

**차트 4: 부문별 매출이익 목표 및 실적 / 달성율**
- 바: 2026목표(베이지) + 2026실적(남색) + 2026수주잔액(연한색)
- 라인: 목표달성율(남색) ← 1개만
- X축: 영업부문

### 5-4. 데이터 훅

| 파일 | 작업 |
|------|------|
| `src/features/dashboard/hooks/useBacklogData.ts` (신규) | 수주잔액 3종(제품별/부문별/산업군별) fetch + 집계 |
| `src/features/dashboard/hooks/useDashboardData.ts` (수정) | 기간 필터, 제품군/산업군 집계, 수주잔액 통합, KPI 9개 계산 |
| `src/features/dashboard/hooks/usePeriodSelector.ts` (신규) | 기간 선택 상태 관리 |

### 5-5. 컴포넌트 수정/생성

| 파일 | 작업 |
|------|------|
| `DashboardKPICards.tsx` (수정) | 2행 9카드 레이아웃 (5 + 4) |
| `MonthlyTrendChart.tsx` (수정) | 누적/월별 토글, 바 3개 + 라인 2개 |
| `ProductGroupChart.tsx` (신규) | 제품군별 실적 순위 |
| `IndustryGroupChart.tsx` (신규) | 산업군별 누적 실적 순위 |
| `DivisionOverviewChart.tsx` (수정) | 목표 + 실적 + 수주잔액 + 달성율 |

### 5-6. 오케스트레이터
- `SolutionBusinessDashboard.tsx` — 헤더 (ViewToggle + PeriodSelector + 기준일) + KPI 2행 + 차트 4개

---

## Firestore 신규 컬렉션 요약

| 컬렉션 | 용도 | 문서 ID |
|--------|------|---------|
| `industry_groups/{id}` | 산업군 마스터 (10개) | auto |
| `product_group_targets/{id}` | 제품군별 분기 목표 | `{year}-{quarter}-{productGroup}` |
| `backlog/{year}` | 수주잔액 메타 | 연도 |
| `backlog/{year}/products/{id}` | 수주잔액 제품별 | auto |
| `backlog/{year}/divisions/{id}` | 수주잔액 부문별 | auto |
| `backlog/{year}/industry_groups/{id}` | 수주잔액 산업군별 | auto |
| `reports/{year}/industry_group_data/{id}` | 산업군별 실적 집계 | auto |

---

## 의존성 및 착수 순서

```
Phase 0 (공통 인프라) ───┐
    │                    │
    ├── Phase 1 (산업군 관리 CRUD)
    │                    │
    ├── Phase 2 (제품군 필드 + 제품군별 목표)
    │                    │
    ├── Phase 3 (수주잔액 업로드 — 3종 파서)
    │                    │
    ├── Phase 4 (산업군별 데이터 업로드)
    │                    │
    └── Phase 5 (대시보드 리팩토링)
```

**모든 Phase 즉시 착수 가능** — 필요한 파일이 모두 제공됨

---

## 검증 방법

1. `npm run build` — 타입 에러 0건 확인
2. `npm run test` — 새 feature 모듈별 테스트
3. `npm run dev` — 각 admin 페이지 CRUD 동작 확인
4. 수주잔액 엑셀 업로드 → 대시보드 KPI/차트 반영 확인
5. 기간 선택 변경 → 데이터 집계 정합성 확인

---

## 핵심 재사용 파일 참조

| 패턴 | 참조 파일 |
|------|-----------|
| Feature 모듈 | `src/features/divisionManagement/` |
| Service CRUD | `src/firebase/services/targetService.ts` |
| 목표 매트릭스 | `src/features/targetInput/hooks/useTargetMatrix.ts` |
| 엑셀 파서 | `src/utils/excelParser.ts`, `src/utils/divisionExcelParser.ts` |
| 대시보드 데이터 | `src/features/dashboard/hooks/useDashboardData.ts` |
| 차트 컴포넌트 | `src/features/dashboard/components/` |
| YoY 비교 | `src/hooks/useYoYReport.ts`, `src/utils/yoyUtils.ts` |

---

## Phase 9: 달성율 페이지 제품군별 탭 추가

### 9-1. 배경
- 달성율 페이지(`AchievementPage.tsx`)는 **부문별(Division)** 목표 달성 현황만 표시
- **제품군별(Product Group)** 목표 달성 현황도 동일한 KPI/차트/테이블 형태로 추가 필요
- 탭 UI로 부문별/제품별 전환

### 9-2. 신규: `useProductGroupAchievement` 훅
- `useAchievement`와 동일한 패턴의 제품군별 달성 현황 계산 훅
- **데이터 소스:**
  - 목표: `getProductGroupTargetsByYear(year)` → `ProductGroupTarget[]`
  - 실적: `getReport(year)` → `getProducts(reportId)` → `ProductData[]`
  - 매핑: `PRODUCT_GROUP_MAPPING` (제품명 → 제품군)
- **계산 로직:**
  1. 제품군별 목표 합산 (선택 기간의 분기 필터링)
  2. ProductData를 PRODUCT_GROUP_MAPPING으로 제품군별 그룹핑
  3. 선택 기간 월의 sales/profit(=sales-cost) 합산
  4. 달성율 = (실적 / 목표) × 100
  5. `TargetAchievement[]` 형태로 반환 (기존 인터페이스 재사용)
- **반환값:** `useAchievement`와 동일 구조 (achievements, totalSalesTarget, totalActualSales, overallRate 등)

### 9-3. 수정: AchievementCharts / AchievementTable
- `entityLabel?: string` prop 추가 (기본값: `'부문'`)
- 차트 제목/테이블 헤더: `부문별` → `{entityLabel}별`
- 첫 번째 열 헤더: `영업부문` → `{entityLabel === '제품군' ? '제품군' : '영업부문'}`

### 9-4. 수정: AchievementPage
- **탭 상태:** `activeTab: 'division' | 'product'`
- **탭 UI:** Filter Bar 아래에 탭 버튼 2개 ("부문별 달성", "제품별 달성")
- **데이터 훅:** `useAchievement` + `useProductGroupAchievement` 병렬 호출
- **조건부 렌더링:** 활성 탭에 따라 KPI/차트/테이블 데이터 소스 전환
- **동기화:** 연도/기간 변경 시 양쪽 훅 모두 반영

### 9-5. 기존 코드 재사용

| 항목 | 파일 | 재사용 방식 |
|------|------|-------------|
| `TargetAchievement` 타입 | `src/types/target.ts` | 그대로 사용 (`divisionName`에 제품군명 할당) |
| `PRODUCT_GROUP_MAPPING` | `src/firebase/services/productMasterService.ts` | 제품→제품군 매핑 |
| `PRODUCT_GROUPS` | `src/firebase/services/productMasterService.ts` | 전체 제품군 목록 |
| `getProductGroupTargetsByYear` | `src/firebase/services/productGroupTargetService.ts` | 목표 데이터 조회 |
| `AchievementCharts` / `AchievementTable` | `src/components/achievement/` | entityLabel prop 추가 후 재사용 |

---

## Phase 10: 대시보드 툴팁 실적+수주잔액 합산 표시

### 10-1. 수정: PerformanceTooltip
- 기존 3항목(전년 실적, 당년 실적, 수주잔액) 아래에 구분선 + **실적+수주잔액** 합산 행 추가
- 당년 실적과 수주잔액이 모두 존재할 때만 표시
- 색상: `text-slate-800` (강조)
