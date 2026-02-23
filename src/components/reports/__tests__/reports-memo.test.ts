import { describe, it, expect } from 'vitest';

describe('reports components React.memo', () => {
  it('ProductCharts is wrapped with React.memo', async () => {
    const mod = await import('@/components/reports/ProductCharts');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('DivisionCharts is wrapped with React.memo', async () => {
    const mod = await import('@/components/reports/DivisionCharts');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('ProductReportTable is wrapped with React.memo', async () => {
    const mod = await import('@/components/reports/ProductReportTable');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('DivisionSummaryTable is wrapped with React.memo', async () => {
    const mod = await import('@/components/reports/DivisionSummaryTable');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
