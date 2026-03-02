/**
 * 산업군별 매출 엑셀 파서
 * - divisionExcelParser.ts 패턴 기반
 * - 2섹션: 매출코드(산업군별 행) + 유지보수코드(모두 "유지보수"로 합산)
 */

import { parseMonthLabel } from './excelParser';
import { logger } from './logger';

export interface IndustryGroupDataRow {
  industryGroupName: string;
  months: Record<string, { sales: number; cost: number }>;
}

export interface IndustryGroupParseResult {
  data: IndustryGroupDataRow[];
  months: string[];
  monthLabels: Record<string, string>;
}

/**
 * 산업군별 엑셀 파일(.xlsx)을 파싱
 */
export async function parseIndustryGroupExcelFile(
  buffer: ArrayBuffer
): Promise<IndustryGroupParseResult> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('워크시트를 찾을 수 없습니다.');
  }

  // 1) 월 헤더 행 탐색
  let monthHeaderRow = 0;
  const monthColumns: { key: string; display: string; salesCol: number; costCol: number }[] = [];

  for (let rowNum = 1; rowNum <= 20; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = getCellString(cell);
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        const parsed = parseMonthLabel(val);
        const isDuplicate = monthColumns.some(m => m.key === parsed.key);
        if (isDuplicate) return;

        if (!found) {
          monthHeaderRow = rowNum;
          found = true;
        }

        // 서브 헤더에서 매출/매입 컬럼 찾기
        const subRow = worksheet.getRow(rowNum + 1);
        let salesCol = colNumber;
        let costCol = colNumber + 1;

        for (let c = colNumber; c <= colNumber + 3; c++) {
          const subVal = String(subRow.getCell(c).value ?? '').trim();
          if (subVal.includes('매출') && !subVal.includes('이익') && !subVal.includes('코드')) {
            salesCol = c;
          } else if (subVal.includes('매입')) {
            costCol = c;
          }
        }

        monthColumns.push({ key: parsed.key, display: parsed.display, salesCol, costCol });
      }
    });
    if (found) break;
  }

  if (monthHeaderRow === 0) {
    throw new Error('월 헤더("1월 2026" 등)를 찾을 수 없습니다.');
  }

  // 2) 항목명 컬럼 탐색
  let nameCol = 2;
  const subHeaderRow = worksheet.getRow(monthHeaderRow + 1);
  subHeaderRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const val = String(cell.value ?? '').trim();
    if (['고객구분', '산업군', '인더스트리'].some(k => val.includes(k))) {
      nameCol = colNumber;
    }
  });

  // 3) 데이터 파싱 (2섹션: 매출코드 + 유지보수코드)
  const dataStartRow = monthHeaderRow + 2;
  const groupMap = new Map<string, Record<string, { sales: number; cost: number }>>();
  let isMaintenanceSection = false;

  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const name = getCellStringFromRow(row, nameCol);

    if (!name) continue;

    // 섹션 구분 (공백/다양한 형식 처리)
    const normalizedName = name.replace(/\s+/g, '');
    if (normalizedName === '매출코드' || normalizedName.includes('매출코드')) {
      isMaintenanceSection = false;
      logger.debug(`[IndustryGroupExcelParser] 매출코드 섹션 시작 (row ${rowNum}, name="${name}")`);
      continue;
    }
    if (normalizedName.includes('유지보수') && normalizedName.includes('코드')) {
      isMaintenanceSection = true;
      logger.debug(`[IndustryGroupExcelParser] 유지보수코드 섹션 시작 (row ${rowNum}, name="${name}")`);
      continue;
    }

    // 합계 행 건너뛰기
    if (name === '전체' || name === '부분합' || name === '합계') continue;

    // 유지보수코드 섹션은 모두 "유지보수" 산업군으로 합산
    const targetGroup = isMaintenanceSection ? '유지보수' : name;
    if (isMaintenanceSection) {
      logger.debug(`[IndustryGroupExcelParser] 유지보수 합산: "${name}" → "유지보수" (row ${rowNum})`);
    }

    const months: Record<string, { sales: number; cost: number }> = {};
    for (const mc of monthColumns) {
      const sales = getCellNumberFromRow(row, mc.salesCol);
      const cost = getCellNumberFromRow(row, mc.costCol);
      months[mc.key] = { sales, cost };
    }

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

  const data: IndustryGroupDataRow[] = Array.from(groupMap.entries()).map(
    ([name, months]) => ({ industryGroupName: name, months })
  );

  if (data.length === 0) {
    throw new Error('유효한 산업군 데이터를 찾을 수 없습니다. 엑셀 파일 형식을 확인해주세요.');
  }

  const months = monthColumns.map(m => m.key);
  const monthLabels: Record<string, string> = {};
  monthColumns.forEach(m => { monthLabels[m.key] = m.display; });

  logger.debug(`[IndustryGroupExcelParser] Parsed ${data.length} industry groups, ${months.length} months`);

  return { data, months, monthLabels };
}

function getCellString(cell: any): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'string') return cell.value.trim();
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map((rt: any) => rt.text).join('').trim();
  }
  return String(cell.value).trim();
}

function getCellStringFromRow(row: any, col: number): string {
  const cell = row.getCell(col);
  return getCellString(cell);
}

function getCellNumberFromRow(row: any, col: number): number {
  const cellValue = row.getCell(col).value;
  if (cellValue == null) return 0;
  if (typeof cellValue === 'number') return cellValue;
  if (typeof cellValue === 'object' && cellValue !== null && 'richText' in cellValue) {
    const text = cellValue.richText.map((rt: any) => rt.text).join('');
    return Number(text) || 0;
  }
  if (typeof cellValue === 'object' && cellValue !== null && 'result' in cellValue) {
    return Number((cellValue as { result: unknown }).result) || 0;
  }
  return Number(String(cellValue).replace(/,/g, '')) || 0;
}
