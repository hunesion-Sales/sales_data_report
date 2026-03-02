/**
 * 수주잔액 엑셀 파서 (3종: 제품별, 부문별, 산업군별)
 * - 기존 excelParser.ts 패턴 재사용
 * - 시트명으로 유형 자동 감지
 * - 지난 달 데이터 무시 옵션 (수주잔액용)
 */

import type {
  BacklogProductData,
  BacklogDivisionData,
  BacklogIndustryGroupData,
  MonthData,
} from '@/types';
import { VALID_YEAR_RANGE } from '@/config/appConfig';
import { logger } from './logger';
import { parseMonthLabel } from './excelParser';

export type BacklogType = 'product' | 'division' | 'industry';

interface BacklogParseResult {
  type: BacklogType;
  year: number;
  products?: BacklogProductData[];
  divisions?: BacklogDivisionData[];
  industryGroups?: BacklogIndustryGroupData[];
  monthsIncluded: string[];
}

/**
 * 셀 값에서 숫자 추출 (richText 처리 포함)
 */
function getCellNumber(row: any, col: number): number {
  const cell = row.getCell(col);
  if (cell.value === null || cell.value === undefined) return 0;
  if (typeof cell.value === 'number') return cell.value;
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    const text = cell.value.richText.map((rt: any) => rt.text).join('');
    return Number(text) || 0;
  }
  return Number(cell.value) || 0;
}

/**
 * 셀 값에서 문자열 추출 (richText 처리 포함)
 */
function getCellString(row: any, col: number): string {
  const cell = row.getCell(col);
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'string') return cell.value.trim();
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map((rt: any) => rt.text).join('').trim();
  }
  return String(cell.value).trim();
}

/**
 * 시트명으로 수주잔액 유형 감지
 */
function detectBacklogType(sheetName: string): BacklogType | null {
  const name = sheetName.toLowerCase();
  if (name.includes('제품별') || name.includes('product')) return 'product';
  if (name.includes('부문별') || name.includes('division')) return 'division';
  if (name.includes('인더스트리') || name.includes('산업군') || name.includes('industry')) return 'industry';
  return null;
}

/**
 * 수주잔액/실적 엑셀 파일 파싱
 */
export async function parseBacklogExcel(
  buffer: ArrayBuffer,
  filterPastMonths: boolean = false
): Promise<BacklogParseResult> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('워크시트를 찾을 수 없습니다.');

  const sheetName = worksheet.name || '';
  const type = detectBacklogType(sheetName);
  if (!type) {
    throw new Error(`시트 유형을 감지할 수 없습니다: "${sheetName}". 시트명에 "제품별", "부문별", "인더스트리별" 키워드가 필요합니다.`);
  }

  logger.debug(`[BacklogParser] Detected type: ${type}, sheet: ${sheetName}`);

  // 1) 월 헤더 탐색
  let monthHeaderRow = 0;
  const monthColumns: { key: string; salesCol: number; costCol: number }[] = [];

  for (let rowNum = 1; rowNum <= 10; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = getCellString({ getCell: () => cell } as any, 1) || String(cell.value ?? '').trim();
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        if (!found) {
          monthHeaderRow = rowNum;
          found = true;
        }
        const parsed = parseMonthLabel(val);
        const isDuplicate = monthColumns.some(m => m.key === parsed.key);
        if (isDuplicate) return;

        // 서브 헤더에서 매출/매입 컬럼 찾기
        const subRow = worksheet.getRow(rowNum + 1);
        let salesCol = colNumber;
        let costCol = colNumber + 1;

        for (let c = colNumber; c <= colNumber + 2; c++) {
          const subVal = String(subRow.getCell(c).value ?? '').trim();
          if (subVal.includes('매출') && !subVal.includes('이익') && !subVal.includes('코드')) {
            salesCol = c;
          } else if (subVal.includes('매입')) {
            costCol = c;
          }
        }

        monthColumns.push({ key: parsed.key, salesCol, costCol });
      }
    });

    if (found) break;
  }

  if (monthColumns.length === 0) {
    throw new Error('월 헤더를 찾을 수 없습니다.');
  }

  // 연도 추출
  const detectedYear = parseInt(monthColumns[0].key.split('-')[0], 10);
  if (detectedYear < VALID_YEAR_RANGE.min || detectedYear > VALID_YEAR_RANGE.max) {
    throw new Error(`감지된 연도(${detectedYear})가 유효 범위를 벗어났습니다.`);
  }

  // 지난 달 필터링 (수주잔액용)
  let filteredMonthColumns = monthColumns;
  if (filterPastMonths) {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredMonthColumns = monthColumns.filter(m => m.key >= currentMonthKey);
  }

  const monthsIncluded = filteredMonthColumns.map(m => m.key);

  // 2) 항목명 컬럼 탐색
  let nameCol = 2;
  const subHeaderRow = worksheet.getRow(monthHeaderRow + 1);
  subHeaderRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const val = String(cell.value ?? '').trim();
    if (['제품군', '제품명', '사업부문', '부문', '고객구분', '매출코드 소유자'].some(k => val.includes(k))) {
      nameCol = colNumber;
    }
  });

  logger.debug(`[BacklogParser] nameCol=${nameCol}, monthHeaderRow=${monthHeaderRow}, dataStartRow=${monthHeaderRow + 2}`);

  // 3) 데이터 파싱
  const dataStartRow = monthHeaderRow + 2;

  if (type === 'industry') {
    return parseIndustryBacklog(worksheet, dataStartRow, nameCol, filteredMonthColumns, detectedYear, monthsIncluded);
  }

  // 제품별 / 부문별 파싱
  const items: Array<{ name: string; months: Record<string, MonthData> }> = [];
  const skippedItems: string[] = [];

  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const name = getCellString(row, nameCol);

    if (!name || name === '전체' || name === '부분합' || name === '합계') continue;

    const months: Record<string, MonthData> = {};
    let totalSales = 0;
    let totalCost = 0;

    for (const mc of filteredMonthColumns) {
      const sales = getCellNumber(row, mc.salesCol);
      const cost = getCellNumber(row, mc.costCol);
      totalSales += sales;
      totalCost += cost;
      if (sales !== 0 || cost !== 0) {
        months[mc.key] = { sales, cost };
      }
    }

    if (Object.keys(months).length > 0) {
      items.push({ name, months });
      logger.debug(`[BacklogParser] Added: ${name}, sales=${totalSales}, cost=${totalCost}, months=${Object.keys(months).length}`);
    } else {
      skippedItems.push(name);
    }
  }

  if (skippedItems.length > 0) {
    logger.debug(`[BacklogParser] Skipped (no data): ${skippedItems.join(', ')}`);
  }

  logger.debug(`[BacklogParser] Total items: ${items.length}, type: ${type}`);

  if (type === 'product') {
    return {
      type,
      year: detectedYear,
      products: items.map(i => ({ product: i.name, months: i.months })),
      monthsIncluded,
    };
  }

  // division
  return {
    type,
    year: detectedYear,
    divisions: items.map(i => ({ division: i.name, months: i.months })),
    monthsIncluded,
  };
}

/**
 * 산업군별 파싱 (2섹션: 매출코드 + 유지보수코드)
 */
function parseIndustryBacklog(
  worksheet: any,
  dataStartRow: number,
  nameCol: number,
  monthColumns: { key: string; salesCol: number; costCol: number }[],
  year: number,
  monthsIncluded: string[]
): BacklogParseResult {
  const groupMap = new Map<string, Record<string, MonthData>>();
  let isMaintenanceSection = false;

  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const name = getCellString(row, nameCol);

    if (!name) continue;

    // 섹션 구분 (공백/다양한 형식 처리)
    const normalizedName = name.replace(/\s+/g, '');
    if (normalizedName === '매출코드' || normalizedName.includes('매출코드')) {
      isMaintenanceSection = false;
      logger.debug(`[BacklogParser:Industry] 매출코드 섹션 시작 (row ${rowNum}, name="${name}")`);
      continue;
    }
    if (normalizedName.includes('유지보수') && normalizedName.includes('코드')) {
      isMaintenanceSection = true;
      logger.debug(`[BacklogParser:Industry] 유지보수코드 섹션 시작 (row ${rowNum}, name="${name}")`);
      continue;
    }

    // 합계/부분합 행 건너뛰기
    if (name === '전체' || name === '부분합' || name === '합계') continue;

    // 유지보수코드 섹션은 모두 "유지보수" 산업군으로 합산
    const targetGroup = isMaintenanceSection ? '유지보수' : name;
    if (isMaintenanceSection) {
      logger.debug(`[BacklogParser:Industry] 유지보수 합산: "${name}" → "유지보수" (row ${rowNum})`);
    }

    const months: Record<string, MonthData> = {};
    for (const mc of monthColumns) {
      const sales = getCellNumber(row, mc.salesCol);
      const cost = getCellNumber(row, mc.costCol);
      if (sales !== 0 || cost !== 0) {
        months[mc.key] = { sales, cost };
      }
    }

    if (Object.keys(months).length > 0) {
      // 기존 데이터에 합산
      const existing = groupMap.get(targetGroup) || {};
      for (const [key, data] of Object.entries(months)) {
        if (existing[key]) {
          existing[key] = {
            sales: existing[key].sales + data.sales,
            cost: existing[key].cost + data.cost,
          };
        } else {
          existing[key] = { ...data };
        }
      }
      groupMap.set(targetGroup, existing);
    }
  }

  const industryGroups: BacklogIndustryGroupData[] = Array.from(groupMap.entries()).map(
    ([name, months]) => ({ industryGroupName: name, months })
  );

  return {
    type: 'industry',
    year,
    industryGroups,
    monthsIncluded,
  };
}
