import { useState, useEffect } from 'react';
import type { ProductData } from '@/types';
import { getReport } from '@/firebase/services/reportService';
import { getProducts } from '@/firebase/services/productService';
import { logger } from '@/utils/logger';

interface YoYData {
  previousData: ProductData[];
  previousMonths: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 전년도 데이터 조회 훅
 * - 현재 선택된 연도의 전년도(year-1) 리포트를 병렬 조회
 * - 전년도 데이터가 없으면 빈 배열 반환
 */
export function useYoYReport(year: number, enabled: boolean = false): YoYData {
  const [previousData, setPreviousData] = useState<ProductData[]>([]);
  const [previousMonths, setPreviousMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPreviousData([]);
      setPreviousMonths([]);
      return;
    }

    let cancelled = false;
    const previousYear = year - 1;

    async function loadPreviousYear() {
      setIsLoading(true);
      setError(null);

      try {
        const reportResult = await getReport(previousYear);
        if (!reportResult || cancelled) {
          if (!cancelled) {
            setPreviousData([]);
            setPreviousMonths([]);
          }
          return;
        }

        const { reportId, report } = reportResult;
        const products = await getProducts(reportId);

        if (cancelled) return;

        setPreviousData(products);
        setPreviousMonths(report.months ?? []);
        logger.debug(`[useYoYReport] Loaded ${products.length} products from ${previousYear}`);
      } catch (err) {
        if (cancelled) return;
        logger.error('[useYoYReport] Failed to load previous year data:', err);
        setError('전년도 데이터 로드 실패');
        setPreviousData([]);
        setPreviousMonths([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPreviousYear();
    return () => { cancelled = true; };
  }, [year, enabled]);

  return { previousData, previousMonths, isLoading, error };
}
