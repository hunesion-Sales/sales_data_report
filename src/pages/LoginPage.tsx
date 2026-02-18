import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import hSRLogo from '@/assets/HUNESION_Huni.png';
import salesBg from '@/assets/sales_growth_bg.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
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

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
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
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  로그인 중...
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
