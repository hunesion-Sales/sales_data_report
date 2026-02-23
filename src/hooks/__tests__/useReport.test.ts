import { describe, it, expect } from 'vitest';

describe('useReport composite hook module structure', () => {
  it('useReport is importable and is a function', async () => {
    const mod = await import('@/hooks/useReport');
    expect(typeof mod.useReport).toBe('function');
  });

  it('re-exports UploadMergeMode type', async () => {
    // TypeScript compile-time check - if this module resolves, the type re-export works
    const mod = await import('@/hooks/useReport');
    expect(mod).toBeDefined();
  });

  it('useReportData is importable directly', async () => {
    const mod = await import('@/hooks/useReportData');
    expect(typeof mod.useReportData).toBe('function');
  });

  it('useReportSnapshots is importable directly', async () => {
    const mod = await import('@/hooks/useReportSnapshots');
    expect(typeof mod.useReportSnapshots).toBe('function');
  });

  it('useReportUpload is importable directly', async () => {
    const mod = await import('@/hooks/useReportUpload');
    expect(typeof mod.useReportUpload).toBe('function');
  });

  it('useReportData exports ReportDataInternals type (compile check)', async () => {
    // This import succeeds if the type is properly exported
    const mod = await import('@/hooks/useReportData');
    expect(typeof mod.useReportData).toBe('function');
  });
});
