import { describe, it, expect } from 'vitest';

// snapshotService 분할 후 barrel re-export 검증
// Firebase 의존성이 있으므로 import 가능 여부(모듈 해석)만 테스트

describe('snapshotService re-exports', () => {
  it('exports query functions from snapshotQueryService', async () => {
    const mod = await import('@/firebase/services/snapshotService');
    expect(typeof mod.getSnapshot).toBe('function');
    expect(typeof mod.getSnapshots).toBe('function');
    expect(typeof mod.getSnapshotProducts).toBe('function');
    expect(typeof mod.getLatestMonthHashes).toBe('function');
  });

  it('exports write functions from snapshotWriteService', async () => {
    const mod = await import('@/firebase/services/snapshotService');
    expect(typeof mod.saveWeeklySnapshot).toBe('function');
    expect(typeof mod.saveSnapshotOnly).toBe('function');
  });

  it('exports orchestration functions', async () => {
    const mod = await import('@/firebase/services/snapshotService');
    expect(typeof mod.analyzeUpload).toBe('function');
    expect(typeof mod.saveWithResolutions).toBe('function');
  });

  it('snapshotQueryService is importable directly', async () => {
    const mod = await import('@/firebase/services/snapshotQueryService');
    expect(typeof mod.getSnapshot).toBe('function');
    expect(typeof mod.getSnapshots).toBe('function');
    expect(typeof mod.getSnapshotProducts).toBe('function');
    expect(typeof mod.getLatestMonthHashes).toBe('function');
  });

  it('snapshotWriteService is importable directly', async () => {
    const mod = await import('@/firebase/services/snapshotWriteService');
    expect(typeof mod.saveWeeklySnapshot).toBe('function');
    expect(typeof mod.saveSnapshotOnly).toBe('function');
  });
});
