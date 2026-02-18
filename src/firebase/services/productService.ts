import {
  collection,
  doc,
  getDocs,
  writeBatch,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config';
import type { ProductData, MonthData } from '@/types';

/**
 * 보고서의 전체 제품 데이터 조회
 */
export async function getProducts(reportId: string): Promise<ProductData[]> {
  const ref = collection(db, 'reports', reportId, 'products');
  // 디버깅: 정렬 조건 제거하고 기본 가져오기
  // const q = query(ref, orderBy('sortOrder', 'asc'));
  const snap = await getDocs(ref);

  console.log(`[getProducts] Fetched ${snap.size} docs from ${reportId}/products`);

  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      product: data.product as string,
      division: data.division as string | undefined,
      months: data.months as Record<string, MonthData>,
      sortOrder: data.sortOrder, // Add for checking
    } as ProductData;
  });

  // Client-side sorting as fallback
  return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/**
 * 제품 데이터 일괄 저장 (batch write)
 * 기존 데이터를 모두 삭제 후 새로 저장
 */
export async function saveProducts(
  reportId: string,
  products: ProductData[],
): Promise<void> {
  const colRef = collection(db, 'reports', reportId, 'products');

  // 기존 문서 전체 삭제
  const existing = await getDocs(colRef);
  const deleteBatch = writeBatch(db);
  existing.docs.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();

  // 새 데이터 일괄 저장 (500건 단위 batch 제한 대응)
  const BATCH_LIMIT = 450;
  for (let i = 0; i < products.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = products.slice(i, i + BATCH_LIMIT);

    chunk.forEach((product, idx) => {
      const docRef = doc(colRef);
      // division 필드가 undefined일 경우 제외되지 않도록 처리 (필요시)
      // Firestore는 undefined 필드를 무시함
      batch.set(docRef, {
        product: product.product,
        ...(product.division && { division: product.division }),
        months: product.months,
        sortOrder: i + idx,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

/**
 * 개별 제품 추가
 */
export async function addProduct(
  reportId: string,
  product: ProductData,
  sortOrder: number,
): Promise<string> {
  const colRef = collection(db, 'reports', reportId, 'products');
  const docRef = doc(colRef);

  const batch = writeBatch(db);
  batch.set(docRef, {
    product: product.product,
    ...(product.division && { division: product.division }),
    months: product.months,
    sortOrder,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  return docRef.id;
}

/**
 * 개별 제품 삭제
 */
export async function deleteProduct(
  reportId: string,
  productId: string,
): Promise<void> {
  const ref = doc(db, 'reports', reportId, 'products', productId);
  await deleteDoc(ref);
}
