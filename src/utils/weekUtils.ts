/**
 * ISO 8601 주차 관련 유틸리티 함수
 */

import type { WeekKey } from '@/types';

/**
 * ISO 8601 주차 번호 계산
 * @param date 날짜
 * @returns 주차 번호 (1-53)
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO 주의 시작은 월요일이므로 일요일(0)을 7로 변환
  const dayNum = d.getUTCDay() || 7;
  // 목요일로 이동 (ISO 주 정의: 목요일이 속한 연도의 주)
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNum;
}

/**
 * ISO 8601 주차의 연도 계산 (12월 말/1월 초 경계 처리)
 * @param date 날짜
 * @returns ISO 주차 기준 연도
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * ISO 주차 키 생성 ("YYYY-Wnn")
 * @param date 날짜 (기본값: 현재)
 * @returns 주차 키 (예: "2026-W07")
 */
export function getWeekKey(date: Date = new Date()): WeekKey {
  const year = getISOWeekYear(date);
  const week = getISOWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * 주차 키 파싱
 * @param weekKey 주차 키 (예: "2026-W07")
 * @returns { year, week } 또는 null (파싱 실패 시)
 */
export function parseWeekKey(weekKey: WeekKey): { year: number; week: number } | null {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10),
  };
}

/**
 * 주차 키에서 날짜 범위 계산 (월요일~일요일)
 * @param weekKey 주차 키
 * @returns { start, end } 날짜 범위
 */
export function getWeekDateRange(weekKey: WeekKey): { start: Date; end: Date } | null {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return null;

  const { year, week } = parsed;

  // 해당 연도의 1월 4일 (항상 첫 주에 속함)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;

  // 첫 주의 월요일 계산
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

  // 해당 주의 월요일
  const start = new Date(firstMonday);
  start.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

  // 해당 주의 일요일
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return { start, end };
}

/**
 * 주차 라벨 생성
 * @param weekKey 주차 키
 * @returns 라벨 (예: "2026년 7주차 (2/10~2/16)")
 */
export function getWeekLabel(weekKey: WeekKey): string {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;

  const range = getWeekDateRange(weekKey);
  if (!range) return `${parsed.year}년 ${parsed.week}주차`;

  const startStr = `${range.start.getUTCMonth() + 1}/${range.start.getUTCDate()}`;
  const endStr = `${range.end.getUTCMonth() + 1}/${range.end.getUTCDate()}`;

  return `${parsed.year}년 ${parsed.week}주차 (${startStr}~${endStr})`;
}

/**
 * 주차 라벨 짧은 버전
 * @param weekKey 주차 키
 * @returns 짧은 라벨 (예: "W07 (2/10~2/16)")
 */
export function getWeekShortLabel(weekKey: WeekKey): string {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;

  const range = getWeekDateRange(weekKey);
  if (!range) return `W${parsed.week.toString().padStart(2, '0')}`;

  const startStr = `${range.start.getUTCMonth() + 1}/${range.start.getUTCDate()}`;
  const endStr = `${range.end.getUTCMonth() + 1}/${range.end.getUTCDate()}`;

  return `W${parsed.week.toString().padStart(2, '0')} (${startStr}~${endStr})`;
}

/**
 * 주차 키 정렬 (최신순)
 * @param weekKeys 주차 키 배열
 * @returns 정렬된 배열 (최신이 먼저)
 */
export function sortWeekKeysDesc(weekKeys: WeekKey[]): WeekKey[] {
  return [...weekKeys].sort((a, b) => {
    const parsedA = parseWeekKey(a);
    const parsedB = parseWeekKey(b);
    if (!parsedA || !parsedB) return 0;

    // 연도 비교
    if (parsedA.year !== parsedB.year) {
      return parsedB.year - parsedA.year;
    }
    // 주차 비교
    return parsedB.week - parsedA.week;
  });
}

/**
 * 주차 키 정렬 (오래된 순)
 * @param weekKeys 주차 키 배열
 * @returns 정렬된 배열 (오래된 것이 먼저)
 */
export function sortWeekKeysAsc(weekKeys: WeekKey[]): WeekKey[] {
  return [...weekKeys].sort((a, b) => {
    const parsedA = parseWeekKey(a);
    const parsedB = parseWeekKey(b);
    if (!parsedA || !parsedB) return 0;

    if (parsedA.year !== parsedB.year) {
      return parsedA.year - parsedB.year;
    }
    return parsedA.week - parsedB.week;
  });
}
