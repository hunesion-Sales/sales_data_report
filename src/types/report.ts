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
  months?: number[];        // 월별 선택 시 (1~12)
  quarters?: Quarter[];     // 분기별 선택 시
  halfYears?: HalfYear[];   // 반기별 선택 시
}

/** 기간 정보 */
export interface PeriodInfo {
  key: string;       // "2026-01", "Q1", "H1", "2026"
  label: string;     // "1월", "1분기", "상반기", "2026년"
  months: string[];  // 해당 기간에 포함된 월 키 목록
}

/** 산업군별 요약 데이터 */
export interface IndustryGroupSummary {
  industryGroupName: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  periodBreakdown: Record<string, PeriodData>;
}

/** 산업군 보고서 필터 */
export interface IndustryGroupReportFilter {
  year: number;
  periodType: PeriodType;
  industryGroupName?: string; // undefined면 전체
  months?: number[];        // 월별 선택 시 (1~12)
  quarters?: Quarter[];     // 분기별 선택 시
  halfYears?: HalfYear[];   // 반기별 선택 시
}

/** 대시보드 기간 선택 상태 */
export interface DashboardPeriodSelection {
  periodType: PeriodType;
  year: number;
  months?: number[];      // 월별 선택 시 (1~12) - 다중 선택 가능
  quarters?: Quarter[];   // 분기별 선택 시 - 다중 선택 가능
  halfYears?: HalfYear[]; // 반기별 선택 시 - 다중 선택 가능
}
