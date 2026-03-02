import type { Quarter } from './report';

/** 제품군별 분기 목표 (Firestore product_group_targets/{year}-{quarter}-{productGroup}) */
export interface ProductGroupTarget {
  id: string;
  year: number;
  quarter: Quarter;
  productGroup: string;
  salesTarget: number;
  profitTarget: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 제품군별 목표 입력 타입 */
export interface ProductGroupTargetInput {
  year: number;
  quarter: Quarter;
  productGroup: string;
  salesTarget: number;
  profitTarget: number;
}
