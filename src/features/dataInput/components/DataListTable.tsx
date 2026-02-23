import React from 'react';
import type { ProductData, WeekKey } from '@/types';
import { getMonthShortLabel } from '@/types';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';

interface DataListTableProps {
  data: ProductData[];
  months: string[];
  selectedSnapshot: WeekKey | null;
  onDelete: (id: number | string) => void;
}

export default function DataListTable({ data, months, selectedSnapshot, onDelete }: DataListTableProps) {
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
      <h4 className="text-lg font-bold text-slate-800 mb-4">
        현재 데이터 목록({data.length}건)
        {selectedSnapshot && (
          <span className="ml-2 text-sm font-normal text-amber-600">
            (스냅샷: {selectedSnapshot})
          </span>
        )}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">제품군</th>
              {months.map(mk => (
                <th key={mk} className="p-3 text-right">{getMonthShortLabel(mk)} 매출</th>
              ))}
              <th className="p-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-700">{item.product}</td>
                {months.map(mk => (
                  <td key={mk} className="p-3 text-right text-slate-600" title={formatCurrencyFull(getMonthData(item, mk).sales)}>
                    {formatMillionWon(getMonthData(item, mk).sales)}
                  </td>
                ))}
                <td className="p-3 text-center">
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
