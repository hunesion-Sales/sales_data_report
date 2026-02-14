import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProductData } from '@/types';
import { getOrCreateReport, updateReportMonths } from '@/firebase/services/reportService';
import { getProducts, saveProducts, addProduct, deleteProduct } from '@/firebase/services/productService';
import { recordUploadHistory } from '@/firebase/services/uploadHistoryService';

interface UseReportReturn {
  data: ProductData[];
  months: string[];
  monthLabels: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  /** 엑셀 업로드 결과를 Firestore에 저장 */
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
  ) => Promise<void>;
  /** 개별 제품 추가 */
  addEntry: (product: ProductData) => Promise<void>;
  /** 개별 제품 삭제 */
  removeEntry: (id: number | string) => Promise<void>;
}

const CURRENT_YEAR = 2026;

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

  // 엑셀 업로드 데이터 저장
  const saveUploadedData = useCallback(async (
    products: ProductData[],
    newMonths: string[],
    newMonthLabels: Record<string, string>,
    fileName: string,
  ) => {
    // UI 즉시 반영
    setData(products);
    setMonths(newMonths);
    setMonthLabels(newMonthLabels);

    // Firestore 비동기 저장
    setIsSaving(true);
    try {
      const { reportId } = await getOrCreateReport(CURRENT_YEAR);
      reportIdRef.current = reportId;

      await updateReportMonths(reportId, newMonths, newMonthLabels);
      await saveProducts(reportId, products);
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
  }, []);

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
