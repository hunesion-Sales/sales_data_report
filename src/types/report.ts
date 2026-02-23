import type { ProcessedProduct } from './core';

/** 기간 유형 */
export type PeriodType = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

/** 달성 현황 조회 기간 */
export type AchievementPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'Year';

/** 분기 */
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/** 반기 */
export type HalfYear = 'H1' | 'H2';

/** 기간별 집계 데이터 */
export interface PeriodData {
  sales: number;
  cost: number;
  profit: number;
}

/** 부문별 요약 데이터 */
export interface DivisionSummary {
  divisionId: string;
  divisionName: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  products: ProcessedProduct[];
  periodBreakdown: Record<string, PeriodData>; // key: "2026-01", "Q1", "H1", "2026" 등
}

/** 보고서 필터 */
export interface ReportFilter {
  year: number;
  periodType: PeriodType;
  divisionId?: string; // undefined면 전체 부문
}

/** 기간 정보 */
export interface PeriodInfo {
  key: string;       // "2026-01", "Q1", "H1", "2026"
  label: string;     // "1월", "1분기", "상반기", "2026년"
  months: string[];  // 해당 기간에 포함된 월 키 목록
}
