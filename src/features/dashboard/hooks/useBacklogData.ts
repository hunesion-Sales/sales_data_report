import { useState, useEffect, useMemo } from 'react';
import { getBacklogProducts, getBacklogDivisions, getBacklogIndustryGroups } from '@/firebase/services/backlogService';
import type { BacklogProductData, BacklogDivisionData, BacklogIndustryGroupData } from '@/types';
import { PRODUCT_GROUP_MAPPING } from '@/firebase/services/productMasterService';

/**
 * 수주잔액 데이터 fetch + 집계 훅
 */
export function useBacklogData(year: number) {
  const [products, setProducts] = useState<BacklogProductData[]>([]);
  const [divisions, setDivisions] = useState<BacklogDivisionData[]>([]);
  const [industryGroups, setIndustryGroups] = useState<BacklogIndustryGroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      getBacklogProducts(year),
      getBacklogDivisions(year),
      getBacklogIndustryGroups(year),
    ])
      .then(([p, d, ig]) => {
        if (cancelled) return;
        setProducts(p);
        setDivisions(d);
        setIndustryGroups(ig);
      })
      .catch(() => {
        // Firestore 에러 시 빈 데이터 사용
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [year]);

  /** 특정 월 범위의 수주잔액 합계 (매출/매입) */
  const getBacklogTotals = useMemo(() => {
    return (monthKeys: string[], mode: 'sales' | 'profit') => {
      let total = 0;
      for (const p of products) {
        for (const mk of monthKeys) {
          const md = p.months[mk];
          if (md) {
            total += mode === 'sales' ? md.sales : (md.sales - md.cost);
          }
        }
      }
      return total;
    };
  }, [products]);

  /** 제품군별 수주잔액 집계 */
  const backlogByProductGroup = useMemo(() => {
    const map: Record<string, { sales: number; cost: number }> = {};
    for (const p of products) {
      const group = PRODUCT_GROUP_MAPPING[p.product] || '기타';
      if (!map[group]) map[group] = { sales: 0, cost: 0 };
      for (const md of Object.values(p.months)) {
        map[group].sales += md.sales;
        map[group].cost += md.cost;
      }
    }
    return map;
  }, [products]);

  /** 부문별 수주잔액 집계 */
  const backlogByDivision = useMemo(() => {
    const map: Record<string, { sales: number; cost: number }> = {};
    for (const d of divisions) {
      if (!map[d.division]) map[d.division] = { sales: 0, cost: 0 };
      for (const md of Object.values(d.months)) {
        map[d.division].sales += md.sales;
        map[d.division].cost += md.cost;
      }
    }
    return map;
  }, [divisions]);

  /** 산업군별 수주잔액 집계 */
  const backlogByIndustryGroup = useMemo(() => {
    const map: Record<string, { sales: number; cost: number }> = {};
    for (const ig of industryGroups) {
      if (!map[ig.industryGroupName]) map[ig.industryGroupName] = { sales: 0, cost: 0 };
      for (const md of Object.values(ig.months)) {
        map[ig.industryGroupName].sales += md.sales;
        map[ig.industryGroupName].cost += md.cost;
      }
    }
    return map;
  }, [industryGroups]);

  /** 월별 수주잔액 (전체 합산) */
  const backlogByMonth = useMemo(() => {
    const map: Record<string, { sales: number; cost: number }> = {};
    for (const p of products) {
      for (const [mk, md] of Object.entries(p.months)) {
        if (!map[mk]) map[mk] = { sales: 0, cost: 0 };
        map[mk].sales += md.sales;
        map[mk].cost += md.cost;
      }
    }
    return map;
  }, [products]);

  return {
    products,
    divisions,
    industryGroups,
    isLoading,
    getBacklogTotals,
    backlogByProductGroup,
    backlogByDivision,
    backlogByIndustryGroup,
    backlogByMonth,
  };
}
