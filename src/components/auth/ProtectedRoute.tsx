import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Clock, XCircle } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isApproved, refreshProfile } = useAuth();
  const location = useLocation();
  const [passwordChanged, setPasswordChanged] = useState(false);

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 미인증 -> 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 승인 대기 중
  if (user.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">승인 대기 중</h1>
            <p className="text-slate-600 mb-6">
              관리자 승인을 기다리고 있습니다.
              <br />
              승인 완료 후 서비스를 이용하실 수 있습니다.
            </p>
            <p className="text-sm text-slate-500">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 거절됨
  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">가입 거절됨</h1>
            <p className="text-slate-600 mb-6">
              가입 신청이 거절되었습니다.
              <br />
              자세한 내용은 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 관리자 전용 페이지인데 관리자가 아닌 경우
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 승인된 사용자
  if (!isApproved) {
    return <Navigate to="/login" replace />;
  }

  // 비밀번호 변경 강제 (관리자 추가 계정)
  if (user.mustChangePassword && !passwordChanged) {
    return (
      <>
        {children}
        <ChangePasswordModal
          isOpen={true}
          onClose={() => {}}
          forced={true}
          onSuccess={() => {
            setPasswordChanged(true);
            refreshProfile();
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}
