import { useState, useCallback, useMemo } from 'react';
import type { DashboardPeriodSelection, Quarter, HalfYear } from '@/types';
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

  /** 선택된 기간에 해당하는 월 키 목록 (다중 선택 지원) */
  const selectedMonthKeys = useMemo((): string[] => {
    const { periodType, year, months, quarters, halfYears } = selection;
    const monthSet = new Set<string>();

    switch (periodType) {
      case 'monthly':
        if (months && months.length > 0) {
          months.forEach(m => monthSet.add(`${year}-${String(m).padStart(2, '0')}`));
        } else {
          getMonthsInYear(year).forEach(m => monthSet.add(m));
        }
        break;
      case 'quarterly':
        if (quarters && quarters.length > 0) {
          quarters.forEach(q => {
            getMonthsInQuarter(year, q).forEach(m => monthSet.add(m));
          });
        } else {
          getMonthsInYear(year).forEach(m => monthSet.add(m));
        }
        break;
      case 'semi-annual':
        if (halfYears && halfYears.length > 0) {
          halfYears.forEach(h => {
            getMonthsInHalfYear(year, h).forEach(m => monthSet.add(m));
          });
        } else {
          getMonthsInYear(year).forEach(m => monthSet.add(m));
        }
        break;
      case 'annual':
      default:
        getMonthsInYear(year).forEach(m => monthSet.add(m));
    }

    return Array.from(monthSet).sort();
  }, [selection]);

  /** 선택된 기간 이후 ~ 12월까지 (수주잔액 범위) */
  const backlogMonthKeys = useMemo((): string[] => {
    const { year } = selection;
    const allMonths = getMonthsInYear(year);
    const lastSelected = selectedMonthKeys[selectedMonthKeys.length - 1];
    if (!lastSelected) return allMonths;
    return allMonths.filter(m => m > lastSelected);
  }, [selection, selectedMonthKeys]);

  /** 기간 라벨 텍스트 (다중 선택 지원) */
  const periodLabel = useMemo((): string => {
    const { periodType, year, months, quarters, halfYears } = selection;

    const formatMonthRange = (arr: number[]): string => {
      if (arr.length === 0) return `${year}년`;
      if (arr.length === 1) return `${year}년 ${arr[0]}월`;
      const sorted = [...arr].sort((a, b) => a - b);
      // 연속된 범위인지 확인
      const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
      if (isConsecutive) {
        return `${year}년 ${sorted[0]}월~${sorted[sorted.length - 1]}월`;
      }
      return `${year}년 ${sorted.join(', ')}월`;
    };

    const formatQuarterRange = (arr: Quarter[]): string => {
      if (arr.length === 0) return `${year}년`;
      if (arr.length === 1) return `${year}년 ${arr[0].replace('Q', '')}분기`;
      const sorted = [...arr].sort();
      return `${year}년 ${sorted.map(q => q.replace('Q', '')).join(', ')}분기`;
    };

    const formatHalfYearRange = (arr: HalfYear[]): string => {
      if (arr.length === 0) return `${year}년`;
      if (arr.length === 1) return `${year}년 ${arr[0] === 'H1' ? '상반기' : '하반기'}`;
      return `${year}년 상/하반기`;
    };

    switch (periodType) {
      case 'monthly':
        return formatMonthRange(months ?? []);
      case 'quarterly':
        return formatQuarterRange(quarters ?? []);
      case 'semi-annual':
        return formatHalfYearRange(halfYears ?? []);
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
