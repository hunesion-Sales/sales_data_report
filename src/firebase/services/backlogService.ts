import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import type {
  BacklogProductData,
  BacklogDivisionData,
  BacklogIndustryGroupData,
  BacklogMeta,
  MonthData,
} from '../../types';

const COLLECTION_NAME = 'backlog';

// ─── 메타 ─────────────────────────────────

/**
 * 수주잔액 메타 정보 저장/업데이트
 */
export async function saveBacklogMeta(
  year: number,
  meta: Omit<BacklogMeta, 'year'>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, String(year));
  await setDoc(docRef, {
    year,
    ...meta,
    uploadedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── 제품별 ─────────────────────────────────

/**
 * 수주잔액 제품별 데이터 저장 (기존 데이터 교체)
 */
export async function saveBacklogProducts(
  year: number,
  products: BacklogProductData[]
): Promise<void> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'products');

  // 기존 데이터 삭제 후 새로 저장
  const existing = await getDocs(collRef);
  const batch = writeBatch(db);

  for (const d of existing.docs) {
    batch.delete(d.ref);
  }

  for (const product of products) {
    const docRef = doc(collRef);
    batch.set(docRef, {
      product: product.product,
      months: product.months,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * 수주잔액 제품별 데이터 조회
 */
export async function getBacklogProducts(year: number): Promise<BacklogProductData[]> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'products');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      product: data.product as string,
      months: data.months as Record<string, MonthData>,
    };
  });
}

// ─── 부문별 ─────────────────────────────────

/**
 * 수주잔액 부문별 데이터 저장
 */
export async function saveBacklogDivisions(
  year: number,
  divisions: BacklogDivisionData[]
): Promise<void> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'divisions');

  const existing = await getDocs(collRef);
  const batch = writeBatch(db);

  for (const d of existing.docs) {
    batch.delete(d.ref);
  }

  for (const division of divisions) {
    const docRef = doc(collRef);
    batch.set(docRef, {
      division: division.division,
      months: division.months,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * 수주잔액 부문별 데이터 조회
 */
export async function getBacklogDivisions(year: number): Promise<BacklogDivisionData[]> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'divisions');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      division: data.division as string,
      months: data.months as Record<string, MonthData & { achievementRate?: number }>,
    };
  });
}

// ─── 산업군별 ─────────────────────────────────

/**
 * 수주잔액 산업군별 데이터 저장
 */
export async function saveBacklogIndustryGroups(
  year: number,
  groups: BacklogIndustryGroupData[]
): Promise<void> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'industry_groups');

  const existing = await getDocs(collRef);
  const batch = writeBatch(db);

  for (const d of existing.docs) {
    batch.delete(d.ref);
  }

  for (const group of groups) {
    const docRef = doc(collRef);
    batch.set(docRef, {
      industryGroupName: group.industryGroupName,
      months: group.months,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * 수주잔액 산업군별 데이터 조회
 */
export async function getBacklogIndustryGroups(year: number): Promise<BacklogIndustryGroupData[]> {
  const collRef = collection(db, COLLECTION_NAME, String(year), 'industry_groups');
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      industryGroupName: data.industryGroupName as string,
      months: data.months as Record<string, MonthData>,
    };
  });
}
