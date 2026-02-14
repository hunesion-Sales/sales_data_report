import { useState, useEffect, useCallback } from 'react';
import type { Division, QuarterlyTarget, QuarterlyTargetInput } from '@/types';
import { getDivisions } from '@/firebase/services/divisionService';
import { getTargetsByYear, batchUpsertTargets } from '@/firebase/services/targetService';

interface UseTargetsReturn {
  divisions: Division[];
  targets: QuarterlyTarget[];
  year: number;
  setYear: (year: number) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveTargets: (inputs: QuarterlyTargetInput[], createdBy: string) => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();

export function useTargets(): UseTargetsReturn {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [targets, setTargets] = useState<QuarterlyTarget[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [divisionsData, targetsData] = await Promise.all([
        getDivisions(),
        getTargetsByYear(year),
      ]);

      setDivisions(divisionsData);
      setTargets(targetsData);
    } catch (err) {
      console.error('useTargets load error:', err);
      setError('목표 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveTargets = useCallback(async (inputs: QuarterlyTargetInput[], createdBy: string) => {
    try {
      setIsSaving(true);
      setError(null);
      await batchUpsertTargets(inputs, createdBy);
      await loadData();
    } catch (err) {
      console.error('useTargets save error:', err);
      setError('목표 저장에 실패했습니다.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  return {
    divisions,
    targets,
    year,
    setYear,
    isLoading,
    isSaving,
    error,
    saveTargets,
  };
}
