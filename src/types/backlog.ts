import type { MonthData } from './core';

/** 수주잔액 제품별 데이터 (Firestore backlog/{year}/products/{docId}) */
export interface BacklogProductData {
  product: string;
  months: Record<string, MonthData>;
}

/** 수주잔액 부문별 데이터 (Firestore backlog/{year}/divisions/{docId}) */
export interface BacklogDivisionData {
  division: string;
  months: Record<string, MonthData & { achievementRate?: number }>;
}

/** 수주잔액 산업군별 데이터 (Firestore backlog/{year}/industry_groups/{docId}) */
export interface BacklogIndustryGroupData {
  industryGroupName: string;
  months: Record<string, MonthData>;
}

/** 수주잔액 메타 정보 (Firestore backlog/{year}) */
export interface BacklogMeta {
  year: number;
  uploadedAt?: Date;
  uploadedBy?: string;
  fileName?: string;
  monthsIncluded: string[];
}
