import type {
  ProductData,
  WeekKey,
  WeeklySnapshot,
  UploadAnalysisResult,
  ConflictResolution,
  ConflictResolutionSaveResult,
} from '@/types';
import type { User } from 'firebase/auth';
import { useReportData } from './useReportData';
import { useReportSnapshots } from './useReportSnapshots';
import { useReportUpload } from './useReportUpload';

export type { UploadMergeMode } from './useReportData';

interface UseReportOptions {
  /** Firebase Auth 사용자 (null이면 Firestore 쿼리 스킵) */
  firebaseUser: User | null;
  /** Auth 상태가 결정되었는지 (초기 로딩 중이면 false) */
  authReady: boolean;
}

interface UseReportReturn {
  data: ProductData[];
  months: string[];
  monthLabels: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveUploadedData: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    fileName: string,
    mergeMode?: import('./useReportData').UploadMergeMode,
    targetYear?: number,
  ) => Promise<{ newCount: number; updatedCount: number }>;
  addEntry: (product: ProductData) => Promise<void>;
  removeEntry: (id: number | string) => Promise<void>;
  currentWeekKey: WeekKey;
  availableSnapshots: WeeklySnapshot[];
  selectedSnapshot: WeekKey | null;
  analyzeUpload: (
    products: ProductData[],
    months: string[],
    monthLabels: Record<string, string>,
    targetYear?: number,
  ) => Promise<UploadAnalysisResult>;
  saveWithConflictResolution: (
    analysisResult: UploadAnalysisResult,
    resolutions: ConflictResolution[],
    fileName: string,
    targetYear?: number,
  ) => Promise<ConflictResolutionSaveResult>;
  loadSnapshot: (weekKey: WeekKey) => Promise<void>;
  loadLatest: () => Promise<void>;
  refreshSnapshots: () => Promise<void>;
}

export function useReport(
  initialData: ProductData[],
  initialMonths: string[],
  initialMonthLabels: Record<string, string>,
  options: UseReportOptions,
): UseReportReturn {
  const { firebaseUser, authReady } = options;

  const {
    data, months, monthLabels,
    isLoading, isSaving, error,
    saveUploadedData, addEntry, removeEntry,
    internals,
  } = useReportData(initialData, initialMonths, initialMonthLabels, {
    firebaseUser,
    authReady,
  });

  const {
    currentWeekKey, availableSnapshots, selectedSnapshot,
    refreshSnapshots, loadSnapshot, loadLatest,
  } = useReportSnapshots({ internals, isLoading });

  const {
    analyzeUpload, saveWithConflictResolution,
  } = useReportUpload({ internals, refreshSnapshots, firebaseUser });

  return {
    data, months, monthLabels,
    isLoading, isSaving, error,
    saveUploadedData, addEntry, removeEntry,
    currentWeekKey, availableSnapshots, selectedSnapshot,
    analyzeUpload, saveWithConflictResolution,
    loadSnapshot, loadLatest, refreshSnapshots,
  };
}
