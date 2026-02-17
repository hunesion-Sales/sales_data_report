import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ProductData,
  WeekKey,
  WeeklySnapshot,
  UploadAnalysisResult,
  ConflictResolution,
  ConflictResolutionSaveResult,
} from '@/types';
import { getOrCreateReport, getReport, updateReportMonths } from '@/firebase/services/reportService';
import { getProducts, saveProducts, addProduct, deleteProduct } from '@/firebase/services/productService';
import { recordUploadHistory } from '@/firebase/services/uploadHistoryService';
import {
  getSnapshots,
  getSnapshotProducts,
  analyzeUpload as analyzeUploadService,
  saveWithResolutions as saveWithResolutionsService,
} from '@/firebase/services/snapshotService';
import { getWeekKey } from '@/utils/weekUtils';
import type { User } from 'firebase/auth';

export type UploadMergeMode = 'overwrite' | 'merge' | 'smart';

interface UseReportOptions {
  /** Firebase Auth 사용자 (null이면 Firestore 쿼리 스킵) */
  firebaseUser: User | null;
  /** Auth 상태가 결정되었는지 (초기 로딩 중이면 false) */
  authReady: boolean;
}

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

  // 스냅샷 관련 기능
  /** 현재 주차 키 */
  currentWeekKey: WeekKey;
  /** 사용 가능한 스냅샷 목록 */
  availableSnapshots: WeeklySnapshot[];
  /** 현재 선택된 스냅샷 (null이면 최신 데이터) */
  selectedSnapshot: WeekKey | null;
  /** 업로드 데이터 분석 (충돌 감지) */
  analyzeUpload: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
  ) => Promise<UploadAnalysisResult>;
  /** 충돌 해결 후 저장 */
  saveWithConflictResolution: (
    analysisResult: UploadAnalysisResult,
    resolutions: ConflictResolution[],
    fileName: string,
  ) => Promise<ConflictResolutionSaveResult>;
  /** 특정 스냅샷 로드 */
  loadSnapshot: (weekKey: WeekKey) => Promise<void>;
  /** 최신 데이터 로드 */
  loadLatest: () => Promise<void>;
  /** 스냅샷 목록 새로고침 */
  refreshSnapshots: () => Promise<void>;
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
  options: UseReportOptions,
): UseReportReturn {
  const { firebaseUser, authReady } = options;
  const [data, setData] = useState<ProductData[]>(initialData);
  const [months, setMonths] = useState<string[]>(initialMonths);
  const [monthLabels, setMonthLabels] = useState<Record<string, string>>(initialMonthLabels);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportIdRef = useRef<string | null>(null);
  const loadedRef = useRef(false);

  // 스냅샷 관련 상태
  const [currentWeekKey] = useState<WeekKey>(getWeekKey());
  const [availableSnapshots, setAvailableSnapshots] = useState<WeeklySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<WeekKey | null>(null);

  // 초기 로드: 인증 완료 후 Firestore에서 데이터 fetch
  useEffect(() => {
    // Auth 상태가 아직 결정되지 않았으면 대기
    if (!authReady) {
      return;
    }

    // 로그인하지 않은 상태면 초기 데이터 사용
    if (!firebaseUser) {
      setIsLoading(false);
      return;
    }

    // Remove loadedRef check to allow re-fetching on user change
    // If strict mode causes double fetch, 'cancelled' flag handles it.

    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const reportResult = await getReport(CURRENT_YEAR);

        if (!reportResult) {
          // 보고서가 없으면 로컬/초기 데이터 사용
          // (에러 아님, 첫 실행이거나 아직 데이터가 없는 상태)
          if (!cancelled) setIsLoading(false);
          return;
        }

        const { reportId, report } = reportResult;
        reportIdRef.current = reportId;
        console.log('[useReport] Fetched Report:', report);

        const products = await getProducts(reportId);
        console.log('[useReport] Fetched Products:', products.length);

        if (cancelled) return;

        if (products.length > 0) {
          // Firestore 데이터 사용
          setData(products);

          // 만약 report.months가 비어있다면 제품 데이터에서 직접 추출 (Fallback)
          if (!report.months || report.months.length === 0) {
            console.warn('[useReport] Report metadata missing months, extracting from products...');
            const monthSet = new Set<string>();
            products.forEach(p => {
              if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
            });
            const extractedMonths = Array.from(monthSet).sort();
            console.log('[useReport] Extracted months:', extractedMonths);

            setMonths(extractedMonths);

            // 라벨도 기본값 생성
            const extractedLabels: Record<string, string> = {};
            extractedMonths.forEach(m => {
              const parts = m.split('-');
              if (parts.length === 2) extractedLabels[m] = `${parts[0]}년 ${parseInt(parts[1])}월`;
              else extractedLabels[m] = m;
            });
            setMonthLabels(extractedLabels);
          } else {
            console.log('[useReport] Using report metadata months:', report.months);
            setMonths(report.months);
            setMonthLabels(report.monthLabels);
          }
        } else {
          console.log('[useReport] No products found.');
        }
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

  // 스냅샷 목록 새로고침
  const refreshSnapshots = useCallback(async () => {
    if (!reportIdRef.current) return;
    try {
      const snapshots = await getSnapshots(reportIdRef.current);
      setAvailableSnapshots(snapshots);
    } catch (err) {
      console.error('Failed to refresh snapshots:', err);
    }
  }, []);

  // 업로드 데이터 분석 (충돌 감지)
  const analyzeUpload = useCallback(async (
    products: ProductData[],
    newMonths: string[],
    newMonthLabels: Record<string, string>,
  ): Promise<UploadAnalysisResult> => {
    const { reportId } = await getOrCreateReport(CURRENT_YEAR);
    reportIdRef.current = reportId;
    return analyzeUploadService(reportId, products, newMonths, newMonthLabels);
  }, []);

  // 충돌 해결 후 저장
  const saveWithConflictResolution = useCallback(async (
    analysisResult: UploadAnalysisResult,
    resolutions: ConflictResolution[],
    fileName: string,
  ): Promise<ConflictResolutionSaveResult> => {
    if (!reportIdRef.current) {
      const { reportId } = await getOrCreateReport(CURRENT_YEAR);
      reportIdRef.current = reportId;
    }

    setIsSaving(true);
    try {
      const userId = firebaseUser?.uid || 'anonymous';
      const result = await saveWithResolutionsService(
        reportIdRef.current,
        analysisResult,
        resolutions,
        fileName,
        userId
      );

      // 스냅샷 목록 새로고침
      await refreshSnapshots();

      // 최신 데이터 로드
      const products = await getProducts(reportIdRef.current);
      setData(products);

      // 월 정보 업데이트
      const allMonths = new Set<string>();
      products.forEach(p => {
        if (p.months) Object.keys(p.months).forEach(k => allMonths.add(k));
      });
      const sortedMonths = Array.from(allMonths).sort();
      setMonths(sortedMonths);
      setMonthLabels(analysisResult.monthLabels);

      // 현재 선택 초기화 (최신 데이터로)
      setSelectedSnapshot(null);

      return result;
    } catch (err) {
      console.error('Save with resolutions error:', err);
      setError('저장 실패');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [firebaseUser, refreshSnapshots]);

  // 특정 스냅샷 로드
  const loadSnapshot = useCallback(async (weekKey: WeekKey) => {
    if (!reportIdRef.current) return;

    setIsLoading(true);
    try {
      const products = await getSnapshotProducts(reportIdRef.current, weekKey);
      setData(products);
      setSelectedSnapshot(weekKey);

      // 월 정보 추출
      const monthSet = new Set<string>();
      products.forEach(p => {
        if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
      });
      setMonths(Array.from(monthSet).sort());
    } catch (err) {
      console.error('Failed to load snapshot:', err);
      setError('스냅샷 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 최신 데이터 로드
  const loadLatest = useCallback(async () => {
    if (!reportIdRef.current) return;

    setIsLoading(true);
    try {
      const products = await getProducts(reportIdRef.current);
      setData(products);
      setSelectedSnapshot(null);

      // 월 정보 추출
      const monthSet = new Set<string>();
      products.forEach(p => {
        if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
      });
      setMonths(Array.from(monthSet).sort());
    } catch (err) {
      console.error('Failed to load latest:', err);
      setError('최신 데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드 시 스냅샷 목록도 로드
  useEffect(() => {
    if (reportIdRef.current && !isLoading) {
      refreshSnapshots();
    }
  }, [isLoading, refreshSnapshots]);

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
    // 스냅샷 관련
    currentWeekKey,
    availableSnapshots,
    selectedSnapshot,
    analyzeUpload,
    saveWithConflictResolution,
    loadSnapshot,
    loadLatest,
    refreshSnapshots,
  };
}
