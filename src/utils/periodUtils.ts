import type { Quarter, HalfYear, PeriodType, PeriodInfo, PeriodData, ProcessedProduct } from '@/types';

/**
 * 월 키("2026-01")에서 분기 반환
 */
export function getQuarterForMonth(monthKey: string): Quarter {
  const month = parseInt(monthKey.split('-')[1], 10);
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

/**
 * 월 키("2026-01")에서 반기 반환
 */
export function getHalfYearForMonth(monthKey: string): HalfYear {
  const month = parseInt(monthKey.split('-')[1], 10);
  return month <= 6 ? 'H1' : 'H2';
}

/**
 * 월 키("2026-01")에서 연도 반환
 */
export function getYearFromMonth(monthKey: string): number {
  return parseInt(monthKey.split('-')[0], 10);
}

/**
 * 특정 연도의 분기에 해당하는 월 목록 반환
 */
export function getMonthsInQuarter(year: number, quarter: Quarter): string[] {
  const quarterStartMonth: Record<Quarter, number> = {
    Q1: 1,
    Q2: 4,
    Q3: 7,
    Q4: 10,
  };
  const start = quarterStartMonth[quarter];
  return [
    `${year}-${String(start).padStart(2, '0')}`,
    `${year}-${String(start + 1).padStart(2, '0')}`,
    `${year}-${String(start + 2).padStart(2, '0')}`,
  ];
}

/**
 * 특정 연도의 반기에 해당하는 월 목록 반환
 */
export function getMonthsInHalfYear(year: number, halfYear: HalfYear): string[] {
  const start = halfYear === 'H1' ? 1 : 7;
  return Array.from({ length: 6 }, (_, i) =>
    `${year}-${String(start + i).padStart(2, '0')}`
  );
}

/**
 * 특정 연도의 전체 월 목록 반환
 */
export function getMonthsInYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );
}

/**
 * 기간 유형에 따른 기간 정보 목록 반환
 */
export function getPeriodInfoList(year: number, periodType: PeriodType, availableMonths: string[]): PeriodInfo[] {
  const yearMonths = availableMonths.filter(m => getYearFromMonth(m) === year);

  switch (periodType) {
    case 'monthly':
      return yearMonths.map(m => ({
        key: m,
        label: `${parseInt(m.split('-')[1], 10)}월`,
        months: [m],
      }));

    case 'quarterly':
      const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
      return quarters
        .map(q => {
          const qMonths = getMonthsInQuarter(year, q);
          const available = qMonths.filter(m => yearMonths.includes(m));
          return {
            key: q,
            label: `${q.replace('Q', '')}분기`,
            months: available,
          };
        })
        .filter(p => p.months.length > 0);

    case 'semi-annual':
      const halves: HalfYear[] = ['H1', 'H2'];
      return halves
        .map(h => {
          const hMonths = getMonthsInHalfYear(year, h);
          const available = hMonths.filter(m => yearMonths.includes(m));
          return {
            key: h,
            label: h === 'H1' ? '상반기' : '하반기',
            months: available,
          };
        })
        .filter(p => p.months.length > 0);

    case 'annual':
      return [{
        key: String(year),
        label: `${year}년`,
        months: yearMonths,
      }];

    default:
      return [];
  }
}

/**
 * 분기 라벨 반환
 */
export function getQuarterLabel(quarter: Quarter): string {
  const labels: Record<Quarter, string> = {
    Q1: '1분기',
    Q2: '2분기',
    Q3: '3분기',
    Q4: '4분기',
  };
  return labels[quarter];
}

/**
 * 반기 라벨 반환
 */
export function getHalfYearLabel(halfYear: HalfYear): string {
  return halfYear === 'H1' ? '상반기' : '하반기';
}

/**
 * 제품 데이터를 기간별로 집계
 */
export function aggregateByPeriod(
  products: ProcessedProduct[],
  periodInfoList: PeriodInfo[]
): Record<string, PeriodData> {
  const result: Record<string, PeriodData> = {};

  for (const period of periodInfoList) {
    let sales = 0;
    let cost = 0;
    let profit = 0;

    for (const product of products) {
      for (const monthKey of period.months) {
        const monthData = product.months[monthKey];
        if (monthData) {
          sales += monthData.sales;
          cost += monthData.cost;
          profit += monthData.profit;
        }
      }
    }

    result[period.key] = { sales, cost, profit };
  }

  return result;
}

/**
 * 사용 가능한 연도 목록 추출
 */
export function getAvailableYears(months: string[]): number[] {
  const years = new Set(months.map(m => getYearFromMonth(m)));
  return Array.from(years).sort((a, b) => b - a); // 최신 연도 먼저
}

/**
 * 현재 분기 반환
 */
export function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

/**
 * 현재 반기 반환
 */
export function getCurrentHalfYear(): HalfYear {
  const month = new Date().getMonth() + 1;
  return month <= 6 ? 'H1' : 'H2';
}

/**
 * 기간 유형 라벨
 */
export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  monthly: '월별',
  quarterly: '분기별',
  'semi-annual': '반기별',
  annual: '연간',
};

/**
 * 달성 현황 기간 조회용 월 목록 반환
 */
import type { AchievementPeriod } from '@/types';

export function getMonthsInAchievementPeriod(year: number, period: AchievementPeriod): string[] {
  if (['Q1', 'Q2', 'Q3', 'Q4'].includes(period)) {
    return getMonthsInQuarter(year, period as Quarter);
  }

  if (period === 'H1') {
    return getMonthsInHalfYear(year, 'H1');
  }

  if (period === 'H2') {
    return getMonthsInHalfYear(year, 'H2');
  }

  // Year
  return getMonthsInYear(year);
}

/**
 * 달성 현황 기간 라벨 반환
 */
export function getAchievementPeriodLabel(period: AchievementPeriod): string {
  const labels: Record<AchievementPeriod, string> = {
    Q1: '1분기',
    Q2: '2분기',
    Q3: '3분기',
    Q4: '4분기',
    H1: '상반기',
    H2: '하반기',
    Year: '연간',
  };
  return labels[period];
}
