/**
 * 월별 데이터 충돌 해결 모달 컴포넌트
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Check,
  Plus,
  SkipForward,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { UploadAnalysisResult, ConflictResolution, MonthConflict } from '@/types';
import { getWeekLabel, getWeekShortLabel } from '@/utils/weekUtils';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: UploadAnalysisResult;
  onResolve: (resolutions: ConflictResolution[]) => void;
  isProcessing?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString();
}

function calculateChange(oldValue: number, newValue: number): { percent: number; direction: 'up' | 'down' | 'same' } {
  if (oldValue === 0) return { percent: 100, direction: newValue > 0 ? 'up' : 'same' };
  const percent = ((newValue - oldValue) / oldValue) * 100;
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'same',
  };
}

interface ConflictItemProps {
  conflict: MonthConflict;
  resolution: 'keep_existing' | 'use_new';
  onSelect: (choice: 'keep_existing' | 'use_new') => void;
}

function ConflictItem({ conflict, resolution, onSelect }: ConflictItemProps) {
  const salesChange = calculateChange(conflict.existingData.totalSales, conflict.newData.totalSales);
  const costChange = calculateChange(conflict.existingData.totalCost, conflict.newData.totalCost);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h4 className="font-semibold text-slate-800">{conflict.monthLabel} 데이터 충돌</h4>
        </div>
      </div>

      {/* Comparison */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* 기존 데이터 */}
          <div
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${resolution === 'keep_existing'
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300'}
            `}
            onClick={() => onSelect('keep_existing')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">기존 데이터</span>
              <input
                type="radio"
                checked={resolution === 'keep_existing'}
                onChange={() => onSelect('keep_existing')}
                className="w-4 h-4 text-primary-600"
              />
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {getWeekShortLabel(conflict.existingData.weekKey)}
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-slate-500">매출:</span>
                <span className="font-medium text-slate-700 ml-1">
                  {formatCurrency(conflict.existingData.totalSales)}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">매입:</span>
                <span className="font-medium text-slate-700 ml-1">
                  {formatCurrency(conflict.existingData.totalCost)}
                </span>
              </p>
            </div>
          </div>

          {/* 신규 데이터 */}
          <div
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${resolution === 'use_new'
                ? 'border-accent-500 bg-accent-50'
                : 'border-slate-200 hover:border-slate-300'}
            `}
            onClick={() => onSelect('use_new')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase">신규 데이터</span>
              <input
                type="radio"
                checked={resolution === 'use_new'}
                onChange={() => onSelect('use_new')}
                className="w-4 h-4 text-accent-600"
              />
            </div>
            <p className="text-xs text-slate-400 mb-2">현재 업로드</p>
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-1">
                <span className="text-slate-500">매출:</span>
                <span className="font-medium text-slate-700">
                  {formatCurrency(conflict.newData.totalSales)}
                </span>
                {salesChange.direction !== 'same' && (
                  <span className={`flex items-center text-xs ${
                    salesChange.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {salesChange.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {salesChange.percent.toFixed(0)}%
                  </span>
                )}
              </p>
              <p className="text-sm flex items-center gap-1">
                <span className="text-slate-500">매입:</span>
                <span className="font-medium text-slate-700">
                  {formatCurrency(conflict.newData.totalCost)}
                </span>
                {costChange.direction !== 'same' && (
                  <span className={`flex items-center text-xs ${
                    costChange.direction === 'up' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {costChange.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {costChange.percent.toFixed(0)}%
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  analysis,
  onResolve,
  isProcessing = false,
}: ConflictResolutionModalProps) {
  // 기본값: 모든 충돌은 기존 유지
  const [resolutions, setResolutions] = useState<Map<string, 'keep_existing' | 'use_new'>>(() =>
    new Map(analysis.conflicts.map(c => [c.monthKey, 'keep_existing' as const]))
  );

  const handleSelect = (monthKey: string, choice: 'keep_existing' | 'use_new') => {
    setResolutions(prev => new Map(prev).set(monthKey, choice));
  };

  const handleSelectAll = (choice: 'keep_existing' | 'use_new') => {
    setResolutions(new Map(analysis.conflicts.map(c => [c.monthKey, choice])));
  };

  const handleSubmit = () => {
    const result: ConflictResolution[] = Array.from(resolutions.entries()).map(
      ([monthKey, resolution]) => ({ monthKey, resolution })
    );
    onResolve(result);
  };

  const useNewCount = useMemo(
    () => Array.from(resolutions.values()).filter(v => v === 'use_new').length,
    [resolutions]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <div className="max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">데이터 충돌 감지</h2>
              <p className="text-sm text-slate-500">
                업로드 주차: {getWeekLabel(analysis.weekKey)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-shrink-0 py-4 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-3">
            {/* 신규 월 */}
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">신규 월</span>
              </div>
              <p className="text-lg font-bold text-emerald-800">
                {analysis.newMonths.length}개
              </p>
              {analysis.newMonths.length > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  {analysis.newMonths.join(', ')}
                </p>
              )}
            </div>

            {/* 변경 없음 */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <SkipForward className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">변경 없음</span>
              </div>
              <p className="text-lg font-bold text-slate-700">
                {analysis.unchangedMonths.length}개
              </p>
              {analysis.unchangedMonths.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  저장 스킵됨
                </p>
              )}
            </div>

            {/* 충돌 발생 */}
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">충돌 발생</span>
              </div>
              <p className="text-lg font-bold text-amber-800">
                {analysis.conflicts.length}개
              </p>
              <p className="text-xs text-amber-600 mt-1">
                선택 필요
              </p>
            </div>
          </div>
        </div>

        {/* Conflict List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {analysis.conflicts.map((conflict) => (
            <ConflictItem
              key={conflict.monthKey}
              conflict={conflict}
              resolution={resolutions.get(conflict.monthKey) || 'keep_existing'}
              onSelect={(choice) => handleSelect(conflict.monthKey, choice)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-200">
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-500">전체 선택:</span>
            <button
              type="button"
              onClick={() => handleSelectAll('keep_existing')}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              모두 기존 유지
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll('use_new')}
              className="px-3 py-1.5 text-sm font-medium text-accent-600 bg-accent-100 hover:bg-accent-200 rounded-lg transition-colors"
            >
              모두 신규로 대체
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {useNewCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {useNewCount}개 월을 신규 데이터로 대체합니다
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    적용 및 저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ConflictResolutionModal;
