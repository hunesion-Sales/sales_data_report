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
export function parseMonthLabel(label: string): { key: string; display: string } {
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

  // 1) 월 헤더 행 탐색 (row 2~20 범위에서 "월" 포함 셀 검색 - 상단 행부터 검색하도록 수정)
  let monthHeaderRow = 0;
  const monthColumns: { key: string; display: string; salesCol: number; costCol: number }[] = [];

  console.log(`[ExcelParser] Start parsing. Total rows: ${worksheet.rowCount}`);

  for (let rowNum = 2; rowNum <= 20; rowNum++) {
    const row = worksheet.getRow(rowNum);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = String(cell.value ?? '').trim();
      // "1월 2026", "2월 2026" 형태 또는 "1월", "2월" 형태 매칭
      if (/^\d{1,2}월/.test(val) && val !== '전체') {
        if (!found) {
          monthHeaderRow = rowNum;
          found = true;
          console.log(`[ExcelParser] Found month header row at ${rowNum}`);
        }

        // 월 헤더 분석
        const parsed = parseMonthLabel(val);

        // [CRITICAL FIX] 중복 월 헤더 방지
        // 엑셀 병합된 셀이나 반복된 헤더로 인해 동일한 월(Key)이 또 나오면
        // 뒤쪽 컬럼에서 처리되면서 매핑이 밀리는 문제(Jan -> Feb Data) 발생.
        // 이미 등록된 Key라면 무시한다.
        const isDuplicate = monthColumns.some(m => m.key === parsed.key);
        if (isDuplicate) {
          console.log(`[ExcelParser] Skipping duplicate month header '${parsed.key}' at col ${colNumber}`);
          return; // continue equivalent in eachCell
        }

        // 월 헤더 아래 행에서 매출/매입 컬럼 찾기
        const subHeaderRow = worksheet.getRow(rowNum + 1);
        let salesCol = colNumber;
        let costCol = colNumber + 1;

        // 현재 컬럼(colNumber) 기준 우측 2칸 범위 내에서 "매출", "매입" 키워드 검색
        // (병합된 셀의 경우 colNumber가 첫 번째 셀일수도, 가운데일수도, 마지막일수도 있음)
        // 이전 컬럼(-1) 검색은 "매출코드" 오인식 방지를 위해 제거
        console.log(`[ExcelParser] Inspecting sub-headers for ${val} around col ${colNumber}`);

        // 중요: +3을 하면 다음 달의 '매출' 컬럼(3칸 뒤)까지 침범하여 덮어쓰는 문제 발생
        // 따라서 +2까지만 검색해야 함 (Start, Start+1, Start+2 = 총 3칸)
        for (let c = colNumber; c <= colNumber + 2; c++) {
          const subVal = String(subHeaderRow.getCell(c).value ?? '').trim();
          if (!subVal) continue;

          // "매출" 포함하되 "이익", "코드"는 제외 ("매출코드" 방지)
          if (subVal.includes('매출') && !subVal.includes('이익') && !subVal.includes('코드')) {
            // 이미 찾았으면(그리고 더 왼쪽 거라면) 덮어쓰지 않음
            // (보통 왼쪽->오른쪽 순회하므로, 루프 내에서 나중에 찾은게 더 오른쪽일 확률 높음)
            // 하지만 현재는 c가 증가하므로, 첫 번째 찾은게 가장 왼쪽임. 
            // 단, colNumber와 가까운걸 선호해야 하나? 
            // 보통 구조상 [매출][매입][이익] 이므로 가장 왼쪽이 맞음.
            if (salesCol === colNumber) { // 아직 초기값(기본값) 상태라면 업데이트
              salesCol = c;
              console.log(`  -> Found 'Sales' at col ${c} ("${subVal}")`);
            } else {
              // 이미 찾았는데 또 나왔다? (범위를 줄였으므로 이 케이스는 드물 것)
              console.log(`  -> Ignored duplicate 'Sales' at col ${c} (already found at ${salesCol})`);
            }
          } else if (subVal.includes('매입')) {
            costCol = c;
            console.log(`  -> Found 'Cost' at col ${c} ("${subVal}")`);
          }
        }

        monthColumns.push({
          key: parsed.key,
          display: parsed.display,
          salesCol,
          costCol,
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
        console.log(`[ExcelParser] Found 'Product Family' column at ${colNumber}`);
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

  console.log(`[ExcelParser] Parsing data starting from row ${dataStartRow}`);

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

    if (data.length < 3) { // Log first 3 rows for debugging
      console.log(`[ExcelParser] Row ${rowNum} (${productName}):`, JSON.stringify(monthData));
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

  console.log(`[ExcelParser] Parsing complete. Found ${data.length} items.`);
  return { data, months, monthLabels };
}
