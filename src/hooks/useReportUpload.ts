import { useCallback } from 'react';
import type {
  UploadAnalysisResult,
  ConflictResolution,
  ConflictResolutionSaveResult,
} from '@/types';
import { getOrCreateReport } from '@/firebase/services/reportService';
import { getProducts } from '@/firebase/services/productService';
import {
  analyzeUpload as analyzeUploadService,
  saveWithResolutions as saveWithResolutionsService,
} from '@/firebase/services/snapshotService';
import type { User } from 'firebase/auth';
import type { ReportDataInternals } from './useReportData';

const CURRENT_YEAR = 2026;

interface UseReportUploadOptions {
  internals: ReportDataInternals;
  refreshSnapshots: () => Promise<void>;
  firebaseUser: User | null;
}

export function useReportUpload({ internals, refreshSnapshots, firebaseUser }: UseReportUploadOptions) {
  const { reportIdRef, setData, setMonths, setMonthLabels, setIsSaving, setError } = internals;

  // 업로드 데이터 분석 (충돌 감지)
  const analyzeUpload = useCallback(async (
    products: import('@/types').ProductData[],
    newMonths: string[],
    newMonthLabels: Record<string, string>,
  ): Promise<UploadAnalysisResult> => {
    const { reportId } = await getOrCreateReport(CURRENT_YEAR);
    reportIdRef.current = reportId;
    return analyzeUploadService(reportId, products, newMonths, newMonthLabels);
  }, [reportIdRef]);

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

      return result;
    } catch (err) {
      console.error('Save with resolutions error:', err);
      setError('저장 실패');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [firebaseUser, refreshSnapshots, reportIdRef, setData, setMonths, setMonthLabels, setIsSaving, setError]);

  return {
    analyzeUpload,
    saveWithConflictResolution,
  };
}
