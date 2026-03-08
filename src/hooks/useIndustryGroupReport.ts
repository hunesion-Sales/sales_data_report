import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  IndustryGroup,
  IndustryGroupSummary,
  IndustryGroupReportFilter,
  PeriodInfo,
  PeriodData,
} from '@/types';
import { getIndustryGroups } from '@/firebase/services/industryGroupService';
import { getOrCreateReport } from '@/firebase/services/reportService';
import { getIndustryGroupData, type IndustryGroupDataItem } from '@/firebase/services/industryGroupDataService';
import {
  getFilteredPeriodInfoList,
  getAvailableYears,
} from '@/utils/periodUtils';
import { remapIndustryGroupData } from '@/utils/industryGroupMapper';

interface UseIndustryGroupReportReturn {
  industryGroups: IndustryGroup[];
  summaries: IndustryGroupSummary[];
  dataItems: IndustryGroupDataItem[];
  periodInfoList: PeriodInfo[];
  availableYears: number[];
  availableMonths: string[];
  filter: IndustryGroupReportFilter;
  setFilter: (filter: IndustryGroupReportFilter) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function useIndustryGroupReport(): UseIndustryGroupReportReturn {
  const [industryGroups, setIndustryGroups] = useState<IndustryGroup[]>([]);
  const [dataItems, setDataItems] = useState<IndustryGroupDataItem[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<IndustryGroupReportFilter>({
    year: CURRENT_YEAR,
    periodType: 'monthly',
    industryGroupName: undefined,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [groups] = await Promise.all([
        getIndustryGroups(),
      ]);

      setIndustryGroups(groups);

      const { reportId, report } = await getOrCreateReport(filter.year);
      const rawData = await getIndustryGroupData(reportId);

      // 설정된 산업군 기준으로 재분류 (키워드 매핑 + _MA 패턴 처리)
      const mappedData = remapIndustryGroupData(rawData, groups);
      setDataItems(mappedData);
      setAvailableMonths(report.months || []);
    } catch (err) {
      console.error('useIndustryGroupReport load error:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [filter.year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableYears = useMemo(() => {
    return getAvailableYears(availableMonths);
  }, [availableMonths]);

  // 기간 정보 목록 (세부 기간 선택 반영)
  const periodInfoList = useMemo(() => {
    return getFilteredPeriodInfoList(
      filter.year, filter.periodType, availableMonths,
      filter.months, filter.quarters, filter.halfYears
    );
  }, [filter.year, filter.periodType, availableMonths, filter.months, filter.quarters, filter.halfYears]);

  const summaries = useMemo<IndustryGroupSummary[]>(() => {
    const result: IndustryGroupSummary[] = [];

    for (const item of dataItems) {
      if (filter.industryGroupName && item.industryGroupName !== filter.industryGroupName) {
        continue;
      }

      const periodBreakdown: Record<string, PeriodData> = {};
      let totalSales = 0;
      let totalCost = 0;

      for (const period of periodInfoList) {
        let periodSales = 0;
        let periodCost = 0;

        for (const monthKey of period.months) {
          const monthData = item.months[monthKey];
          if (monthData) {
            periodSales += monthData.sales;
            periodCost += monthData.cost;
          }
        }

        periodBreakdown[period.key] = {
          sales: periodSales,
          cost: periodCost,
          profit: periodSales - periodCost,
        };
      }

      const allMonthsInView = new Set(periodInfoList.flatMap(p => p.months));
      for (const monthKey of allMonthsInView) {
        const monthData = item.months[monthKey];
        if (monthData) {
          totalSales += monthData.sales;
          totalCost += monthData.cost;
        }
      }

      result.push({
        industryGroupName: item.industryGroupName,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
        periodBreakdown,
      });
    }

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }, [dataItems, periodInfoList, filter.industryGroupName]);

  return {
    industryGroups,
    summaries,
    dataItems,
    periodInfoList,
    availableYears,
    availableMonths,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: loadData,
  };
}
