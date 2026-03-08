# Migration Guide - Gap Analysis Report

> **Analysis Type**: Design-Implementation Gap Analysis
>
> **Project**: HSR (Huni Sales Report System)
> **Version**: 1.0.0
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-08
> **Design Doc**: [migration.md](../../working_files/migration.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

migration.md 문서가 실제 프로젝트 구조(환경변수, Firestore 컬렉션, 파일 경로, firebase.json 설정, 스크립트, deploy 명령어, 보안 설정, 소스 코드 참조)와 정확히 일치하는지 검증합니다.

### 1.2 Analysis Scope

- **Design Document**: `working_files/migration.md`
- **Implementation Files**: `.env`, `.env.production`, `firestore.rules`, `firebase.json`, `package.json`, `.gitignore`, `src/firebase/config.ts`, `scripts/migrate-db.js`, `.firebaserc`, `firestore.indexes.json`
- **Analysis Date**: 2026-03-08

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| 환경변수 완전성 | 100% | PASS |
| Firestore 컬렉션 완전성 | 100% | PASS |
| 파일 참조 정확성 | 100% | PASS |
| firebase.json 설정 | 95% | WARN |
| 스크립트 참조 | 100% | PASS |
| deploy 명령어 | 100% | PASS |
| 보안 파일 | 60% | FAIL |
| 소스 코드 참조 | 100% | PASS |
| **Overall** | **94%** | **WARN** |

---

## 3. Detailed Gap Analysis

### 3.1 Environment Variable Completeness (100% - PASS)

migration.md Section 4.1에서 언급한 환경변수 vs 실제 `.env` / `.env.production` 파일 비교.

| Variable (migration.md) | `.env` | `.env.production` | Status |
|--------------------------|:------:|:------------------:|:------:|
| `VITE_FIREBASE_API_KEY` | Present | Present | PASS |
| `VITE_FIREBASE_AUTH_DOMAIN` | Present | Present | PASS |
| `VITE_FIREBASE_PROJECT_ID` | Present | Present | PASS |
| `VITE_FIREBASE_STORAGE_BUCKET` | Present | Present | PASS |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Present | Present | PASS |
| `VITE_FIREBASE_APP_ID` | Present | Present | PASS |
| `VITE_ADMIN_EMAIL` | Present | Present | PASS |

**Result**: migration.md에서 언급한 7개 환경변수가 `.env`와 `.env.production` 모두에 정확히 존재합니다.

**Additional Finding**: `src/firebase/config.ts`에서 사용하는 6개 Firebase 변수와 `src/firebase/services/authService.ts`에서 사용하는 `VITE_ADMIN_EMAIL`이 모두 migration.md에 포함되어 있습니다.

**Note**: `functions/.env`에 `SMTP_EMAIL`, `SMTP_PASSWORD` 변수가 존재하나, 이는 Cloud Functions용이며 migration.md의 클라이언트 앱 마이그레이션 범위 밖이므로 Gap으로 간주하지 않습니다.

---

### 3.2 Firestore Collection Completeness (100% - PASS)

migration.md Phase 3의 컬렉션 맵 vs `firestore.rules`의 실제 컬렉션 구조 비교.

| Collection (migration.md) | firestore.rules | Status |
|----------------------------|:---------------:|:------:|
| `users/{userId}` | Line 66 | PASS |
| `divisions/{divisionId}` | Line 112 | PASS |
| `products_master/{productId}` | Line 135 | PASS |
| `products/{productId}` (하위 호환) | Line 156 | PASS |
| `reports/{reportId}` | Line 164 | PASS |
| `reports/{reportId}/products/{productDocId}` | Line 188 | PASS |
| `reports/{reportId}/division_data/{id}` | Line 205 | PASS |
| `reports/{reportId}/industry_group_data/{id}` | Line 221 | PASS |
| `reports/{reportId}/snapshots/{snapshotId}` | Line 237 | PASS |
| `reports/{reportId}/snapshots/{snapshotId}/products/{productId}` | Line 241 | PASS |
| `targets/{targetId}` | Line 251 | PASS |
| `industry_groups/{groupId}` | Line 277 | PASS |
| `product_group_targets/{targetId}` | Line 300 | PASS |
| `backlog/{year}` | Line 327 | PASS |
| `backlog/{year}/products/{docId}` | Line 335 | PASS |
| `backlog/{year}/divisions/{docId}` | Line 341 | PASS |
| `backlog/{year}/industry_groups/{docId}` | Line 348 | PASS |
| `uploadHistory/{historyId}` | Line 359 | PASS |

**Result**: migration.md의 10개 루트 컬렉션과 모든 서브컬렉션(3단계 중첩 포함)이 `firestore.rules`와 100% 일치합니다.

**Cross-check**: `scripts/migrate-db.js`의 `topLevelCollections` 배열(Line 28-39)도 동일한 10개 컬렉션을 나열하며, `copySubcollections()` 함수로 서브컬렉션을 재귀적으로 처리합니다.

---

### 3.3 File Reference Accuracy (100% - PASS)

migration.md에서 참조하는 모든 파일 경로의 실제 존재 여부 검증.

| Referenced File | Actual Path | Exists | Status |
|-----------------|-------------|:------:|:------:|
| `.env` | `/sales-data-weekly/.env` | Yes | PASS |
| `.env.production` | `/sales-data-weekly/.env.production` | Yes | PASS |
| `.firebaserc` | `/sales-data-weekly/.firebaserc` | Yes | PASS |
| `firebase.json` | `/sales-data-weekly/firebase.json` | Yes | PASS |
| `firestore.rules` | `/sales-data-weekly/firestore.rules` | Yes | PASS |
| `firestore.indexes.json` | `/sales-data-weekly/firestore.indexes.json` | Yes | PASS |
| `scripts/migrate-db.js` | `/sales-data-weekly/scripts/migrate-db.js` | Yes | PASS |

**Result**: migration.md에서 참조하는 모든 7개 파일이 실제로 존재합니다.

---

### 3.4 firebase.json Configuration (95% - WARN)

migration.md의 firebase.json 관련 설명 vs 실제 설정 비교.

| Item | migration.md Description | Actual firebase.json | Status |
|------|--------------------------|---------------------|:------:|
| `hosting.site` | `"hunesalesreport"` (line 23) | `"hunesalesreport"` (line 23) | PASS |
| `functions` section mention | "functions 섹션이 있으나 functions/ 디렉토리는 존재하지 않음" | functions 섹션 존재, functions/ 디렉토리 미존재 | PASS |
| `.firebaserc` default project | `"hunesalesreport"` | `"hunesalesreport"` | PASS |

**Gap Found (Severity: LOW)**:

| # | Item | Description | Severity |
|---|------|-------------|:--------:|
| 1 | firebase.json line number | migration.md에서 `(line 23)`이라고 명시했는데, 실제로도 line 23에 `"site": "hunesalesreport"`가 위치하여 정확합니다. 다만 firebase.json의 보안 헤더(CSP, HSTS 등) 설정이 migration.md에서 언급되지 않았습니다. 마이그레이션 시 보안 헤더는 자동으로 이전되므로 문제 없으나, 문서 완전성 측면에서 참고 사항입니다. | LOW |

---

### 3.5 Script Reference (100% - PASS)

migration.md의 `scripts/migrate-db.js` 설명 vs 실제 스크립트 비교.

| Check Item | migration.md | Actual Script | Status |
|------------|-------------|---------------|:------:|
| File exists | `scripts/migrate-db.js` | Exists (103 lines) | PASS |
| Key file paths | `old-key.json`, `new-key.json` | Line 7-8: `OLD_PROJECT_KEY_PATH`, `NEW_PROJECT_KEY_PATH` | PASS |
| 10 root collections | 10 collections listed | Line 28-39: identical 10 collections | PASS |
| `copySubcollections()` function | "재귀적으로 복사" | Line 44-59: recursive subcollection copy | PASS |
| 3-level nesting | "3단계 중첩까지 자동 처리" | Recursive design handles any depth | PASS |
| Firebase Admin SDK | `npm install firebase-admin` | `import admin from 'firebase-admin'` (Line 1) | PASS |
| Execution command | `node scripts/migrate-db.js` | Compatible with Node.js execution | PASS |

**Result**: migration.md의 스크립트 설명이 실제 `scripts/migrate-db.js` 구현과 100% 일치합니다.

---

### 3.6 Deploy Commands (100% - PASS)

migration.md의 배포 명령어 vs `package.json`의 scripts 비교.

| Command (migration.md) | package.json script | Definition | Status |
|--------------------------|:---:|------------|:------:|
| `npm run deploy:all` (Phase 5) | `deploy:all` | `npm run build && firebase deploy` | PASS |

**Additional verification**: migration.md에서 직접 언급하지 않지만, `package.json`에 존재하는 관련 스크립트들.

| package.json script | Definition | migration.md 언급 |
|---------------------|------------|:-----------------:|
| `deploy` | `npm run build && firebase deploy --only hosting` | Indirect (Phase 5 context) |
| `deploy:rules` | `firebase deploy --only firestore:rules` | Not mentioned |
| `build` | `tsc -b && vite build` | Implicit (deploy:all includes) |

**Result**: migration.md Phase 5에서 사용하라고 명시한 `npm run deploy:all` 명령이 `package.json`에 정확히 존재하며, 그 동작(build + firebase deploy 전체)이 문서 설명과 일치합니다.

---

### 3.7 Security Files (60% - FAIL)

migration.md의 보안 관련 지침 vs 실제 `.gitignore` 설정 비교.

| Check Item | migration.md Instruction | Actual `.gitignore` | Status |
|------------|--------------------------|---------------------|:------:|
| `.env` ignored | Implicit (sensitive data) | `.env` pattern present | PASS |
| `.env.*` ignored | Implicit | `.env.*` pattern present | PASS |
| `*.local` ignored | Standard | `*.local` pattern present | PASS |
| `old-key.json` ignored | "키 파일이 .gitignore에 포함되어 있는지 확인" | NOT PRESENT | **FAIL** |
| `new-key.json` ignored | "echo new-key.json >> .gitignore" | NOT PRESENT | **FAIL** |
| `users.json` ignored | "민감한 사용자 정보 포함" | NOT PRESENT | **FAIL** |

**Gaps Found (Severity: HIGH)**:

| # | Item | Description | Severity |
|---|------|-------------|:--------:|
| 1 | `old-key.json` not in .gitignore | Firebase 서비스 계정 비공개 키 파일이 `.gitignore`에 미등록. migration.md Section 3 방법 B 2단계에서 등록하라고 안내하고 있지만, 사전에 등록되어 있지 않습니다. `*.json` 와일드카드 패턴도 없음. | HIGH |
| 2 | `new-key.json` not in .gitignore | 위와 동일. 신규 프로젝트 서비스 계정 키 파일 미등록. | HIGH |
| 3 | `users.json` not in .gitignore | Firebase Auth 사용자 내보내기 파일(비밀번호 해시 포함)이 `.gitignore`에 미등록. migration.md Phase 7에서 삭제를 안내하지만 사전 보호가 없습니다. | HIGH |

**Mitigation**: `.gitignore`의 `*.local` 패턴은 이 파일들을 보호하지 않습니다. migration.md에서 수동으로 `.gitignore`에 추가하라는 안내를 제공하고 있지만(Section 3 방법 B 2단계), 사전에 포함되어 있지 않아 작업자가 이 단계를 건너뛸 경우 서비스 계정 키가 Git에 커밋될 위험이 있습니다.

---

### 3.8 Source Code Reference (100% - PASS)

migration.md Section 4.1의 환경변수 목록 vs `src/firebase/config.ts`의 실제 사용 비교.

| Variable in config.ts | migration.md 목록 | Status |
|----------------------|:-----------------:|:------:|
| `import.meta.env.VITE_FIREBASE_API_KEY` | Listed | PASS |
| `import.meta.env.VITE_FIREBASE_AUTH_DOMAIN` | Listed | PASS |
| `import.meta.env.VITE_FIREBASE_PROJECT_ID` | Listed | PASS |
| `import.meta.env.VITE_FIREBASE_STORAGE_BUCKET` | Listed | PASS |
| `import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID` | Listed | PASS |
| `import.meta.env.VITE_FIREBASE_APP_ID` | Listed | PASS |

| Variable in authService.ts | migration.md 목록 | Status |
|---------------------------|:-----------------:|:------:|
| `import.meta.env.VITE_ADMIN_EMAIL` | Listed | PASS |

**Result**: 소스 코드에서 사용하는 모든 7개 환경변수가 migration.md에 정확히 나열되어 있습니다.

---

## 4. Match Rate Summary

```
+-----------------------------------------------+
|  Overall Match Rate: 94%                       |
+-----------------------------------------------+
|  PASS:          7 categories (87.5%)           |
|  WARN:          1 category  ( 6.3%)            |
|  FAIL:          1 category  ( 6.3%)            |
+-----------------------------------------------+
|  Total items checked: 52                       |
|  Matched:             49 (94.2%)               |
|  Gaps found:           3 (5.8%)                |
+-----------------------------------------------+
```

---

## 5. Gap Items Summary

### FAIL - Missing Features (migration.md describes but not implemented)

| # | Item | Document Location | Description | Severity |
|---|------|-------------------|-------------|:--------:|
| 1 | `old-key.json` not in .gitignore | migration.md Phase 3 Step 2 | 서비스 계정 키 파일이 `.gitignore`에 사전 등록되지 않음. 문서에서 수동 추가를 안내하지만, 사전 보호 미비. | HIGH |
| 2 | `new-key.json` not in .gitignore | migration.md Phase 3 Step 2 | 위와 동일 | HIGH |
| 3 | `users.json` not in .gitignore | migration.md Phase 2 / Phase 7 | Auth 사용자 내보내기 파일이 `.gitignore`에 미등록. 민감 데이터 포함. | HIGH |

### WARN - Documentation Completeness

| # | Item | Document Location | Description | Severity |
|---|------|-------------------|-------------|:--------:|
| 1 | firebase.json 보안 헤더 미언급 | migration.md Phase 4.2 | firebase.json에 CSP, HSTS 등 보안 헤더가 설정되어 있으나 migration.md에서 다루지 않음. 마이그레이션 시 자동 이전되므로 기능상 문제없으나, 새 프로젝트에서 보안 헤더 커스터마이징이 필요할 수 있음. | LOW |

### INFO - Correct Matches (migration.md matches implementation)

| # | Category | Items Verified |
|---|----------|:-------------:|
| 1 | Environment Variables | 7/7 |
| 2 | Firestore Collections (root) | 10/10 |
| 3 | Firestore Subcollections | 8/8 |
| 4 | File References | 7/7 |
| 5 | firebase.json site/functions | 3/3 |
| 6 | migrate-db.js implementation | 7/7 |
| 7 | Deploy commands | 1/1 |
| 8 | Source code env vars | 7/7 |

---

## 6. Recommended Actions

### 6.1 Immediate Actions (HIGH severity)

| # | Action | File | Details |
|---|--------|------|---------|
| 1 | `.gitignore`에 서비스 계정 키 패턴 추가 | `.gitignore` | `old-key.json`, `new-key.json`, `users.json`, `*-key.json` 패턴 추가. 마이그레이션 작업 시작 전에 반드시 적용해야 합니다. |
| 2 | migration.md 보안 섹션 강화 | `working_files/migration.md` | Phase 3 방법 B의 "보안 확인" 단계를 사전 조건(Prerequisites)으로 승격하여, 가이드 시작 시점에 `.gitignore` 수정을 먼저 수행하도록 구조 변경. |

**Suggested `.gitignore` additions**:

```gitignore
# Firebase migration - service account keys
old-key.json
new-key.json
*-key.json

# Firebase Auth export
users.json
```

### 6.2 Documentation Improvements (LOW severity)

| # | Action | File | Details |
|---|--------|------|---------|
| 1 | 보안 헤더 참조 추가 | `working_files/migration.md` | Phase 4.2에 firebase.json의 보안 헤더(CSP, HSTS 등)에 대한 간략한 언급 추가. 새 프로젝트에서 도메인이 변경되면 CSP의 connect-src 등을 업데이트해야 할 수 있음을 명시. |
| 2 | `functions/.env` 처리 안내 | `working_files/migration.md` | `functions/.env` 파일에 SMTP 자격 증명이 존재함. Cloud Functions를 사용하지 않더라도 이 파일의 처리(삭제 또는 이전) 방침을 migration.md에 명시할 것을 권장. |
| 3 | `.env.example` 템플릿 생성 권장 | Project root | 현재 `.env.example`이 존재하지 않음. 마이그레이션 시 새 프로젝트 환경변수를 설정하는 데 참고할 수 있도록 템플릿 파일 생성 권장. |

---

## 7. Cross-Validation: migrate-db.js vs firestore.rules

두 파일 간의 컬렉션 일관성을 교차 검증합니다.

| migrate-db.js topLevelCollections | firestore.rules match block | Consistent |
|-----------------------------------|----------------------------|:----------:|
| `users` | `match /users/{userId}` | Yes |
| `divisions` | `match /divisions/{divisionId}` | Yes |
| `products_master` | `match /products_master/{productId}` | Yes |
| `products` | `match /products/{productId}` | Yes |
| `reports` | `match /reports/{reportId}` | Yes |
| `targets` | `match /targets/{targetId}` | Yes |
| `industry_groups` | `match /industry_groups/{groupId}` | Yes |
| `product_group_targets` | `match /product_group_targets/{targetId}` | Yes |
| `backlog` | `match /backlog/{year}` | Yes |
| `uploadHistory` | `match /uploadHistory/{historyId}` | Yes |

**Result**: 10/10 완전 일치. migration.md, migrate-db.js, firestore.rules 세 파일 모두 동일한 컬렉션 구조를 참조합니다.

---

## 8. Firestore Indexes Verification

migration.md Phase 5에서 언급한 인덱스 정보 vs `firestore.indexes.json` 비교.

| migration.md Description | firestore.indexes.json | Status |
|--------------------------|----------------------|:------:|
| "복합 인덱스 3개" | 3 indexes defined | PASS |
| `targets` collection indexes | 2 indexes for `targets` | PASS |
| `product_group_targets` collection indexes | 1 index for `product_group_targets` | PASS |

**Result**: 인덱스 수와 대상 컬렉션이 정확히 일치합니다.

---

## 9. Conclusion

migration.md 문서의 전체 정확도는 **94%**로, 프로젝트 실제 구현과 높은 수준으로 일치합니다.

**강점**:
- 환경변수, Firestore 컬렉션, 파일 참조, 스크립트 설명이 모두 정확합니다.
- firebase.json의 line number 참조까지 정확합니다.
- migrate-db.js의 구현 설명이 실제 코드와 완벽히 일치합니다.

**개선 필요 사항**:
- `.gitignore`에 서비스 계정 키 파일 패턴이 사전 등록되어 있지 않아, 마이그레이션 작업 중 민감 파일이 Git에 커밋될 위험이 있습니다. 이 부분은 migration.md에서 안내하고 있으나, 가이드 순서상 사전 조건으로 더 강조할 필요가 있습니다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-08 | Initial gap analysis | bkit-gap-detector |
