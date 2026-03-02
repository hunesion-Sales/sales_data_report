import { useState, useCallback, useMemo } from 'react';
import type { DashboardPeriodSelection } from '@/types';
import { CURRENT_YEAR } from '@/config/appConfig';
import {
  getMonthsInYear,
  getMonthsInQuarter,
  getMonthsInHalfYear,
} from '@/utils/periodUtils';

const STORAGE_KEY = 'dashboard-period-selection';

function loadFromStorage(): DashboardPeriodSelection {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { periodType: 'annual', year: CURRENT_YEAR };
}

/**
 * 대시보드 기간 선택 상태 관리 훅
 */
export function usePeriodSelector() {
  const [selection, setSelectionState] = useState<DashboardPeriodSelection>(loadFromStorage);

  const setSelection = useCallback((next: DashboardPeriodSelection) => {
    setSelectionState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** 선택된 기간에 해당하는 월 키 목록 */
  const selectedMonthKeys = useMemo((): string[] => {
    const { periodType, year, month, quarter, halfYear } = selection;
    switch (periodType) {
      case 'monthly':
        if (month) return [`${year}-${String(month).padStart(2, '0')}`];
        return getMonthsInYear(year); // 월 미선택 시 연간
      case 'quarterly':
        if (quarter) return getMonthsInQuarter(year, quarter);
        return getMonthsInYear(year);
      case 'semi-annual':
        if (halfYear) return getMonthsInHalfYear(year, halfYear);
        return getMonthsInYear(year);
      case 'annual':
      default:
        return getMonthsInYear(year);
    }
  }, [selection]);

  /** 선택된 기간 이후 ~ 12월까지 (수주잔액 범위) */
  const backlogMonthKeys = useMemo((): string[] => {
    const { year } = selection;
    const allMonths = getMonthsInYear(year);
    const lastSelected = selectedMonthKeys[selectedMonthKeys.length - 1];
    if (!lastSelected) return allMonths;
    return allMonths.filter(m => m > lastSelected);
  }, [selection, selectedMonthKeys]);

  /** 기간 라벨 텍스트 */
  const periodLabel = useMemo((): string => {
    const { periodType, year, month, quarter, halfYear } = selection;
    switch (periodType) {
      case 'monthly':
        return month ? `${year}년 ${month}월` : `${year}년`;
      case 'quarterly':
        return quarter ? `${year}년 ${quarter.replace('Q', '')}분기` : `${year}년`;
      case 'semi-annual':
        return halfYear ? `${year}년 ${halfYear === 'H1' ? '상반기' : '하반기'}` : `${year}년`;
      case 'annual':
      default:
        return `${year}년`;
    }
  }, [selection]);

  return {
    selection,
    setSelection,
    selectedMonthKeys,
    backlogMonthKeys,
    periodLabel,
  };
}
