import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import type { QuarterlyTarget, QuarterlyTargetInput, Quarter } from '../../types';

const COLLECTION_NAME = 'targets';

/**
 * 문서 ID 생성: {year}-{quarter}-{divisionId}
 */
function getTargetDocId(year: number, quarter: Quarter, divisionId: string): string {
  return `${year}-${quarter}-${divisionId}`;
}

/**
 * Firestore 문서를 QuarterlyTarget으로 변환
 */
function docToTarget(id: string, data: Record<string, unknown>): QuarterlyTarget {
  return {
    id,
    year: data.year as number,
    quarter: data.quarter as Quarter,
    divisionId: data.divisionId as string,
    salesTarget: data.salesTarget as number,
    profitTarget: data.profitTarget as number | undefined,
    createdBy: data.createdBy as string,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 연도별 목표 조회
 */
export async function getTargetsByYear(year: number): Promise<QuarterlyTarget[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('year', '==', year),
    orderBy('quarter', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToTarget(doc.id, doc.data()));
}

/**
 * 연도 + 분기별 목표 조회
 */
export async function getTargetsByYearQuarter(year: number, quarter: Quarter): Promise<QuarterlyTarget[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('year', '==', year),
    where('quarter', '==', quarter),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToTarget(doc.id, doc.data()));
}

/**
 * 목표 upsert (setDoc merge)
 */
export async function upsertTarget(input: QuarterlyTargetInput, createdBy: string): Promise<void> {
  const docId = getTargetDocId(input.year, input.quarter, input.divisionId);
  const docRef = doc(db, COLLECTION_NAME, docId);

  await setDoc(docRef, {
    year: input.year,
    quarter: input.quarter,
    divisionId: input.divisionId,
    salesTarget: input.salesTarget,
    ...(input.profitTarget !== undefined && { profitTarget: input.profitTarget }),
    createdBy,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * 목표 일괄 upsert (batch)
 */
export async function batchUpsertTargets(inputs: QuarterlyTargetInput[], createdBy: string): Promise<void> {
  const batch = writeBatch(db);

  for (const input of inputs) {
    const docId = getTargetDocId(input.year, input.quarter, input.divisionId);
    const docRef = doc(db, COLLECTION_NAME, docId);

    batch.set(docRef, {
      year: input.year,
      quarter: input.quarter,
      divisionId: input.divisionId,
      salesTarget: input.salesTarget,
      ...(input.profitTarget !== undefined && { profitTarget: input.profitTarget }),
      createdBy,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  await batch.commit();
}

/**
 * 단일 목표 삭제
 */
export async function deleteTarget(year: number, quarter: Quarter, divisionId: string): Promise<void> {
  const docId = getTargetDocId(year, quarter, divisionId);
  const docRef = doc(db, COLLECTION_NAME, docId);
  await deleteDoc(docRef);
}
