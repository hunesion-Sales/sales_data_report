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

export interface IndustryGroupDataItem {
  industryGroupName: string;
  months: Record<string, { sales: number; cost: number }>;
}

/**
 * 산업군별 데이터 저장
 */
export async function saveIndustryGroupData(
  reportId: string,
  items: IndustryGroupDataItem[],
  mergeMode: 'overwrite' | 'merge' | 'smart' = 'overwrite'
): Promise<void> {
  const colRef = collection(db, 'reports', reportId, 'industry_group_data');

  if (mergeMode === 'overwrite') {
    const existing = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    existing.docs.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    const BATCH_LIMIT = 450;
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + BATCH_LIMIT);

      chunk.forEach((item) => {
        const docRef = doc(colRef);
        batch.set(docRef, {
          industryGroupName: item.industryGroupName,
          months: item.months,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }
  } else {
    const existingSnap = await getDocs(colRef);
    const existingMap = new Map<string, any>();

    existingSnap.docs.forEach(d => {
      const data = d.data();
      existingMap.set(data.industryGroupName, { ref: d.ref, ...data });
    });

    const batch = writeBatch(db);
    let opCount = 0;

    for (const item of items) {
      const existingItem = existingMap.get(item.industryGroupName);

      if (existingItem) {
        const mergedMonths = { ...existingItem.months, ...item.months };
        batch.update(existingItem.ref, {
          months: mergedMonths,
          updatedAt: serverTimestamp(),
        });
      } else {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          industryGroupName: item.industryGroupName,
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
 * 산업군별 데이터 전체 조회
 */
export async function getIndustryGroupData(reportId: string): Promise<IndustryGroupDataItem[]> {
  const ref = collection(db, 'reports', reportId, 'industry_group_data');
  const q = query(ref, orderBy('industryGroupName', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      industryGroupName: data.industryGroupName as string,
      months: data.months as Record<string, { sales: number; cost: number }>,
    };
  });
}
