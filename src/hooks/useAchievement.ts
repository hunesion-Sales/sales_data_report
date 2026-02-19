import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Division,
  QuarterlyTarget,
  AchievementPeriod,
  TargetAchievement,
  AchievementStatus,
} from '@/types';
import { getDivisions } from '@/firebase/services/divisionService';
import { getTargetsByYear } from '@/firebase/services/targetService';
import { getReport } from '@/firebase/services/reportService';
import { getDivisionData, type DivisionDataItem } from '@/firebase/services/divisionDataService';
import { getMonthsInAchievementPeriod, getCurrentQuarter } from '@/utils/periodUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseAchievementReturn {
  divisions: Division[];
  achievements: TargetAchievement[];
  divisionItems: DivisionDataItem[];
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

export function useAchievement(
  userDivisionId?: string | null,
  isAdmin = false,
): UseAchievementReturn {
  const { firebaseUser, authReady } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [allTargets, setAllTargets] = useState<QuarterlyTarget[]>([]);
  const [divisionItems, setDivisionItems] = useState<DivisionDataItem[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [period, setPeriod] = useState<AchievementPeriod>(getCurrentQuarter());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 연간 목표 전체 조회 (분기별 Aggregation을 위해)
      const [divisionsData, targetsData] = await Promise.all([
        getDivisions(),
        getTargetsByYear(year),
      ]);

      setDivisions(divisionsData);
      setAllTargets(targetsData);

      // Report & Division Data 로드
      const reportResult = await getReport(year);

      if (reportResult) {
        // 부문별 실적 데이터 조회 (Division Data)
        const items = await getDivisionData(reportResult.reportId);
        setDivisionItems(items);
      } else {
        setDivisionItems([]);
      }
    } catch (err) {
      console.error('useAchievement load error:', err);
      setError('달성 현황 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  // 인증 완료 후에만 데이터 로드
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
        console.error('useAchievement init error:', err);
        if (!cancelled) {
          setError('데이터를 불러오는데 실패했습니다.');
          setIsLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [authReady, firebaseUser, loadData]);

  // 부문별 실적 합산 (Division Data 기반)
  const divisionActuals = useMemo(() => {
    // 선택된 기간(분기/반기/연간)에 포함된 월 목록 조회
    const targetMonths = getMonthsInAchievementPeriod(year, period);
    const actuals: Record<string, { sales: number; profit: number }> = {};

    for (const item of divisionItems) {
      let divisionId = item.divisionId;
      if (!divisionId) {
        const normalizedItemName = item.divisionName.replace(/\s+/g, '');
        const matchedDivision = divisions.find(d => d.name.replace(/\s+/g, '') === normalizedItemName);
        if (matchedDivision) {
          divisionId = matchedDivision.id;
        }
      }

      if (!divisionId) continue;

      if (!actuals[divisionId]) {
        actuals[divisionId] = { sales: 0, profit: 0 };
      }

      for (const monthKey of targetMonths) {
        const md = item.months[monthKey];
        if (md) {
          actuals[divisionId].sales += md.sales || 0;
          actuals[divisionId].profit += (md.sales || 0) - (md.cost || 0);
        }
      }
    }

    return actuals;
  }, [divisionItems, divisions, year, period]);

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

    // 2. 부문별 목표 합산
    const aggregatedTargets = new Map<string, { sales: number; profit: number }>();

    // (1) divisionId 별 초기화
    divisions.forEach(d => {
      aggregatedTargets.set(d.id, { sales: 0, profit: 0 });
    });

    // (2) 목표 데이터 순회하며 합산
    allTargets.forEach(t => {
      if (targetQuarters.includes(t.quarter)) {
        const current = aggregatedTargets.get(t.divisionId) || { sales: 0, profit: 0 };
        aggregatedTargets.set(t.divisionId, {
          sales: current.sales + t.salesTarget,
          profit: current.profit + (t.profitTarget || 0)
        });
      }
    });

    // 3. 결과 리스트 생성
    const result: TargetAchievement[] = [];
    const divisionMap = new Map(divisions.map(d => [d.id, d.name]));

    // 사용자 권한 필터
    const allowedDivisionId = !isAdmin ? userDivisionId : null;

    divisions.forEach(div => {
      if (allowedDivisionId && div.id !== allowedDivisionId) return;

      const targetSum = aggregatedTargets.get(div.id) || { sales: 0, profit: 0 };
      const actual = divisionActuals[div.id] || { sales: 0, profit: 0 };

      // 목표가 0이고 실적도 0이면 리스트에서 제외 (불필요한 행 제거)
      if (targetSum.sales === 0 && actual.sales === 0 && targetSum.profit === 0 && actual.profit === 0) {
        return;
      }

      // 목표가 있는데 실적이 없거나, 실적이 있는데 목표가 없는 경우는 표시해야 함 via logic above (only skip if BOTH are 0)
      // 단, targets 데이터가 아예 없는 부문인데 실적만 있는 경우 -> 위 로직에서 allTargets 기준이 아니라 divisions 기준 루프이므로 처리됨.

      const salesAchievementRate = targetSum.sales > 0
        ? (actual.sales / targetSum.sales) * 100
        : 0;

      const profitAchievementRate = targetSum.profit > 0
        ? (actual.profit / targetSum.profit) * 100
        : undefined;

      result.push({
        target: {
          id: `${year}-${period}-${div.id}`, // 가상 ID
          year,
          quarter: period as any, // Type adaptation needed or update type
          divisionId: div.id,
          salesTarget: targetSum.sales,
          profitTarget: targetSum.profit,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        divisionName: div.name,
        actualSales: actual.sales,
        actualProfit: actual.profit,
        salesAchievementRate,
        profitAchievementRate,
        status: getStatus(salesAchievementRate),
      });
    });

    return result.sort((a, b) => b.salesAchievementRate - a.salesAchievementRate);
  }, [allTargets, divisions, divisionActuals, isAdmin, userDivisionId, year, period]);

  // 전체 달성율 (매출)
  const overallSalesAchievementRate = useMemo<number | null>(() => {
    if (achievements.length === 0) return null;
    const totalTarget = achievements.reduce((acc, a) => acc + a.target.salesTarget, 0);
    if (totalTarget === 0) return null;
    const totalActual = achievements.reduce((acc, a) => acc + a.actualSales, 0);
    return (totalActual / totalTarget) * 100;
  }, [achievements]);

  // 전체 달성율 (이익)
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
    divisions,
    achievements,
    divisionItems,
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
