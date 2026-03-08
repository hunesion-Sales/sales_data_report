import { useState, useEffect } from 'react';
import { getReport } from '@/firebase/services/reportService';
import { getDivisionData, type DivisionDataItem } from '@/firebase/services/divisionDataService';

/**
 * 전년도 부문별 데이터 조회 훅
 */
export function usePreviousYearDivisionData(year: number) {
  const [data, setData] = useState<DivisionDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const prevYear = year - 1;

    async function load() {
      setIsLoading(true);
      try {
        const result = await getReport(prevYear);
        if (!result || cancelled) {
          if (!cancelled) setData([]);
          return;
        }
        const items = await getDivisionData(result.reportId);
        if (!cancelled) setData(items);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year]);

  return { data, isLoading };
}
