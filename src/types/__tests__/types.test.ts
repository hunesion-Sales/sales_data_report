import { describe, it, expect } from 'vitest';

// 1. barrel re-export 검증: 모든 타입과 함수가 '@/types'에서 접근 가능한지 확인
import {
  // core.ts
  type MonthData,
  type ProductData,
  type MonthProcessed,
  type ProcessedProduct,
  type MonthTotals,
  type Totals,
  // parse.ts
  type Notification,
  type ParseResult,
  getMonthShortLabel,
  getMonthFullLabel,
  // user.ts
  type UserRole,
  type UserStatus,
  type UserProfile,
  type Division,
  type AuthState,
  // product.ts
  type ProductMaster,
  type ProductMasterInput,
  type ProductDataExtended,
  // report.ts
  type PeriodType,
  type AchievementPeriod,
  type Quarter,
  type HalfYear,
  type PeriodData,
  type DivisionSummary,
  type ReportFilter,
  type PeriodInfo,
  // target.ts
  type AchievementStatus,
  type QuarterlyTarget,
  type QuarterlyTargetInput,
  type TargetAchievement,
  // snapshot.ts
  type WeekKey,
  type WeeklySnapshot,
  type MonthDataHash,
  type MonthConflict,
  type UploadAnalysisResult,
  type ConflictResolution,
  type ConflictResolutionSaveResult,
} from '@/types';

describe('types barrel re-export', () => {
  it('exports getMonthShortLabel function', () => {
    expect(typeof getMonthShortLabel).toBe('function');
  });

  it('exports getMonthFullLabel function', () => {
    expect(typeof getMonthFullLabel).toBe('function');
  });

  it('all type imports are resolvable (compile-time check)', () => {
    // 이 테스트가 컴파일되면 모든 타입이 barrel에서 정상 export됨을 의미
    const _monthData: MonthData = { sales: 0, cost: 0 };
    const _productData: ProductData = { id: 1, product: 'test', months: {} };
    const _notification: Notification = { message: 'test', type: 'success' };
    const _userRole: UserRole = 'admin';
    const _userStatus: UserStatus = 'approved';
    const _periodType: PeriodType = 'monthly';
    const _quarter: Quarter = 'Q1';
    const _achievementStatus: AchievementStatus = 'on-track';
    const _weekKey: WeekKey = '2026-W07';
    expect(true).toBe(true);
  });
});

describe('getMonthShortLabel', () => {
  it('converts "2026-01" to "1월"', () => {
    expect(getMonthShortLabel('2026-01')).toBe('1월');
  });

  it('converts "2026-12" to "12월"', () => {
    expect(getMonthShortLabel('2026-12')).toBe('12월');
  });

  it('returns input for invalid format', () => {
    expect(getMonthShortLabel('invalid')).toBe('invalid');
  });

  it('handles single-segment input', () => {
    expect(getMonthShortLabel('2026')).toBe('2026');
  });
});

describe('getMonthFullLabel', () => {
  it('converts "2026-01" to "2026년 1월"', () => {
    expect(getMonthFullLabel('2026-01')).toBe('2026년 1월');
  });

  it('converts "2025-06" to "2025년 6월"', () => {
    expect(getMonthFullLabel('2025-06')).toBe('2025년 6월');
  });

  it('converts "2026-12" to "2026년 12월"', () => {
    expect(getMonthFullLabel('2026-12')).toBe('2026년 12월');
  });

  it('returns input for invalid format', () => {
    expect(getMonthFullLabel('bad')).toBe('bad');
  });
});
