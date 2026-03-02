import {
  collection,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import type { ProductGroupTarget, ProductGroupTargetInput, Quarter } from '../../types';

const COLLECTION_NAME = 'product_group_targets';

/**
 * 문서 ID: {year}-{quarter}-{productGroup}
 */
function getDocId(year: number, quarter: Quarter, productGroup: string): string {
  // Firestore 문서 ID에 '/' 사용 불가 → '_' 치환
  const safeGroup = productGroup.replace(/\//g, '_');
  return `${year}-${quarter}-${safeGroup}`;
}

/**
 * Firestore 문서 → ProductGroupTarget 변환
 */
function docToTarget(id: string, data: Record<string, unknown>): ProductGroupTarget {
  return {
    id,
    year: data.year as number,
    quarter: data.quarter as Quarter,
    productGroup: data.productGroup as string,
    salesTarget: data.salesTarget as number,
    profitTarget: data.profitTarget as number,
    createdBy: data.createdBy as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 연도별 제품군 목표 조회
 */
export async function getProductGroupTargetsByYear(year: number): Promise<ProductGroupTarget[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('year', '==', year),
  );
  const snapshot = await getDocs(q);
  const QUARTER_ORDER: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  return snapshot.docs
    .map((d) => docToTarget(d.id, d.data()))
    .sort((a, b) => (QUARTER_ORDER[a.quarter] || 0) - (QUARTER_ORDER[b.quarter] || 0));
}

/**
 * 제품군 목표 일괄 upsert (batch)
 */
export async function batchUpsertProductGroupTargets(
  inputs: ProductGroupTargetInput[],
  createdBy: string
): Promise<void> {
  const batch = writeBatch(db);

  for (const input of inputs) {
    const docId = getDocId(input.year, input.quarter, input.productGroup);
    const docRef = doc(db, COLLECTION_NAME, docId);

    batch.set(docRef, {
      year: input.year,
      quarter: input.quarter,
      productGroup: input.productGroup,
      salesTarget: input.salesTarget,
      profitTarget: input.profitTarget,
      createdBy,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
}
