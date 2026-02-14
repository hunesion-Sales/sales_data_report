import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { UserProfile, UserRole, UserStatus } from '../../types';

const COLLECTION_NAME = 'users';

/**
 * Firestore 문서를 UserProfile로 변환
 */
function docToUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: data.email as string,
    displayName: data.displayName as string,
    divisionId: (data.divisionId as string) || null,
    role: data.role as UserRole,
    status: data.status as UserStatus,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 모든 사용자 목록 조회 (createdAt 정렬)
 */
export async function getUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToUserProfile(doc.id, doc.data()));
}

/**
 * 상태별 사용자 조회
 */
export async function getUsersByStatus(status: UserStatus): Promise<UserProfile[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToUserProfile(doc.id, doc.data()));
}

/**
 * 부문별 사용자 조회
 */
export async function getUsersByDivision(divisionId: string): Promise<UserProfile[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('divisionId', '==', divisionId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToUserProfile(doc.id, doc.data()));
}

/**
 * 승인 대기 중인 사용자 수 조회
 */
export async function getPendingUsersCount(): Promise<number> {
  const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.size;
}
