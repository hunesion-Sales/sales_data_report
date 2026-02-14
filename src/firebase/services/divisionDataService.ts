import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config';

export interface DivisionDataItem {
  divisionName: string;
  divisionId: string;
  months: Record<string, { sales: number; cost: number }>;
}

/**
 * 부문별 데이터 일괄 저장 (batch write)
 * 기존 데이터를 모두 삭제 후 새로 저장
 */
export async function saveDivisionData(
  reportId: string,
  items: DivisionDataItem[],
): Promise<void> {
  const colRef = collection(db, 'reports', reportId, 'division_data');

  // 기존 문서 전체 삭제
  const existing = await getDocs(colRef);
  const deleteBatch = writeBatch(db);
  existing.docs.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  // 새 데이터 일괄 저장 (500건 단위 batch 제한 대응)
  const BATCH_LIMIT = 450;
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = items.slice(i, i + BATCH_LIMIT);

    chunk.forEach((item) => {
      const docRef = doc(colRef);
      batch.set(docRef, {
        divisionName: item.divisionName,
        divisionId: item.divisionId,
        months: item.months,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

/**
 * 부문별 데이터 전체 조회
 */
export async function getDivisionData(reportId: string): Promise<DivisionDataItem[]> {
  const ref = collection(db, 'reports', reportId, 'division_data');
  const q = query(ref, orderBy('divisionName', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      divisionName: data.divisionName as string,
      divisionId: data.divisionId as string,
      months: data.months as Record<string, { sales: number; cost: number }>,
    };
  });
}
