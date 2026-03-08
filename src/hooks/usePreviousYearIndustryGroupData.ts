import { useState, useEffect } from 'react';
import type { IndustryGroup } from '@/types';
import { getReport } from '@/firebase/services/reportService';
import { getIndustryGroupData, type IndustryGroupDataItem } from '@/firebase/services/industryGroupDataService';
import { remapIndustryGroupData } from '@/utils/industryGroupMapper';

/**
 * 전년도 산업군별 데이터 조회 훅 (산업군 설정 기준 재분류 포함)
 */
export function usePreviousYearIndustryGroupData(year: number, industryGroups: IndustryGroup[]) {
  const [data, setData] = useState<IndustryGroupDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (industryGroups.length === 0) return;

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
        const rawData = await getIndustryGroupData(result.reportId);
        if (!cancelled) {
          const mapped = remapIndustryGroupData(rawData, industryGroups);
          setData(mapped);
        }
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, industryGroups]);

  return { data, isLoading };
}
