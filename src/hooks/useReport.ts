import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductData } from '@/types';
import { getOrCreateReport, updateReportMonths } from '@/firebase/services/reportService';
import { getProducts, saveProducts, addProduct, deleteProduct } from '@/firebase/services/productService';
import { recordUploadHistory } from '@/firebase/services/uploadHistoryService';

export type UploadMergeMode = 'overwrite' | 'merge';

interface UseReportReturn {
  data: ProductData[];
  months: string[];
  monthLabels: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  /** 엑셀 업로드 결과를 Firestore에 저장 (병합 모드 지원) */
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
    mergeMode?: UploadMergeMode,
  ) => Promise<{ newCount: number; updatedCount: number }>;
  /** 개별 제품 추가 */
  addEntry: (product: ProductData) => Promise<void>;
  /** 개별 제품 삭제 */
  removeEntry: (id: number | string) => Promise<void>;
}

const CURRENT_YEAR = 2026;

/**
 * 두 ProductData 배열을 병합
 * - 같은 제품명이면 월별 데이터를 병합 (새 데이터로 덮어쓰기)
 * - 새 제품은 추가
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
      // 기존 제품 업데이트: 새로운 월 데이터로 덮어쓰기
      const mergedMonths = { ...existingProduct.months };
      for (const [monthKey, monthData] of Object.entries(incomingProduct.months)) {
        mergedMonths[monthKey] = monthData as { sales: number; cost: number };
      }
      productMap.set(incomingProduct.product, {
        ...existingProduct,
        months: mergedMonths,
      });
      updatedCount++;
    } else {
      // 새 제품 추가
      productMap.set(incomingProduct.product, incomingProduct);
      newCount++;
    }
  }

  // 모든 월 합치기 (중복 제거 및 정렬)
  const allMonths = new Set([...existingMonths, ...incomingMonths]);
  const sortedMonths = Array.from(allMonths).sort();

  // 결과 배열 생성 (빈 월 데이터 채우기)
  const merged = Array.from(productMap.values()).map(product => {
    const filledMonths: Record<string, { sales: number; cost: number }> = {};
    for (const month of sortedMonths) {
      filledMonths[month] = product.months[month] ?? { sales: 0, cost: 0 };
    }
    return { ...product, months: filledMonths };
  });

  return { merged, newCount, updatedCount };
}

export function useReport(
  initialData: ProductData[],
  initialMonths: string[],
  initialMonthLabels: Record<string, string>,
): UseReportReturn {
  const [data, setData] = useState<ProductData[]>(initialData);
  const [months, setMonths] = useState<string[]>(initialMonths);
  const [monthLabels, setMonthLabels] = useState<Record<string, string>>(initialMonthLabels);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportIdRef = useRef<string | null>(null);

  // 초기 로드: Firestore에서 데이터 fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const { reportId, report } = await getOrCreateReport(CURRENT_YEAR);
        reportIdRef.current = reportId;

        const products = await getProducts(reportId);

        if (cancelled) return;

        if (products.length > 0) {
          // Firestore 데이터 사용
          setData(products);
          setMonths(report.months);
          setMonthLabels(report.monthLabels);
        }
        // products가 없으면 initialData(INITIAL_DATA) 유지
      } catch (err) {
        if (cancelled) return;
        console.error('Firestore load error:', err);
        setError('데이터 로드 실패. 로컬 데이터를 사용합니다.');
        // initialData fallback 유지
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

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
      // 병합 모드: 기존 데이터와 합치기
      const result = mergeProducts(data, products, months, newMonths);
      finalProducts = result.merged;
      newCount = result.newCount;
      updatedCount = result.updatedCount;

      // 월 정보 병합
      const allMonths = new Set([...months, ...newMonths]);
      finalMonths = Array.from(allMonths).sort();
      finalMonthLabels = { ...monthLabels, ...newMonthLabels };
    } else {
      // 덮어쓰기 모드: 기존 데이터 대체
      finalProducts = products;
      finalMonths = newMonths;
      finalMonthLabels = newMonthLabels;
      newCount = products.length;
    }

    // UI 즉시 반영
    setData(finalProducts);
    setMonths(finalMonths);
    setMonthLabels(finalMonthLabels);

    // Firestore 비동기 저장
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
      // Firestore 비동기 저장
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
  };
}
