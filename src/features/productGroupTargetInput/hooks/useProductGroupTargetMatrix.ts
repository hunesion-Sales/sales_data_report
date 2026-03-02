import { useState, useEffect, useCallback } from 'react';
import { getProductGroupTargetsByYear, batchUpsertProductGroupTargets } from '@/firebase/services/productGroupTargetService';
import { PRODUCT_GROUPS } from '@/firebase/services/productMasterService';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENT_YEAR } from '@/config/appConfig';
import type { Quarter, ProductGroupTargetInput } from '@/types';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

interface TargetCell {
  salesTarget: number;
  profitTarget: number;
}

/** 제품군(행) × Q1~Q4(열) 매트릭스 */
type TargetMatrix = Record<string, Record<Quarter, TargetCell>>;

function createEmptyMatrix(): TargetMatrix {
  const matrix: TargetMatrix = {};
  for (const group of PRODUCT_GROUPS) {
    matrix[group] = {} as Record<Quarter, TargetCell>;
    for (const q of QUARTERS) {
      matrix[group][q] = { salesTarget: 0, profitTarget: 0 };
    }
  }
  return matrix;
}

export function useProductGroupTargetMatrix() {
  const { user } = useAuth();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [matrix, setMatrix] = useState<TargetMatrix>(createEmptyMatrix);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTargets = useCallback(async () => {
    try {
      setIsLoading(true);
      const targets = await getProductGroupTargetsByYear(year);
      const newMatrix = createEmptyMatrix();

      for (const t of targets) {
        if (newMatrix[t.productGroup] && newMatrix[t.productGroup][t.quarter]) {
          newMatrix[t.productGroup][t.quarter] = {
            salesTarget: t.salesTarget,
            profitTarget: t.profitTarget,
          };
        }
      }

      setMatrix(newMatrix);
      setError(null);
    } catch (err) {
      setError('목표 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const updateCell = (productGroup: string, quarter: Quarter, field: 'salesTarget' | 'profitTarget', value: number) => {
    setMatrix((prev) => ({
      ...prev,
      [productGroup]: {
        ...prev[productGroup],
        [quarter]: {
          ...prev[productGroup][quarter],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!user?.email) return;
    try {
      setIsSaving(true);
      const inputs: ProductGroupTargetInput[] = [];

      for (const group of PRODUCT_GROUPS) {
        for (const q of QUARTERS) {
          const cell = matrix[group][q];
          if (cell.salesTarget > 0 || cell.profitTarget > 0) {
            inputs.push({
              year,
              quarter: q,
              productGroup: group,
              salesTarget: cell.salesTarget,
              profitTarget: cell.profitTarget,
            });
          }
        }
      }

      await batchUpsertProductGroupTargets(inputs, user.email);
      setSuccessMsg(`${year}년 제품군별 목표가 저장되었습니다. (${inputs.length}건)`);
      setError(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('목표 저장에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 제품군별 연간 합계 계산
  const getGroupAnnualTotal = (productGroup: string) => {
    let salesTotal = 0;
    let profitTotal = 0;
    for (const q of QUARTERS) {
      salesTotal += matrix[productGroup][q].salesTarget;
      profitTotal += matrix[productGroup][q].profitTarget;
    }
    return { salesTotal, profitTotal };
  };

  // 전체 연간 합계
  const getGrandTotal = () => {
    let salesTotal = 0;
    let profitTotal = 0;
    for (const group of PRODUCT_GROUPS) {
      const { salesTotal: s, profitTotal: p } = getGroupAnnualTotal(group);
      salesTotal += s;
      profitTotal += p;
    }
    return { salesTotal, profitTotal };
  };

  /** 엑셀 파일에서 목표 데이터 임포트 */
  const importFromExcel = useCallback(async (file: File) => {
    try {
      setIsSaving(true);
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];
      if (!ws) throw new Error('시트를 찾을 수 없습니다.');

      const newMatrix = createEmptyMatrix();
      let importCount = 0;

      // Row 5~15: product group data (row 4 = header, row 16 = total)
      for (let r = 5; r <= 100; r++) {
        const row = ws.getRow(r);
        let name = row.getCell(1).value;
        if (name && typeof name === 'object' && 'richText' in name) {
          name = (name as { richText: { text: string }[] }).richText.map((t) => t.text).join('');
        }
        if (!name) continue;
        const nameStr = String(name).trim();
        if (nameStr === '합계' || nameStr === '') continue;

        // PRODUCT_GROUPS에 있는 제품군만 임포트
        if (!newMatrix[nameStr]) continue;

        for (let q = 0; q < 4; q++) {
          const salesTarget = Number(row.getCell(2 + q).value) || 0;
          const profitTarget = Number(row.getCell(6 + q).value) || 0;
          newMatrix[nameStr][QUARTERS[q]] = { salesTarget, profitTarget };
          if (salesTarget > 0 || profitTarget > 0) importCount++;
        }
      }

      setMatrix(newMatrix);
      setSuccessMsg(`엑셀에서 ${importCount}건의 목표 데이터를 가져왔습니다. '저장' 버튼을 눌러 Firestore에 반영하세요.`);
      setError(null);
    } catch (err) {
      setError('엑셀 파일 파싱에 실패했습니다: ' + (err instanceof Error ? err.message : ''));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
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
    productGroups: PRODUCT_GROUPS,
    quarters: QUARTERS,
  };
}
