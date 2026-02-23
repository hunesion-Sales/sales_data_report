import { useState, useRef, useCallback } from 'react';
import { parseExcelFile } from '@/utils/excelParser';
import { parseDivisionExcelFile } from '@/utils/divisionExcelParser';
import { validateExcelFile } from '@/utils/fileValidator';
import type { UploadMergeMode } from '@/hooks/useReport';
import { getDivisions } from '@/firebase/services/divisionService';
import { saveDivisionData } from '@/firebase/services/divisionDataService';
import type { ProductData, Division, UploadAnalysisResult, ConflictResolution, ConflictResolutionSaveResult } from '@/types';
import { getMonthShortLabel } from '@/types';

interface UseDataInputOptions {
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
    mergeMode?: UploadMergeMode,
  ) => Promise<{ newCount: number; updatedCount: number }>;
  analyzeUpload: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
  ) => Promise<UploadAnalysisResult>;
  saveWithConflictResolution: (
    analysisResult: UploadAnalysisResult,
    resolutions: ConflictResolution[],
    fileName: string,
  ) => Promise<ConflictResolutionSaveResult>;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

export function matchDivision(excelName: string, divisions: Division[]): Division | null {
  const exact = divisions.find(d => d.name === excelName);
  if (exact) return exact;
  const partial = divisions.find(d =>
    d.name.includes(excelName) || excelName.includes(d.name)
  );
  return partial || null;
}

export function useDataInput({
  saveUploadedData,
  analyzeUpload,
  saveWithConflictResolution,
  showNotification,
}: UseDataInputOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'product' | 'division'>('product');
  const [mergeMode, setMergeMode] = useState<UploadMergeMode>('smart');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [uploadAnalysis, setUploadAnalysis] = useState<UploadAnalysisResult | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateExcelFile(file);
    if (!validation.valid) {
      showNotification(validation.error!, 'error');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();

      if (uploadType === 'division') {
        const result = await parseDivisionExcelFile(buffer);
        const divisions = await getDivisions();

        let matchedCount = 0;
        let unmatchedCount = 0;
        const items = result.data.map(row => {
          const matched = matchDivision(row.divisionName, divisions);
          if (matched) {
            matchedCount++;
          } else {
            unmatchedCount++;
          }
          return {
            divisionName: row.divisionName,
            divisionId: matched?.id ?? 'unmatched',
            months: row.months,
          };
        });

        const currentYear = new Date().getFullYear();
        const reportId = `report-${currentYear}`;
        await saveDivisionData(reportId, items, mergeMode);

        showNotification(
          `${items.length}개 부문 데이터가 업로드되었습니다 (${matchedCount}개 매칭, ${unmatchedCount}개 미매칭)`
        );
      } else {
        const result = await parseExcelFile(buffer);

        if (mergeMode === 'smart') {
          const analysis = await analyzeUpload(
            result.data,
            result.months,
            result.monthLabels,
          );

          if (analysis.conflicts.length > 0) {
            setUploadAnalysis(analysis);
            setPendingFileName(file.name);
            setShowConflictModal(true);
            setIsUploading(false);
            e.target.value = '';
            return;
          }

          const saveResult = await saveWithConflictResolution(
            analysis,
            [],
            file.name,
          );

          const monthInfo = result.months.length > 0
            ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
            : '';

          showNotification(
            `데이터가 저장되었습니다: 신규 ${analysis.newMonths.length}개 월, 변경 없음 ${saveResult.skippedMonths.length}개 월${monthInfo}`
          );
        } else {
          const { newCount, updatedCount } = await saveUploadedData(
            result.data,
            result.months,
            result.monthLabels,
            file.name,
            mergeMode,
          );

          const monthInfo = result.months.length > 0
            ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
            : '';

          if (mergeMode === 'merge') {
            showNotification(
              `데이터가 병합되었습니다: 신규 ${newCount}건, 업데이트 ${updatedCount}건${monthInfo}`
            );
          } else {
            showNotification(`${result.data.length}건의 데이터를 불러왔습니다.${monthInfo}`);
          }
        }
      }
    } catch (error) {
      console.error('Excel parsing error:', error);
      const message = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
      showNotification(message, 'error');
    } finally {
      setIsUploading(false);
    }
    e.target.value = '';
  }, [saveUploadedData, uploadType, mergeMode, analyzeUpload, saveWithConflictResolution, showNotification]);

  const handleConflictResolve = useCallback(async (resolutions: ConflictResolution[]) => {
    if (!uploadAnalysis) return;

    setIsUploading(true);
    try {
      const result = await saveWithConflictResolution(
        uploadAnalysis,
        resolutions,
        pendingFileName,
      );

      setShowConflictModal(false);
      setUploadAnalysis(null);
      setPendingFileName('');

      const useNewCount = resolutions.filter(r => r.resolution === 'use_new').length;
      showNotification(
        `데이터가 저장되었습니다: 신규 ${result.newCount}개 월, 대체 ${useNewCount}개 월, 스킵 ${result.skippedMonths.length}개 월`
      );
    } catch (error) {
      console.error('Conflict resolution error:', error);
      showNotification('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [uploadAnalysis, pendingFileName, saveWithConflictResolution, showNotification]);

  return {
    fileInputRef,
    isUploading,
    uploadType,
    setUploadType,
    mergeMode,
    setMergeMode,
    showConflictModal,
    setShowConflictModal,
    uploadAnalysis,
    setUploadAnalysis,
    pendingFileName,
    setPendingFileName,
    handleFileUpload,
    handleConflictResolve,
  };
}
