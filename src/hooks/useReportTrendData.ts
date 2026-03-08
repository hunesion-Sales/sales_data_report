import { useMemo } from 'react';
import type { MonthlyTrendDataItem } from '@/features/dashboard/components/MonthlyTrendChart';
import { getMonthsInYear } from '@/utils/periodUtils';

interface ItemWithMonths {
  name: string;
  months: Record<string, { sales: number; cost: number }>;
}

interface TrendDataSource {
  /** 당년 항목별 월 데이터 */
  currentItems: ItemWithMonths[];
  /** 전년 항목별 월 데이터 */
  previousItems: ItemWithMonths[];
  /** 수주잔액 항목별 합계: Record<항목명, Record<monthKey, {sales, cost}>> */
  backlogByItem: Record<string, Record<string, { sales: number; cost: number }>>;
}

/**
 * 보고서 트렌드 차트용 월별 데이터 생성 훅
 * - 선택된 항목(또는 전체)에 대해 12개월 데이터 생성
 * - 각 월별: 전년실적 + 당년실적 + 수주잔액 계산
 */
export function useReportTrendData(
  source: TrendDataSource,
  selectedItem: string,
  year: number,
  viewMode: 'sales' | 'profit',
): MonthlyTrendDataItem[] {
  return useMemo(() => {
    const monthKeys = getMonthsInYear(year);
    const prevMonthKeys = getMonthsInYear(year - 1);

    // 항목 필터링 (전체 또는 특정 항목)
    const isAll = selectedItem === '전체';
    const filterItems = (items: ItemWithMonths[]) =>
      isAll ? items : items.filter(it => it.name === selectedItem);

    const currentFiltered = filterItems(source.currentItems);
    const previousFiltered = filterItems(source.previousItems);

    return monthKeys.map((mk, idx) => {
      const monthNum = parseInt(mk.split('-')[1], 10);
      const prevMk = prevMonthKeys[idx]; // 동일 월 인덱스

      // 당년 실적
      let curSales = 0, curCost = 0;
      for (const item of currentFiltered) {
        const md = item.months[mk];
        if (md) { curSales += md.sales; curCost += md.cost; }
      }

      // 전년 실적
      let prevSales = 0, prevCost = 0;
      for (const item of previousFiltered) {
        const md = item.months[prevMk];
        if (md) { prevSales += md.sales; prevCost += md.cost; }
      }

      // 수주잔액
      let blSales = 0, blCost = 0;
      if (isAll) {
        for (const byMonth of Object.values(source.backlogByItem)) {
          const md = byMonth[mk];
          if (md) { blSales += md.sales; blCost += md.cost; }
        }
      } else {
        const byMonth = source.backlogByItem[selectedItem];
        if (byMonth) {
          const md = byMonth[mk];
          if (md) { blSales += md.sales; blCost += md.cost; }
        }
      }

      const currentValue = viewMode === 'sales' ? curSales : (curSales - curCost);
      const prevValue = viewMode === 'sales' ? prevSales : (prevSales - prevCost);
      const backlogValue = viewMode === 'sales' ? blSales : (blSales - blCost);

      return {
        name: `${monthNum}월`,
        prevYearActual: prevValue,
        currentActual: currentValue,
        backlog: backlogValue,
        achievementRate: 0,
        growthRate: 0,
      };
    });
  }, [source, selectedItem, year, viewMode]);
}
