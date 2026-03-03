import React, { useState } from 'react';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { validatePassword, getPasswordStrength } from '@/utils/passwordValidator';
import type { Division } from '@/types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string, displayName: string, divisionId: string | null) => Promise<void>;
  divisions: Division[];
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  divisions,
}: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [divisionId, setDivisionId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);
  const validation = validatePassword(password);

  const resetForm = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setDivisionId('');
    setShowPassword(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.valid) {
      setError(`비밀번호: ${validation.message}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(email, password, displayName, divisionId || null);
      resetForm();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '사용자 추가에 실패했습니다';
      if (message.includes('auth/email-already-in-use')) {
        setError('이미 사용 중인 이메일입니다');
      } else if (message.includes('auth/invalid-email')) {
        setError('유효하지 않은 이메일 형식입니다');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="사용자 추가" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <UserPlus className="w-4 h-4 inline mr-1" />
          추가된 사용자는 첫 로그인 시 비밀번호 변경이 필요합니다.
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="user@example.com"
            required
          />
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="사용자 이름"
            required
            maxLength={50}
          />
        </div>

        {/* 초기 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">초기 비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="8자 이상, 대/소문자, 숫자 포함"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password && (
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
            </div>
          )}
        </div>

        {/* 소속 부문 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">소속 부문</label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">미배정</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !validation.valid || !email || !displayName}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                추가 중...
              </>
            ) : (
              '사용자 추가'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
