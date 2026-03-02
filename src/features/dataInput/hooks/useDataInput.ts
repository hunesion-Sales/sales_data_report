import { useState, useRef, useCallback } from 'react';
import { parseExcelFile } from '@/utils/excelParser';
import { parseDivisionExcelFile } from '@/utils/divisionExcelParser';
import { parseIndustryGroupExcelFile } from '@/utils/industryGroupExcelParser';
import { parseBacklogExcel } from '@/utils/backlogExcelParser';
import { validateExcelFile } from '@/utils/fileValidator';
import { getDivisions } from '@/firebase/services/divisionService';
import { saveDivisionData } from '@/firebase/services/divisionDataService';
import { saveIndustryGroupData, type IndustryGroupDataItem } from '@/firebase/services/industryGroupDataService';
import { getIndustryGroups } from '@/firebase/services/industryGroupService';
import {
  saveBacklogMeta,
  saveBacklogProducts,
  saveBacklogDivisions,
  saveBacklogIndustryGroups,
} from '@/firebase/services/backlogService';
import type { ProductData, Division } from '@/types';
import { getMonthShortLabel } from '@/types';
import type { UploadType } from '../components/UploadTypeSelector';
import { logger } from '@/utils/logger';

interface UseDataInputOptions {
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
    mergeMode?: 'overwrite' | 'merge' | 'smart',
    targetYear?: number,
  ) => Promise<{ newCount: number; updatedCount: number }>;
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

/**
 * 파서가 반환한 원시 데이터(고객구분명)를 산업군 키워드로 매핑하여 합산
 * - "공공기관", "공기업", "부,청" → "공공" 산업군으로 합산
 * - "유지보수" 항목은 이미 파서에서 합산되어 있으므로 그대로 유지
 * - 고객구분이 "_MA"로 끝나면 "유지보수" 산업군으로 분류 (2025년 데이터 호환)
 * - 매칭 안 되는 항목은 "기타"로 분류
 */
function mapToIndustryGroups(
  rawData: IndustryGroupDataItem[],
  industryGroups: { name: string; keywords: string[] }[],
): IndustryGroupDataItem[] {
  const groupMap = new Map<string, Record<string, { sales: number; cost: number }>>();

  for (const item of rawData) {
    let targetName: string;

    // 1. "_MA"로 끝나는 고객구분은 유지보수 산업군으로 분류 (2025년 데이터 호환)
    if (item.industryGroupName.trim().endsWith('_MA')) {
      targetName = '유지보수';
      logger.debug(`[mapToIndustryGroups] "${item.industryGroupName}" → 유지보수 (MA 패턴)`);
    }
    // 2. 산업군명과 정확히 일치하면 바로 사용 (예: "유지보수", "기타")
    else if (industryGroups.find(g => g.name === item.industryGroupName)) {
      targetName = item.industryGroupName;
    }
    // 3. 키워드 매칭
    else {
      const matched = industryGroups.find(g =>
        g.keywords.some(kw =>
          kw === item.industryGroupName ||
          item.industryGroupName.includes(kw) ||
          kw.includes(item.industryGroupName)
        )
      );
      targetName = matched?.name ?? '기타';
    }

    const existing = groupMap.get(targetName) || {};
    for (const [monthKey, data] of Object.entries(item.months)) {
      if (existing[monthKey]) {
        existing[monthKey] = {
          sales: existing[monthKey].sales + data.sales,
          cost: existing[monthKey].cost + data.cost,
        };
      } else {
        existing[monthKey] = { ...data };
      }
    }
    groupMap.set(targetName, existing);
  }

  return Array.from(groupMap.entries()).map(([name, months]) => ({
    industryGroupName: name,
    months,
  }));
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
  showNotification,
}: UseDataInputOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>('performance');
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

      // === 시트명 기반 업로드 타입 자동 감지 ===
      // 70%~80% → 수주잔액(backlog), 90%~100% → 실적(performance)
      let effectiveUploadType: UploadType = uploadType;
      {
        const ExcelJS = await import('exceljs');
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const sheetName = wb.worksheets[0]?.name || '';

        if (sheetName.includes('70%~80%') || sheetName.includes('잔액')) {
          if (uploadType !== 'backlog') {
            logger.info(`[DataInput] 시트명 자동 감지: "${sheetName}" → 수주잔액 (사용자 선택: ${uploadType})`);
            showNotification('시트명에서 수주잔액 데이터가 감지되어 자동 전환되었습니다.');
          }
          effectiveUploadType = 'backlog';
        } else if (sheetName.includes('90%~100%') || sheetName.includes('90%~1000%')) {
          if (uploadType !== 'performance') {
            logger.info(`[DataInput] 시트명 자동 감지: "${sheetName}" → 실적 (사용자 선택: ${uploadType})`);
            showNotification('시트명에서 실적 데이터가 감지되어 자동 전환되었습니다.');
          }
          effectiveUploadType = 'performance';
        }
      }

      if (effectiveUploadType === 'backlog') {
        // === 수주잔액 업로드 (시트명 자동 감지) ===
        // filterPastMonths = false: 과거 월 데이터도 모두 저장 (전체 수주잔액 합계 표시용)
        const result = await parseBacklogExcel(buffer, false);
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
          // 영업부문 매칭 적용 (공공사업부 → 공공사업부문 등)
          const divisions = await getDivisions();
          const mappedDivisions = result.divisions.map(d => {
            const matched = matchDivision(d.division, divisions);
            return {
              division: matched?.name ?? d.division,
              months: d.months,
            };
          });
          await saveBacklogDivisions(result.year, mappedDivisions);
          logger.debug(`[DataInput] Division mapping: ${result.divisions.map(d => d.division).join(', ')} → ${mappedDivisions.map(d => d.division).join(', ')}`);
        } else if (result.type === 'industry' && result.industryGroups) {
          // 산업군 키워드 매핑 적용 (실적 데이터와 동일한 매핑 로직)
          const industryGroups = await getIndustryGroups();
          const mappedGroups = mapToIndustryGroups(result.industryGroups, industryGroups);
          await saveBacklogIndustryGroups(result.year, mappedGroups);
          logger.debug(`[DataInput] Backlog industry mapping: ${result.industryGroups.length} raw → ${mappedGroups.length} mapped groups`);
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

          // 고객구분(raw) → 산업군명 키워드 매핑 후 합산
          const industryGroups = await getIndustryGroups();
          const mappedData = mapToIndustryGroups(result.data, industryGroups);

          // 월 키에서 연도 추출 (예: "2025-01" → 2025)
          const detectedYr = result.months.length > 0
            ? parseInt(result.months[0].split('-')[0], 10)
            : new Date().getFullYear();
          setDetectedYear(detectedYr);
          const reportId = `report-${detectedYr}`;
          await saveIndustryGroupData(reportId, mappedData, 'overwrite');

          const yearInfo = detectedYr !== new Date().getFullYear() ? ` [${detectedYr}년]` : '';
          showNotification(
            `${yearInfo}산업군별 데이터가 업로드되었습니다 (${mappedData.length}개 산업군, ${result.months.length}개 월)`
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

          // 월 키에서 연도 추출 (예: "2025-01" → 2025)
          const detectedYr = result.months.length > 0
            ? parseInt(result.months[0].split('-')[0], 10)
            : new Date().getFullYear();
          setDetectedYear(detectedYr);
          const reportId = `report-${detectedYr}`;
          await saveDivisionData(reportId, items, 'overwrite');

          const yearInfo = detectedYr !== new Date().getFullYear() ? ` [${detectedYr}년]` : '';
          showNotification(
            `${yearInfo}부문별 데이터가 업로드되었습니다 (${items.length}개 부문, ${matchedCount}개 매칭, ${unmatchedCount}개 미매칭)`
          );
        } else {
          // --- 제품별 (기본) ---
          const result = await parseExcelFile(buffer);
          setDetectedYear(result.detectedYear);
          const yearForUpload = result.detectedYear;

          await saveUploadedData(
            result.data,
            result.months,
            result.monthLabels,
            file.name,
            'overwrite',
            yearForUpload,
          );

          const yearInfo = yearForUpload !== new Date().getFullYear() ? ` [${yearForUpload}년]` : '';
          const monthInfo = result.months.length > 0
            ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
            : '';

          showNotification(`${yearInfo}${result.data.length}건의 제품별 데이터를 불러왔습니다.${monthInfo}`);
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
  }, [saveUploadedData, uploadType, showNotification]);

  return {
    fileInputRef,
    isUploading,
    uploadType,
    setUploadType,
    detectedYear,
    detectedSubType,
    handleFileUpload,
  };
}
