import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  getUserProfile,
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
} from '../firebase/services/authService';
import { seedDefaultDivisions } from '../firebase/services/divisionService';
import { logger } from '@/utils/logger';
import type { UserProfile } from '../types';

// 비활동 타임아웃: 30분 (밀리초)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  /** Auth 상태가 결정되었는지 (로그인/비로그인 확인 완료) */
  authReady: boolean;
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
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initDone = useRef(false);

  // 앱 초기화 시 기본 부문 seed (한 번만 실행)
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    // 인증 없이도 실행될 수 있으므로 에러 무시
    seedDefaultDivisions().catch(() => {
      // divisions seed 실패해도 앱은 계속 동작
    });
  }, []);

  // Firebase Auth 상태 감시 - 안전한 패턴
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;

      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          // 인증된 상태에서만 프로필 조회 시도
          const profile = await getUserProfile(fbUser.uid);
          if (!cancelled) {
            setUser(profile);
          }
        } catch (err) {
          // 프로필이 없을 수 있음 (아직 생성 전) - 이건 에러가 아님
          logger.warn('Profile not found or error:', err);
          if (!cancelled) {
            setUser(null);
          }
        }
      } else {
        // 로그아웃 상태
        setUser(null);
      }

      if (!cancelled) {
        setLoading(false);
        setAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
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

  // 비활동 타임아웃: 30분 동안 마우스/키보드/터치 없으면 자동 로그아웃
  useEffect(() => {
    if (!firebaseUser) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        logger.warn('세션 타임아웃: 30분 비활동으로 자동 로그아웃');
        await firebaseLogout();
        setUser(null);
        setFirebaseUser(null);
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [firebaseUser]);

  const isAdmin = user?.role === 'admin';
  const isApproved = user?.status === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        authReady,
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
