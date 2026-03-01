/**
 * 전년도 비교(YoY) 유틸리티
 */

/**
 * YoY 증감률 계산
 * @returns 증감률(%) 또는 null(전년도 데이터 없음)
 */
export function calculateYoYRate(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : current < 0 ? -100 : null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * YoY 변화량 포맷팅
 */
export function formatYoYRate(rate: number | null): string {
  if (rate === null) return '-';
  const sign = rate >= 0 ? '▲' : '▼';
  return `${sign} ${Math.abs(rate).toFixed(1)}%`;
}

/**
 * YoY 색상 클래스 반환
 */
export function getYoYColorClass(rate: number | null): string {
  if (rate === null) return 'text-slate-400';
  return rate >= 0 ? 'text-emerald-600' : 'text-rose-600';
}
