import React from 'react';
import { Sparkles, RefreshCcw, GitMerge } from 'lucide-react';
import type { UploadMergeMode } from '@/hooks/useReport';

interface MergeModeSelectorProps {
  mergeMode: UploadMergeMode;
  onChangeMode: (mode: UploadMergeMode) => void;
  uploadType: string;
}

export default function MergeModeSelector({ mergeMode, onChangeMode, uploadType }: MergeModeSelectorProps) {
  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-sm font-medium text-slate-700 mb-3">업로드 방식</p>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <input
            type="radio"
            name="mergeMode"
            checked={mergeMode === 'smart'}
            onChange={() => onChangeMode('smart')}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
          />
          <Sparkles className="w-4 h-4 text-amber-500" />
          <div>
            <span className="text-sm font-medium text-slate-700">스마트 (권장)</span>
            <p className="text-xs text-slate-500">
              변경된 월만 감지, 충돌 시 선택
            </p>
          </div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <input
            type="radio"
            name="mergeMode"
            checked={mergeMode === 'overwrite'}
            onChange={() => onChangeMode('overwrite')}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
          />
          <RefreshCcw className="w-4 h-4 text-slate-500" />
          <div>
            <span className="text-sm font-medium text-slate-700">덮어쓰기</span>
            <p className="text-xs text-slate-500">기존 데이터를 새 데이터로 대체</p>
          </div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <input
            type="radio"
            name="mergeMode"
            checked={mergeMode === 'merge'}
            onChange={() => onChangeMode('merge')}
            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
          />
          <GitMerge className="w-4 h-4 text-slate-500" />
          <div>
            <span className="text-sm font-medium text-slate-700">병합</span>
            <p className="text-xs text-slate-500">기존 데이터와 합치기</p>
          </div>
        </label>
      </div>
    </div>
  );
}
