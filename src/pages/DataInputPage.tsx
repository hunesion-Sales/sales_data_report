import React, { useState, useRef, useCallback } from 'react';
import { parseExcelFile } from '@/utils/excelParser';
import { parseDivisionExcelFile } from '@/utils/divisionExcelParser';
import { useReport, type UploadMergeMode } from '@/hooks/useReport';
import { useAuth } from '@/contexts/AuthContext';
import { getDivisions } from '@/firebase/services/divisionService';
import { saveDivisionData } from '@/firebase/services/divisionDataService';
import { formatMillionWon, formatCurrency as formatCurrencyFull } from '@/utils/formatUtils';
import type { ProductData, Notification, Division, UploadAnalysisResult, ConflictResolution } from '@/types';
import { getMonthShortLabel } from '@/types';
import { WeekSelector, ConflictResolutionModal } from '@/components/upload';
import {
    Upload, FileText, Loader2, Save, X, Package, Building2, RefreshCcw, GitMerge, Cloud, CloudOff, RefreshCw, AlertTriangle, Sparkles, Trash2
} from 'lucide-react';

// --- 초기 데이터 (동적 월 구조) ---
const DEFAULT_MONTHS = ['2026-01', '2026-02'];
const DEFAULT_MONTH_LABELS: Record<string, string> = {
    '2026-01': '1월 2026',
    '2026-02': '2월 2026',
};

// Initial Data is needed for useReport but we only use the upload functionality here
// We can pass an empty array or minimal data as we are mainly using saveUploadedData
const INITIAL_DATA: ProductData[] = [];

export default function DataInputPage() {
    const { firebaseUser, authReady } = useAuth();
    const {
        data, months,
        isLoading, isSaving, error: firestoreError,
        saveUploadedData, removeEntry,
        // 스냅샷 관련
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

    const [notification, setNotification] = useState<Notification | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState<'product' | 'division'>('product');
    const [mergeMode, setMergeMode] = useState<UploadMergeMode>('smart');

    // 충돌 해결 모달 상태
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [uploadAnalysis, setUploadAnalysis] = useState<UploadAnalysisResult | null>(null);
    const [pendingFileName, setPendingFileName] = useState<string>('');

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // 제품의 특정 월 데이터를 안전하게 가져오기
    const getMonthData = (item: ProductData, monthKey: string) => {
        return item.months[monthKey] ?? { sales: 0, cost: 0 };
    };

    const handleDelete = async (id: number | string) => {
        if (window.confirm('삭제하시겠습니까?')) {
            await removeEntry(id);
            showNotification('데이터가 삭제되었습니다.', 'error');
        }
    };

    // --- 부문 매칭 로직 ---
    const matchDivision = (excelName: string, divisions: Division[]): Division | null => {
        const exact = divisions.find(d => d.name === excelName);
        if (exact) return exact;
        const partial = divisions.find(d =>
            d.name.includes(excelName) || excelName.includes(d.name)
        );
        return partial || null;
    };

    // --- 파일 업로드 처리 ---
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (!isExcel) {
            showNotification('지원하지 않는 파일 형식입니다. .xlsx 파일을 업로드해주세요.', 'error');
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const buffer = await file.arrayBuffer();

            if (uploadType === 'division') {
                const result = await parseDivisionExcelFile(buffer);
                const divisions = await getDivisions();

                let matchedCount = 0;
                let unmatchedCount = 0;
                const items = result.data.map(row => {
                    const matched = matchDivision(row.divisionName, divisions);
                    if (matched) {
                        matchedCount++;
                    } else {
                        unmatchedCount++;
                    }
                    return {
                        divisionName: row.divisionName,
                        divisionId: matched?.id ?? 'unmatched',
                        months: row.months,
                    };
                });

                const currentYear = new Date().getFullYear();
                const reportId = `report-${currentYear}`;
                // pass mergeMode to saveDivisionData
                await saveDivisionData(reportId, items, mergeMode);

                showNotification(
                    `${items.length}개 부문 데이터가 업로드되었습니다 (${matchedCount}개 매칭, ${unmatchedCount}개 미매칭)`
                );
            } else {
                const result = await parseExcelFile(buffer);

                // smart 모드: 충돌 감지
                if (mergeMode === 'smart') {
                    const analysis = await analyzeUpload(
                        result.data,
                        result.months,
                        result.monthLabels,
                    );

                    // 충돌이 있으면 모달 표시
                    if (analysis.conflicts.length > 0) {
                        setUploadAnalysis(analysis);
                        setPendingFileName(file.name);
                        setShowConflictModal(true);
                        setIsUploading(false);
                        e.target.value = '';
                        return;
                    }

                    // 충돌 없으면 바로 저장
                    const saveResult = await saveWithConflictResolution(
                        analysis,
                        [], // 충돌 없으므로 빈 배열
                        file.name,
                    );

                    const monthInfo = result.months.length > 0
                        ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
                        : '';

                    showNotification(
                        `데이터가 저장되었습니다: 신규 ${analysis.newMonths.length}개 월, 변경 없음 ${saveResult.skippedMonths.length}개 월${monthInfo}`
                    );
                } else {
                    // 기존 overwrite/merge 모드
                    const { newCount, updatedCount } = await saveUploadedData(
                        result.data,
                        result.months,
                        result.monthLabels,
                        file.name,
                        mergeMode,
                    );

                    const monthInfo = result.months.length > 0
                        ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
                        : '';

                    if (mergeMode === 'merge') {
                        showNotification(
                            `데이터가 병합되었습니다: 신규 ${newCount}건, 업데이트 ${updatedCount}건${monthInfo}`
                        );
                    } else {
                        showNotification(`${result.data.length}건의 데이터를 불러왔습니다.${monthInfo}`);
                    }
                }
            }
        } catch (error) {
            console.error('Excel parsing error:', error);
            const message = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
            showNotification(message, 'error');
        } finally {
            setIsUploading(false);
        }
        e.target.value = '';
    }, [saveUploadedData, uploadType, mergeMode, analyzeUpload, saveWithConflictResolution]);

    // --- 충돌 해결 처리 ---
    const handleConflictResolve = useCallback(async (resolutions: ConflictResolution[]) => {
        if (!uploadAnalysis) return;

        setIsUploading(true);
        try {
            const result = await saveWithConflictResolution(
                uploadAnalysis,
                resolutions,
                pendingFileName,
            );

            setShowConflictModal(false);
            setUploadAnalysis(null);
            setPendingFileName('');

            const useNewCount = resolutions.filter(r => r.resolution === 'use_new').length;
            showNotification(
                `데이터가 저장되었습니다: 신규 ${result.newCount}개 월, 대체 ${useNewCount}개 월, 스킵 ${result.skippedMonths.length}개 월`
            );
        } catch (error) {
            console.error('Conflict resolution error:', error);
            showNotification('저장 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [uploadAnalysis, pendingFileName, saveWithConflictResolution]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">데이터 관리</h2>

                {/* 주차 선택 및 상태 */}
                <div className="flex items-center gap-4">
                    {/* 주차 선택 */}
                    <WeekSelector
                        snapshots={availableSnapshots}
                        selectedWeek={selectedSnapshot}
                        currentWeekKey={currentWeekKey}
                        onSelectWeek={loadSnapshot}
                        onSelectLatest={loadLatest}
                        isLoading={isLoading}
                    />

                    {/* Firestore Status */}
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
                <p className="text-sm text-slate-500 mb-4">
                    매출 데이터 엑셀 파일(.xlsx)을 업로드하세요.<br />
                    (헤더 행에서 월 정보를 자동 감지합니다)
                </p>

                {/* 업로드 타입 토글 */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setUploadType('product')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'product'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        제품별 데이터
                    </button>
                    <button
                        onClick={() => setUploadType('division')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'division'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        부문별 데이터
                    </button>
                </div>

                {/* 병합 모드 (제품별/부문별 모두 표시) */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">업로드 방식</p>
                    <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <input
                                type="radio"
                                name="mergeMode"
                                checked={mergeMode === 'smart'}
                                onChange={() => setMergeMode('smart')}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                            />
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <div>
                                <span className="text-sm font-medium text-slate-700">스마트 (권장)</span>
                                <p className="text-xs text-slate-500">
                                    {uploadType === 'product'
                                        ? '변경된 월만 감지, 충돌 시 선택'
                                        : '기존 데이터와 병합 (충돌 시 자동 병합)'}
                                </p>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors">
                            <input
                                type="radio"
                                name="mergeMode"
                                checked={mergeMode === 'overwrite'}
                                onChange={() => setMergeMode('overwrite')}
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
                                onChange={() => setMergeMode('merge')}
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
                    {/* DB Sync & Repair Section */}
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
                                {/* Sync and Init buttons removed as requested */}
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('경고: 2026년 보고서의 모든 데이터(제품, 스냅샷, 업로드 기록)가 영구 삭제됩니다.\n정말 초기화하시겠습니까?')) return;
                                        if (!window.confirm('데이터는 복구할 수 없습니다. 정말 진행하시겠습니까?')) return;

                                        try {
                                            const { clearReportData } = await import('@/firebase/services/reportService');
                                            const { terminate, clearIndexedDbPersistence } = await import('firebase/firestore');
                                            const { db } = await import('@/firebase/config');

                                            // 1. Delete all data
                                            await clearReportData('report-2026');

                                            // 2. Clear local cache to prevent BloomFilter errors
                                            await terminate(db);
                                            await clearIndexedDbPersistence(db);

                                            alert('모든 데이터가 초기화되었습니다.');
                                            window.location.reload();
                                        } catch (e) {
                                            console.error(e);
                                            alert('초기화 중 오류가 발생했습니다.');
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
                    {isUploading ? (
                        <>
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-primary-900 font-medium">파일 처리 중...</p>
                        </>
                    ) : (
                        <>
                            <FileText className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                            <p className="text-primary-900 font-medium">
                                클릭하여 {uploadType === 'division' ? '부문별' : '제품별'} 파일 업로드
                            </p>
                            <p className="text-xs text-primary-400 mt-1">.xlsx, .xls 파일 지원</p>
                        </>
                    )}
                </div>
            </div>

            {/* 목록 리스트 */}
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
                                            onClick={() => handleDelete(item.id)}
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
