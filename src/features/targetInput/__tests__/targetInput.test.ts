import { describe, it, expect } from 'vitest';
import { cellKey, QUARTERS } from '../hooks/useTargetMatrix';

describe('targetInput feature', () => {
  describe('cellKey', () => {
    it('generates correct key format', () => {
      expect(cellKey('div1', 'Q1')).toBe('div1-Q1');
      expect(cellKey('abc-123', 'Q4')).toBe('abc-123-Q4');
    });
  });

  describe('QUARTERS constant', () => {
    it('has 4 quarters in order', () => {
      expect(QUARTERS).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
      expect(QUARTERS).toHaveLength(4);
    });
  });

  describe('barrel exports', () => {
    it('exports all feature modules', async () => {
      const mod = await import('../index');
      expect(mod.useTargetMatrix).toBeDefined();
      expect(mod.QUARTERS).toBeDefined();
      expect(mod.cellKey).toBeDefined();
      expect(mod.ModeToggle).toBeDefined();
      expect(mod.AnnualTargetInputs).toBeDefined();
      expect(mod.RatioInputs).toBeDefined();
      expect(mod.TargetDataTable).toBeDefined();
    });
  });
});
