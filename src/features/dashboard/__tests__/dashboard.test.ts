import { describe, it, expect } from 'vitest';

describe('dashboard barrel exports', () => {
  it('exports useDashboardData hook', async () => {
    const mod = await import('@/features/dashboard');
    expect(typeof mod.useDashboardData).toBe('function');
  });

  it('exports all chart components', async () => {
    const mod = await import('@/features/dashboard');
    expect(mod.DashboardKPICards).toBeDefined();
    expect(mod.MonthlyTrendChart).toBeDefined();
    expect(mod.ProductGroupChart).toBeDefined();
    expect(mod.IndustryGroupChart).toBeDefined();
    expect(mod.DivisionOverviewChart).toBeDefined();
    expect(mod.DashboardDetailModal).toBeDefined();
    expect(mod.PeriodSelector).toBeDefined();
  });

  it('exports hooks', async () => {
    const mod = await import('@/features/dashboard');
    expect(typeof mod.useDashboardData).toBe('function');
    expect(typeof mod.usePeriodSelector).toBe('function');
    expect(typeof mod.useBacklogData).toBe('function');
    expect(typeof mod.useUploadDate).toBe('function');
  });
});

describe('useDashboardData module', () => {
  it('is importable directly', async () => {
    const mod = await import('@/features/dashboard/hooks/useDashboardData');
    expect(typeof mod.useDashboardData).toBe('function');
  });
});

describe('dashboard components React.memo', () => {
  it('DashboardKPICards is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/DashboardKPICards');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('MonthlyTrendChart is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/MonthlyTrendChart');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('DivisionOverviewChart is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/DivisionOverviewChart');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('ProductGroupChart is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/ProductGroupChart');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('IndustryGroupChart is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/IndustryGroupChart');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
