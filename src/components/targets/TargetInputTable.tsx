import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, Calculator, Keyboard, Percent, ChevronDown, ChevronRight } from 'lucide-react';
import type { Division, QuarterlyTarget, QuarterlyTargetInput, Quarter } from '@/types';
import { getQuarterLabel } from '@/utils/periodUtils';

interface TargetInputTableProps {
  divisions: Division[];
  targets: QuarterlyTarget[];
  year: number;
  isSaving: boolean;
  onSave: (inputs: QuarterlyTargetInput[], createdBy: string) => Promise<void>;
  createdBy: string;
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

type CellKey = string; // "{divisionId}-{quarter}"
type CellValue = { salesTarget: string; profitTarget: string };
type InputMode = 'manual' | 'percentage';

function cellKey(divisionId: string, quarter: Quarter): CellKey {
  return `${divisionId}-${quarter}`;
}

export default function TargetInputTable({
  divisions,
  targets,
  year,
  isSaving,
  onSave,
  createdBy,
}: TargetInputTableProps) {
  const [matrix, setMatrix] = useState<Record<CellKey, CellValue>>({});
  const [mode, setMode] = useState<InputMode>('manual');

  // Default common ratios (25% each)
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
      initial[key] = {
        salesTarget: t.salesTarget > 0 ? String(t.salesTarget) : '',
        profitTarget: t.profitTarget && t.profitTarget > 0 ? String(t.profitTarget) : '',
      };
    }

    setMatrix(initial);
  }, [divisions, targets]);

  // Handle Common Ratio Changes
  const handleRatioChange = (index: number, value: string) => {
    const numValue = Number(value.replace(/[^0-9]/g, ''));
    if (numValue > 100) return;

    // Update ratios state
    const newRatios = [...ratios];
    newRatios[index] = numValue;
    setRatios(newRatios);

    // Recalculate matrix for BOTH sales and profit
    const newMatrix = { ...matrix };
    divisions.forEach(div => {
      // 1. Calculate and distribute Sales Total
      let totalSales = 0;
      QUARTERS.forEach(q => {
        totalSales += Number(matrix[cellKey(div.id, q)].salesTarget) || 0;
      });
      if (totalSales > 0) {
        distributeTotal(div.id, 'sales', totalSales, newMatrix, newRatios);
      }

      // 2. Calculate and distribute Profit Total
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

  const distributeTotal = (
    divisionId: string,
    type: 'sales' | 'profit',
    total: number,
    currentMatrix: Record<CellKey, CellValue>,
    currentRatios: number[]
  ) => {
    const targetKey = type === 'sales' ? 'salesTarget' : 'profitTarget';

    // Calculate values for Q1, Q2, Q3
    const values = currentRatios.map(r => Math.round(total * (r / 100)));

    // Adjust Q4 to ensure sum matches Total exactly
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

  const handleChange = (key: CellKey, field: 'salesTarget' | 'profitTarget', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setMatrix(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: cleaned },
    }));
  };

  // Handle Annual Total Change (Percentage Mode)
  const handleTotalChange = (divisionId: string, field: 'salesTarget' | 'profitTarget', value: string) => {
    const total = Number(value.replace(/[^0-9]/g, ''));
    const newMatrix = { ...matrix };
    const type = field === 'salesTarget' ? 'sales' : 'profit';

    // Distribute based on common ratios
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

  const handleSave = async () => {
    const inputs: QuarterlyTargetInput[] = [];

    for (const div of divisions) {
      for (const q of QUARTERS) {
        const key = cellKey(div.id, q);
        const cell = matrix[key];
        const salesTarget = Number(cell?.salesTarget) || 0;
        const profitTarget = Number(cell?.profitTarget) || 0;

        if (salesTarget > 0) {
          inputs.push({
            year,
            quarter: q,
            divisionId: div.id,
            salesTarget,
            ...(profitTarget > 0 && { profitTarget }),
          });
        }
      }
    }

    await onSave(inputs, createdBy);
  };

  const ratioTotal = ratios.reduce((a, b) => a + b, 0);

  // Calculate Footer Totals
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

  if (divisions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        등록된 영업부문이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'manual'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Keyboard className="w-4 h-4" />
              직접 입력
            </button>
            <button
              onClick={() => setMode('percentage')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'percentage'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Calculator className="w-4 h-4" />
              퍼센트 배분
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Percent className="w-4 h-4" />
            <span>{mode === 'manual' ? '각 분기별 목표를 직접 입력하면 합계가 자동 계산됩니다.' : '연간 목표와 비율을 입력하면 분기별 목표가 자동 배분됩니다.'}</span>
          </div>
        </div>

        {/* Annual Target Inputs (Only visible in Percentage Mode) */}
        {mode === 'percentage' && (
          <div className="pt-4 border-t border-slate-100 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500" />
                부문별 연간 목표 입력
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {divisions.map(div => {
                // Calculate current totals for input display
                let currentSalesTotal = 0;
                let currentProfitTotal = 0;
                QUARTERS.forEach(q => {
                  const cell = matrix[cellKey(div.id, q)];
                  currentSalesTotal += Number(cell?.salesTarget) || 0;
                  currentProfitTotal += Number(cell?.profitTarget) || 0;
                });

                return (
                  <div key={div.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="text-sm font-medium text-slate-700 mb-2">{div.name}</div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <label className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 px-1">매출</label>
                        <input
                          type="text"
                          value={currentSalesTotal > 0 ? currentSalesTotal.toLocaleString() : ''}
                          onChange={(e) => handleTotalChange(div.id, 'salesTarget', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 text-right border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 border-indigo-200 text-indigo-700 font-medium"
                        />
                      </div>
                      <div className="relative flex-1">
                        <label className="text-[10px] text-slate-500 absolute -top-1.5 left-2 bg-slate-50 px-1">이익</label>
                        <input
                          type="text"
                          value={currentProfitTotal > 0 ? currentProfitTotal.toLocaleString() : ''}
                          onChange={(e) => handleTotalChange(div.id, 'profitTarget', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 text-right border border-slate-200 rounded text-sm focus:ring-1 focus:ring-emerald-500 border-emerald-200 text-emerald-700 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unified Ratio Inputs (Only visible in Percentage Mode) */}
        {mode === 'percentage' && (
          <div className="pt-4 border-t border-slate-100 animate-slide-up">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-500" />
                분기별 배분 비율 (매출/이익 공통)
              </span>
              <span className={`text-xs font-medium ${ratioTotal === 100 ? 'text-green-600' : 'text-red-500'}`}>
                합계: {ratioTotal}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-2xl">
              {QUARTERS.map((q, idx) => (
                <div key={q}>
                  <label className="block text-xs text-slate-500 mb-1 text-center">{getQuarterLabel(q)}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ratios[idx]}
                      onChange={(e) => handleRatioChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 text-center border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-sm text-slate-500">
            {year}년 분기별 매출 목표 (단위: 원)
            {matrix && Object.values(matrix).some(v => v.salesTarget || v.profitTarget) &&
              <span className="ml-2 text-xs text-orange-500 font-medium">
                * {mode === 'manual' ? '저장 버튼을 눌러야 반영됩니다.' : '자동 배분된 값은 저장 시 확정됩니다.'}
              </span>
            }
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || (mode === 'percentage' && ratioTotal !== 100)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            전체 저장
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold">
              <tr>
                <th className="p-3 text-left border-b border-r border-slate-200 min-w-[150px] bg-slate-200 sticky left-0 z-10">
                  영업부문
                </th>
                {QUARTERS.map(q => (
                  <th
                    key={q}
                    colSpan={2}
                    className="p-3 text-center border-b border-r border-slate-200 min-w-[200px]"
                  >
                    {getQuarterLabel(q)}
                  </th>
                ))}
                <th colSpan={2} className="p-3 text-center border-b border-slate-200 min-w-[200px] bg-slate-50 text-slate-800">
                  연간 합계
                </th>
              </tr>
              <tr className="text-xs text-slate-500">
                <th className="p-2 text-left border-b border-r border-slate-200 bg-slate-200 sticky left-0 z-10" />
                {QUARTERS.map(q => (
                  <React.Fragment key={q}>
                    <th className="p-2 border-b border-r border-slate-200 text-center text-indigo-600">매출</th>
                    <th className="p-2 border-b border-r border-slate-200 text-center text-emerald-600">이익</th>
                  </React.Fragment>
                ))}
                <th className="p-2 border-b border-r border-slate-200 text-center bg-slate-50 font-bold text-indigo-700">매출 합계</th>
                <th className="p-2 border-b border-slate-200 text-center bg-slate-50 font-bold text-emerald-700">이익 합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {divisions.map(div => {
                // Calculate totals for this division
                let totalSales = 0;
                let totalProfit = 0;
                QUARTERS.forEach(q => {
                  const key = cellKey(div.id, q);
                  const cell = matrix[key];
                  if (cell) {
                    totalSales += Number(cell.salesTarget) || 0;
                    totalProfit += Number(cell.profitTarget) || 0;
                  }
                });

                return (
                  <tr key={div.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-slate-700 border-r border-slate-100 sticky left-0 bg-white">
                      {div.name}
                    </td>
                    {QUARTERS.map(q => {
                      const key = cellKey(div.id, q);
                      const cell = matrix[key] || { salesTarget: '', profitTarget: '' };
                      const isReadOnly = mode === 'percentage';

                      return (
                        <React.Fragment key={q}>
                          <td className={`p-2 border-r border-slate-100 ${isReadOnly ? 'bg-slate-50' : ''}`}>
                            <input
                              type="text"
                              value={cell.salesTarget ? Number(cell.salesTarget).toLocaleString() : ''}
                              onChange={(e) => handleChange(key, 'salesTarget', e.target.value)}
                              readOnly={isReadOnly}
                              placeholder="0"
                              className={`w-full px-2 py-1.5 text-right border border-slate-200 rounded outline-none text-sm ${isReadOnly
                                ? 'bg-transparent text-slate-500 cursor-not-allowed border-transparent'
                                : 'focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                            />
                          </td>
                          <td className={`p-2 border-r border-slate-100 ${isReadOnly ? 'bg-slate-50' : ''}`}>
                            <input
                              type="text"
                              value={cell.profitTarget ? Number(cell.profitTarget).toLocaleString() : ''}
                              onChange={(e) => handleChange(key, 'profitTarget', e.target.value)}
                              readOnly={isReadOnly}
                              placeholder="0"
                              className={`w-full px-2 py-1.5 text-right border border-slate-200 rounded outline-none text-sm ${isReadOnly
                                ? 'bg-transparent text-slate-500 cursor-not-allowed border-transparent'
                                : 'focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500'
                                }`}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {/* Total Columns - ReadOnly in both modes */}
                    <td className="p-2 text-right border-r border-slate-100 bg-slate-50">
                      <span className="font-bold text-slate-800 pr-2 block">
                        {totalSales > 0 ? totalSales.toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="p-2 text-right bg-slate-50">
                      <span className="font-bold text-slate-800 pr-2 block">
                        {totalProfit > 0 ? totalProfit.toLocaleString() : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Footer Summary Row */}
            <tfoot className="bg-slate-100 font-bold sticky bottom-0 text-slate-800 shadow-[0_-1px_0_rgba(0,0,0,0.1)]">
              <tr>
                <td className="p-3 border-t border-r border-slate-300 sticky left-0 bg-slate-100 z-10 text-center">전체 합계</td>
                {QUARTERS.map(q => (
                  <React.Fragment key={q}>
                    <td className="p-2 border-t border-r border-slate-300 text-right text-indigo-700">
                      {footerTotals.sales[q] > 0 ? footerTotals.sales[q].toLocaleString() : '-'}
                    </td>
                    <td className="p-2 border-t border-r border-slate-300 text-right text-emerald-700">
                      {footerTotals.profit[q] > 0 ? footerTotals.profit[q].toLocaleString() : '-'}
                    </td>
                  </React.Fragment>
                ))}
                <td className="p-2 border-t border-r border-slate-300 text-right text-indigo-800 bg-indigo-50">
                  {footerTotals.sales.Total > 0 ? footerTotals.sales.Total.toLocaleString() : '-'}
                </td>
                <td className="p-2 border-t border-slate-300 text-right text-emerald-800 bg-emerald-50">
                  {footerTotals.profit.Total > 0 ? footerTotals.profit.Total.toLocaleString() : '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
