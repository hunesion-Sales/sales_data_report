import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Division,
  DivisionSummary,
  ReportFilter,
  PeriodInfo,
  PeriodData,
} from '@/types';
import { getDivisions } from '@/firebase/services/divisionService';
import { getOrCreateReport } from '@/firebase/services/reportService';
import { getDivisionData, type DivisionDataItem } from '@/firebase/services/divisionDataService';
import {
  getFilteredPeriodInfoList,
  getAvailableYears,
} from '@/utils/periodUtils';

interface UseDivisionReportReturn {
  divisions: Division[];
  divisionItems: DivisionDataItem[];
  summaries: DivisionSummary[];
  periodInfoList: PeriodInfo[];
  availableYears: number[];
  availableMonths: string[];
  filter: ReportFilter;
  setFilter: (filter: ReportFilter) => void;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function useDivisionReport(userDivisionId?: string | null, isAdmin = false): UseDivisionReportReturn {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionItems, setDivisionItems] = useState<DivisionDataItem[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<ReportFilter>({
    year: CURRENT_YEAR,
    periodType: 'monthly',
    divisionId: undefined, // 전체
  });

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [divisionsData] = await Promise.all([
        getDivisions(),
      ]);

      setDivisions(divisionsData);

      // 보고서 데이터 로드
      const { reportId, report } = await getOrCreateReport(filter.year);

      // 부문별 데이터 로드 (Option B: division_data 컬렉션 사용)
      const cachedDivisionData = await getDivisionData(reportId);

      setDivisionItems(cachedDivisionData);
      setAvailableMonths(report.months || []);
    } catch (err) {
      console.error('useDivisionReport load error:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [filter.year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 사용 가능한 연도 목록
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

  // 부문별 요약 데이터 생성
  const summaries = useMemo<DivisionSummary[]>(() => {
    // 1. 필터링 대상 부문 식별 (단, unmatched 부문은 별도 처리)
    // 사용자 권한 필터
    const allowedDivisionId = !isAdmin ? userDivisionId : null;

    // UI 필터
    const selectedDivisionId = filter.divisionId;

    const result: DivisionSummary[] = [];

    // 2. DivisionDataItem을 DivisionSummary로 변환
    for (const item of divisionItems) {
      // 권한 필터 체크
      // userDivisionId가 있는데 item.divisionId와 다르다면 스킵 (unmatched도 제외됨)
      if (allowedDivisionId && item.divisionId !== allowedDivisionId) {
        continue;
      }

      // UI 필터 체크
      if (selectedDivisionId && item.divisionId !== selectedDivisionId) {
        continue;
      }

      // 기간별 집계 계산
      const periodBreakdown: Record<string, PeriodData> = {};
      let totalSales = 0;
      let totalCost = 0;

      // 각 기간(월, 분기, 반기, 연간)에 대해 데이터 집계
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

      // 전체 합계 계산 (현재 선택된 기간 전체 기준이 아니라, 데이터 있는 모든 월 기준일 수도 있지만
      // 보통 보고서는 표시된 기간의 합을 보여주는 것이 직관적임.
      // 여기서는 periodInfoList에 포함된 모든 월의 합계를 계산)
      const allMonthsInView = new Set(periodInfoList.flatMap(p => p.months));
      for (const monthKey of allMonthsInView) {
        const monthData = item.months[monthKey];
        if (monthData) {
          totalSales += monthData.sales;
          totalCost += monthData.cost;
        }
      }

      result.push({
        divisionId: item.divisionId,
        divisionName: item.divisionName, // 엑셀에서 파싱된 이름 그대로 사용 ("경영지원본부" 등)
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
        products: [], // 상세 제품 데이터 없음
        periodBreakdown,
      });
    }

    // 매출액 기준 내림차순 정렬
    return result.sort((a, b) => b.totalSales - a.totalSales);
  }, [divisionItems, periodInfoList, filter.divisionId, isAdmin, userDivisionId]);

  return {
    divisions,
    divisionItems,
    summaries,
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
