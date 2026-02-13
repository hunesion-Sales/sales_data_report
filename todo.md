# 매출 보고 웹 대시보드 - 검증 결과 및 TODO

> 검증일: 2026-02-13
> 대상 파일: `sales_data_weekly` (React JSX 컴포넌트), `sales_data_2_4.xlsx`
> 참조 프로젝트: `/Volumes/hclim_SSD/sales-app` (SalesFlow - React+Firebase+Vite 웹앱)

---

## 0. 참조 프로젝트(sales-app) 기술 스택 요약

| 항목 | sales-app 사용 기술 | 이 프로젝트 적용 방향 |
|------|---------------------|----------------------|
| Framework | React 19 + TypeScript 5.9 | React 19 + TypeScript (`.tsx`) |
| Build | Vite 7.2 | Vite (동일) |
| Styling | TailwindCSS 3.4 + PostCSS + autoprefixer | TailwindCSS (동일) |
| Charts | recharts 3.5 | recharts (동일) |
| Icons | lucide-react 0.555 | lucide-react (동일) |
| Excel | **exceljs 4.4** (동적 import) | exceljs (sales-app과 통일, SheetJS 대신) |
| Backend | Firebase (Firestore, Auth, Storage, Functions) | Firebase Hosting 배포만 활용 (데이터는 localStorage) |
| State | React Context | 단순 useState 유지 (소규모 앱) |
| Font | Inter + Nanum Gothic | 동일 적용 |
| PWA | vite-plugin-pwa | 선택적 적용 |
| Error | Sentry + ErrorBoundary | ErrorBoundary만 적용 |
| Validation | Zod | 엑셀 파싱 시 데이터 검증용 선택적 적용 |

---

## 1. 데이터 검증 결과

### 정상 확인 항목
- **INITIAL_DATA <-> Excel 데이터 일치**: 코드의 22개 제품 데이터가 엑셀(B16:G37)과 정확히 일치
- **그룹화 로직 정상**: `_MA` -> 유지보수, `H/W`+`기타` -> 기타 합산 로직 올바름
- **이익 계산 정상**: 매출액 - 매입액 = 이익 수식 정확
- **합계 행 계산 정상**: processedData 기반 reduce 합계 로직 올바름

### 검증 참고사항
- Excel 전체 합계(row 38): 매출 699,085,307 / 매입 162,104,392 / 이익 536,980,915 (1월)
- Excel 전체 합계(row 38): 매출 337,862,343 / 매입 40,041,146 / 이익 297,821,197 (2월)
- 코드의 INITIAL_DATA 합산 시 위 수치와 동일하게 산출됨 -> **데이터 정합성 확인 완료**

---

## 2. 발견된 문제점 (Critical)

### P0 - 프로젝트 구조 미비 -- RESOLVED
- [x] **프로젝트 초기화 완료**: `package.json`, `vite.config.ts`, `tsconfig.json/app.json` 생성
- [x] **파일 확장자 및 구조 변경 완료**: `src/components/`, `src/utils/`, `src/types/` 구조
- [x] **의존성 설치 완료**: sales-app과 버전 통일 (271 packages)

### P0 - JSX 문법 오류 (빌드 불가) -- RESOLVED
- [x] **JSX 공백 오류 100건+ 수정 완료**
- [x] **자체 닫힘 태그 오류 수정 완료**
- [x] **TypeScript 타입 추가 및 tsc 컴파일 통과**

### P0 - 엑셀 파일 업로드 미지원 -- RESOLVED
- [x] **엑셀 파일(.xlsx/.xls) 업로드 지원**: `accept=".xlsx,.xls,.txt"`, `readAsArrayBuffer()` 사용
- [x] **exceljs 라이브러리 도입** (sales-app과 동일)
  - `src/utils/excelParser.ts` 생성: 동적 import `await import('exceljs')`
  - 월 헤더 자동 감지, "전체" 행 자동 제외, 수식 결과값 처리
- [x] 엑셀 파싱 시 헤더 행 자동 감지, 데이터 행 파싱, 합계 행("전체") 제외 로직 구현 완료
- [x] 업로드 중 로딩 스피너 표시, 기존 .txt 파싱 하위 호환 유지

---

## 3. 발견된 문제점 (Major)

### P1 - 기능 개선 필요
- [ ] **월 데이터 하드코딩**: 현재 1월/2월만 지원 -> 주간/월간 데이터 동적 추가 구조로 변경 필요
  - 매주 엑셀 업로드 시 새 월(3월, 4월...) 컬럼이 자동으로 추가되어야 함
  - 엑셀 헤더 행(row 14)에서 "1월 2026", "2월 2026" 등 월 정보 자동 감지
  - 테이블 헤더, KPI 카드, 차트 모두 동적 월 지원 필요
- [ ] **데이터 영속성 없음**: 페이지 새로고침 시 데이터 초기화됨
  - 1단계: `localStorage` 기반 저장/로드 (간단, 즉시 적용 가능)
  - 2단계(선택): Firebase Firestore 연동 시 sales-app의 baseService 패턴 참조
- [ ] **엑셀 업로드 시 컬럼 매핑 취약**: `columns[1]`, `columns[4]` 등 인덱스 하드코딩
  - 엑셀 헤더(제품군, 매출액 합계, 매입액 합계 등) 기반 동적 매핑 필요
- [ ] **엑셀 업로드 시 기존 데이터 덮어쓰기**: 새 파일 업로드 시 기존 데이터를 완전 교체함
  - 누적/병합 옵션 제공 필요

### P1 - UI/UX 개선
- [ ] **인쇄/PDF 최적화**: `@media print` CSS 스타일 없음 -> 인쇄 시 레이아웃 깨짐 예상
- [ ] **반응형 테이블**: 모바일에서 상세 보고서 테이블 가독성 개선
- [ ] **로딩 상태 표시**: 파일 업로드 중 로딩 인디케이터 없음
  - sales-app의 `LoadingSpinner` 컴포넌트 패턴 참조
- [ ] **에러 바운더리**: sales-app의 `ErrorBoundary` 컴포넌트 패턴 적용
- [ ] **알림 시스템**: 현재 자체 구현 -> sales-app의 `NotificationContext` 패턴 참조 가능

### P2 - TypeScript 전환
- [ ] **타입 정의 추가**: sales-app의 `src/types/index.ts` 패턴 참조
  - `SalesProduct` 인터페이스 정의 (product, monthlySales, monthlyCost 등)
  - `ProcessedProduct` 인터페이스 (이익 계산 후)
  - `MonthlyData` 타입 (동적 월 지원용)
- [ ] **Zod 스키마 추가** (선택): 엑셀 파싱 데이터 검증용

---

## 4. 권장 작업 순서 (sales-app 패턴 기준)

### Phase 1: 프로젝트 셋업 및 기본 동작 -- COMPLETED (2026-02-13)
1. [x] Vite + React + TypeScript 프로젝트 초기화
   - `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json` 생성
   - sales-app의 `vite.config.ts` 경량 버전 적용 (PWA, Sentry 제외)
   - exceljs, recharts 별도 chunk 분리 설정 완료
2. [x] TailwindCSS 설정
   - `tailwind.config.js`: Inter + Nanum Gothic 폰트, fade-in/bounce-in 애니메이션
   - `postcss.config.js`: tailwindcss + autoprefixer
   - `src/index.css`: `@media print` CSS 포함
3. [x] `sales_data_weekly` -> `src/components/SolutionBusinessDashboard.tsx` 변환
   - JSX 공백 오류 100건+ 전체 수정 (`< div` -> `<div`)
   - 자체 닫힘 태그 오류 수정 (`/ >` -> `/>`)
   - TypeScript 타입 추가: `ProductData`, `ProcessedProduct`, `Totals`, `Notification`
   - Recharts Tooltip formatter 타입 오류 수정
4. [x] `src/App.tsx`, `src/main.tsx`, `index.html` 생성
   - index.html: 한국어 lang, viewport, 메타태그 설정
5. [x] 의존성 설치 및 빌드/실행 테스트
   - `npm install` 완료 (271 packages)
   - `tsc -b` 컴파일 에러 없음
   - `vite build` 성공 (경고 없음)
   - 번들 크기: JS 206KB + charts 380KB, CSS 17KB

### Phase 2: 엑셀 업로드 기능 구현 -- COMPLETED (2026-02-13)
6. [x] `exceljs@^4.4.0` 설치 (Phase 1에서 완료, sales-app과 동일)
7. [x] `src/utils/excelParser.ts` 생성
   - 동적 import 패턴: `const ExcelJS = await import('exceljs')`
   - 엑셀 구조 자동 감지 (row 10~20 범위에서 월 헤더 탐색, 제품군 컬럼 자동 감지)
   - "전체" 행 자동 제외, 수식 결과값(`.result`) 처리 지원
8. [x] 파일 업로드 핸들러 수정: `.xlsx` 파일 지원
   - accept 속성: `.xlsx,.xls,.txt` (하위 호환)
   - `file.arrayBuffer()` + `parseExcelFile()` 사용
   - 업로드 중 로딩 스피너 표시 (`isUploading` 상태)
   - 감지된 월 정보를 알림 메시지에 표시
9. [x] Vite 빌드 최적화: exceljs 별도 chunk 분리 (Phase 1에서 설정 완료)
   - 빌드 결과: `vendor-excel` 937KB (gzip 269KB) 별도 분리 확인

### Phase 3: 동적 월 지원 & 데이터 구조 개선
10. [ ] `src/types/index.ts` 생성: 타입 정의
    ```ts
    interface MonthData { sales: number; cost: number; }
    interface ProductRecord {
      id: number;
      product: string;
      months: Record<string, MonthData>; // key: "2026-01", "2026-02", ...
    }
    ```
11. [ ] 엑셀 헤더에서 월 자동 감지 (예: "1월 2026" -> "2026-01")
12. [ ] 테이블/차트/KPI 컴포넌트를 동적 월 기반으로 수정

### Phase 4: 데이터 영속성 & 안정화
13. [ ] `localStorage` 기반 데이터 저장/로드 구현
    - 키: `salesDashboard_data`, `salesDashboard_lastUpdated`
    - 업로드/수정/삭제 시 자동 저장
14. [ ] 인쇄용 CSS (`@media print`) 추가
    - 헤더/사이드바 숨기기, 테이블 페이지 나눔, 폰트 크기 조정
15. [ ] 에러 핸들링 강화
    - `ErrorBoundary` 컴포넌트 (sales-app 패턴)
    - 엑셀 파싱 실패 시 상세 오류 메시지

### Phase 5: 배포 (선택)
16. [ ] Firebase Hosting 배포 설정
    - `firebase.json`: sales-app 호스팅 설정 참조 (SPA rewrite, 캐시 헤더)
    - `.firebaserc`: 별도 프로젝트 또는 sales-app 하위 사이트로 배포
17. [ ] GitHub Actions CI/CD (선택)

---

## 5. 엑셀 파일 구조 참고 (sales_data_2_4.xlsx)

```
Row 2:  제목 - ['26년_예상매출이익_90%~100%]제품별
Row 3:  작성일시/작성자
Row 6-12: 필터 조건 메타정보
Row 14: 월 헤더 (B: "계산서일자 ->", C: "1월 2026", F: "2월 2026", I: "전체")
Row 15: 컬럼 헤더 (B: "제품군", C: "매출액 합계", D: "매입액 합계", E: "매출이익", ...)
Row 16-37: 데이터 (22개 제품)
Row 38: 전체 합계
```

**컬럼 매핑:**
| 엑셀 컬럼 | 내용 | 비고 |
|-----------|------|------|
| B | 제품군 | 필수 |
| C | 1월 매출액 | 파싱 대상 |
| D | 1월 매입액 | 파싱 대상 |
| E | 1월 매출이익 | 계산값 (C-D), 파싱 불필요 |
| F | 2월 매출액 | 파싱 대상 |
| G | 2월 매입액 | 파싱 대상 |
| H | 2월 매출이익 | 계산값 (F-G), 파싱 불필요 |
| I | 전체 매출액 | 계산값, 파싱 불필요 |
| J | 전체 매입액 | 계산값, 파싱 불필요 |
| K | 전체 매출이익 | 계산값, 파싱 불필요 |

**엑셀 파싱 전략:**
- row 14에서 월 헤더 감지: "1월 2026", "2월 2026" 등
- 각 월은 3컬럼(매출액, 매입액, 매출이익) 단위로 반복
- "매출이익" 컬럼과 "전체" 섹션은 앱에서 자체 계산하므로 파싱 생략
- "전체" 행(제품군 값이 "전체")은 제외

---

## 6. sales-app에서 재활용 가능한 코드/패턴

| 항목 | sales-app 소스 | 적용 방법 |
|------|---------------|-----------|
| Excel 동적 import | `src/utils/excelExport.ts` | excelParser.ts에 동일 패턴 적용 |
| 숫자 포맷팅 | `src/utils/formatters.ts` | 통화 포맷 유틸 참조 |
| ErrorBoundary | `src/components/common/ErrorBoundary.tsx` | 그대로 복사 적용 |
| LoadingSpinner | `src/components/common/LoadingSpinner.tsx` | 업로드 중 표시용 |
| Vite 청크 분리 | `vite.config.ts` manualChunks | exceljs 별도 청크 |
| index.html 메타태그 | `index.html` | 한국어, viewport, PWA 메타 |
| TailwindCSS 설정 | `tailwind.config.js` | 폰트, 색상 체계 |
| Firebase Hosting | `firebase.json` | 배포 설정 |
