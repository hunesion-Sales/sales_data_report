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
import type { Division } from '../../types';

const COLLECTION_NAME = 'divisions';

/** 기본 영업부문 (초기 seed 데이터) */
const DEFAULT_DIVISIONS = [
  { id: 'public', name: '공공사업부문', sortOrder: 0 },
  { id: 'convergence', name: '융합사업부문', sortOrder: 1 },
  { id: 'finance', name: '금융기업사업부문', sortOrder: 2 },
  { id: 'strategy', name: '전략사업부문', sortOrder: 3 },
  { id: 'maintenance', name: '서비스사업팀', sortOrder: 4 },
  { id: 'solution', name: '솔루션사업본부', sortOrder: 5 },
];

/**
 * Firestore 문서를 Division으로 변환
 */
function docToDivision(id: string, data: Record<string, unknown>): Division {
  return {
    id,
    name: data.name as string,
    sortOrder: data.sortOrder as number,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 모든 영업부문 조회 (sortOrder 정렬)
 */
export async function getDivisions(): Promise<Division[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToDivision(doc.id, doc.data()));
}

/**
 * 단일 영업부문 조회
 */
export async function getDivision(divisionId: string): Promise<Division | null> {
  const docRef = doc(db, COLLECTION_NAME, divisionId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToDivision(docSnap.id, docSnap.data());
}

/**
 * 영업부문 생성
 */
export async function createDivision(
  name: string,
  sortOrder: number
): Promise<Division> {
  const docRef = doc(collection(db, COLLECTION_NAME));
  const data = {
    name,
    sortOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, data);
  return {
    id: docRef.id,
    name,
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 영업부문 업데이트
 */
export async function updateDivision(
  divisionId: string,
  updates: Partial<Pick<Division, 'name' | 'sortOrder'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, divisionId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 영업부문 삭제
 */
export async function deleteDivision(divisionId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, divisionId);
  await deleteDoc(docRef);
}

/**
 * 기본 영업부문 초기화 (seed)
 * - 각 기본 부문이 존재하는지 확인하고 없으면 생성
 */
export async function seedDefaultDivisions(): Promise<boolean> {
  const existing = await getDivisions();
  // Map for quick lookup
  const existingMap = new Map(existing.map(d => [d.id, d]));

  const batch = writeBatch(db);
  let operationCount = 0;

  for (const div of DEFAULT_DIVISIONS) {
    const existingDiv = existingMap.get(div.id);

    if (!existingDiv) {
      // Create new
      const docRef = doc(db, COLLECTION_NAME, div.id);
      batch.set(docRef, {
        name: div.name,
        sortOrder: div.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      operationCount++;
    } else if (existingDiv.sortOrder !== div.sortOrder) {
      // Update existing if sortOrder changed
      const docRef = doc(db, COLLECTION_NAME, div.id);
      batch.update(docRef, {
        sortOrder: div.sortOrder,
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
 * 영업부문 전체 초기화 (기존 데이터 삭제 후 기본값 생성)
 * - 주의: 기존 부문 ID가 변경되므로 연관 데이터(User, Product 등)의 정합성이 깨질 수 있음
 */
export async function resetToDefaultDivisions(): Promise<void> {
  const existing = await getDivisions();
  const batch = writeBatch(db);

  // 1. 기존 데이터 전체 삭제
  for (const div of existing) {
    const docRef = doc(db, COLLECTION_NAME, div.id);
    batch.delete(docRef);
  }

  // 2. 기본 데이터 생성
  for (const div of DEFAULT_DIVISIONS) {
    const docRef = doc(db, COLLECTION_NAME, div.id);
    batch.set(docRef, {
      name: div.name,
      sortOrder: div.sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
