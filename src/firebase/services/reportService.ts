import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { logger } from '@/utils/logger';

export interface ReportDoc {
  year: number;
  title: string;
  months: string[];
  monthLabels: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 연도별 보고서 문서 ID 생성 (예: "report-2026")
 */
function getReportId(year: number): string {
  return `report-${year}`;
}

/**
 * 연도별 보고서를 가져오기 (없으면 null 반환)
 */
export async function getReport(year: number): Promise<{ reportId: string; report: ReportDoc } | null> {
  const reportId = getReportId(year);
  const ref = doc(db, 'reports', reportId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { reportId, report: snap.data() as ReportDoc };
  }
  return null;
}

/**
 * 연도별 보고서를 가져오거나, 없으면 새로 생성 (Admin Only)
 */
export async function getOrCreateReport(year: number): Promise<{ reportId: string; report: ReportDoc }> {
  // 1. 가져오기 시도
  const existing = await getReport(year);
  if (existing) return existing;

  // 2. 없으면 생성 (권한 없으면 Firestore 에러 발생)
  const reportId = getReportId(year);
  const ref = doc(db, 'reports', reportId);

  const newReport: Record<string, unknown> = {
    year,
    title: `${year}년 매출 보고`,
    months: [],
    monthLabels: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, newReport);
  const created = await getDoc(ref);
  return { reportId, report: created.data() as ReportDoc };
}

/**
 * 보고서의 월 메타데이터 업데이트
 */
export async function updateReportMonths(
  reportId: string,
  months: string[],
  monthLabels: Record<string, string>,
): Promise<void> {
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, {
    months,
    monthLabels,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 보고서의 모든 데이터 삭제 (제품, 스냅샷, 부문 데이터, 업로드 이력)
 * - 주의: 복구 불가능
 */
export async function clearReportData(reportId: string): Promise<void> {
  const batchLimit = 500;

  // 1. 하위 컬렉션 데이터 삭제 헬퍼
  const deleteCollection = async (collectionPath: string) => {
    const colRef = collection(db, collectionPath);
    const snap = await getDocs(colRef);

    if (snap.empty) return;

    // 배치가 500개 제한이므로 청크로 나누어 삭제
    const chunks = [];
    let currentChunk = [];

    for (const doc of snap.docs) {
      currentChunk.push(doc);
      if (currentChunk.length >= batchLimit) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  };

  // 2. products 삭제
  await deleteCollection(`reports/${reportId}/products`);

  // 3. division_data 삭제
  await deleteCollection(`reports/${reportId}/division_data`);

  // 4. snapshots 및 하위 products 삭제
  const snapshotsRef = collection(db, `reports/${reportId}/snapshots`);
  const snapshotsSnap = await getDocs(snapshotsRef);
  for (const snapshotDoc of snapshotsSnap.docs) {
    // 스냅샷 내부 products 삭제
    await deleteCollection(`reports/${reportId}/snapshots/${snapshotDoc.id}/products`);
    // 스냅샷 문서 자체 삭제
    await deleteDoc(snapshotDoc.ref);
  }

  // 5. uploadHistory 삭제 (해당 리포트 관련)
  const historyQuery = query(collection(db, 'uploadHistory'), where('reportId', '==', reportId));
  const historySnap = await getDocs(historyQuery);
  const historyBatch = writeBatch(db);
  historySnap.forEach(doc => historyBatch.delete(doc.ref));
  await historyBatch.commit();

  // 6. 리포트 메타데이터 초기화
  const reportRef = doc(db, 'reports', reportId);
  await updateDoc(reportRef, {
    months: [],
    monthLabels: {},
    updatedAt: serverTimestamp(),
  });

  logger.debug(`[clearReportData] Report ${reportId} cleared successfully.`);
}
