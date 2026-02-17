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

// ============================================
// Phase 5: 인증 & 영업부문 관련 타입
// ============================================

/** 사용자 역할 */
export type UserRole = 'admin' | 'user';

/** 사용자 상태 */
export type UserStatus = 'pending' | 'approved' | 'rejected';

/** 사용자 프로필 (Firestore users/{uid}) */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  divisionId: string | null;
  divisionName?: string; // 클라이언트 편의용
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** 영업부문 (Firestore divisions/{divisionId}) */
export interface Division {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 인증 컨텍스트 상태 */
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// Phase 6: 제품 마스터 & 데이터 확장 타입
// ============================================

/** 제품 마스터 (Firestore products_master/{productId}) */
export interface ProductMaster {
  id: string;
  name: string;
  divisionId?: string | null; // @deprecated
  isMaintenanceType: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 제품 마스터 생성/수정용 입력 타입 */
export interface ProductMasterInput {
  name: string;
  divisionId?: string | null; // @deprecated
  isMaintenanceType: boolean;
  sortOrder?: number;
}

/** 제품 데이터 확장 (divisionId, productMasterId 추가) */
export interface ProductDataExtended extends ProductData {
  divisionId?: string | null;
  productMasterId?: string | null;
}

// ============================================
// Phase 7: 부문별 보고 & 기간별 집계 타입
// ============================================

/** 기간 유형 */
export type PeriodType = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

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

// ============================================
// Phase 8: 분기별 목표 & 달성율 타입
// ============================================

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

// ============================================
// Phase 9: 주차별 스냅샷 & 충돌 해결 타입
// ============================================

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
