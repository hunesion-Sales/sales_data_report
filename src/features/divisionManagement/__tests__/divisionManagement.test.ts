import { describe, it, expect } from 'vitest';

describe('divisionManagement feature', () => {
  describe('barrel exports', () => {
    it('exports all feature modules', async () => {
      const mod = await import('../index');
      expect(mod.useDivisionManagement).toBeDefined();
      expect(mod.DivisionList).toBeDefined();
      expect(mod.DivisionAddForm).toBeDefined();
    });
  });

  describe('DivisionList', () => {
    it('is a function component', async () => {
      const mod = await import('../components/DivisionList');
      expect(typeof mod.default).toBe('function');
    });
  });

  describe('DivisionAddForm', () => {
    it('is a function component', async () => {
      const mod = await import('../components/DivisionAddForm');
      expect(typeof mod.default).toBe('function');
    });
  });
});
