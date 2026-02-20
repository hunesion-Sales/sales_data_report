import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDivisions } from '../firebase/services/divisionService';
import { validatePassword, getPasswordStrength } from '../utils/passwordValidator';
import { UserPlus, AlertCircle, Loader2, CheckCircle, Check, X as XIcon } from 'lucide-react';
import type { Division } from '../types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, loading, error, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 비밀번호 강도 분석
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  // 영업부문 목록 로드
  useEffect(() => {
    getDivisions().then(setDivisions).catch(console.error);
  }, []);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (user && !loading && user.status === 'approved') {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    // 비밀번호 강도 검증
    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      setLocalError(`비밀번호: ${pwValidation.message}`);
      return;
    }

    // 비밀번호 확인
    if (password !== passwordConfirm) {
      setLocalError('비밀번호가 일치하지 않습니다');
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password, displayName, divisionId || undefined);
      setSuccess(true);
    } catch {
      // 에러는 AuthContext에서 처리
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

  // 가입 성공 메시지
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">가입 신청 완료</h1>
            <p className="text-slate-600 mb-6">
              관리자 승인 후 로그인이 가능합니다.
              <br />
              승인 완료 시 이메일로 안내드립니다.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 transition-all"
            >
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">회원가입</h1>
            <p className="text-slate-600 mt-2">매출 보고 시스템 가입 신청</p>
          </div>

          {/* 에러 메시지 */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{displayError}</p>
            </div>
          )}

          {/* 가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1.5">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                이메일 <span className="text-red-500">*</span>
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
              <label htmlFor="division" className="block text-sm font-medium text-slate-700 mb-1.5">
                소속 부문
              </label>
              <select
                id="division"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all bg-white"
              >
                <option value="">선택 안함</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="8자 이상 (대/소문자, 숫자 포함)"
              />
              {/* 비밀번호 강도 표시 */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{passwordStrength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {passwordStrength.checks.map(check => (
                      <span key={check.label} className={`flex items-center gap-1 text-xs ${check.passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {check.passed ? <Check className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        {check.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                placeholder="비밀번호 재입력"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  가입 신청 중...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  가입 신청
                </>
              )}
            </button>
          </form>

          {/* 로그인 링크 */}
          <p className="mt-6 text-center text-sm text-slate-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
