import React from 'react';
import type { ProductData } from '@/types';
import { useReport } from '@/hooks/useReport';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { WeekSelector, ConflictResolutionModal } from '@/components/upload';
import {
  useDataInput,
  UploadTypeSelector,
  MergeModeSelector,
  DataManagementTools,
  DataListTable,
} from '@/features/dataInput';
import { CURRENT_YEAR } from '@/config/appConfig';
import {
  Upload, FileText, Loader2, Save, X, Cloud, CloudOff, CalendarDays, Info,
} from 'lucide-react';

// --- 초기 데이터 (동적 월 구조) ---
const DEFAULT_MONTHS = ['2026-01', '2026-02'];
const DEFAULT_MONTH_LABELS: Record<string, string> = {
  '2026-01': '1월 2026',
  '2026-02': '2월 2026',
};
const INITIAL_DATA: ProductData[] = [];

export default function DataInputPage() {
  const { firebaseUser, authReady } = useAuth();
  const {
    data, months,
    isLoading, isSaving, error: firestoreError,
    saveUploadedData, removeEntry,
    currentWeekKey,
    availableSnapshots,
    selectedSnapshot,
    analyzeUpload,
    saveWithConflictResolution,
    loadSnapshot,
    loadLatest,
  } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
    firebaseUser,
    authReady,
  });

  const { notification, showNotification } = useNotification();

  const {
    fileInputRef,
    isUploading,
    uploadType,
    setUploadType,
    mergeMode,
    setMergeMode,
    showConflictModal,
    setShowConflictModal,
    uploadAnalysis,
    setUploadAnalysis,
    pendingFileName,
    setPendingFileName,
    detectedYear,
    detectedSubType,
    handleFileUpload,
    handleConflictResolve,
  } = useDataInput({
    saveUploadedData,
    analyzeUpload,
    saveWithConflictResolution,
    showNotification,
  });

  const handleDelete = async (id: number | string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await removeEntry(id);
      showNotification('데이터가 삭제되었습니다.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">데이터 관리</h2>

        <div className="flex items-center gap-4">
          <WeekSelector
            snapshots={availableSnapshots}
            selectedWeek={selectedSnapshot}
            currentWeekKey={currentWeekKey}
            onSelectWeek={loadSnapshot}
            onSelectLatest={loadLatest}
            isLoading={isLoading}
          />

          <div className="flex items-center gap-3">
            {isSaving ? (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                저장 중...
              </span>
            ) : firestoreError ? (
              <span className="flex items-center gap-1 text-xs text-red-500" title={firestoreError}>
                <CloudOff className="w-3.5 h-3.5" />
                오프라인
              </span>
            ) : !isLoading ? (
              <span className="flex items-center gap-1 text-xs text-accent-600">
                <Cloud className="w-3.5 h-3.5" />
                동기화됨
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-accent-600 text-white'}`}>
          {notification.type === 'error' ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* 파일 업로드 섹션 */}
      <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6 text-indigo-600" />
          데이터 파일 일괄 업로드
        </h3>
        <p className="text-sm text-slate-500 mb-2">
          엑셀 파일(.xlsx)을 업로드하세요. 시트명으로 유형(제품별/부문별/산업군별)을 자동 감지합니다.
        </p>
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span>시트명에 &quot;부문별&quot;, &quot;산업군&quot; 등의 키워드가 포함되면 해당 유형으로 처리, 없으면 제품별로 처리됩니다.</span>
        </div>

        <UploadTypeSelector uploadType={uploadType} onChangeType={setUploadType} />
        {uploadType !== 'backlog' && (
          <MergeModeSelector mergeMode={mergeMode} onChangeMode={setMergeMode} uploadType={uploadType} />
        )}

        {/* 감지된 연도/유형 표시 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {detectedYear && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              detectedYear === CURRENT_YEAR
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <CalendarDays className="w-4 h-4" />
              자동 감지된 연도: {detectedYear}년
              {detectedYear !== CURRENT_YEAR && ' (과거 데이터)'}
            </div>
          )}
          {detectedSubType && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Info className="w-4 h-4" />
              감지된 유형: {detectedSubType}
            </div>
          )}
        </div>

        <div
          className={`border-2 border-dashed border-primary-200 rounded-xl p-8 bg-primary-50/50 text-center transition-colors ${isUploading ? 'opacity-60 cursor-wait' : 'hover:bg-primary-50 cursor-pointer'}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <DataManagementTools />
          {isUploading ? (
            <>
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-primary-900 font-medium">파일 처리 중...</p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <p className="text-primary-900 font-medium">
                클릭하여 {uploadType === 'backlog' ? '수주잔액' : '실적 데이터'} 파일 업로드
              </p>
              <p className="text-xs text-primary-400 mt-1">.xlsx, .xls 파일 지원</p>
            </>
          )}
        </div>
      </div>

      {/* 목록 리스트 */}
      <DataListTable
        data={data}
        months={months}
        selectedSnapshot={selectedSnapshot}
        onDelete={handleDelete}
      />

      {/* 충돌 해결 모달 */}
      {uploadAnalysis && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false);
            setUploadAnalysis(null);
            setPendingFileName('');
          }}
          analysis={uploadAnalysis}
          onResolve={handleConflictResolve}
          isProcessing={isUploading}
        />
      )}
    </div>
  );
}
