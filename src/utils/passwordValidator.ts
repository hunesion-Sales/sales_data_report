export interface PasswordValidation {
  valid: boolean;
  message: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: PasswordCheck[];
}

interface PasswordCheck {
  label: string;
  passed: boolean;
}

/**
 * 비밀번호 유효성 검증 (모든 조건 충족 필요)
 */
export function validatePassword(password: string): PasswordValidation {
  if (password.length < 8) {
    return { valid: false, message: '8자 이상이어야 합니다' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '대문자를 포함해야 합니다' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '소문자를 포함해야 합니다' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '숫자를 포함해야 합니다' };
  }
  return { valid: true, message: '' };
}

/**
 * 비밀번호 강도 분석 (실시간 UI 표시용)
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordCheck[] = [
    { label: '8자 이상', passed: password.length >= 8 },
    { label: '대문자 포함', passed: /[A-Z]/.test(password) },
    { label: '소문자 포함', passed: /[a-z]/.test(password) },
    { label: '숫자 포함', passed: /[0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.passed).length;

  const levels: Record<number, { label: string; color: string }> = {
    0: { label: '', color: 'bg-slate-200' },
    1: { label: '매우 약함', color: 'bg-red-500' },
    2: { label: '약함', color: 'bg-orange-500' },
    3: { label: '보통', color: 'bg-amber-500' },
    4: { label: '강함', color: 'bg-emerald-500' },
  };

  const level = levels[score];

  return { score, label: level.label, color: level.color, checks };
}
