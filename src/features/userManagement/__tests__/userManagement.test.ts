import { describe, it, expect } from 'vitest';

describe('userManagement feature', () => {
  describe('barrel exports', () => {
    it('exports all feature modules', async () => {
      const mod = await import('../index');
      expect(mod.useUserManagement).toBeDefined();
      expect(mod.StatusBadge).toBeDefined();
      expect(mod.UserTable).toBeDefined();
    });
  });

  describe('StatusBadge', () => {
    it('is a function component', async () => {
      const mod = await import('../components/StatusBadge');
      expect(typeof mod.default).toBe('function');
    });
  });

  describe('UserTable', () => {
    it('is a function component', async () => {
      const mod = await import('../components/UserTable');
      expect(typeof mod.default).toBe('function');
    });
  });
});
