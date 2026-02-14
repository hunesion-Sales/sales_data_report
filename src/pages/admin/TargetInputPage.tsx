import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Loader2, AlertCircle, X, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTargets } from '@/hooks/useTargets';
import TargetInputTable from '@/components/targets/TargetInputTable';
import type { Notification, QuarterlyTargetInput } from '@/types';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

export default function TargetInputPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { divisions, targets, year, setYear, isLoading, isSaving, error, saveTargets } = useTargets();
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async (inputs: QuarterlyTargetInput[], createdBy: string) => {
    try {
      await saveTargets(inputs, createdBy);
      showNotification(`${inputs.length}건의 목표가 저장되었습니다.`);
    } catch {
      showNotification('목표 저장에 실패했습니다.', 'error');
    }
  };

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
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
          {notification.type === 'error' ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">분기별 목표 관리</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">연도</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <TargetInputTable
          divisions={divisions}
          targets={targets}
          year={year}
          isSaving={isSaving}
          createdBy={user?.uid || ''}
          onSave={handleSave}
        />
      </main>
    </div>
  );
}
