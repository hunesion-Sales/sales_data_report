import { useState, useEffect, useMemo } from 'react';
import { getBacklogProducts, getBacklogDivisions, getBacklogIndustryGroups } from '@/firebase/services/backlogService';
import type { BacklogProductData, BacklogDivisionData, BacklogIndustryGroupData } from '@/types';
import { PRODUCT_GROUP_MAPPING } from '@/firebase/services/productMasterService';
import { remapBacklogByIndustryGroup } from '@/utils/industryGroupMapper';

interface IndustryGroupConfig {
  name: string;
  keywords: string[];
}

/**
 * 수주잔액 데이터 fetch + 집계 훅
 * @param year 대상 연도
 * @param industryGroups 산업군 설정 (재분류용)
 */
export function useBacklogData(year: number, industryGroupConfig?: IndustryGroupConfig[]) {
  const [products, setProducts] = useState<BacklogProductData[]>([]);
  const [divisions, setDivisions] = useState<BacklogDivisionData[]>([]);
  const [industryGroupsData, setIndustryGroupsData] = useState<BacklogIndustryGroupData[]>([]);
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
        setIndustryGroupsData(ig);
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

  /** 산업군별 수주잔액 집계 (산업군 설정 기준으로 재분류) */
  const backlogByIndustryGroup = useMemo(() => {
    // 원본 데이터 집계
    const rawMap: Record<string, { sales: number; cost: number }> = {};
    for (const ig of industryGroupsData) {
      if (!rawMap[ig.industryGroupName]) rawMap[ig.industryGroupName] = { sales: 0, cost: 0 };
      for (const md of Object.values(ig.months)) {
        rawMap[ig.industryGroupName].sales += md.sales;
        rawMap[ig.industryGroupName].cost += md.cost;
      }
    }
    // 산업군 설정이 제공되면 재분류, 아니면 원본 반환
    if (industryGroupConfig && industryGroupConfig.length > 0) {
      return remapBacklogByIndustryGroup(rawMap, industryGroupConfig);
    }
    return rawMap;
  }, [industryGroupsData, industryGroupConfig]);

  /** 월별 수주잔액 (전체 합산) - 제품별 > 부문별 > 산업군별 우선순위 */
  const backlogByMonth = useMemo(() => {
    const map: Record<string, { sales: number; cost: number }> = {};

    // 제품별 데이터가 있으면 사용 (가장 상세)
    if (products.length > 0) {
      for (const p of products) {
        for (const [mk, md] of Object.entries(p.months)) {
          if (!map[mk]) map[mk] = { sales: 0, cost: 0 };
          map[mk].sales += md.sales;
          map[mk].cost += md.cost;
        }
      }
      return map;
    }

    // 부문별 데이터가 있으면 사용
    if (divisions.length > 0) {
      for (const d of divisions) {
        for (const [mk, md] of Object.entries(d.months)) {
          if (!map[mk]) map[mk] = { sales: 0, cost: 0 };
          map[mk].sales += md.sales;
          map[mk].cost += md.cost;
        }
      }
      return map;
    }

    // 산업군별 데이터가 있으면 사용
    if (industryGroupsData.length > 0) {
      for (const ig of industryGroupsData) {
        for (const [mk, md] of Object.entries(ig.months)) {
          if (!map[mk]) map[mk] = { sales: 0, cost: 0 };
          map[mk].sales += md.sales;
          map[mk].cost += md.cost;
        }
      }
    }

    return map;
  }, [products, divisions, industryGroupsData]);

  return {
    products,
    divisions,
    industryGroupsData,
    isLoading,
    getBacklogTotals,
    backlogByProductGroup,
    backlogByDivision,
    backlogByIndustryGroup,
    backlogByMonth,
  };
}
