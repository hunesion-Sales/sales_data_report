import { useState, useRef, useCallback } from 'react';
import { parseExcelFile } from '@/utils/excelParser';
import { parseDivisionExcelFile } from '@/utils/divisionExcelParser';
import { parseIndustryGroupExcelFile } from '@/utils/industryGroupExcelParser';
import { parseBacklogExcel } from '@/utils/backlogExcelParser';
import { validateExcelFile } from '@/utils/fileValidator';
import type { UploadMergeMode } from '@/hooks/useReport';
import { getDivisions } from '@/firebase/services/divisionService';
import { saveDivisionData } from '@/firebase/services/divisionDataService';
import { saveIndustryGroupData } from '@/firebase/services/industryGroupDataService';
import {
  saveBacklogMeta,
  saveBacklogProducts,
  saveBacklogDivisions,
  saveBacklogIndustryGroups,
} from '@/firebase/services/backlogService';
import type { ProductData, Division, UploadAnalysisResult, ConflictResolution, ConflictResolutionSaveResult } from '@/types';
import { getMonthShortLabel } from '@/types';
import type { UploadType } from '../components/UploadTypeSelector';
import { logger } from '@/utils/logger';

interface UseDataInputOptions {
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
    mergeMode?: UploadMergeMode,
    targetYear?: number,
  ) => Promise<{ newCount: number; updatedCount: number }>;
  analyzeUpload: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    targetYear?: number,
  ) => Promise<UploadAnalysisResult>;
  saveWithConflictResolution: (
    analysisResult: UploadAnalysisResult,
    resolutions: ConflictResolution[],
    fileName: string,
    targetYear?: number,
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

type PerformanceSubType = 'product' | 'division' | 'industryGroup';

/**
 * 시트명으로 실적 데이터 유형 자동 감지
 * - 부문별/division → division
 * - 산업군/인더스트리/industry → industryGroup
 * - 기본(제품별 포함) → product
 */
function detectPerformanceType(sheetName: string): PerformanceSubType {
  const name = sheetName.toLowerCase();
  if (name.includes('부문별') || name.includes('division') || name.includes('매출코드 소유자')) {
    return 'division';
  }
  if (name.includes('산업군') || name.includes('인더스트리') || name.includes('industry') || name.includes('고객구분')) {
    return 'industryGroup';
  }
  return 'product';
}

export function useDataInput({
  saveUploadedData,
  analyzeUpload,
  saveWithConflictResolution,
  showNotification,
}: UseDataInputOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>('performance');
  const [mergeMode, setMergeMode] = useState<UploadMergeMode>('smart');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [uploadAnalysis, setUploadAnalysis] = useState<UploadAnalysisResult | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [detectedYear, setDetectedYear] = useState<number | null>(null);
  const [detectedSubType, setDetectedSubType] = useState<string | null>(null);

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
    setDetectedSubType(null);
    try {
      const buffer = await file.arrayBuffer();

      if (uploadType === 'backlog') {
        // === 수주잔액 업로드 (시트명 자동 감지) ===
        const result = await parseBacklogExcel(buffer, true);
        setDetectedYear(result.year);

        await saveBacklogMeta(result.year, {
          monthsIncluded: result.monthsIncluded,
        });

        const typeLabels: Record<string, string> = {
          product: '제품별',
          division: '부문별',
          industry: '산업군별',
        };

        if (result.type === 'product' && result.products) {
          await saveBacklogProducts(result.year, result.products);
        } else if (result.type === 'division' && result.divisions) {
          await saveBacklogDivisions(result.year, result.divisions);
        } else if (result.type === 'industry' && result.industryGroups) {
          await saveBacklogIndustryGroups(result.year, result.industryGroups);
        }

        const monthCount = result.monthsIncluded.length;
        const itemCount = result.products?.length
          ?? result.divisions?.length
          ?? result.industryGroups?.length
          ?? 0;

        setDetectedSubType(typeLabels[result.type]);
        showNotification(
          `수주잔액 ${typeLabels[result.type]} 데이터가 업로드되었습니다 (${result.year}년, ${itemCount}개 항목, ${monthCount}개 월)`
        );
      } else {
        // === 실적 데이터 업로드 (시트명 자동 감지) ===
        // 먼저 시트명을 읽어서 유형 감지
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheetName = workbook.worksheets[0]?.name || '';
        const subType = detectPerformanceType(sheetName);

        logger.debug(`[DataInput] Detected performance sub-type: ${subType} (sheet: "${sheetName}")`);

        const subTypeLabels: Record<PerformanceSubType, string> = {
          product: '제품별',
          division: '부문별',
          industryGroup: '산업군별',
        };
        setDetectedSubType(subTypeLabels[subType]);

        if (subType === 'industryGroup') {
          // --- 산업군별 ---
          const result = await parseIndustryGroupExcelFile(buffer);

          const currentYear = new Date().getFullYear();
          const reportId = `report-${currentYear}`;
          await saveIndustryGroupData(reportId, result.data, mergeMode);

          showNotification(
            `산업군별 데이터가 업로드되었습니다 (${result.data.length}개 산업군, ${result.months.length}개 월)`
          );
        } else if (subType === 'division') {
          // --- 부문별 ---
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
            `부문별 데이터가 업로드되었습니다 (${items.length}개 부문, ${matchedCount}개 매칭, ${unmatchedCount}개 미매칭)`
          );
        } else {
          // --- 제품별 (기본) ---
          const result = await parseExcelFile(buffer);
          setDetectedYear(result.detectedYear);
          const yearForUpload = result.detectedYear;

          if (mergeMode === 'smart') {
            const analysis = await analyzeUpload(
              result.data,
              result.months,
              result.monthLabels,
              yearForUpload,
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
              yearForUpload,
            );

            const yearInfo = yearForUpload !== new Date().getFullYear() ? ` [${yearForUpload}년]` : '';
            const monthInfo = result.months.length > 0
              ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
              : '';

            showNotification(
              `${yearInfo}제품별 데이터가 저장되었습니다: 신규 ${analysis.newMonths.length}개 월, 변경 없음 ${saveResult.skippedMonths.length}개 월${monthInfo}`
            );
          } else {
            const { newCount, updatedCount } = await saveUploadedData(
              result.data,
              result.months,
              result.monthLabels,
              file.name,
              mergeMode,
              yearForUpload,
            );

            const yearInfo = yearForUpload !== new Date().getFullYear() ? ` [${yearForUpload}년]` : '';
            const monthInfo = result.months.length > 0
              ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
              : '';

            if (mergeMode === 'merge') {
              showNotification(
                `${yearInfo}제품별 데이터가 병합되었습니다: 신규 ${newCount}건, 업데이트 ${updatedCount}건${monthInfo}`
              );
            } else {
              showNotification(`${yearInfo}${result.data.length}건의 제품별 데이터를 불러왔습니다.${monthInfo}`);
            }
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
    detectedYear,
    detectedSubType,
    handleFileUpload,
    handleConflictResolve,
  };
}
