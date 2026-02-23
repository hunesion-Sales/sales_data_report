import { describe, it, expect } from 'vitest';

// 개별 도메인 파일에서 직접 import 가능한지 확인
import type { MonthData, ProductData, ProcessedProduct, Totals } from '@/types/core';
import { getMonthShortLabel, getMonthFullLabel } from '@/types/parse';
import type { Notification, ParseResult } from '@/types/parse';
import type { UserRole, UserProfile, Division, AuthState } from '@/types/user';
import type { ProductMaster, ProductDataExtended } from '@/types/product';
import type { PeriodType, Quarter, DivisionSummary, PeriodInfo } from '@/types/report';
import type { AchievementStatus, QuarterlyTarget, TargetAchievement } from '@/types/target';
import type { WeekKey, WeeklySnapshot, UploadAnalysisResult, ConflictResolution } from '@/types/snapshot';

describe('domain file direct imports', () => {
  it('core.ts exports are accessible', () => {
    const data: ProductData = { id: 'p1', product: 'Product A', months: { '2026-01': { sales: 100, cost: 50 } } };
    expect(data.product).toBe('Product A');
    expect(data.months['2026-01'].sales).toBe(100);
  });

  it('parse.ts functions work from direct import', () => {
    expect(getMonthShortLabel('2026-03')).toBe('3월');
    expect(getMonthFullLabel('2026-03')).toBe('2026년 3월');
  });

  it('user.ts types compile correctly', () => {
    const profile: UserProfile = {
      uid: 'u1',
      email: 'test@test.com',
      displayName: 'Test',
      divisionId: null,
      role: 'user',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(profile.uid).toBe('u1');
  });

  it('product.ts extends core ProductData', () => {
    const extended: ProductDataExtended = {
      id: 'p1',
      product: 'Product A',
      months: {},
      divisionId: 'div1',
      productMasterId: 'pm1',
    };
    expect(extended.divisionId).toBe('div1');
  });

  it('report.ts uses core ProcessedProduct in DivisionSummary', () => {
    const summary: DivisionSummary = {
      divisionId: 'd1',
      divisionName: 'Div A',
      totalSales: 1000,
      totalCost: 500,
      totalProfit: 500,
      products: [],
      periodBreakdown: {},
    };
    expect(summary.divisionName).toBe('Div A');
  });

  it('target.ts uses report Quarter type', () => {
    const target: QuarterlyTarget = {
      id: 't1',
      year: 2026,
      quarter: 'Q1',
      divisionId: 'd1',
      salesTarget: 10000,
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(target.quarter).toBe('Q1');
  });

  it('snapshot.ts uses core ProductData in UploadAnalysisResult', () => {
    const analysis: UploadAnalysisResult = {
      weekKey: '2026-W07',
      newMonths: ['2026-01'],
      unchangedMonths: [],
      conflicts: [],
      products: [{ id: 1, product: 'P1', months: {} }],
      monthLabels: { '2026-01': '1월 2026' },
    };
    expect(analysis.products[0].product).toBe('P1');
  });
});
