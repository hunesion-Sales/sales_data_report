import type { MonthData, DashboardPeriodSelection } from '@/types';
import {
  getMonthsInQuarter,
  getMonthsInHalfYear,
  getMonthsInYear,
} from '@/utils/periodUtils';

/**
 * 선택한 기간에 해당하는 월 키 목록 반환 (다중 선택 지원)
 */
export function getMonthKeysForPeriod(selection: DashboardPeriodSelection): string[] {
  const { periodType, year, months, quarters, halfYears } = selection;
  const monthSet = new Set<string>();

  switch (periodType) {
    case 'monthly':
      if (months && months.length > 0) {
        months.forEach(m => monthSet.add(`${year}-${String(m).padStart(2, '0')}`));
      } else {
        getMonthsInYear(year).forEach(m => monthSet.add(m));
      }
      break;
    case 'quarterly':
      if (quarters && quarters.length > 0) {
        quarters.forEach(q => {
          getMonthsInQuarter(year, q).forEach(m => monthSet.add(m));
        });
      } else {
        getMonthsInYear(year).forEach(m => monthSet.add(m));
      }
      break;
    case 'semi-annual':
      if (halfYears && halfYears.length > 0) {
        halfYears.forEach(h => {
          getMonthsInHalfYear(year, h).forEach(m => monthSet.add(m));
        });
      } else {
        getMonthsInYear(year).forEach(m => monthSet.add(m));
      }
      break;
    case 'annual':
    default:
      getMonthsInYear(year).forEach(m => monthSet.add(m));
  }

  return Array.from(monthSet).sort();
}

/**
 * 선택 기간 이후 ~ 12월까지의 미래 월 키 목록 반환 (수주잔액 집계용)
 * 수주잔액은 선택기간+1 ~ 12월
 */
export function getFutureMonthKeys(selection: DashboardPeriodSelection): string[] {
  const { year } = selection;
  const periodMonths = getMonthKeysForPeriod(selection);
  const allMonths = getMonthsInYear(year);

  if (periodMonths.length === 0) return allMonths;

  // 선택 기간의 마지막 월 다음부터
  const lastPeriodMonth = periodMonths[periodMonths.length - 1];
  const lastMonthIdx = allMonths.indexOf(lastPeriodMonth);

  if (lastMonthIdx === -1 || lastMonthIdx >= allMonths.length - 1) return [];

  return allMonths.slice(lastMonthIdx + 1);
}

/**
 * 월별 MonthData에서 특정 월 키들의 합계 계산
 */
export function sumMonthData(
  months: Record<string, MonthData>,
  monthKeys: string[]
): { sales: number; cost: number; profit: number } {
  let sales = 0;
  let cost = 0;

  for (const key of monthKeys) {
    const data = months[key];
    if (data) {
      sales += data.sales;
      cost += data.cost;
    }
  }

  return { sales, cost, profit: sales - cost };
}

/**
 * 실적 + 수주잔액 합산하여 예상 실적 계산
 */
export function calculateExpectedPerformance(
  actualSales: number,
  backlogSales: number
): number {
  return actualSales + backlogSales;
}

/**
 * 달성율 계산 (%)
 * target이 0이면 0 반환
 */
export function calculateAchievementRate(actual: number, target: number): number {
  if (target === 0) return 0;
  return (actual / target) * 100;
}

/**
 * 성장율 계산 (%)
 * previousValue가 0이면 currentValue > 0일 때 100, 아니면 0 반환
 */
export function calculateGrowthRate(currentValue: number, previousValue: number): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}
