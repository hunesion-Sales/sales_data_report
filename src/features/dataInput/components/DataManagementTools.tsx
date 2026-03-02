import React from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

export default function DataManagementTools() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600" />
          데이터 관리 도구
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-800 mb-1">데이터 초기화 주의</p>
            <p>
              데이터 초기화는 되돌릴 수 없습니다. 신중하게 결정해주세요.
              문제가 지속될 경우 관리자에게 문의하세요.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!window.confirm('경고: 모든 연도의 보고서 데이터가 영구 삭제됩니다.\n\n삭제 항목:\n- 제품별 실적 데이터 (전 연도)\n- 부문별 실적 데이터 (전 연도)\n- 산업군별 실적 데이터 (전 연도)\n- 수주잔액 데이터 (전 연도)\n- 스냅샷 및 업로드 기록 (전 연도)\n\n정말 초기화하시겠습니까?')) return;
              if (!window.confirm('데이터는 복구할 수 없습니다. 정말 진행하시겠습니까?')) return;

              try {
                const { clearAllReportData } = await import('@/firebase/services/reportService');

                const result = await clearAllReportData();

                const reportYears = result.clearedReports.map(r => r.replace('report-', '')).join(', ');
                const backlogYears = result.clearedBacklogs.join(', ');
                alert(`모든 데이터가 초기화되었습니다.\n\n삭제된 보고서: ${reportYears || '없음'}\n삭제된 수주잔액: ${backlogYears || '없음'}`);

                // 로컬 캐시 정리 (선택적 - 실패해도 무시)
                try {
                  const { terminate, clearIndexedDbPersistence } = await import('firebase/firestore');
                  const { db } = await import('@/firebase/config');
                  await terminate(db);
                  await clearIndexedDbPersistence(db);
                } catch {
                  // 캐시 정리 실패는 무시 (데이터는 이미 삭제됨)
                }

                window.location.reload();
              } catch (e) {
                console.error('데이터 초기화 오류:', e);
                const errorMsg = e instanceof Error ? e.message : '알 수 없는 오류';
                alert(`초기화 중 오류가 발생했습니다.\n\n${errorMsg}`);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            데이터 초기화 (전체 삭제)
          </button>
        </div>
      </div>
    </div>
  );
}
