import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config';
import type { UserProfile, UserRole, UserStatus } from '../../types';

const ADMIN_EMAIL = 'hclim@hunesion.com';

/**
 * Firestore users/{uid} 문서를 UserProfile로 변환
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
 * 사용자 프로필 조회
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToUserProfile(uid, docSnap.data());
}

/**
 * 사용자 프로필 생성 또는 업데이트
 * - hclim@hunesion.com은 자동으로 admin + approved
 */
export async function createUserProfile(
  user: User,
  displayName: string,
  divisionId: string | null = null
): Promise<UserProfile> {
  const isAdmin = user.email === ADMIN_EMAIL;
  const role: UserRole = isAdmin ? 'admin' : 'user';
  const status: UserStatus = isAdmin ? 'approved' : 'pending';

  const profileData = {
    uid: user.uid,
    email: user.email || '',
    displayName,
    divisionId,
    role,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), profileData);

  return {
    ...profileData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserProfile;
}

/**
 * 회원가입 (이메일/비밀번호)
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  divisionId: string | null = null
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firebase Auth displayName 업데이트
  await updateProfile(user, { displayName });

  // Firestore 프로필 생성
  const profile = await createUserProfile(user, displayName, divisionId);
  return profile;
}

/**
 * 로그인 (이메일/비밀번호)
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 기존 프로필 조회
  let profile = await getUserProfile(user.uid);

  // 프로필이 없으면 생성 (기존 Firebase Auth 사용자 마이그레이션)
  if (!profile) {
    profile = await createUserProfile(user, user.displayName || email.split('@')[0]);
  }

  return profile;
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * 사용자 승인 (관리자 전용)
 */
export async function approveUser(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
}

/**
 * 사용자 거절 (관리자 전용)
 */
export async function rejectUser(uid: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

/**
 * 사용자 역할 변경 (관리자 전용)
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 사용자 부문 변경
 */
export async function updateUserDivision(uid: string, divisionId: string): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    divisionId,
    updatedAt: serverTimestamp(),
  });
}
