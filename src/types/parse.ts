import type { ProductData } from './core';

/** 알림 */
export interface Notification {
  message: string;
  type: 'success' | 'error';
}

/** 엑셀 파싱 결과 */
export interface ParseResult {
  data: ProductData[];
  months: string[]; // 감지된 월 키 목록 (정렬됨): ["2026-01", "2026-02", ...]
  monthLabels: Record<string, string>; // key -> 표시명: { "2026-01": "1월 2026" }
  detectedYear: number; // 엑셀 헤더에서 감지된 연도
}

/**
 * 월 키("2026-01") -> 표시 라벨("1월")로 변환
 */
export function getMonthShortLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const monthNum = parseInt(parts[1], 10);
  return `${monthNum}월`;
}

/**
 * 월 키("2026-01") -> 전체 라벨("2026년 1월")로 변환
 */
export function getMonthFullLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  return `${parts[0]}년 ${parseInt(parts[1], 10)}월`;
}
