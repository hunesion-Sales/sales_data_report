/** 월별 매출/매입 데이터 */
export interface MonthData {
  sales: number;
  cost: number;
}

/** 제품별 원본 데이터 (동적 월 지원) */
export interface ProductData {
  id: number | string;
  product: string;
  division?: string; // Excel에서 추출된 영업부문명
  months: Record<string, MonthData>; // key: "2026-01", "2026-02", ...
  sortOrder?: number;
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
