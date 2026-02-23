import { describe, it, expect } from 'vitest';

describe('productManagement feature', () => {
  describe('barrel exports', () => {
    it('exports all feature modules', async () => {
      const mod = await import('../index');
      expect(mod.useProductManagement).toBeDefined();
      expect(mod.ProductAddForm).toBeDefined();
      expect(mod.ProductTable).toBeDefined();
      expect(mod.DeleteConfirmModal).toBeDefined();
    });
  });

  describe('DeleteConfirmModal', () => {
    it('is a function component', async () => {
      const mod = await import('../components/DeleteConfirmModal');
      expect(typeof mod.default).toBe('function');
    });
  });

  describe('ProductAddForm', () => {
    it('is a function component', async () => {
      const mod = await import('../components/ProductAddForm');
      expect(typeof mod.default).toBe('function');
    });
  });

  describe('ProductTable', () => {
    it('is a function component', async () => {
      const mod = await import('../components/ProductTable');
      expect(typeof mod.default).toBe('function');
    });
  });
});
