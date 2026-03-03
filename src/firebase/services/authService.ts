import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../config';
import type { UserProfile, UserRole, UserStatus } from '../../types';
import { getDivision } from './divisionService';
import { logger } from '@/utils/logger';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

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
    mustChangePassword: (data.mustChangePassword as boolean) || false,
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

  const profile = docToUserProfile(uid, docSnap.data());

  if (profile.divisionId) {
    try {
      const division = await getDivision(profile.divisionId);
      if (division) {
        profile.divisionName = division.name;
      }
    } catch (error) {
      logger.warn('Failed to fetch division name:', error);
    }
  }

  return profile;
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
  } else {
    // 관리자 이메일인 경우 강제로 권한/상태 업데이트 (기존 계정 권한 상승)
    const isAdminEmail = email === ADMIN_EMAIL;
    if (isAdminEmail && (profile.role !== 'admin' || profile.status !== 'approved')) {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        role: 'admin',
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      // 업데이트된 프로필 반환
      profile = {
        ...profile,
        role: 'admin',
        status: 'approved',
        updatedAt: new Date(),
      };
    }
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

/**
 * 관리자가 사용자 추가 (Secondary App 패턴)
 * - 관리자 세션을 유지하면서 새 계정 생성
 * - Secondary App의 Firestore로 문서 생성 (새 사용자 인증 컨텍스트 사용)
 */
export async function createUserByAdmin(
  email: string,
  password: string,
  displayName: string,
  divisionId: string | null = null
): Promise<UserProfile> {
  const secondaryApp = initializeApp(firebaseConfig, 'secondary');
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName });

    const profileData = {
      uid: newUser.uid,
      email: newUser.email || email,
      displayName,
      divisionId,
      role: 'user' as UserRole,
      status: 'approved' as UserStatus,
      mustChangePassword: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Secondary DB 사용: request.auth.uid == newUser.uid 으로 규칙 통과
    await setDoc(doc(secondaryDb, 'users', newUser.uid), profileData);

    await secondaryAuth.signOut();

    return {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;
  } finally {
    await deleteApp(secondaryApp);
  }
}

/**
 * 비밀번호 초기화 메일 발송 + mustChangePassword 설정
 */
export async function sendPasswordReset(uid: string, email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);

  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    mustChangePassword: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 본인 비밀번호 변경 (재인증 후 변경)
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('로그인된 사용자가 없습니다');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);

  const docRef = doc(db, 'users', user.uid);
  await updateDoc(docRef, {
    mustChangePassword: false,
    updatedAt: serverTimestamp(),
  });
}
