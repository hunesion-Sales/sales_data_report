import { useMemo } from 'react';
import type { ProductData } from '@/types';
import { getMonthShortLabel } from '@/types';
import type { TargetAchievement } from '@/types';
import { PRODUCT_GROUP_MAPPING } from '@/firebase/services/productMasterService';
import type { DashboardKPIData } from '../components/DashboardKPICards';
import type { MonthlyTrendDataItem } from '../components/MonthlyTrendChart';
import type { DualBarLineChartDataItem } from '../components/shared/DualBarLineChart';
import type { DivisionChartDataItem } from '../components/DivisionOverviewChart';
import { getMonthsInYear } from '@/utils/periodUtils';

interface UseDashboardDataOptions {
  data: ProductData[];
  months: string[];
  viewMode: 'sales' | 'profit';
  divisionAchievements: TargetAchievement[];
  totalSalesTarget: number;
  totalProfitTarget: number;
  /** 선택된 기간에 해당하는 월 키 목록 */
  selectedMonthKeys: string[];
  /** 수주잔액 월 범위 */
  backlogMonthKeys: string[];
  /** 전년도 제품 데이터 */
  previousData: ProductData[];
  /** 수주잔액 데이터 (월별) */
  backlogByMonth: Record<string, { sales: number; cost: number }>;
  /** 제품군별 수주잔액 */
  backlogByProductGroup: Record<string, { sales: number; cost: number }>;
  /** 부문별 수주잔액 */
  backlogByDivision: Record<string, { sales: number; cost: number }>;
  /** 산업군별 수주잔액 */
  backlogByIndustryGroup: Record<string, { sales: number; cost: number }>;
  /** 산업군별 실적 데이터 (당년) */
  industryGroupData: Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>;
  /** 산업군별 실적 데이터 (전년) */
  prevIndustryGroupData: Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>;
  /** 제품군별 목표 합계 */
  productGroupTargetTotal: { sales: number; profit: number };
  /** 제품군별 개별 목표 */
  productGroupTargetByGroup: Record<string, { sales: number; profit: number }>;
  /** 선택 연도 */
  year: number;
}

function getValue(md: { sales: number; cost: number } | undefined, mode: 'sales' | 'profit'): number {
  if (!md) return 0;
  return mode === 'sales' ? md.sales : (md.sales - md.cost);
}

function calcGrowthRate(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return ((current - prev) / prev) * 100;
}

export function useDashboardData(opts: UseDashboardDataOptions) {
  const {
    data, months, viewMode, divisionAchievements,
    totalSalesTarget, totalProfitTarget,
    selectedMonthKeys, backlogMonthKeys,
    previousData, backlogByMonth,
    backlogByProductGroup, backlogByDivision, backlogByIndustryGroup,
    industryGroupData, prevIndustryGroupData, productGroupTargetTotal, productGroupTargetByGroup, year,
  } = opts;

  // ── KPI 데이터 ──
  const kpiData = useMemo<DashboardKPIData>(() => {
    // 당년 실적 (선택 기간)
    let actual = 0;
    for (const item of data) {
      for (const mk of selectedMonthKeys) {
        actual += getValue(item.months[mk], viewMode);
      }
    }

    // 수주잔액 (잔여 기간)
    let backlogTotal = 0;
    for (const mk of backlogMonthKeys) {
      backlogTotal += getValue(backlogByMonth[mk], viewMode);
    }

    // 연간 목표
    const annualTarget = viewMode === 'sales' ? productGroupTargetTotal.sales : productGroupTargetTotal.profit;
    // 연간 실적 (전체 월)
    const allMonths = getMonthsInYear(year);
    let annualActual = 0;
    for (const item of data) {
      for (const mk of allMonths) {
        annualActual += getValue(item.months[mk], viewMode);
      }
    }
    // 연간 수주잔액 (전체 - 대상이 아닌 미래 월)
    let annualBacklog = 0;
    for (const md of Object.values(backlogByMonth)) {
      annualBacklog += getValue(md, viewMode);
    }

    const expectedPerformance = annualActual + annualBacklog;
    const achievementRate = annualTarget > 0 ? (annualActual / annualTarget) * 100 : null;
    const predictedRate = annualTarget > 0 ? (expectedPerformance / annualTarget) * 100 : null;

    // 전년 실적 (동 기간)
    const prevYear = year - 1;
    const prevMonthKeys = selectedMonthKeys.map(mk => `${prevYear}-${mk.split('-')[1]}`);
    let prevYearActual = 0;
    for (const item of previousData) {
      for (const mk of prevMonthKeys) {
        prevYearActual += getValue(item.months[mk], viewMode);
      }
    }

    // 전년 연간 실적
    const prevAllMonths = getMonthsInYear(prevYear);
    let prevYearAnnual = 0;
    for (const item of previousData) {
      for (const mk of prevAllMonths) {
        prevYearAnnual += getValue(item.months[mk], viewMode);
      }
    }

    return {
      actual,
      achievementRate,
      backlogTotal: annualBacklog,
      expectedPerformance,
      predictedRate,
      prevYearActual,
      periodGrowthRate: calcGrowthRate(actual, prevYearActual),
      prevYearAnnual,
      annualGrowthRate: calcGrowthRate(expectedPerformance, prevYearAnnual),
    };
  }, [data, viewMode, selectedMonthKeys, backlogMonthKeys, backlogByMonth, previousData, productGroupTargetTotal, year]);

  // ── 월별 트렌드 데이터 ──
  const monthlyTrendData = useMemo<MonthlyTrendDataItem[]>(() => {
    const allMonths = getMonthsInYear(year);
    const prevYear = year - 1;
    const annualTarget = viewMode === 'sales' ? totalSalesTarget : totalProfitTarget;

    // 당년 월별 집계
    const currentByMonth: Record<string, number> = {};
    for (const item of data) {
      for (const mk of allMonths) {
        currentByMonth[mk] = (currentByMonth[mk] ?? 0) + getValue(item.months[mk], viewMode);
      }
    }

    // 전년 월별 집계
    const prevByMonth: Record<string, number> = {};
    for (const item of previousData) {
      for (const mk of getMonthsInYear(prevYear)) {
        prevByMonth[mk] = (prevByMonth[mk] ?? 0) + getValue(item.months[mk], viewMode);
      }
    }

    let cumulativeActual = 0;
    return allMonths.map(mk => {
      const monthNum = mk.split('-')[1];
      const prevMk = `${prevYear}-${monthNum}`;
      const currentVal = currentByMonth[mk] ?? 0;
      const prevVal = prevByMonth[prevMk] ?? 0;
      const backlogVal = getValue(backlogByMonth[mk], viewMode);
      cumulativeActual += currentVal;
      const achievementRate = annualTarget > 0 ? (cumulativeActual / annualTarget) * 100 : 0;
      const growthRate = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;

      return {
        name: getMonthShortLabel(mk),
        prevYearActual: prevVal,
        currentActual: currentVal,
        backlog: backlogVal,
        achievementRate,
        growthRate,
      };
    });
  }, [data, previousData, backlogByMonth, viewMode, year, totalSalesTarget, totalProfitTarget]);

  // ── 제품군별 차트 데이터 ──
  const productGroupChartData = useMemo<DualBarLineChartDataItem[]>(() => {
    const prevYear = year - 1;
    const allMonths = getMonthsInYear(year);
    const prevAllMonths = getMonthsInYear(prevYear);

    // 당년 제품군별 집계
    const currentByGroup: Record<string, number> = {};
    for (const item of data) {
      const group = PRODUCT_GROUP_MAPPING[item.product] || '기타';
      for (const mk of allMonths) {
        currentByGroup[group] = (currentByGroup[group] ?? 0) + getValue(item.months[mk], viewMode);
      }
    }

    // 전년 제품군별 집계
    const prevByGroup: Record<string, number> = {};
    for (const item of previousData) {
      const group = PRODUCT_GROUP_MAPPING[item.product] || '기타';
      for (const mk of prevAllMonths) {
        prevByGroup[group] = (prevByGroup[group] ?? 0) + getValue(item.months[mk], viewMode);
      }
    }

    const groups = new Set([
      ...Object.keys(currentByGroup),
      ...Object.keys(prevByGroup),
      ...Object.keys(backlogByProductGroup),
    ]);

    return Array.from(groups)
      .map(group => {
        const current = currentByGroup[group] ?? 0;
        const prev = prevByGroup[group] ?? 0;
        const blg = backlogByProductGroup[group];
        const backlog = blg ? getValue(blg, viewMode) : 0;
        const groupTarget = productGroupTargetByGroup[group];
        const targetVal = groupTarget ? (viewMode === 'sales' ? groupTarget.sales : groupTarget.profit) : 0;
        return {
          name: group,
          prevYearActual: prev,
          currentActual: current,
          backlog,
          achievementRate: targetVal > 0 ? (current / targetVal) * 100 : 0,
          growthRate: prev > 0 ? ((current - prev) / prev) * 100 : 0,
        };
      })
      .sort((a, b) => b.currentActual - a.currentActual);
  }, [data, previousData, backlogByProductGroup, productGroupTargetByGroup, viewMode, year]);

  // ── 산업군별 차트 데이터 ──
  const industryGroupChartData = useMemo<DualBarLineChartDataItem[]>(() => {
    // 당년 산업군별
    const currentByGroup: Record<string, number> = {};
    for (const ig of industryGroupData) {
      let total = 0;
      for (const md of Object.values(ig.months)) {
        total += getValue(md, viewMode);
      }
      currentByGroup[ig.industryGroupName] = (currentByGroup[ig.industryGroupName] ?? 0) + total;
    }

    // 전년 산업군별
    const prevByGroup: Record<string, number> = {};
    for (const ig of prevIndustryGroupData) {
      let total = 0;
      for (const md of Object.values(ig.months)) {
        total += getValue(md, viewMode);
      }
      prevByGroup[ig.industryGroupName] = (prevByGroup[ig.industryGroupName] ?? 0) + total;
    }

    const groups = new Set([
      ...Object.keys(currentByGroup),
      ...Object.keys(prevByGroup),
      ...Object.keys(backlogByIndustryGroup),
    ]);

    return Array.from(groups)
      .map(group => {
        const current = currentByGroup[group] ?? 0;
        const prev = prevByGroup[group] ?? 0;
        const blg = backlogByIndustryGroup[group];
        const backlog = blg ? getValue(blg, viewMode) : 0;
        return {
          name: group,
          prevYearActual: prev,
          currentActual: current,
          backlog,
          achievementRate: 0,
          growthRate: prev > 0 ? ((current - prev) / prev) * 100 : 0,
        };
      })
      .sort((a, b) => b.currentActual - a.currentActual);
  }, [industryGroupData, prevIndustryGroupData, backlogByIndustryGroup, viewMode, year]);

  // ── 부문별 차트 데이터 ──
  const divisionChartData = useMemo<DivisionChartDataItem[]>(() => {
    return divisionAchievements.map(ach => {
      const actualVal = viewMode === 'sales' ? ach.actualSales : ach.actualProfit;
      const targetVal = viewMode === 'sales' ? ach.target.salesTarget : (ach.target.profitTarget ?? 0);
      const blg = backlogByDivision[ach.divisionName];
      const backlogVal = blg ? getValue(blg, viewMode) : 0;

      const achievementRate = targetVal > 0 ? (actualVal / targetVal) * 100 : 0;
      const achievementRateWithBacklog = targetVal > 0 ? ((actualVal + backlogVal) / targetVal) * 100 : 0;

      return {
        name: ach.divisionName,
        target: targetVal,
        actual: actualVal,
        backlog: backlogVal,
        achievementRate,
        achievementRateWithBacklog,
        divisionId: ach.target.divisionId,
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [divisionAchievements, backlogByDivision, viewMode]);

  // ── 기간 라벨 ──
  const monthRangeText = useMemo(() => {
    if (months.length === 0) return '';
    if (months.length === 1) return getMonthShortLabel(months[0]);
    return `${getMonthShortLabel(months[0])}~${getMonthShortLabel(months[months.length - 1])}`;
  }, [months]);

  return {
    kpiData,
    monthlyTrendData,
    productGroupChartData,
    industryGroupChartData,
    divisionChartData,
    monthRangeText,
  };
}
