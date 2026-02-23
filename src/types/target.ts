import type { Quarter } from './report';

/** 달성 상태 */
export type AchievementStatus = 'exceeded' | 'on-track' | 'behind' | 'critical';

/** 분기별 목표 (Firestore targets/{year}-{quarter}-{divisionId}) */
export interface QuarterlyTarget {
  id: string;
  year: number;
  quarter: Quarter;
  divisionId: string;
  salesTarget: number;
  profitTarget?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 분기별 목표 입력 타입 */
export interface QuarterlyTargetInput {
  year: number;
  quarter: Quarter;
  divisionId: string;
  salesTarget: number;
  profitTarget?: number;
}

/** 목표 달성 현황 */
export interface TargetAchievement {
  target: QuarterlyTarget;
  divisionName: string;
  actualSales: number;
  actualProfit: number;
  salesAchievementRate: number;
  profitAchievementRate?: number;
  status: AchievementStatus;
}
