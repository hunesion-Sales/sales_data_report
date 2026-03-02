import { useState, useEffect, useMemo } from 'react';
import type { Division, QuarterlyTarget, QuarterlyTargetInput, Quarter } from '@/types';

export const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export type CellKey = string; // "{divisionId}-{quarter}"
export type CellValue = { salesTarget: string; profitTarget: string };
export type InputMode = 'manual' | 'percentage';

export function cellKey(divisionId: string, quarter: Quarter): CellKey {
  return `${divisionId}-${quarter}`;
}

interface UseTargetMatrixParams {
  divisions: Division[];
  targets: QuarterlyTarget[];
  year: number;
}

export function useTargetMatrix({ divisions, targets, year }: UseTargetMatrixParams) {
  const [matrix, setMatrix] = useState<Record<CellKey, CellValue>>({});
  const [mode, setMode] = useState<InputMode>('manual');
  const [ratios, setRatios] = useState<number[]>([25, 25, 25, 25]);

  // targets가 변경되면 matrix 초기화
  useEffect(() => {
    const initial: Record<CellKey, CellValue> = {};

    for (const div of divisions) {
      for (const q of QUARTERS) {
        initial[cellKey(div.id, q)] = { salesTarget: '', profitTarget: '' };
      }
    }

    for (const t of targets) {
      const key = cellKey(t.divisionId, t.quarter);
      // Firestore 원 단위 → 화면 백만원 단위
      const salesInMillions = Math.round(t.salesTarget / 1000000);
      const profitInMillions = t.profitTarget ? Math.round(t.profitTarget / 1000000) : 0;
      initial[key] = {
        salesTarget: salesInMillions > 0 ? String(salesInMillions) : '',
        profitTarget: profitInMillions > 0 ? String(profitInMillions) : '',
      };
    }

    setMatrix(initial);
  }, [divisions, targets]);

  const distributeTotal = (
    divisionId: string,
    type: 'sales' | 'profit',
    total: number,
    currentMatrix: Record<CellKey, CellValue>,
    currentRatios: number[]
  ) => {
    const targetKey = type === 'sales' ? 'salesTarget' : 'profitTarget';
    const values = currentRatios.map(r => Math.round(total * (r / 100)));
    const sumQ1to3 = values[0] + values[1] + values[2];
    values[3] = total - sumQ1to3;

    QUARTERS.forEach((q, idx) => {
      const key = cellKey(divisionId, q);
      if (!currentMatrix[key]) currentMatrix[key] = { salesTarget: '', profitTarget: '' };
      currentMatrix[key] = {
        ...currentMatrix[key],
        [targetKey]: values[idx] > 0 ? String(values[idx]) : ''
      };
    });
  };

  const handleRatioChange = (index: number, value: string) => {
    const numValue = Number(value.replace(/[^0-9]/g, ''));
    if (numValue > 100) return;

    const newRatios = [...ratios];
    newRatios[index] = numValue;
    setRatios(newRatios);

    const newMatrix = { ...matrix };
    divisions.forEach(div => {
      let totalSales = 0;
      QUARTERS.forEach(q => {
        totalSales += Number(matrix[cellKey(div.id, q)].salesTarget) || 0;
      });
      if (totalSales > 0) {
        distributeTotal(div.id, 'sales', totalSales, newMatrix, newRatios);
      }

      let totalProfit = 0;
      QUARTERS.forEach(q => {
        totalProfit += Number(matrix[cellKey(div.id, q)].profitTarget) || 0;
      });
      if (totalProfit > 0) {
        distributeTotal(div.id, 'profit', totalProfit, newMatrix, newRatios);
      }
    });
    setMatrix(newMatrix);
  };

  const handleChange = (key: CellKey, field: 'salesTarget' | 'profitTarget', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setMatrix(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: cleaned },
    }));
  };

  const handleTotalChange = (divisionId: string, field: 'salesTarget' | 'profitTarget', value: string) => {
    const total = Number(value.replace(/[^0-9]/g, ''));
    const newMatrix = { ...matrix };
    const type = field === 'salesTarget' ? 'sales' : 'profit';
    distributeTotal(divisionId, type, total, newMatrix, ratios);
    setMatrix(newMatrix);
  };

  const hasChanges = useMemo(() => {
    const existingMap = new Map<string, QuarterlyTarget>();
    for (const t of targets) {
      existingMap.set(cellKey(t.divisionId, t.quarter), t);
    }

    for (const [key, cell] of Object.entries(matrix)) {
      const existing = existingMap.get(key);
      const salesVal = Number(cell.salesTarget) || 0;
      const profitVal = Number(cell.profitTarget) || 0;

      if (existing) {
        if (existing.salesTarget !== salesVal || (existing.profitTarget || 0) !== profitVal) {
          return true;
        }
      } else if (salesVal > 0 || profitVal > 0) {
        return true;
      }
    }
    return false;
  }, [matrix, targets]);

  const handleSave = async (
    onSave: (inputs: QuarterlyTargetInput[], createdBy: string) => Promise<void>,
    createdBy: string
  ) => {
    const inputs: QuarterlyTargetInput[] = [];

    for (const div of divisions) {
      for (const q of QUARTERS) {
        const key = cellKey(div.id, q);
        const cell = matrix[key];
        const salesInMillions = Number(cell?.salesTarget) || 0;
        const profitInMillions = Number(cell?.profitTarget) || 0;

        if (salesInMillions > 0) {
          // 화면 백만원 단위 → Firestore 원 단위
          inputs.push({
            year,
            quarter: q,
            divisionId: div.id,
            salesTarget: salesInMillions * 1000000,
            ...(profitInMillions > 0 && { profitTarget: profitInMillions * 1000000 }),
          });
        }
      }
    }

    await onSave(inputs, createdBy);
  };

  const ratioTotal = ratios.reduce((a, b) => a + b, 0);

  const footerTotals = useMemo(() => {
    const totals = {
      sales: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, Total: 0 },
      profit: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, Total: 0 }
    };

    divisions.forEach(div => {
      QUARTERS.forEach(q => {
        const key = cellKey(div.id, q);
        const cell = matrix[key];
        const sales = Number(cell?.salesTarget) || 0;
        const profit = Number(cell?.profitTarget) || 0;
        totals.sales[q] += sales;
        totals.profit[q] += profit;
        totals.sales.Total += sales;
        totals.profit.Total += profit;
      });
    });
    return totals;
  }, [matrix, divisions]);

  return {
    matrix,
    mode,
    setMode,
    ratios,
    ratioTotal,
    hasChanges,
    footerTotals,
    handleRatioChange,
    handleChange,
    handleTotalChange,
    handleSave,
  };
}
