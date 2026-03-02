import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import type { IndustryGroup, IndustryGroupInput } from '../../types';
import { DEFAULT_INDUSTRY_GROUPS } from '@/utils/industryGroupMapper';

const COLLECTION_NAME = 'industry_groups';

/**
 * Firestore 문서를 IndustryGroup으로 변환
 */
function docToIndustryGroup(id: string, data: Record<string, unknown>): IndustryGroup {
  return {
    id,
    name: data.name as string,
    keywords: (data.keywords as string[]) || [],
    sortOrder: data.sortOrder as number,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 모든 산업군 조회 (sortOrder 정렬)
 */
export async function getIndustryGroups(): Promise<IndustryGroup[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToIndustryGroup(d.id, d.data()));
}

/**
 * 단일 산업군 조회
 */
export async function getIndustryGroup(groupId: string): Promise<IndustryGroup | null> {
  const docRef = doc(db, COLLECTION_NAME, groupId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToIndustryGroup(docSnap.id, docSnap.data());
}

/**
 * 산업군 생성
 */
export async function createIndustryGroup(input: IndustryGroupInput): Promise<IndustryGroup> {
  const docRef = doc(collection(db, COLLECTION_NAME));
  const data = {
    name: input.name,
    keywords: input.keywords,
    sortOrder: input.sortOrder ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, data);
  return {
    id: docRef.id,
    name: input.name,
    keywords: input.keywords,
    sortOrder: input.sortOrder ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 산업군 수정
 */
export async function updateIndustryGroup(
  groupId: string,
  updates: Partial<Pick<IndustryGroup, 'name' | 'keywords' | 'sortOrder'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, groupId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 산업군 삭제
 */
export async function deleteIndustryGroup(groupId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, groupId);
  await deleteDoc(docRef);
}

/**
 * 기본 산업군 시드 데이터 초기화
 */
export async function seedDefaultIndustryGroups(): Promise<boolean> {
  const existing = await getIndustryGroups();
  const existingMap = new Map(existing.map(g => [g.name, g]));

  const batch = writeBatch(db);
  let operationCount = 0;

  for (const group of DEFAULT_INDUSTRY_GROUPS) {
    const existingGroup = existingMap.get(group.name);

    if (!existingGroup) {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        name: group.name,
        keywords: group.keywords,
        sortOrder: group.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      operationCount++;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    return true;
  }

  return false;
}

/**
 * 산업군 전체 초기화 (기존 삭제 후 기본값 생성)
 */
export async function resetToDefaultIndustryGroups(): Promise<void> {
  const existing = await getIndustryGroups();
  const batch = writeBatch(db);

  for (const group of existing) {
    batch.delete(doc(db, COLLECTION_NAME, group.id));
  }

  for (const group of DEFAULT_INDUSTRY_GROUPS) {
    const docRef = doc(collection(db, COLLECTION_NAME));
    batch.set(docRef, {
      name: group.name,
      keywords: group.keywords,
      sortOrder: group.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
