/**
 * 주차 선택 드롭다운 컴포넌트
 */

import { useState } from 'react';
import { Calendar, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import type { WeeklySnapshot, WeekKey } from '@/types';
import { getWeekShortLabel, getWeekLabel } from '@/utils/weekUtils';

interface WeekSelectorProps {
  snapshots: WeeklySnapshot[];
  selectedWeek: WeekKey | null;
  currentWeekKey: WeekKey;
  onSelectWeek: (weekKey: WeekKey) => void;
  onSelectLatest: () => void;
  isLoading?: boolean;
}

export function WeekSelector({
  snapshots,
  selectedWeek,
  currentWeekKey,
  onSelectWeek,
  onSelectLatest,
  isLoading = false,
}: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isLatest = selectedWeek === null;
  const selectedSnapshot = snapshots.find(s => s.weekKey === selectedWeek);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDisplayLabel = () => {
    if (isLatest) {
      return '현재 (최신)';
    }
    if (selectedSnapshot) {
      return getWeekShortLabel(selectedSnapshot.weekKey);
    }
    return '주차 선택';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border
          ${isLatest
            ? 'bg-primary-50 border-primary-200 text-primary-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'}
          hover:bg-opacity-80 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <Calendar className="w-4 h-4" />
        <span className="font-medium">{getDisplayLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-20 overflow-hidden">
            {/* 현재 (최신) 옵션 */}
            <button
              type="button"
              onClick={() => {
                onSelectLatest();
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 flex items-center gap-3 text-left
                hover:bg-slate-50 transition-colors
                ${isLatest ? 'bg-primary-50' : ''}
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${isLatest ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'}
              `}>
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">현재 (최신)</p>
                <p className="text-sm text-slate-500">실시간 데이터 표시</p>
              </div>
              {isLatest && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  선택됨
                </span>
              )}
            </button>

            {snapshots.length > 0 && (
              <>
                <div className="border-t border-slate-200 px-4 py-2 bg-slate-50">
                  <p className="text-xs font-medium text-slate-500 uppercase">
                    저장된 스냅샷 ({snapshots.length}개)
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {snapshots.map((snapshot) => {
                    const isSelected = selectedWeek === snapshot.weekKey;
                    return (
                      <button
                        key={snapshot.weekKey}
                        type="button"
                        onClick={() => {
                          onSelectWeek(snapshot.weekKey);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full px-4 py-3 flex items-start gap-3 text-left
                          hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0
                          ${isSelected ? 'bg-amber-50' : ''}
                        `}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}
                        `}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {getWeekLabel(snapshot.weekKey)}
                            </p>
                            {isSelected && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                선택됨
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {snapshot.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{formatDate(snapshot.uploadedAt)}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{snapshot.productCount}개 제품</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{snapshot.monthsIncluded.length}개 월</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {snapshots.length === 0 && (
              <div className="px-4 py-6 text-center text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">저장된 스냅샷이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">
                  데이터를 업로드하면 주차별로 스냅샷이 저장됩니다
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default WeekSelector;
