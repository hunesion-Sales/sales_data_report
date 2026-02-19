
/**
 * 달성율 관련 유틸리티 함수
 */

import { MonthData, ProductData } from '@/types';

/**
 * 전사/부문 연간 목표 대비 월별 누적 달성율 계산 (대시보드 차트용)
 * 공식: (해당 월까지의 누적 실적 / 연간 총 목표) * 100
 */
export const calculateCumulativeAchievement = (
  months: string[],
  monthlyData: Record<string, { sales: number; profit: number }>,
  totalTargetSales: number,
  totalTargetProfit: number
) => {
  let cumulativeSales = 0;
  let cumulativeProfit = 0;

  return months.map(monthKey => {
    const data = monthlyData[monthKey] || { sales: 0, profit: 0 };
    cumulativeSales += data.sales;
    cumulativeProfit += data.profit;

    return {
      month: monthKey,
      cumulativeSales,
      cumulativeProfit,
      salesRate: totalTargetSales > 0 ? (cumulativeSales / totalTargetSales) * 100 : 0,
      profitRate: totalTargetProfit > 0 ? (cumulativeProfit / totalTargetProfit) * 100 : 0,
    };
  });
};

/**
 * 특정 제품이 Cloud 서비스인지 확인
 */
export const isCloudProduct = (productName: string): boolean => {
  return productName.toLowerCase().includes('cloud');
};
