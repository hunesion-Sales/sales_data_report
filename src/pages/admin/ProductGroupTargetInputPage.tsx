import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Target, Loader2, AlertCircle, X, CheckCircle, Upload } from 'lucide-react';
import {
  useProductGroupTargetMatrix,
  ProductGroupTargetTable,
} from '@/features/productGroupTargetInput';
import { CURRENT_YEAR } from '@/config/appConfig';

export default function ProductGroupTargetInputPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'sales' | 'profit' | 'both'>('both');
  const excelInputRef = useRef<HTMLInputElement>(null);

  const {
    year,
    setYear,
    matrix,
    isLoading,
    isSaving,
    error,
    setError,
    successMsg,
    updateCell,
    handleSave,
    importFromExcel,
    getGroupAnnualTotal,
    getGrandTotal,
    productGroups,
    quarters,
  } = useProductGroupTargetMatrix();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500">목표 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">제품군별 목표 관리</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={excelInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await importFromExcel(file);
                e.target.value = '';
              }}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => excelInputRef.current?.click()}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              엑셀 가져오기
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              저장
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {[CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <span className="text-sm text-slate-500">{productGroups.length}개 제품군 × 4분기</span>
            </div>

            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {[
                { key: 'both' as const, label: '매출+이익' },
                { key: 'sales' as const, label: '매출만' },
                { key: 'profit' as const, label: '이익만' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setViewMode(opt.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === opt.key
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ProductGroupTargetTable
            matrix={matrix}
            productGroups={productGroups}
            quarters={quarters}
            updateCell={updateCell}
            getGroupAnnualTotal={getGroupAnnualTotal}
            getGrandTotal={getGrandTotal}
            viewMode={viewMode}
          />
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          단위: 원 (백만원 환산 표시). 0이 아닌 값만 저장됩니다.
        </p>
      </main>
    </div>
  );
}
