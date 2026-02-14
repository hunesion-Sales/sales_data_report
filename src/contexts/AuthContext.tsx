import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  getUserProfile,
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
} from '../firebase/services/authService';
import { seedDefaultDivisions } from '../firebase/services/divisionService';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, divisionId?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 앱 초기화 시 기본 부문 seed
  useEffect(() => {
    seedDefaultDivisions().catch(console.error);
  }, []);

  // Firebase Auth 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          setUser(profile);
        } catch (err) {
          console.error('Failed to get user profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await loginWithEmail(email, password);
      setUser(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다';
      setError(translateFirebaseError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    divisionId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await registerWithEmail(email, password, displayName, divisionId || null);
      setUser(profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다';
      setError(translateFirebaseError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isApproved = user?.status === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAdmin,
        isApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Firebase 에러 메시지 한국어 번역
 */
function translateFirebaseError(message: string): string {
  if (message.includes('auth/invalid-email')) {
    return '유효하지 않은 이메일 형식입니다';
  }
  if (message.includes('auth/user-disabled')) {
    return '비활성화된 계정입니다';
  }
  if (message.includes('auth/user-not-found')) {
    return '등록되지 않은 이메일입니다';
  }
  if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다';
  }
  if (message.includes('auth/email-already-in-use')) {
    return '이미 사용 중인 이메일입니다';
  }
  if (message.includes('auth/weak-password')) {
    return '비밀번호는 6자 이상이어야 합니다';
  }
  if (message.includes('auth/too-many-requests')) {
    return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요';
  }
  return message;
}
