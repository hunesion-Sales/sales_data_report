import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { validatePassword, getPasswordStrength } from '@/utils/passwordValidator';
import { changeOwnPassword } from '@/firebase/services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  forced?: boolean;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  forced = false,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(newPassword);
  const validation = validatePassword(newPassword);

  const handleClose = () => {
    if (forced) return;
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (currentPassword === newPassword) {
      setError('현재 비밀번호와 다른 비밀번호를 입력해주세요');
      return;
    }

    try {
      setIsSubmitting(true);
      await changeOwnPassword(currentPassword, newPassword);
      resetForm();
      onSuccess?.();
      if (!forced) onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다';
      if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
        setError('현재 비밀번호가 올바르지 않습니다');
      } else if (message.includes('auth/too-many-requests')) {
        setError('너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={forced ? '비밀번호 변경 필요' : '비밀번호 변경'}
      size="sm"
      closeOnOverlayClick={!forced}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {forced && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            관리자가 생성한 계정입니다. 보안을 위해 비밀번호를 변경해주세요.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 현재 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="현재 비밀번호 입력"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="새 비밀번호 입력"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 비밀번호 강도 표시 */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strength.score ? strength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">{strength.label}</p>
              <ul className="space-y-0.5">
                {strength.checks.map((check) => (
                  <li
                    key={check.label}
                    className={`text-xs ${check.passed ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {check.passed ? '✓' : '○'} {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-300'
              }`}
              placeholder="새 비밀번호 다시 입력"
              required
              autoComplete="new-password"
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          {!forced && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !validation.valid || newPassword !== confirmPassword}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                변경 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
