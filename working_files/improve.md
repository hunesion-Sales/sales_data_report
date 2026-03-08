# 대용량 파일 모듈화 및 성능 개선 방안 (계획)

> **최종 업데이트**: 2026-02-23 (Phase 6 완료)
> **현재 상태**: Phase 1-6 완료, 작업 내용은 `improve_work.md`, 테스트 결과는 `improve_test.md` 참조.

이 문서는 프로젝트 성능 및 코드 구조를 개선하기 위한 전체적인 **계획 및 설계**를 담고 있습니다.

---

## 0. 현재 프로젝트 현황 요약

### 0.1 프로젝트 개요
- **프로젝트명**: HSR (Huni Sales Report System) - 휴네시온 솔루션사업본부 매출 보고 시스템
- **기술 스택**: React 19.2 + TypeScript 5.9 + Vite 7.2 + Firebase 12.9 (Firestore + Auth + Hosting) + Tailwind CSS 3.4
- **배포**: Firebase Hosting (`hunesalesreport.web.app`)
- **빌드 도구**: Vite 7.2.4, `@vitejs/plugin-react`

### 0.2 코드베이스 메트릭 (2차 분석 기준)
- 총 72 파일, 약 11,645 라인 체제 (components ~4,110 라인, pages ~2,877 라인 등)

### 0.3 빌드 산출물 현황 (개선 이전)
- 메인 번들: 929 KB (라우트 분할 미비)
- 엑셀/차트 모듈은 분리됨. 합계 약 ~2.6 MB (이미지 제외)

### 0.4 대용량 파일 현황 (150줄 이상 주요 대상)
1. `DataInputPage.tsx` (501줄)
2. `SolutionBusinessDashboard.tsx` (492줄)
3. `TargetInputTable.tsx` (489줄)
4. `useReport.ts` (480줄)
... 등 총 23개의 대용량 파일이 존재하여 모듈화 계획 수립.

---

## 1. 개요

### 1.1 목적
- 대용량 파일(200라인 이상)을 기능 단위로 분리하여 유지보수성 향상
- React 코드 분할(lazy loading) 적용으로 초기 로딩 시간 단축
- 커스텀 훅 분리를 통한 로직 재사용성 증가
- 중복 코드 통합으로 일관성 확보
- 프로덕션 환경 보안 헤더 및 규칙 강화

---

## 2. 현재 상태 분석

### 2.1 공통 문제점
1. **단일 책임 원칙 위반**: 한 파일에 여러 관심사가 혼재
2. **중복 코드**: 알림, 로딩 상태, 에러 처리, viewMode, 색상 팔레트 로직 반복
3. **코드 분할 미적용**: 모든 페이지가 단일 번들에 포함

### 2.2 부문 렌더링 병목 파일
- `DataInputPage.tsx`: 상태 관리, 파일/데이터 로직 통합 문제
- `SolutionBusinessDashboard.tsx`: KPI, 차트 렌더링 등의 UI 결합 문제
- `useReport.ts` 및 여러 Admin 페이지들

---

## 3. 중복 코드 및 최적화 전략 요약

### 3.1 공통화(중복 제거) 설계
- **viewMode/알림**: `useViewMode`, `useNotification` 훅으로 통합
- **색상 팔레트**: `constants/colors.ts` 파일로 통합 (과도한 배열/매직스트링 제거)
- **UI 컴포넌트**: `KPICardGrid` 와 같은 공통 데이터 프레젠테이션 컴포넌트로 분리 

### 3.2 성능 최적화(코드 분할)
- Admin 관리 화면 4개 및 일반 보고서/현황 화면 3개를 React.lazy 로 분리
- 번들 사이즈 50%+ 감소 기대.

---

## 4. 파일별 모듈화 전략 상세 설계

- `DataInputPage`, `SolutionBusinessDashboard` 등의 페이지를 도메인 주도 형태의 구조(`features/...`)로 분리.
- `types/index.ts` 는 `core`, `parse`, `report` 등으로 개별 도메인별 분리. 

---

## 5. 보안 현황 분석 및 강화 방안

보안 위협 최소화 및 무결성 확보를 위한 구조적 조치 계획:
- **CSP 및 보안 헤더**: Firebase Hosting 의 `firebase.json` 구성 강화.
- **필드 레벨 검증**: Firestore `rules`의 스키마 점검 규칙 강화
- **입력 검증**: 비밀번호 강도(클라이언트), 파일 정합성(Magic Bytes 등) 로직 강화.
- **민감정보 제거**: 프로덕션 배포 전에 `logger` 유틸리티를 적용하여 console 노출 방지.

---

## 6. 최종 디렉토리 구조 (모듈화 완료 목표)

```
src/
├── components/ (공통 UI, 차트 레이아웃)
├── features/ (도메인 주도 컴포넌트)
│   ├── dashboard/
│   ├── dataInput/
│   ├── productManagement/
│   ├── userManagement/
│   ├── divisionManagement/
│   └── targetInput/
├── hooks/ (분리된 data, upload, composite 훅)
├── pages/ (Lazy Loading 엔트리)
├── types/ (도메인 분할)
└── utils/, firebase/, ...
```

---

## 7. 향후 작업 계획 (Phase 7)

| 순서 | 영역 | 작업 | 난이도 |
|------|------|------|--------|
| 26 | 성능 | React.memo 적용 (차트/테이블 6개 컴포넌트) | ★☆☆ |
| 27 | 보안 | Firebase Custom Claims 도입 (Cloud Functions) | ★★★ |

---

> **비고**:
> - 구체적인 작업 내역(완료된 Phase 로깅)은 `improve_work.md` 파일을 참조하세요.
> - 작업 완료 후 수행된 번들 용량 변화와 단위 테스트 결과는 `improve_test.md` 파일을 참조하세요.
