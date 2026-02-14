# Firebase 배포 설정 가이드

## 1. GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿을 설정하세요:

### Firebase 환경 변수 (필수)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Firebase Service Account (필수)
- `FIREBASE_SERVICE_ACCOUNT`: Firebase 서비스 계정 JSON 키

## 2. Firebase Service Account 생성

1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드된 JSON 파일 내용 전체를 `FIREBASE_SERVICE_ACCOUNT` 시크릿에 저장

## 3. 수동 배포

### Hosting만 배포
```bash
npm run deploy
```

### Firestore 규칙만 배포
```bash
npm run deploy:rules
```

### 전체 배포 (Hosting + Rules)
```bash
npm run deploy:all
```

## 4. 자동 배포 (CI/CD)

- **main 브랜치 푸시**: 자동으로 프로덕션 배포
- **PR 생성**: 프리뷰 URL 자동 생성 (PR 댓글로 URL 표시)

## 5. 배포 확인

배포 후 다음 URL에서 확인:
- https://hunesalesreport.web.app
- https://hunesalesreport.firebaseapp.com
