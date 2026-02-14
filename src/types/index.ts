/** 월별 매출/매입 데이터 */
export interface MonthData {
  sales: number;
  cost: number;
}

/** 제품별 원본 데이터 (동적 월 지원) */
export interface ProductData {
  id: number | string;
  product: string;
  months: Record<string, MonthData>; // key: "2026-01", "2026-02", ...
}

/** 월별 이익 포함 가공 데이터 */
export interface MonthProcessed extends MonthData {
  profit: number;
}

/** 제품별 가공 데이터 */
export interface ProcessedProduct {
  id: number | string;
  product: string;
  months: Record<string, MonthProcessed>;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

/** 월별 합계 */
export interface MonthTotals {
  sales: number;
  cost: number;
  profit: number;
}

/** 전체 합계 */
export interface Totals {
  byMonth: Record<string, MonthTotals>;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

/** 알림 */
export interface Notification {
  message: string;
  type: 'success' | 'error';
}

/** 엑셀 파싱 결과 */
export interface ParseResult {
  data: ProductData[];
  months: string[]; // 감지된 월 키 목록 (정렬됨): ["2026-01", "2026-02", ...]
  monthLabels: Record<string, string>; // key -> 표시명: { "2026-01": "1월 2026" }
}

/**
 * 월 키("2026-01") -> 표시 라벨("1월")로 변환
 */
export function getMonthShortLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const monthNum = parseInt(parts[1], 10);
  return `${monthNum}월`;
}

/**
 * 월 키("2026-01") -> 전체 라벨("2026년 1월")로 변환
 */
export function getMonthFullLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  return `${parts[0]}년 ${parseInt(parts[1], 10)}월`;
}
