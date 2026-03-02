import React, { useState, useCallback } from 'react';
import type { Quarter } from '@/types';

/** 숫자를 ###,### 형식으로 포맷 */
function formatNumber(value: number): string {
  if (!value) return '';
  return value.toLocaleString('ko-KR');
}

/** 콤마 포함 문자열 → 숫자 변환 */
function parseFormattedNumber(text: string): number {
  return Number(text.replace(/,/g, '')) || 0;
}

/** 천단위 콤마 포맷 input (포커스 시 숫자만 표시, 블러 시 콤마 포맷) */
function FormattedInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setEditValue(value ? String(value) : '');
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onChange(parseFormattedNumber(editValue));
  }, [editValue, onChange]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={isFocused ? editValue : formatNumber(value)}
      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder="0"
    />
  );
}

interface TargetCell {
  salesTarget: number;
  profitTarget: number;
}

interface ProductGroupTargetTableProps {
  matrix: Record<string, Record<Quarter, TargetCell>>;
  productGroups: readonly string[];
  quarters: Quarter[];
  updateCell: (group: string, quarter: Quarter, field: 'salesTarget' | 'profitTarget', value: number) => void;
  getGroupAnnualTotal: (group: string) => { salesTotal: number; profitTotal: number };
  getGrandTotal: () => { salesTotal: number; profitTotal: number };
  viewMode: 'sales' | 'profit' | 'both';
}

const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: '1분기',
  Q2: '2분기',
  Q3: '3분기',
  Q4: '4분기',
};

export default function ProductGroupTargetTable({
  matrix,
  productGroups,
  quarters,
  updateCell,
  getGroupAnnualTotal,
  getGrandTotal,
  viewMode,
}: ProductGroupTargetTableProps) {
  const grandTotal = getGrandTotal();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium sticky left-0 bg-slate-100 z-10 min-w-[160px]">
              제품군
            </th>
            {quarters.map((q) => (
              <th key={q} className="px-3 py-2 text-center font-medium" colSpan={viewMode === 'both' ? 2 : 1}>
                {QUARTER_LABELS[q]}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-medium bg-slate-200" colSpan={viewMode === 'both' ? 2 : 1}>
              연간 합계
            </th>
          </tr>
          {viewMode === 'both' && (
            <tr className="bg-slate-50 text-xs text-slate-500">
              <th className="px-3 py-1 sticky left-0 bg-slate-50 z-10"></th>
              {quarters.map((q) => (
                <React.Fragment key={q}>
                  <th className="px-3 py-1 text-center">매출</th>
                  <th className="px-3 py-1 text-center">이익</th>
                </React.Fragment>
              ))}
              <th className="px-3 py-1 text-center bg-slate-100">매출</th>
              <th className="px-3 py-1 text-center bg-slate-100">이익</th>
            </tr>
          )}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productGroups.map((group) => {
            const annual = getGroupAnnualTotal(group);
            return (
              <tr key={group} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 font-medium text-slate-700 sticky left-0 bg-white z-10">
                  {group}
                </td>
                {quarters.map((q) => {
                  const cell = matrix[group][q];
                  return viewMode === 'both' ? (
                    <React.Fragment key={q}>
                      <td className="px-1 py-1">
                        <FormattedInput
                          value={cell.salesTarget}
                          onChange={(v) => updateCell(group, q, 'salesTarget', v)}
                          className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <FormattedInput
                          value={cell.profitTarget}
                          onChange={(v) => updateCell(group, q, 'profitTarget', v)}
                          className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </td>
                    </React.Fragment>
                  ) : (
                    <td key={q} className="px-1 py-1">
                      <FormattedInput
                        value={viewMode === 'sales' ? cell.salesTarget : cell.profitTarget}
                        onChange={(v) => updateCell(group, q, viewMode === 'sales' ? 'salesTarget' : 'profitTarget', v)}
                        className="w-full px-2 py-1 text-right text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </td>
                  );
                })}
                {viewMode === 'both' ? (
                  <>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 bg-slate-50">
                      {formatNumber(annual.salesTotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700 bg-slate-50">
                      {formatNumber(annual.profitTotal)}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-right font-medium text-slate-700 bg-slate-50">
                    {formatNumber(viewMode === 'sales' ? annual.salesTotal : annual.profitTotal)}
                  </td>
                )}
              </tr>
            );
          })}

          {/* 합계 행 */}
          <tr className="bg-slate-100 font-bold">
            <td className="px-3 py-2 text-slate-800 sticky left-0 bg-slate-100 z-10">합계</td>
            {quarters.map((q) => {
              let qSales = 0;
              let qProfit = 0;
              for (const group of productGroups) {
                qSales += matrix[group][q].salesTarget;
                qProfit += matrix[group][q].profitTarget;
              }
              return viewMode === 'both' ? (
                <React.Fragment key={q}>
                  <td className="px-3 py-2 text-right text-slate-800">{formatNumber(qSales)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700">{formatNumber(qProfit)}</td>
                </React.Fragment>
              ) : (
                <td key={q} className="px-3 py-2 text-right text-slate-800">
                  {formatNumber(viewMode === 'sales' ? qSales : qProfit)}
                </td>
              );
            })}
            {viewMode === 'both' ? (
              <>
                <td className="px-3 py-2 text-right text-slate-800 bg-slate-200">{formatNumber(grandTotal.salesTotal)}</td>
                <td className="px-3 py-2 text-right text-emerald-700 bg-slate-200">{formatNumber(grandTotal.profitTotal)}</td>
              </>
            ) : (
              <td className="px-3 py-2 text-right text-slate-800 bg-slate-200">
                {formatNumber(viewMode === 'sales' ? grandTotal.salesTotal : grandTotal.profitTotal)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
