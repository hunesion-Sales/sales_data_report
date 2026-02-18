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
 * 부문별 데이터 저장
 * @param reportId 보고서 ID
 * @param items 저장할 데이터
 * @param mergeMode 병합 모드 ('overwrite' | 'merge' | 'smart')
 */
export async function saveDivisionData(
  reportId: string,
  items: DivisionDataItem[],
  mergeMode: 'overwrite' | 'merge' | 'smart' = 'overwrite'
): Promise<void> {
  const colRef = collection(db, 'reports', reportId, 'division_data');

  if (mergeMode === 'overwrite') {
    // 1. Overwrite 모드: 기존 데이터 전체 삭제 후 저장
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
  } else {
    // 2. Merge / Smart 모드: 기존 데이터와 병합
    // 기존 데이터 조회
    const existingSnap = await getDocs(colRef);
    const existingMap = new Map<string, any>(); // key: divisionName

    existingSnap.docs.forEach(d => {
      const data = d.data();
      existingMap.set(data.divisionName, { ref: d.ref, ...data });
    });

    const batch = writeBatch(db);
    let opCount = 0;

    for (const item of items) {
      const existingItem = existingMap.get(item.divisionName);

      if (existingItem) {
        // 기존 부문 존재: 월 데이터 병합
        const mergedMonths = { ...existingItem.months, ...item.months };
        batch.update(existingItem.ref, {
          months: mergedMonths,
          updatedAt: serverTimestamp(),
          divisionId: item.divisionId // ID 업데이트 (필요시)
        });
      } else {
        // 신규 부문: 추가
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          divisionName: item.divisionName,
          divisionId: item.divisionId,
          months: item.months,
          updatedAt: serverTimestamp(),
        });
      }

      opCount++;
      if (opCount >= 450) {
        await batch.commit();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
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

/**
 * 부문별 데이터 전체 삭제 (초기화)
 */
export async function clearDivisionData(reportId: string): Promise<number> {
  const colRef = collection(db, 'reports', reportId, 'division_data');
  const existing = await getDocs(colRef);

  if (existing.empty) {
    return 0;
  }

  const batch = writeBatch(db);
  existing.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  return existing.docs.length;
}
