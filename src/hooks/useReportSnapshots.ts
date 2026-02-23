import { useState, useCallback, useEffect } from 'react';
import type { ProductData, WeekKey, WeeklySnapshot } from '@/types';
import { getProducts } from '@/firebase/services/productService';
import {
  getSnapshots,
  getSnapshotProducts,
} from '@/firebase/services/snapshotService';
import { getWeekKey } from '@/utils/weekUtils';
import type { ReportDataInternals } from './useReportData';

interface UseReportSnapshotsOptions {
  internals: ReportDataInternals;
  isLoading: boolean;
}

export function useReportSnapshots({ internals, isLoading }: UseReportSnapshotsOptions) {
  const { reportIdRef, setData, setMonths, setSelectedSnapshot: _unused, setIsLoading, setError } = {
    ...internals,
    setSelectedSnapshot: undefined as any, // handled internally
  };

  const [currentWeekKey] = useState<WeekKey>(getWeekKey());
  const [availableSnapshots, setAvailableSnapshots] = useState<WeeklySnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<WeekKey | null>(null);

  // 스냅샷 목록 새로고침
  const refreshSnapshots = useCallback(async () => {
    if (!reportIdRef.current) return;
    try {
      const snapshots = await getSnapshots(reportIdRef.current);
      setAvailableSnapshots(snapshots);
    } catch (err) {
      console.error('Failed to refresh snapshots:', err);
    }
  }, [reportIdRef]);

  // 특정 스냅샷 로드
  const loadSnapshot = useCallback(async (weekKey: WeekKey) => {
    if (!reportIdRef.current) return;

    internals.setIsLoading(true);
    try {
      const products = await getSnapshotProducts(reportIdRef.current, weekKey);
      internals.setData(products);
      setSelectedSnapshot(weekKey);

      const monthSet = new Set<string>();
      products.forEach(p => {
        if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
      });
      internals.setMonths(Array.from(monthSet).sort());
    } catch (err) {
      console.error('Failed to load snapshot:', err);
      internals.setError('스냅샷 로드 실패');
    } finally {
      internals.setIsLoading(false);
    }
  }, [reportIdRef, internals]);

  // 최신 데이터 로드
  const loadLatest = useCallback(async () => {
    if (!reportIdRef.current) return;

    internals.setIsLoading(true);
    try {
      const products = await getProducts(reportIdRef.current);
      internals.setData(products);
      setSelectedSnapshot(null);

      const monthSet = new Set<string>();
      products.forEach(p => {
        if (p.months) Object.keys(p.months).forEach(k => monthSet.add(k));
      });
      internals.setMonths(Array.from(monthSet).sort());
    } catch (err) {
      console.error('Failed to load latest:', err);
      internals.setError('최신 데이터 로드 실패');
    } finally {
      internals.setIsLoading(false);
    }
  }, [reportIdRef, internals]);

  // 초기 로드 시 스냅샷 목록도 로드
  useEffect(() => {
    if (reportIdRef.current && !isLoading) {
      refreshSnapshots();
    }
  }, [isLoading, refreshSnapshots, reportIdRef]);

  return {
    currentWeekKey,
    availableSnapshots,
    selectedSnapshot,
    refreshSnapshots,
    loadSnapshot,
    loadLatest,
  };
}
