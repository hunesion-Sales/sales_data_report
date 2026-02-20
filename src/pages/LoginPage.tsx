import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Loader2, Lock } from 'lucide-react';
import hSRLogo from '@/assets/HUNESION_Huni.png';
import salesBg from '@/assets/sales_growth_bg.png';

// 로그인 시도 제한 설정
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5분 (밀리초)
const STORAGE_KEY = 'login_attempts';

interface LoginAttempts {
  count: number;
  lockedUntil: number | null;
}

function getLoginAttempts(): LoginAttempts {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { count: 0, lockedUntil: null };
}

function saveLoginAttempts(attempts: LoginAttempts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

function clearLoginAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const isLockedOut = lockoutRemaining > 0;

  // 잠금 타이머 확인
  const checkLockout = useCallback(() => {
    const stored = getLoginAttempts();
    setAttempts(stored.count);
    if (stored.lockedUntil && Date.now() < stored.lockedUntil) {
      setLockoutRemaining(Math.ceil((stored.lockedUntil - Date.now()) / 1000));
    } else if (stored.lockedUntil) {
      // 잠금 해제됨
      clearLoginAttempts();
      setAttempts(0);
      setLockoutRemaining(0);
    }
  }, []);

  // 잠금 카운트다운
  useEffect(() => {
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [checkLockout]);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut) return;

    clearError();
    setSubmitting(true);

    try {
      await login(email, password);
      // 로그인 성공 시 시도 횟수 초기화
      clearLoginAttempts();
      setAttempts(0);
      navigate('/');
    } catch {
      // 로그인 실패 시 시도 횟수 증가
      const stored = getLoginAttempts();
      const newCount = stored.count + 1;
      const newAttempts: LoginAttempts = {
        count: newCount,
        lockedUntil: newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : null,
      };
      saveLoginAttempts(newAttempts);
      setAttempts(newCount);
      if (newAttempts.lockedUntil) {
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={salesBg} alt="Background" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-slate-100/50" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={hSRLogo} alt="HSR Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">HSR (Huni Sales Report System)</h1>
            <p className="text-slate-600 mt-2">휴네시온 솔루션사업본부 매출 보고 시스템</p>
          </div>

          {/* 잠금 상태 */}
          {isLockedOut && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">로그인이 일시 잠금되었습니다</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {Math.floor(lockoutRemaining / 60)}분 {lockoutRemaining % 60}초 후 다시 시도해주세요
                </p>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && !isLockedOut && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                {attempts > 0 && attempts < MAX_ATTEMPTS && (
                  <p className="text-xs text-red-500 mt-0.5">
                    로그인 시도 {attempts}/{MAX_ATTEMPTS}회 ({MAX_ATTEMPTS - attempts}회 남음)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="example@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || isLockedOut}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  로그인 중...
                </>
              ) : isLockedOut ? (
                <>
                  <Lock className="w-5 h-5" />
                  잠금됨
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <p className="mt-6 text-center text-sm text-slate-600">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-700">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
