import { useMemo } from 'react';
import type { ProductData, ProcessedProduct, Totals } from '@/types';

/**
 * 제품별 보고서 데이터 가공 훅
 * - 메인 데이터(일반+Cloud서비스+유지보수+기타)와 클라우드 개별 데이터 분리
 * - 각 그룹의 합계 계산
 */
export function useProductReport(data: ProductData[], months: string[]) {
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  const { mainData, cloudData } = useMemo(() => {
    const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
      const m: Record<string, { sales: number; cost: number }> = {};
      months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
      return m;
    };

    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
      '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
    };

    const regularItems: ProductData[] = [];
    const cloudItems: ProductData[] = [];
    const cloudSubtotal: ProductData = { id: 'cloud_total', product: 'Cloud 서비스', months: emptyMonths() };

    data.forEach(item => {
      if (item.product.endsWith('_MA')) {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['유지보수'].months[mk].sales += md.sales;
          aggregatedGroups['유지보수'].months[mk].cost += md.cost;
        });
      } else if (item.product === 'H/W' || item.product === '기타') {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['기타'].months[mk].sales += md.sales;
          aggregatedGroups['기타'].months[mk].cost += md.cost;
        });
      } else if (item.product.toUpperCase().includes('CLOUD')) {
        cloudItems.push(item);
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          cloudSubtotal.months[mk].sales += md.sales;
          cloudSubtotal.months[mk].cost += md.cost;
        });
      } else {
        regularItems.push(item);
      }
    });

    regularItems.sort((a, b) => a.product.localeCompare(b.product));
    cloudItems.sort((a, b) => a.product.localeCompare(b.product));

    const processList = (list: ProductData[]): ProcessedProduct[] => list.map(item => {
      const processedMonths: Record<string, { sales: number; cost: number; profit: number }> = {};
      let totalSales = 0;
      let totalCost = 0;

      months.forEach(mk => {
        const md = getMonthData(item, mk);
        const profit = md.sales - md.cost;
        processedMonths[mk] = { sales: md.sales, cost: md.cost, profit };
        totalSales += md.sales;
        totalCost += md.cost;
      });

      return {
        id: item.id,
        product: item.product,
        months: processedMonths,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
      };
    });

    const mainRaw = [
      ...regularItems,
      cloudSubtotal,
      aggregatedGroups['유지보수'],
      aggregatedGroups['기타'],
    ];

    return {
      mainData: processList(mainRaw),
      cloudData: processList(cloudItems),
    };
  }, [data, months]);

  const totals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

    mainData.forEach(item => {
      months.forEach(mk => {
        const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
        byMonth[mk].sales += md.sales;
        byMonth[mk].cost += md.cost;
        byMonth[mk].profit += md.profit;
      });
      totalSales += item.totalSales;
      totalCost += item.totalCost;
    });

    return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
  }, [mainData, months]);

  const cloudTotals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

    cloudData.forEach(item => {
      months.forEach(mk => {
        const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
        byMonth[mk].sales += md.sales;
        byMonth[mk].cost += md.cost;
        byMonth[mk].profit += md.profit;
      });
      totalSales += item.totalSales;
      totalCost += item.totalCost;
    });

    return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
  }, [cloudData, months]);

  return { mainData, cloudData, totals, cloudTotals };
}
