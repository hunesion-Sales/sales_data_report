import type { ProductData } from './core';

/** 주차 키 형식: "YYYY-Wnn" (ISO 8601, 예: "2026-W07") */
export type WeekKey = string;

/** 주차별 스냅샷 메타데이터 */
export interface WeeklySnapshot {
  weekKey: WeekKey;
  uploadedAt: Date;
  uploadedBy: string;
  fileName: string;
  monthsIncluded: string[];
  monthLabels: Record<string, string>;
  productCount: number;
  monthHashes: Record<string, string>; // monthKey -> hash
}

/** 월별 데이터 해시 (변경 감지용) */
export interface MonthDataHash {
  monthKey: string;
  hash: string;
  productCount: number;
  totalSales: number;
  totalCost: number;
}

/** 월별 충돌 정보 */
export interface MonthConflict {
  monthKey: string;
  monthLabel: string;
  existingData: {
    weekKey: WeekKey;
    uploadedAt: Date;
    totalSales: number;
    totalCost: number;
    hash: string;
  };
  newData: {
    totalSales: number;
    totalCost: number;
    hash: string;
  };
}

/** 업로드 분석 결과 */
export interface UploadAnalysisResult {
  weekKey: WeekKey;
  newMonths: string[];
  unchangedMonths: string[];
  conflicts: MonthConflict[];
  products: ProductData[];
  monthLabels: Record<string, string>;
}

/** 충돌 해결 선택 */
export interface ConflictResolution {
  monthKey: string;
  resolution: 'keep_existing' | 'use_new';
}

/** 충돌 해결 저장 결과 */
export interface ConflictResolutionSaveResult {
  newCount: number;
  updatedCount: number;
  skippedMonths: string[];
}
