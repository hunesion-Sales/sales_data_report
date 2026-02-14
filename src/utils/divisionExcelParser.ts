/**
 * 부문별 엑셀 파일 파싱 유틸리티
 * - 월당 4컬럼 (매출액, 매입액, 매출이익, 달성율) 구조
 * - 달성율 컬럼은 무시하고 매출/매입만 파싱
 * - "전체" 행/섹션 자동 제외
 */

import { parseMonthLabel } from './excelParser';

export interface DivisionDataRow {
  divisionName: string;
  months: Record<string, { sales: number; cost: number }>;
}

export interface DivisionParseResult {
  data: DivisionDataRow[];
  months: string[];
  monthLabels: Record<string, string>;
}

/**
 * 부문별 엑셀 파일(.xlsx)을 파싱하여 DivisionDataRow 배열로 변환
 *
 * 엑셀 구조:
 *   Row 14 부근: 월 헤더 ("1월 2026"(4칸 병합), "2월 2026"(4칸 병합), "전체"(4칸 병합))
 *   다음 행: 컬럼 헤더 ("매출액 합계", "매입액 합계", "매출이익", "달성율")
 *   이후: 부문 데이터 행
 *   마지막: "전체" 합계 행 (제외 대상)
 *
 * 각 월은 4컬럼 단위(매출액, 매입액, 매출이익, 달성율)로 반복
 * 매출이익/달성율은 앱에서 사용하지 않으므로 파싱 생략
 */
export async function parseDivisionExcelFile(buffer: ArrayBuffer): Promise<DivisionParseResult> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('워크시트를 찾을 수 없습니다.');
  }

  // 1) 월 헤더 행 탐색 (row 10~20 범위에서 "월" 포함 셀 검색)
  let monthHeaderRow = 0;
  const monthColumns: { key: string; display: string; salesCol: number; costCol: number }[] = [];
  const seenMonthKeys = new Set<string>();

  for (let rowNum = 10; rowNum <= 20; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = String(cell.value ?? '').trim();
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        const parsed = parseMonthLabel(val);
        // 같은 월 라벨이 4번 반복되므로 중복 제거
        if (!seenMonthKeys.has(parsed.key)) {
          seenMonthKeys.add(parsed.key);
          if (!found) {
            monthHeaderRow = rowNum;
            found = true;
          }
          monthColumns.push({
            key: parsed.key,
            display: parsed.display,
            salesCol: colNumber,       // 첫 번째 컬럼 = 매출액
            costCol: colNumber + 1,    // 두 번째 컬럼 = 매입액
          });
        }
      }
    });
    if (found) break;
  }

  // 2) 부문명 컬럼 탐색 (월 헤더 행 다음 행에서 "부서" 키워드 검색, fallback B열)
  let divisionCol = 2; // 기본값: B열
  if (monthHeaderRow > 0) {
    const headerRow = worksheet.getRow(monthHeaderRow + 1);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = String(cell.value ?? '').trim();
      if (val.includes('부서') || val.includes('부문')) {
        divisionCol = colNumber;
      }
    });
  }

  // 3) 데이터 행 파싱 (월 헤더 + 2행부터 빈 행 또는 "전체"까지)
  const dataStartRow = monthHeaderRow + 2;
  const data: DivisionDataRow[] = [];
  const months = monthColumns.map(m => m.key);
  const monthLabels: Record<string, string> = {};
  monthColumns.forEach(m => {
    monthLabels[m.key] = m.display;
  });

  const getCellNumber = (row: import('exceljs').Row, col: number): number => {
    const cellValue = row.getCell(col).value;
    if (cellValue == null) return 0;
    if (typeof cellValue === 'number') return cellValue;
    if (typeof cellValue === 'object' && cellValue !== null && 'result' in cellValue) {
      return Number((cellValue as { result: unknown }).result) || 0;
    }
    return Number(String(cellValue).replace(/,/g, '')) || 0;
  };

  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const divisionName = String(row.getCell(divisionCol).value ?? '').trim();

    // 빈 행이거나 "전체" 합계 행이면 종료
    if (!divisionName || divisionName === '전체') break;

    const monthData: Record<string, { sales: number; cost: number }> = {};
    for (const mc of monthColumns) {
      monthData[mc.key] = {
        sales: getCellNumber(row, mc.salesCol),
        cost: getCellNumber(row, mc.costCol),
      };
    }

    data.push({
      divisionName,
      months: monthData,
    });
  }

  if (data.length === 0) {
    throw new Error('유효한 부문 데이터를 찾을 수 없습니다. 엑셀 파일 형식을 확인해주세요.');
  }

  return { data, months, monthLabels };
}
