/**
 * 스냅샷 쓰기 서비스
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type {
  ProductData,
  WeekKey,
} from '@/types';
import { getWeekKey } from '@/utils/weekUtils';
import { generateMonthHashes } from '@/utils/hashUtils';

/**
 * 주차별 스냅샷 저장
 */
export async function saveWeeklySnapshot(
  reportId: string,
  weekKey: WeekKey,
  products: ProductData[],
  months: string[],
  monthLabels: Record<string, string>,
  fileName: string,
  userId: string
): Promise<void> {
  const snapshotRef = doc(db, 'reports', reportId, 'snapshots', weekKey);

  // 월별 해시 생성
  const monthHashes = await generateMonthHashes(products, months);

  // 스냅샷 메타데이터 저장
  await setDoc(snapshotRef, {
    weekKey,
    uploadedAt: serverTimestamp(),
    uploadedBy: userId,
    fileName,
    monthsIncluded: months,
    monthLabels,
    productCount: products.length,
    monthHashes,
  });

  // 스냅샷 제품 데이터 저장
  const productsColRef = collection(snapshotRef, 'products');

  // 기존 제품 데이터 삭제 (같은 주차에 재업로드 시)
  const existing = await getDocs(productsColRef);
  if (existing.size > 0) {
    const deleteBatch = writeBatch(db);
    existing.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
  }

  // 새 제품 데이터 저장 (450건 단위 batch)
  const BATCH_LIMIT = 450;
  for (let i = 0; i < products.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = products.slice(i, i + BATCH_LIMIT);

    chunk.forEach((product, idx) => {
      const docRef = doc(productsColRef);
      batch.set(docRef, {
        product: product.product,
        months: product.months,
        sortOrder: i + idx,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

/**
 * 스냅샷 데이터만 저장 (충돌 없이)
 */
export async function saveSnapshotOnly(
  reportId: string,
  products: ProductData[],
  months: string[],
  monthLabels: Record<string, string>,
  fileName: string,
  userId: string
): Promise<{ weekKey: WeekKey }> {
  const weekKey = getWeekKey();

  // 스냅샷 저장
  await saveWeeklySnapshot(reportId, weekKey, products, months, monthLabels, fileName, userId);

  // 활성 데이터 업데이트 (dynamic import 유지 - 순환 참조 방지)
  const { saveProducts } = await import('./productService');
  await saveProducts(reportId, products);

  // 보고서 메타데이터 업데이트
  const { updateReportMonths } = await import('./reportService');
  await updateReportMonths(reportId, months, monthLabels);

  // latestWeekKey 업데이트
  const reportRef = doc(db, 'reports', reportId);
  await setDoc(reportRef, { latestWeekKey: weekKey }, { merge: true });

  return { weekKey };
}
