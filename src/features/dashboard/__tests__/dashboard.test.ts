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
    expect(mod.TopProductsChart).toBeDefined();
    expect(mod.DivisionOverviewChart).toBeDefined();
    expect(mod.DashboardDetailModal).toBeDefined();
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

  it('TopProductsChart is wrapped with React.memo', async () => {
    const mod = await import('@/features/dashboard/components/TopProductsChart');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
