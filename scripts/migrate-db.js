import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

// ==========================================
// 설정: 두 프로젝트의 서비스 계정 키 JSON 파일 경로
// ==========================================
const OLD_PROJECT_KEY_PATH = './old-key.json';
const NEW_PROJECT_KEY_PATH = './new-key.json';

// 보안 검사: 키 파일이 존재하는지 확인
if (!existsSync(OLD_PROJECT_KEY_PATH) || !existsSync(NEW_PROJECT_KEY_PATH)) {
  console.error("❌ 오류: 서비스 계정 키 파일(old-key.json, new-key.json)을 찾을 수 없습니다.");
  console.error("이 파일들은 보안상 중요하므로 git에 커밋되지 않아야 합니다.");
  process.exit(1);
}

// 서비스 계정 키 로드
const oldKey = JSON.parse(readFileSync(OLD_PROJECT_KEY_PATH, 'utf8'));
const newKey = JSON.parse(readFileSync(NEW_PROJECT_KEY_PATH, 'utf8'));

// 기존 프로젝트 초기화
const oldApp = admin.initializeApp({
  credential: admin.credential.cert(oldKey)
}, 'oldApp');

// 신규 프로젝트 초기화
const newApp = admin.initializeApp({
  credential: admin.credential.cert(newKey)
}, 'newApp');

const oldDb = oldApp.firestore();
const newDb = newApp.firestore();

// 마이그레이션할 최상위 컬렉션 목록
const topLevelCollections = [
  'users',
  'divisions',
  'products_master',
  'products',
  'reports',              // 서브컬렉션: products, division_data, industry_group_data, snapshots
  'targets',
  'industry_groups',
  'product_group_targets',
  'backlog',              // 서브컬렉션: products, divisions, industry_groups
  'uploadHistory'
];

/**
 * 하위 컬렉션들을 재귀적으로 복사합니다 (Batch 사용)
 */
async function copySubcollections(oldDocRef, newDocRef) {
  const subcollections = await oldDocRef.listCollections();
  
  for (const subColl of subcollections) {
    console.log(`  -> 서브컬렉션 복사 중: ${subColl.id} (부모: ${oldDocRef.path})`);
    
    // 서브컬렉션 내부 문서 가져오기
    const snapshot = await subColl.get();
    const newSubCollRef = newDocRef.collection(subColl.id);
    
    if (snapshot.empty) continue;

    // 배치 처리 (최대 500건씩)
    const batches = [];
    let currentBatch = newDb.batch();
    let opCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const newSubDocRef = newSubCollRef.doc(doc.id);
      
      currentBatch.set(newSubDocRef, data);
      opCount++;

      if (opCount === 500) {
        batches.push(currentBatch);
        currentBatch = newDb.batch();
        opCount = 0;
      }
    }
    
    if (opCount > 0) {
      batches.push(currentBatch);
    }
    
    // 배치 실행
    await Promise.all(batches.map(b => b.commit()));

    // 서브컬렉션의 서브컬렉션 재귀 탐색
    for (const doc of snapshot.docs) {
      await copySubcollections(doc.ref, newSubCollRef.doc(doc.id));
    }
  }
}

/**
 * 최상위 컬렉션을 복사합니다.
 */
async function migrateCollection(collectionName) {
  console.log(`===========================================`);
  console.log(`[시작] 컬렉션 마이그레이션: ${collectionName}`);
  
  try {
    const snapshot = await oldDb.collection(collectionName).get();
    console.log(`총 ${snapshot.size}개의 문서를 찾았습니다.`);

    // 배치 처리 (Firestore 한도는 500개)
    const batches = [];
    let currentBatch = newDb.batch();
    let opCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const newDocRef = newDb.collection(collectionName).doc(doc.id);
      
      currentBatch.set(newDocRef, data);
      opCount++;

      if (opCount === 500) {
        batches.push(currentBatch);
        currentBatch = newDb.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      batches.push(currentBatch);
    }

    // 최상위 컬렉션 쓰기
    console.log(`  -> 배치 ${batches.length}개 커밋 중...`);
    await Promise.all(batches.map(b => b.commit()));
    console.log(`  -> ${collectionName} 컬렉션 최상위 문서 이식 완료`);

    // 각 문서의 서브컬렉션 복사
    for (const doc of snapshot.docs) {
      const newDocRef = newDb.collection(collectionName).doc(doc.id);
      await copySubcollections(doc.ref, newDocRef);
    }

    console.log(`[완료] 컬렉션 마이그레이션: ${collectionName}`);
  } catch (error) {
    console.error(`❌ [오류] ${collectionName} 컬렉션 진행 중 에러 발생:`, error);
  }
}

async function runMigration() {
  try {
    for (const collection of topLevelCollections) {
      await migrateCollection(collection);
    }
    console.log("✅ 모든 데이터 마이그레이션이 성공적으로 완료되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 전체 진행 중 심각한 오류 발생:", error);
  } finally {
    process.exit(0);
  }
}

runMigration();
