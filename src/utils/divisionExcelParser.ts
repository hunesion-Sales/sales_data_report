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

  // 1) 월 헤더 행 탐색 (row 1~20 범위)
  // "1월 2026" 같은 패턴이 있는 행을 찾음
  let monthHeaderRow = 0;
  // 각 월의 시작 컬럼 인덱스 저장
  const monthColumns: { key: string; display: string; salesCol: number; costCol: number }[] = [];
  const seenMonthKeys = new Set<string>();

  for (let rowNum = 1; rowNum <= 20; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // 병합된 셀의 경우, ExcelJS는 보통 top-left 셀에만 값을 줍니다.
      const val = String(cell.value ?? '').trim();

      // "1월 2026" 또는 "1월" 패턴 확인, "전체" 제외
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        const parsed = parseMonthLabel(val);

        if (!seenMonthKeys.has(parsed.key)) {
          seenMonthKeys.add(parsed.key);
          if (!found) {
            monthHeaderRow = rowNum;
            found = true;
          }

          // 4컬럼 구조: [매출, 매입, 이익, 달성율]
          // cell.col 이 시작점(매출)
          monthColumns.push({
            key: parsed.key,
            display: parsed.display,
            salesCol: colNumber,       // 1번째: 매출액
            costCol: colNumber + 1,    // 2번째: 매입액
          });
        }
      }
    });
    if (found) break; // 월 헤더 행을 찾았으면 중단
  }

  if (monthHeaderRow === 0) {
    throw new Error('월 헤더("1월 2026" 등)를 찾을 수 없습니다.');
  }

  // 2) 부문명 컬럼 탐색 
  // 월 헤더 행의 *다음 행*(또는 그 근처)에서 "매출코드 소유자" 또는 "부서"/"부문" 찾기
  let divisionCol = 1; // 기본값 A열
  const headerSearchStart = monthHeaderRow;
  const headerSearchEnd = monthHeaderRow + 2;

  let dataStartRow = monthHeaderRow + 2; // 기본 데이터 시작 행

  for (let r = headerSearchStart; r <= headerSearchEnd; r++) {
    const row = worksheet.getRow(r);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = String(cell.value ?? '').trim();
      if (val.includes('매출코드 소유자') || val.includes('부서') || val.includes('부문')) {
        divisionCol = colNumber;
        dataStartRow = r + 1; // 헤더 바로 다음부터 데이터
      }
    });
  }

  // 3) 데이터 행 파싱
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
    if (!divisionName || divisionName === '전체' || divisionName === '합계') continue;

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
