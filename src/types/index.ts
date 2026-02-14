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
  divisionId: string | null;
  isMaintenanceType: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 제품 마스터 생성/수정용 입력 타입 */
export interface ProductMasterInput {
  name: string;
  divisionId: string | null;
  isMaintenanceType: boolean;
  sortOrder?: number;
}

/** 제품 데이터 확장 (divisionId, productMasterId 추가) */
export interface ProductDataExtended extends ProductData {
  divisionId?: string | null;
  productMasterId?: string | null;
}
