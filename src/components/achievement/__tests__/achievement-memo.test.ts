import { describe, it, expect } from 'vitest';

describe('achievement components React.memo', () => {
  it('AchievementCharts is wrapped with React.memo', async () => {
    const mod = await import('@/components/achievement/AchievementCharts');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('AchievementTable is wrapped with React.memo', async () => {
    const mod = await import('@/components/achievement/AchievementTable');
    expect(mod.default.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
