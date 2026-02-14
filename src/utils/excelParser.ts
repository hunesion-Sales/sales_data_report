/**
 * 엑셀 파일 파싱 유틸리티
 * - exceljs를 동적 import하여 번들 최적화
 * - 엑셀 헤더에서 월 정보 자동 감지 (동적 월 지원)
 * - "전체" 행 자동 제외
 */

import type { ProductData, ParseResult } from '@/types';

/**
 * "1월 2026" -> "2026-01", "12월 2025" -> "2025-12" 형태로 변환
 * "1월" (연도 없음) -> 현재 연도 기준으로 "2026-01"
 */
function parseMonthLabel(label: string): { key: string; display: string } {
  const match = label.match(/^(\d{1,2})월\s*(\d{4})?/);
  if (!match) return { key: label, display: label };

  const monthNum = parseInt(match[1], 10);
  const year = match[2] ? parseInt(match[2], 10) : new Date().getFullYear();
  const key = `${year}-${String(monthNum).padStart(2, '0')}`;
  return { key, display: label.trim() };
}

/**
 * 엑셀 파일(.xlsx)을 파싱하여 동적 월 구조의 ProductData 배열로 변환
 *
 * 엑셀 구조:
 *   Row 14 부근: 월 헤더 ("1월 2026", "2월 2026", ...)
 *   다음 행: 컬럼 헤더 ("제품군", "매출액 합계", "매입액 합계", "매출이익", ...)
 *   이후: 데이터 행
 *   마지막: "전체" 합계 행 (제외 대상)
 *
 * 각 월은 3컬럼 단위(매출액, 매입액, 매출이익)로 반복됨
 * 매출이익 컬럼은 앱에서 자체 계산하므로 파싱 생략
 */
export async function parseExcelFile(buffer: ArrayBuffer): Promise<ParseResult> {
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

  for (let rowNum = 10; rowNum <= 20; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = String(cell.value ?? '').trim();
      // "1월 2026", "2월 2026" 형태 또는 "1월", "2월" 형태 매칭
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        if (!found) {
          monthHeaderRow = rowNum;
          found = true;
        }
        const parsed = parseMonthLabel(val);
        monthColumns.push({
          key: parsed.key,
          display: parsed.display,
          salesCol: colNumber,
          costCol: colNumber + 1,
        });
      }
    });
    if (found) break;
  }

  // 2) 제품군 컬럼 탐색 (월 헤더 행 다음 행에서 "제품군" 검색)
  let productCol = 2; // 기본값: B열
  if (monthHeaderRow > 0) {
    const headerRow = worksheet.getRow(monthHeaderRow + 1);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (String(cell.value ?? '').trim() === '제품군') {
        productCol = colNumber;
      }
    });
  }

  // 3) 데이터 행 파싱 (월 헤더 + 2행부터 빈 행 또는 "전체"까지)
  const dataStartRow = monthHeaderRow + 2;
  const data: ProductData[] = [];
  const months = monthColumns.map(m => m.key);
  const monthLabels: Record<string, string> = {};
  monthColumns.forEach(m => {
    monthLabels[m.key] = m.display;
  });

  const getCellNumber = (row: import('exceljs').Row, col: number): number => {
    const cellValue = row.getCell(col).value;
    if (cellValue == null) return 0;
    if (typeof cellValue === 'number') return cellValue;
    // 수식 결과인 경우
    if (typeof cellValue === 'object' && cellValue !== null && 'result' in cellValue) {
      return Number((cellValue as { result: unknown }).result) || 0;
    }
    return Number(String(cellValue).replace(/,/g, '')) || 0;
  };

  for (let rowNum = dataStartRow; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const productName = String(row.getCell(productCol).value ?? '').trim();

    // 빈 행이거나 "전체" 합계 행이면 종료
    if (!productName || productName === '전체') break;

    const monthData: Record<string, { sales: number; cost: number }> = {};
    for (const mc of monthColumns) {
      monthData[mc.key] = {
        sales: getCellNumber(row, mc.salesCol),
        cost: getCellNumber(row, mc.costCol),
      };
    }

    data.push({
      id: Date.now() + rowNum,
      product: productName,
      months: monthData,
    });
  }

  if (data.length === 0) {
    throw new Error('유효한 데이터를 찾을 수 없습니다. 엑셀 파일 형식을 확인해주세요.');
  }

  return { data, months, monthLabels };
}
