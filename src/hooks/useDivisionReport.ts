import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  ProductData,
  ProcessedProduct,
  Division,
  DivisionSummary,
  ReportFilter,
  PeriodType,
  PeriodInfo,
  ProductMaster,
} from '@/types';
import { getDivisions } from '@/firebase/services/divisionService';
import { getProductMasters } from '@/firebase/services/productMasterService';
import { getOrCreateReport } from '@/firebase/services/reportService';
import { getProducts } from '@/firebase/services/productService';
import {
  getPeriodInfoList,
  aggregateByPeriod,
  getAvailableYears,
} from '@/utils/periodUtils';

interface UseDivisionReportReturn {
  divisions: Division[];
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
  availableYears: number[];
  availableMonths: string[];
  filter: ReportFilter;
  setFilter: (filter: ReportFilter) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function useDivisionReport(userDivisionId?: string | null, isAdmin = false): UseDivisionReportReturn {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productMasters, setProductMasters] = useState<ProductMaster[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<ReportFilter>({
    year: CURRENT_YEAR,
    periodType: 'monthly',
    divisionId: undefined, // 전체
  });

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [divisionsData, productMastersData] = await Promise.all([
        getDivisions(),
        getProductMasters(),
      ]);

      setDivisions(divisionsData);
      setProductMasters(productMastersData);

      // 보고서 데이터 로드
      const { reportId, report } = await getOrCreateReport(filter.year);
      const productsData = await getProducts(reportId);

      setProducts(productsData);
      setAvailableMonths(report.months || []);
    } catch (err) {
      console.error('useDivisionReport load error:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [filter.year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 제품명 -> divisionId 매핑 (productMaster 기준)
  const productDivisionMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const pm of productMasters) {
      map[pm.name] = pm.divisionId;
    }
    return map;
  }, [productMasters]);

  // 제품 데이터를 ProcessedProduct로 변환
  const processedProducts = useMemo<ProcessedProduct[]>(() => {
    return products.map((p) => {
      let totalSales = 0;
      let totalCost = 0;
      const processedMonths: Record<string, { sales: number; cost: number; profit: number }> = {};

      for (const [monthKey, monthData] of Object.entries(p.months)) {
        const sales = monthData.sales || 0;
        const cost = monthData.cost || 0;
        const profit = sales - cost;
        processedMonths[monthKey] = { sales, cost, profit };
        totalSales += sales;
        totalCost += cost;
      }

      return {
        id: p.id,
        product: p.product,
        months: processedMonths,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
      };
    });
  }, [products]);

  // 사용 가능한 연도 목록
  const availableYears = useMemo(() => {
    return getAvailableYears(availableMonths);
  }, [availableMonths]);

  // 기간 정보 목록
  const periodInfoList = useMemo(() => {
    return getPeriodInfoList(filter.year, filter.periodType, availableMonths);
  }, [filter.year, filter.periodType, availableMonths]);

  // 부문별 요약 데이터 생성
  const summaries = useMemo<DivisionSummary[]>(() => {
    // 필터링할 부문 목록
    let targetDivisions = divisions;

    // 일반 사용자는 자신의 부문만, 관리자는 전체 또는 선택한 부문
    if (!isAdmin && userDivisionId) {
      targetDivisions = divisions.filter(d => d.id === userDivisionId);
    } else if (filter.divisionId) {
      targetDivisions = divisions.filter(d => d.id === filter.divisionId);
    }

    // 미분류 부문 추가 (divisionId가 없는 제품용)
    const hasUnassigned = processedProducts.some(
      p => !productDivisionMap[p.product]
    );

    const result: DivisionSummary[] = [];

    // 부문별로 제품 그룹핑 및 집계
    for (const division of targetDivisions) {
      const divisionProducts = processedProducts.filter(
        p => productDivisionMap[p.product] === division.id
      );

      if (divisionProducts.length === 0) continue;

      const periodBreakdown = aggregateByPeriod(divisionProducts, periodInfoList);

      let totalSales = 0;
      let totalCost = 0;
      for (const p of divisionProducts) {
        totalSales += p.totalSales;
        totalCost += p.totalCost;
      }

      result.push({
        divisionId: division.id,
        divisionName: division.name,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
        products: divisionProducts,
        periodBreakdown,
      });
    }

    // 미분류 제품이 있고, 필터가 전체이거나 관리자인 경우 추가
    if (hasUnassigned && (isAdmin || !filter.divisionId)) {
      const unassignedProducts = processedProducts.filter(
        p => !productDivisionMap[p.product]
      );

      if (unassignedProducts.length > 0) {
        const periodBreakdown = aggregateByPeriod(unassignedProducts, periodInfoList);

        let totalSales = 0;
        let totalCost = 0;
        for (const p of unassignedProducts) {
          totalSales += p.totalSales;
          totalCost += p.totalCost;
        }

        result.push({
          divisionId: 'unassigned',
          divisionName: '미분류',
          totalSales,
          totalCost,
          totalProfit: totalSales - totalCost,
          products: unassignedProducts,
          periodBreakdown,
        });
      }
    }

    // 매출액 기준 내림차순 정렬
    return result.sort((a, b) => b.totalSales - a.totalSales);
  }, [divisions, processedProducts, productDivisionMap, periodInfoList, filter.divisionId, isAdmin, userDivisionId]);

  return {
    divisions,
    summaries,
    periodInfoList,
    availableYears,
    availableMonths,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: loadData,
  };
}
