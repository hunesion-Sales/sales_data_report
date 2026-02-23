import { useMemo } from 'react';
import type { ProductData, ProcessedProduct, Totals } from '@/types';
import { getMonthShortLabel } from '@/types';
import { isCloudProduct } from '@/utils/achievementUtils';
import { calculateCumulativeAchievement } from '@/utils/achievementUtils';
import type { TargetAchievement } from '@/types';

interface UseDashboardDataOptions {
  data: ProductData[];
  months: string[];
  viewMode: 'sales' | 'profit';
  divisionAchievements: TargetAchievement[];
  totalSalesTarget: number;
  totalProfitTarget: number;
}

export function useDashboardData({
  data,
  months,
  viewMode,
  divisionAchievements,
  totalSalesTarget,
  totalProfitTarget,
}: UseDashboardDataOptions) {
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  const processedData = useMemo<ProcessedProduct[]>(() => {
    const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
      const m: Record<string, { sales: number; cost: number }> = {};
      months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
      return m;
    };

    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
      '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
      '클라우드 서비스': { id: 'cloud_total', product: '클라우드 서비스', months: emptyMonths() },
    };

    const cloudProducts: ProductData[] = [];
    const regularItems: ProductData[] = [];

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
      } else if (isCloudProduct(item.product)) {
        cloudProducts.push(item);
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['클라우드 서비스'].months[mk].sales += md.sales;
          aggregatedGroups['클라우드 서비스'].months[mk].cost += md.cost;
        });
      } else {
        regularItems.push(item);
      }
    });

    const itemsToProcess = [...regularItems, aggregatedGroups['유지보수'], aggregatedGroups['기타']];
    const cloudTotalSales = Object.values(aggregatedGroups['클라우드 서비스'].months).reduce((acc, m) => acc + m.sales, 0);
    if (cloudTotalSales > 0 || cloudProducts.length > 0) {
      itemsToProcess.push(aggregatedGroups['클라우드 서비스']);
    }

    return itemsToProcess.map(item => {
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
    }).sort((a, b) => {
      const valA = viewMode === 'sales' ? a.totalSales : a.totalProfit;
      const valB = viewMode === 'sales' ? b.totalSales : b.totalProfit;
      return valB - valA;
    });
  }, [data, months, viewMode]);

  const totals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

    processedData.forEach(item => {
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
  }, [processedData, months]);

  const monthlyTrendData = useMemo(() => {
    const year = months.length > 0 ? months[0].split('-')[0] : new Date().getFullYear().toString();
    const fullMonths = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return `${year}-${m.toString().padStart(2, '0')}`;
    });

    const achievementData = calculateCumulativeAchievement(
      fullMonths,
      totals.byMonth,
      totalSalesTarget,
      totalProfitTarget
    );

    return fullMonths.map((mk, idx) => {
      const stats = achievementData[idx];
      const items = totals.byMonth[mk] || { sales: 0, profit: 0 };
      return {
        name: getMonthShortLabel(mk),
        sales: items.sales,
        profit: items.profit,
        rate: viewMode === 'sales' ? stats.salesRate : stats.profitRate,
      };
    });
  }, [months, totals, viewMode, totalSalesTarget, totalProfitTarget]);

  const allProducts = useMemo(() => {
    return [...processedData].sort((a, b) => b.totalSales - a.totalSales);
  }, [processedData]);

  const divisionChartData = useMemo(() => {
    return divisionAchievements.map(ach => ({
      name: ach.divisionName,
      sales: ach.actualSales,
      profit: ach.actualProfit,
      rate: viewMode === 'sales' ? ach.salesAchievementRate : (ach.profitAchievementRate || 0),
      divisionId: ach.target.divisionId
    })).sort((a, b) => b.sales - a.sales);
  }, [divisionAchievements, viewMode]);

  const monthRangeText = useMemo(() => {
    if (months.length === 0) return '';
    if (months.length === 1) return getMonthShortLabel(months[0]);
    return `${getMonthShortLabel(months[0])}~${getMonthShortLabel(months[months.length - 1])}`;
  }, [months]);

  return {
    processedData,
    totals,
    monthlyTrendData,
    allProducts,
    divisionChartData,
    monthRangeText,
  };
}
