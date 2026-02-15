import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Division,
  QuarterlyTarget,
  Quarter,
  ProductMaster,
  ProductData,
  TargetAchievement,
  AchievementStatus,
} from '@/types';
import { getDivisions } from '@/firebase/services/divisionService';
import { getProductMasters } from '@/firebase/services/productMasterService';
import { getTargetsByYearQuarter } from '@/firebase/services/targetService';
import { getReport } from '@/firebase/services/reportService';
import { getProducts } from '@/firebase/services/productService';
import { getMonthsInQuarter, getCurrentQuarter } from '@/utils/periodUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseAchievementReturn {
  divisions: Division[];
  achievements: TargetAchievement[];
  overallAchievementRate: number | null;
  year: number;
  setYear: (year: number) => void;
  quarter: Quarter;
  setQuarter: (quarter: Quarter) => void;
  isLoading: boolean;
  error: string | null;
  totalTarget: number;
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

export function useAchievement(
  userDivisionId?: string | null,
  isAdmin = false,
): UseAchievementReturn {
  const { firebaseUser, authReady } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [targets, setTargets] = useState<QuarterlyTarget[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productMasters, setProductMasters] = useState<ProductMaster[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [quarter, setQuarter] = useState<Quarter>(getCurrentQuarter());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [divisionsData, productMastersData, targetsData] = await Promise.all([
        getDivisions(),
        getProductMasters(),
        getTargetsByYearQuarter(year, quarter),
      ]);

      setDivisions(divisionsData);
      setProductMasters(productMastersData);
      setTargets(targetsData);

      // Report products 로드
      const reportResult = await getReport(year);

      if (reportResult) {
        const productsData = await getProducts(reportResult.reportId);
        setProducts(productsData);
      } else {
        setProducts([]);
        // 보고서가 없으면 빈 상태 유지
      }
    } catch (err) {
      console.error('useAchievement load error:', err);
      setError('달성 현황 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year, quarter]);

  // 인증 완료 후에만 데이터 로드
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Auth 상태가 아직 결정되지 않았으면 대기
      if (!authReady) {
        return;
      }

      // 로그인하지 않은 상태면 로딩 종료
      if (!firebaseUser) {
        setIsLoading(false);
        return;
      }

      // Firestore 연결 안정화를 위한 짧은 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));

      if (cancelled) return;

      // 인증 완료 후 데이터 로드
      try {
        await loadData();
      } catch (err) {
        console.error('useAchievement init error:', err);
        if (!cancelled) {
          setError('데이터를 불러오는데 실패했습니다.');
          setIsLoading(false);
        }
      }
    };

    init();


    return () => {
      cancelled = true;
    };
  }, [authReady, firebaseUser, loadData]);

  // 제품명 → divisionId 매핑
  const productDivisionMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const pm of productMasters) {
      map[pm.name] = pm.divisionId;
    }
    return map;
  }, [productMasters]);

  // 부문별 실적 합산
  const divisionActuals = useMemo(() => {
    const quarterMonths = getMonthsInQuarter(year, quarter);
    const actuals: Record<string, { sales: number; profit: number }> = {};

    for (const product of products) {
      const divisionId = productDivisionMap[product.product];
      if (!divisionId) continue;

      if (!actuals[divisionId]) {
        actuals[divisionId] = { sales: 0, profit: 0 };
      }

      for (const monthKey of quarterMonths) {
        const md = product.months[monthKey];
        if (md) {
          actuals[divisionId].sales += md.sales || 0;
          actuals[divisionId].profit += (md.sales || 0) - (md.cost || 0);
        }
      }
    }

    return actuals;
  }, [products, productDivisionMap, year, quarter]);

  // 달성 현황 계산
  const achievements = useMemo<TargetAchievement[]>(() => {
    // role-based 필터
    let filteredTargets = targets;
    if (!isAdmin && userDivisionId) {
      filteredTargets = targets.filter(t => t.divisionId === userDivisionId);
    }

    const divisionMap = new Map(divisions.map(d => [d.id, d.name]));

    return filteredTargets.map(target => {
      const actual = divisionActuals[target.divisionId] || { sales: 0, profit: 0 };
      const salesAchievementRate = target.salesTarget > 0
        ? (actual.sales / target.salesTarget) * 100
        : 0;
      const profitAchievementRate = target.profitTarget && target.profitTarget > 0
        ? (actual.profit / target.profitTarget) * 100
        : undefined;

      return {
        target,
        divisionName: divisionMap.get(target.divisionId) || '미분류',
        actualSales: actual.sales,
        actualProfit: actual.profit,
        salesAchievementRate,
        profitAchievementRate,
        status: getStatus(salesAchievementRate),
      };
    }).sort((a, b) => b.salesAchievementRate - a.salesAchievementRate);
  }, [targets, divisions, divisionActuals, isAdmin, userDivisionId]);

  // 전체 달성율
  const overallAchievementRate = useMemo<number | null>(() => {
    if (achievements.length === 0) return null;
    const totalTarget = achievements.reduce((acc, a) => acc + a.target.salesTarget, 0);
    if (totalTarget === 0) return null;
    const totalActual = achievements.reduce((acc, a) => acc + a.actualSales, 0);
    return (totalActual / totalTarget) * 100;
  }, [achievements]);

  const totalTarget = useMemo(
    () => achievements.reduce((acc, a) => acc + a.target.salesTarget, 0),
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
    divisions,
    achievements,
    overallAchievementRate,
    year,
    setYear,
    quarter,
    setQuarter,
    isLoading,
    error,
    totalTarget,
    totalActualSales,
    totalActualProfit,
    refresh: loadData,
  };
}
