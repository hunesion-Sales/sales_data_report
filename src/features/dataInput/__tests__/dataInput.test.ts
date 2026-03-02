import { describe, it, expect } from 'vitest';
import { matchDivision } from '@/features/dataInput';
import type { Division } from '@/types';

const mockDivisions: Division[] = [
  { id: 'd1', name: '솔루션사업1부', sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'd2', name: '솔루션사업2부', sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'd3', name: '클라우드사업부', sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
];

describe('matchDivision', () => {
  it('matches exact division name', () => {
    const result = matchDivision('솔루션사업1부', mockDivisions);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('d1');
  });

  it('matches partial division name (input includes division name)', () => {
    const result = matchDivision('솔루션사업1부 매출팀', mockDivisions);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('d1');
  });

  it('matches partial division name (division name includes input)', () => {
    const result = matchDivision('클라우드', mockDivisions);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('d3');
  });

  it('returns null for unmatched division', () => {
    const result = matchDivision('존재하지않는부서', mockDivisions);
    expect(result).toBeNull();
  });

  it('prefers exact match over partial', () => {
    const result = matchDivision('솔루션사업2부', mockDivisions);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('d2');
  });

  it('handles empty division list', () => {
    const result = matchDivision('솔루션사업1부', []);
    expect(result).toBeNull();
  });
});

describe('dataInput barrel exports', () => {
  it('exports all components and hooks', async () => {
    const mod = await import('@/features/dataInput');
    expect(typeof mod.useDataInput).toBe('function');
    expect(typeof mod.matchDivision).toBe('function');
    expect(mod.UploadTypeSelector).toBeDefined();
    expect(mod.DataManagementTools).toBeDefined();
    expect(mod.DataListTable).toBeDefined();
  });
});
