import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductData } from '@/types';
import { getOrCreateReport, getReport, updateReportMonths } from '@/firebase/services/reportService';
import { getProducts, saveProducts, addProduct, deleteProduct } from '@/firebase/services/productService';
import { recordUploadHistory } from '@/firebase/services/uploadHistoryService';
import { logger } from '@/utils/logger';
import type { User } from 'firebase/auth';

export type UploadMergeMode = 'overwrite' | 'merge' | 'smart';

export interface ReportDataInternals {
  reportIdRef: React.MutableRefObject<string | null>;
  setData: React.Dispatch<React.SetStateAction<ProductData[]>>;
  setMonths: React.Dispatch<React.SetStateAction<string[]>>;
  setMonthLabels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseReportDataOptions {
  firebaseUser: User | null;
  authReady: boolean;
}

const CURRENT_YEAR = 2026;

/**
 * 두 ProductData 배열을 병합
 */
function mergeProducts(
  existingProducts: ProductData[],
  incomingProducts: ProductData[],
  existingMonths: string[],
  incomingMonths: string[],
): { merged: ProductData[]; newCount: number; updatedCount: number } {
  const productMap = new Map<string, ProductData>();
  existingProducts.forEach(p => productMap.set(p.product, { ...p }));

  let newCount = 0;
  let updatedCount = 0;

  for (const incomingProduct of incomingProducts) {
    const existingProduct = productMap.get(incomingProduct.product);
    if (existingProduct) {
      const mergedMonths = { ...existingProduct.months };
      for (const [monthKey, monthData] of Object.entries(incomingProduct.months)) {
        mergedMonths[monthKey] = monthData as { sales: number; cost: number };
      }
      productMap.set(incomingProduct.product, {
        ...existingProduct,
        ...(incomingProduct.division && { division: incomingProduct.division }),
        months: mergedMonths,
      });
      updatedCount++;
    } else {
      productMap.set(incomingProduct.product, incomingProduct);
      newCount++;
    }
  }

  const allMonths = new Set([...existingMonths, ...incomingMonths]);
  const sortedMonths = Array.from(allMonths).sort();

  const merged = Array.from(productMap.values()).map(product => {
    const filledMonths: Record<string, { sales: number; cost: number }> = {};
    for (const month of sortedMonths) {
      filledMonths[month] = product.months[month] ?? { sales: 0, cost: 0 };
    }
    return { ...product, months: filledMonths };
  });

  return { merged, newCount, updatedCount };
}

export function useReportData(
  initialData: ProductData[],
  initialMonths: string[],
  initialMonthLabels: Record<string, string>,
  options: UseReportDataOptions,
) {
  const { firebaseUser, authReady } = options;
  const [data, setData] = useState<ProductData[]>(initialData);
  const [months, setMonths] = useState<string[]>(initialMonths);
  const [monthLabels, setMonthLabels] = useState<Record<string, string>>(initialMonthLabels);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportIdRef = useRef<string | null>(null);

  const internals: ReportDataInternals = {
    reportIdRef,
    setData,
    setMonths,
    setMonthLabels,
    setIsLoading,
    setIsSaving,
    setError,
  };

  // 초기 로드: 인증 완료 후 Firestore에서 데이터 fetch
  useEffect(() => {
    if (!authReady) return;
    if (!firebaseUser) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const reportResult = await getReport(CURRENT_YEAR);

        if (!reportResult) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const { reportId, report } = reportResult;
        reportIdRef.current = reportId;
        logger.debug('[useReport] Fetched Report:', report);

        const products = await getProducts(reportId);
        logger.debug('[useReport] Fetched Products:', products.length);

        if (cancelled) return;

        if (products.length > 0) {
          setData(products);

          if (!report.months || report.months.length === 0) {
            logger.warn('[useReport] Report metadata missing months, extracting from products...');
            const monthSet = new Set<string>();
            products.forEach(p => {
              if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
            });
            const extractedMonths = Array.from(monthSet).sort();
            logger.debug('[useReport] Extracted months:', extractedMonths);

            setMonths(extractedMonths);

            const extractedLabels: Record<string, string> = {};
            extractedMonths.forEach(m => {
              const parts = m.split('-');
              if (parts.length === 2) extractedLabels[m] = `${parts[0]}년 ${parseInt(parts[1])}월`;
              else extractedLabels[m] = m;
            });
            setMonthLabels(extractedLabels);
          } else {
            logger.debug('[useReport] Using report metadata months:', report.months);
            setMonths(report.months);
            setMonthLabels(report.monthLabels);
          }
        } else {
          logger.debug('[useReport] No products found.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Firestore load error:', err);
        setError('데이터 로드 실패. 로컬 데이터를 사용합니다.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [authReady, firebaseUser]);

  // 엑셀 업로드 데이터 저장 (병합 모드 지원)
  const saveUploadedData = useCallback(async (
    products: ProductData[],
    newMonths: string[],
    newMonthLabels: Record<string, string>,
    fileName: string,
    mergeMode: UploadMergeMode = 'overwrite',
  ): Promise<{ newCount: number; updatedCount: number }> => {
    let finalProducts: ProductData[];
    let finalMonths: string[];
    let finalMonthLabels: Record<string, string>;
    let newCount = 0;
    let updatedCount = 0;

    if (mergeMode === 'merge') {
      const result = mergeProducts(data, products, months, newMonths);
      finalProducts = result.merged;
      newCount = result.newCount;
      updatedCount = result.updatedCount;

      const allMonths = new Set([...months, ...newMonths]);
      finalMonths = Array.from(allMonths).sort();
      finalMonthLabels = { ...monthLabels, ...newMonthLabels };
    } else {
      finalProducts = products;
      finalMonths = newMonths;
      finalMonthLabels = newMonthLabels;
      newCount = products.length;
    }

    setData(finalProducts);
    setMonths(finalMonths);
    setMonthLabels(finalMonthLabels);

    setIsSaving(true);
    try {
      const { reportId } = await getOrCreateReport(CURRENT_YEAR);
      reportIdRef.current = reportId;

      await updateReportMonths(reportId, finalMonths, finalMonthLabels);
      await saveProducts(reportId, finalProducts);
      await recordUploadHistory({
        reportId,
        fileName,
        monthsAffected: newMonths,
        productCount: products.length,
      });
    } catch (err) {
      console.error('Firestore save error:', err);
      setError('클라우드 저장 실패. 데이터는 화면에 유지됩니다.');
    } finally {
      setIsSaving(false);
    }

    return { newCount, updatedCount };
  }, [data, months, monthLabels]);

  // 개별 제품 추가
  const addEntry = useCallback(async (product: ProductData) => {
    setData(prev => {
      const next = [...prev, product];
      if (reportIdRef.current) {
        addProduct(reportIdRef.current, product, next.length - 1).catch(err =>
          console.error('Firestore addProduct error:', err),
        );
      }
      return next;
    });
  }, []);

  // 개별 제품 삭제
  const removeEntry = useCallback(async (id: number | string) => {
    setData(prev => prev.filter(item => item.id !== id));

    if (reportIdRef.current && typeof id === 'string') {
      try {
        await deleteProduct(reportIdRef.current, id);
      } catch (err) {
        console.error('Firestore deleteProduct error:', err);
      }
    }
  }, []);

  return {
    data,
    months,
    monthLabels,
    isLoading,
    isSaving,
    error,
    saveUploadedData,
    addEntry,
    removeEntry,
    internals,
  };
}
