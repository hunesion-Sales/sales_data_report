import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  AchievementPeriod,
  TargetAchievement,
  AchievementStatus,
  ProductGroupTarget,
  ProductData,
} from '@/types';
import { getProductGroupTargetsByYear } from '@/firebase/services/productGroupTargetService';
import { getReport } from '@/firebase/services/reportService';
import { getProducts } from '@/firebase/services/productService';
import { PRODUCT_GROUP_MAPPING, PRODUCT_GROUPS } from '@/firebase/services/productMasterService';
import { getMonthsInAchievementPeriod, getCurrentQuarter } from '@/utils/periodUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseProductGroupAchievementReturn {
  achievements: TargetAchievement[];
  overallSalesAchievementRate: number | null;
  overallProfitAchievementRate: number | null;
  year: number;
  setYear: (year: number) => void;
  period: AchievementPeriod;
  setPeriod: (period: AchievementPeriod) => void;
  isLoading: boolean;
  error: string | null;
  totalSalesTarget: number;
  totalProfitTarget: number;
  totalActualSales: number;
  totalActualProfit: number;
  refresh: () => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

function getStatus(rate: number): AchievementStatus {
  if (rate >= 100) return 'exceeded';
  if (rate >= 75) return 'on-track';
  if (rate >= 50) return 'behind';
  return 'critical';
}

export function useProductGroupAchievement(): UseProductGroupAchievementReturn {
  const { firebaseUser, authReady } = useAuth();
  const [allTargets, setAllTargets] = useState<ProductGroupTarget[]>([]);
  const [productItems, setProductItems] = useState<ProductData[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [period, setPeriod] = useState<AchievementPeriod>(getCurrentQuarter());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [targetsData, reportResult] = await Promise.all([
        getProductGroupTargetsByYear(year),
        getReport(year),
      ]);

      setAllTargets(targetsData);

      if (reportResult) {
        const products = await getProducts(reportResult.reportId);
        setProductItems(products);
      } else {
        setProductItems([]);
      }
    } catch (err) {
      console.error('useProductGroupAchievement load error:', err);
      setError('제품군별 달성 현황 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!authReady) return;
      if (!firebaseUser) {
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      if (cancelled) return;

      try {
        await loadData();
      } catch (err) {
        console.error('useProductGroupAchievement init error:', err);
        if (!cancelled) {
          setError('데이터를 불러오는데 실패했습니다.');
          setIsLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [authReady, firebaseUser, loadData]);

  // 제품군별 실적 합산 (ProductData → PRODUCT_GROUP_MAPPING 기반)
  const productGroupActuals = useMemo(() => {
    const targetMonths = getMonthsInAchievementPeriod(year, period);
    const actuals: Record<string, { sales: number; profit: number }> = {};

    for (const item of productItems) {
      const groupName = PRODUCT_GROUP_MAPPING[item.product];
      if (!groupName) continue;

      if (!actuals[groupName]) {
        actuals[groupName] = { sales: 0, profit: 0 };
      }

      for (const monthKey of targetMonths) {
        const md = item.months[monthKey];
        if (md) {
          actuals[groupName].sales += md.sales || 0;
          actuals[groupName].profit += (md.sales || 0) - (md.cost || 0);
        }
      }
    }

    return actuals;
  }, [productItems, year, period]);

  // 달성 현황 계산
  const achievements = useMemo<TargetAchievement[]>(() => {
    // 1. 필요한 분기 목록 결정
    let targetQuarters: string[] = [];
    if (['Q1', 'Q2', 'Q3', 'Q4'].includes(period)) {
      targetQuarters = [period];
    } else if (period === 'H1') {
      targetQuarters = ['Q1', 'Q2'];
    } else if (period === 'H2') {
      targetQuarters = ['Q3', 'Q4'];
    } else if (period === 'Year') {
      targetQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    }

    // 2. 제품군별 목표 합산
    const aggregatedTargets = new Map<string, { sales: number; profit: number }>();

    // 모든 제품군 초기화
    for (const group of PRODUCT_GROUPS) {
      aggregatedTargets.set(group, { sales: 0, profit: 0 });
    }

    // 목표 데이터 순회하며 합산
    allTargets.forEach(t => {
      if (targetQuarters.includes(t.quarter)) {
        const current = aggregatedTargets.get(t.productGroup) || { sales: 0, profit: 0 };
        aggregatedTargets.set(t.productGroup, {
          sales: current.sales + t.salesTarget,
          profit: current.profit + (t.profitTarget || 0),
        });
      }
    });

    // 3. 결과 리스트 생성
    const result: TargetAchievement[] = [];

    for (const group of PRODUCT_GROUPS) {
      const targetSum = aggregatedTargets.get(group) || { sales: 0, profit: 0 };
      const actual = productGroupActuals[group] || { sales: 0, profit: 0 };

      // 목표 0 + 실적 0이면 제외
      if (targetSum.sales === 0 && actual.sales === 0 && targetSum.profit === 0 && actual.profit === 0) {
        continue;
      }

      const salesAchievementRate = targetSum.sales > 0
        ? (actual.sales / targetSum.sales) * 100
        : 0;

      const profitAchievementRate = targetSum.profit > 0
        ? (actual.profit / targetSum.profit) * 100
        : undefined;

      result.push({
        target: {
          id: `${year}-${period}-pg-${group}`,
          year,
          quarter: period as any,
          divisionId: group, // 제품군명을 divisionId에 할당 (호환용)
          salesTarget: targetSum.sales,
          profitTarget: targetSum.profit,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        divisionName: group, // 제품군명을 divisionName에 할당
        actualSales: actual.sales,
        actualProfit: actual.profit,
        salesAchievementRate,
        profitAchievementRate,
        status: getStatus(salesAchievementRate),
      });
    }

    return result.sort((a, b) => b.salesAchievementRate - a.salesAchievementRate);
  }, [allTargets, productGroupActuals, year, period]);

  const overallSalesAchievementRate = useMemo<number | null>(() => {
    if (achievements.length === 0) return null;
    const totalTarget = achievements.reduce((acc, a) => acc + a.target.salesTarget, 0);
    if (totalTarget === 0) return null;
    const totalActual = achievements.reduce((acc, a) => acc + a.actualSales, 0);
    return (totalActual / totalTarget) * 100;
  }, [achievements]);

  const overallProfitAchievementRate = useMemo<number | null>(() => {
    if (achievements.length === 0) return null;
    const totalTarget = achievements.reduce((acc, a) => acc + (a.target.profitTarget || 0), 0);
    if (totalTarget === 0) return null;
    const totalActual = achievements.reduce((acc, a) => acc + a.actualProfit, 0);
    return (totalActual / totalTarget) * 100;
  }, [achievements]);

  const totalSalesTarget = useMemo(
    () => achievements.reduce((acc, a) => acc + a.target.salesTarget, 0),
    [achievements],
  );

  const totalProfitTarget = useMemo(
    () => achievements.reduce((acc, a) => acc + (a.target.profitTarget || 0), 0),
    [achievements],
  );

  const totalActualSales = useMemo(
    () => achievements.reduce((acc, a) => acc + a.actualSales, 0),
    [achievements],
  );

  const totalActualProfit = useMemo(
    () => achievements.reduce((acc, a) => acc + a.actualProfit, 0),
    [achievements],
  );

  return {
    achievements,
    overallSalesAchievementRate,
    overallProfitAchievementRate,
    year,
    setYear,
    period,
    setPeriod,
    isLoading,
    error,
    totalSalesTarget,
    totalProfitTarget,
    totalActualSales,
    totalActualProfit,
    refresh: loadData,
  };
}
