# HSR 프로젝트 - 성능 개선 및 보안 강화 작업 내역

> **최종 업데이트**: 2026-02-23 (Phase 7 완료)

이 문서는 `improve.md` (계획)을 바탕으로 실제 수행된 개선 작업 내역을 기록합니다.
테스트 및 빌드 검증 결과는 `improve_test.md`를 참조하세요.

## 1. Phase 1: 보안 긴급 조치 + 코드 품질 — ✅ 완료 (2026-02-20)

### 1.1 작업 항목
| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 1 | 보안 | firebase.json 보안 헤더 추가 (CSP, Referrer, Permissions, HSTS) | firebase.json | ✅ 완료 |
| 2 | 보안 | 관리자 이메일 환경변수 이동 | authService.ts, .env | ✅ 완료 |
| 3 | 품질 | logger.ts 유틸리티 생성 + console.log/warn 31건 교체 | 8개 파일 | ✅ 완료 |
| 4 | 품질 | authService.ts 중복 주석 제거 | authService.ts | ✅ 완료 |

### 1.2 변경 요약
- `firebase.json`: CSP, Referrer-Policy, Permissions-Policy, HSTS 4개 보안 헤더 추가
- `authService.ts`: 하드코딩된 관리자 이메일 → `VITE_ADMIN_EMAIL` 환경변수로 이동, 중복 주석 제거
- `src/utils/logger.ts`: 환경 기반 로깅 유틸리티 신규 생성 (DEV 환경에서만 debug/info 출력)
- console.log/warn 31건 → logger.debug/logger.warn으로 교체 (8개 파일)
  - `excelParser.ts` (12건), `divisionExcelParser.ts` (5건), `useReport.ts` (6건)
  - `dbRepair.ts` (3건), `config.ts` (1건 삭제), `authService.ts` (1건)
  - `productService.ts` (1건), `reportService.ts` (1건), `AuthContext.tsx` (1건)

---

## 2. Phase 2: 성능 최적화 — 코드 분할 — ✅ 완료 (2026-02-20)

### 2.1 작업 항목
| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 5 | 성능 | React.lazy 라우트 기반 코드 분할 (7개 페이지) | router.tsx | ✅ 완료 |
| 6 | 성능 | Suspense fallback + LoadingSpinner 통합 | router.tsx | ✅ 완료 |

### 2.2 변경 요약
- `router.tsx`: 7개 페이지에 React.lazy + Suspense 적용 (DataInput, DivisionReport, ProductReport, Achievement, DivisionManagement, ProductManagement, UserManagement, TargetInput)
- `SuspenseWrapper` 컴포넌트 생성 (LoadingSpinner size="lg" + "페이지를 불러오는 중..." 메시지)
- 항상 로드: LoginPage, RegisterPage, SolutionBusinessDashboard (초기 화면)

---

## 3. Phase 3: 중복 제거 + 공통화 — ✅ 완료 (2026-02-20)

### 3.1 작업 항목
| 순서 | 영역 | 작업 | 영향 파일 | 상태 |
|------|------|------|----------|------|
| 7 | 중복 | colors.ts 상수 중앙화 | 4개 파일 | ✅ 완료 |
| 8 | 중복 | useNotification 훅 생성 | 3개 파일 | ✅ 완료 |
| 9 | 중복 | useViewMode 훅 + ViewToggle 통합 | 4개 파일 | ✅ 완료 |
| 10 | 중복 | KPICardGrid 공통 컴포넌트 | 2개 파일 | ✅ 완료 |

### 3.2 변경 요약
- `src/constants/colors.ts`: CHART_COLORS (12색), DIVISION_COLORS (10색), MONTH_COLORS (12월) 상수 중앙화
  - `ProductCharts.tsx`, `DivisionCharts.tsx`: 로컬 COLORS 제거 → 중앙 상수 import
  - `ProductReportTable.tsx`, `ProductReportPage.tsx`: 로컬 MONTH_COLORS 제거 → 중앙 상수 import
- `src/hooks/useNotification.ts`: showNotification 패턴 공통 훅으로 추출
  - `TargetInputPage.tsx`, `UserManagementPage.tsx`, `DataInputPage.tsx`: 로컬 구현 제거 → 훅 사용
- `src/hooks/useViewMode.ts`: viewMode 상태 관리 공통 훅
  - `SolutionBusinessDashboard.tsx`, `AchievementPage.tsx`, `DivisionReportPage.tsx`, `ProductReportPage.tsx`: useState 제거 → useViewMode 훅 사용
  - `ProductReportPage.tsx`: 인라인 토글 버튼 → ViewToggle 컴포넌트로 통일
- `src/components/common/KPICardGrid.tsx`: 공통 KPI 카드 그리드 컴포넌트
  - `DivisionReportPage.tsx`, `ProductReportPage.tsx`: 수동 KPI 마크업 → KPICardGrid 사용

---

## 4. Phase 4: 보안 강화 — ✅ 완료 (2026-02-20)

### 4.1 작업 항목
| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 11 | 보안 | Firestore 필드 검증 규칙 추가 | firestore.rules | ✅ 완료 |
| 12 | 보안 | 비밀번호 강도 검증 추가 | RegisterPage.tsx, passwordValidator.ts | ✅ 완료 |
| 13 | 보안 | 파일 업로드 검증 강화 (MIME, 크기, 매직 바이트) | DataInputPage.tsx, fileValidator.ts | ✅ 완료 |
| 14 | 보안 | 세션 비활동 타임아웃 (30분) | AuthContext.tsx | ✅ 완료 |
| 15 | 보안 | 클라이언트 로그인 시도 제한 | LoginPage.tsx | ✅ 완료 |

### 4.2 변경 요약
- `firestore.rules`: 주요 컬렉션에 필드 검증 함수 추가 (users, divisions, products_master, reports, targets, uploadHistory)
  - 필수 필드 존재 확인 (`hasAll`), 타입 검증 (`is string`, `is number`, `is map`)
  - 문자열 길이 제한, 열거형 값 검증 (`role in ['admin', 'user']`), 숫자 범위 검증
  - 공통 헬퍼: `isNonEmptyString()`, `isStringMaxLen()`, `isNonNegativeNumber()`
- `src/utils/passwordValidator.ts`: 비밀번호 유효성 검증 + 강도 분석 유틸리티 신규 생성
  - `validatePassword()`: 8자+, 대/소문자, 숫자 필수 검증
  - `getPasswordStrength()`: 0-4 점수, 실시간 체크리스트 (UI용)
- `RegisterPage.tsx`: 비밀번호 강도 프로그레스 바 + 체크리스트 UI 추가, 기존 6자 검증 → 8자+강도 검증으로 강화
- `src/utils/fileValidator.ts`: 엑셀 파일 종합 검증 유틸리티 신규 생성
  - 확장자 + MIME 타입 + 파일 크기(10MB 제한) + 매직 바이트(ZIP/OLE2 헤더) 4단계 검증
- `DataInputPage.tsx`: 기존 확장자만 체크 → `validateExcelFile()` 종합 검증으로 교체
- `AuthContext.tsx`: 30분 비활동 타임아웃 추가 (mousedown/keydown/touchstart/scroll 이벤트 기반)
- `LoginPage.tsx`: 5회 실패 시 5분 잠금 (localStorage 기반 시도 횟수 관리, 카운트다운 UI)

---

## 5. Phase 5: 핵심 모듈화 — ✅ 완료 (2026-02-23)

### 5.1 작업 항목
| 순서 | 영역 | 작업 | 현재 → 목표 | 상태 |
|------|------|------|-----------|------|
| 16 | 모듈화 | types/index.ts 도메인별 분리 | 302줄 → 7파일 + barrel | ✅ 완료 |
| 17 | 모듈화 | snapshotService.ts 분할 | 408줄 → 3파일 (query, write, orchestration) | ✅ 완료 |
| 18 | 모듈화 | useReport.ts 분할 | 482줄 → 4파일 (data, snapshots, upload, composite) | ✅ 완료 |
| 19 | 모듈화 | DataInputPage.tsx 분할 | 499줄 → 6파일 (hook + 4 components + barrel) | ✅ 완료 |
| 20 | 모듈화 | SolutionBusinessDashboard.tsx 분할 | 494줄 → 7파일 (hook + 5 components + barrel) | ✅ 완료 |

### 5.2 변경 요약
- **types/index.ts 분리**: `core.ts`, `parse.ts`, `user.ts`, `product.ts`, `report.ts`, `target.ts`, `snapshot.ts`, `helpers.ts` 파일로 분리하고 `index.ts`를 barrel로 사용 (41개 파일 하위 호환성 유지)
- **snapshotService.ts 분할**: query, write 로직 분리 및 orchestration 코드 조합
- **useReport.ts 분할**: `useReportData.ts`, `useReportSnapshots.ts`, `useReportUpload.ts` 로 분할하고 composition 구현
- **DataInputPage.tsx 분할**: `useDataInput` 훅, `MergeModeSelector`, `DataListTable` 등 여러 작은 컴포넌트로 분할하여 150줄가량으로 파일 크기 축소
- **SolutionBusinessDashboard.tsx 분할**: `useDashboardData` 훅과 각종 차트, 모달 컴포넌트 등으로 분할하여 책임 분리 및 코드 경량화 달성

---

## 6. Phase 6: Admin 페이지 모듈화 — ✅ 완료 (2026-02-23)

### 6.1 작업 항목
| 순서 | 영역 | 작업 | 현재 → 목표 | 상태 |
|------|------|------|-----------|------|
| 22 | 모듈화 | TargetInputTable.tsx 분할 | 489줄 → 75줄 + hook + 4 components | ✅ 완료 |
| 23 | 모듈화 | ProductManagementPage.tsx 분할 | 421줄 → 130줄 + hook + 3 components | ✅ 완료 |
| 24 | 모듈화 | UserManagementPage.tsx 분할 | 410줄 → 115줄 + hook + 2 components | ✅ 완료 |
| 25 | 모듈화 | DivisionManagementPage.tsx 분할 | 366줄 → 120줄 + hook + 2 components | ✅ 완료 |

### 6.2 변경 요약
- **features/targetInput/**: `useTargetMatrix` 훅(matrix 상태, 비율 배분, 변경 감지), `ModeToggle`, `AnnualTargetInputs`, `RatioInputs`, `TargetDataTable` 4개 컴포넌트로 분할. TargetInputTable.tsx가 75줄 오케스트레이션 코드로 축소.
- **features/productManagement/**: `useProductManagement` 훅(CRUD, 필터, 편집 상태), `ProductAddForm`, `ProductTable`, `DeleteConfirmModal`(공통 재사용) 분할.
- **features/userManagement/**: `useUserManagement` 훅(사용자 CRUD, 필터, 승인/거절/역할), `StatusBadge`, `UserTable` 분할.
- **features/divisionManagement/**: `useDivisionManagement` 훅(부문 CRUD, 삭제 확인), `DivisionList`, `DivisionAddForm` 분할. `DeleteConfirmModal`은 productManagement에서 공유.

---

## 7. Phase 7: React.memo 성능 최적화 — ✅ 완료 (2026-02-23)

### 7.1 작업 항목
| 순서 | 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|------|
| 26-A | 성능 | Dashboard 차트 4개 React.memo 래핑 | DashboardKPICards, MonthlyTrendChart, DivisionOverviewChart, TopProductsChart | ✅ 완료 |
| 26-B | 성능 | Reports 차트/테이블 4개 React.memo 래핑 | ProductCharts, DivisionCharts, ProductReportTable, DivisionSummaryTable | ✅ 완료 |
| 26-C | 성능 | Achievement 컴포넌트 2개 React.memo 래핑 | AchievementCharts, AchievementTable | ✅ 완료 |
| 26-D | 성능 | SolutionBusinessDashboard useCallback 5개 핸들러 | SolutionBusinessDashboard.tsx | ✅ 완료 |
| 26-E | 테스트 | React.memo 검증 테스트 작성 | 3개 테스트 파일 (10건) | ✅ 완료 |

### 7.2 변경 요약
- **React.memo 래핑 (10개 컴포넌트)**: `export default function X` → `function X` + `export default React.memo(X)` 패턴 적용
  - Dashboard: `DashboardKPICards`, `MonthlyTrendChart`, `DivisionOverviewChart`, `TopProductsChart`
  - Reports: `ProductCharts`, `DivisionCharts`, `ProductReportTable`, `DivisionSummaryTable`
  - Achievement: `AchievementCharts`, `AchievementTable`
- **React import 추가 (6개 파일)**: `ProductCharts`, `DivisionCharts`, `DivisionSummaryTable`, `AchievementCharts`, `AchievementTable` — 기존 `{ useMemo }` 등만 import하던 파일에 `React` 네임스페이스 import 추가
- **useCallback 적용 (SolutionBusinessDashboard.tsx)**:
  - `import { useCallback }` 추가
  - `handleProductClick`: `useCallback(fn, [])` 래핑
  - `handleDivisionClick`: `useCallback(fn, [divisionChartData])` 래핑
  - KPI 인라인 핸들러 3개 → `handleSalesClick`, `handleProfitClick`, `handleAchievementClick` 별도 `useCallback` 변수로 추출
- **커스텀 비교 함수 불필요**: 모든 props가 shallow comparison으로 충분

---

## 8. 향후 작업 계획 (Phase 8)

| 순서 | 영역 | 작업 | 난이도 |
|------|------|------|--------|
| 27 | 보안 | Firebase Custom Claims 도입 (Cloud Functions) | ★★★ |

---

## 9. Phase 9: 제품 마스터 및 UI 차트 개선 — ✅ 완료 (2026-03-01)

### 9.1 작업 항목 (제품 마스터 데이터베이스 마이그레이션)
| 영역 | 작업 | 파일 | 상태 |
|------|------|------|------|
| 데이터 | `isMaintenanceType`을 `ProductType`으로 마이그레이션 (General/Cloud/Maintenance) | `types/product.ts`, `productMasterService.ts` | ✅ 완료 |
| 데이터 | 누락된 신규 제품 및 Cloud 속성 제품 추가 파싱 로직 적용 | `productMasterService.ts` | ✅ 완료 |
| UI | 제품 관리 페이지에 마이그레이션 및 동기화 액션 버튼 2종 추가 | `ProductManagementPage.tsx`外 | ✅ 완료 |

### 9.2 작업 항목 (막대 차트 라벨 개선)
| 영역 | 작업 | 포함 차트 및 컴포넌트 | 상태 |
|------|------|-----------------------|------|
| UI | 막대 그래프 상단 숫자를 백만원 단위로 노출 (`LabelList` 적용) | 대시보드 (`TopProductsChart`, `DivisionOverviewChart`, `MonthlyTrendChart`, `DashboardDetailModal`) | ✅ 완료 |
| UI | 보고서 및 달성 현황 차트 렌더링 방식 일원화 (`formatMillionWonChart` 헬퍼 적용) | 보고서 및 달성 현황 (`ProductCharts`, `DivisionCharts`, `AchievementCharts`, `DualAxisChart`) | ✅ 완료 |

### 9.3 변경 요약
- **제품 마스터 업데이트**: 데이터베이스 구조 한계를 극복하기 위해 `ProductType` 도입. 마이그레이션 스크립트를 관리자 페이지에 연동해 안전하게 클라우드 및 유지보수 데이터를 분리함.
- **차트 가독성 향상**: Recharts 모듈의 `LabelList`를 적용하고 기존 `formatMillionWonChart` 함수를 이용해 100만 원 단위 축소 포맷팅을 일괄 적용. TypeScript 에러 방지를 위해 Formatter 래핑을 꼼꼼하게 처리함. 모든 막대 차트에서 즉시 직관적인 실적 파악이 가능해짐.
