import { useState, useEffect, useCallback } from 'react';
import {
  getIndustryGroups,
  createIndustryGroup,
  updateIndustryGroup,
  deleteIndustryGroup,
  resetToDefaultIndustryGroups,
} from '@/firebase/services/industryGroupService';
import { db } from '@/firebase/config';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { IndustryGroup } from '@/types';

export function useIndustryGroupManagement() {
  const [groups, setGroups] = useState<IndustryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 추가 상태
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState<string[]>([]);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<IndustryGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getIndustryGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError('산업군 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setIsSaving(true);
      const maxOrder = groups.length > 0 ? Math.max(...groups.map(g => g.sortOrder)) : 0;
      await createIndustryGroup({
        name: newName.trim(),
        keywords: newKeywords.filter(k => k.trim()),
        sortOrder: maxOrder + 1,
      });
      setNewName('');
      setNewKeywords([]);
      setIsAdding(false);
      await loadGroups();
    } catch (err) {
      setError('산업군 추가에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (group: IndustryGroup) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditKeywords([...group.keywords]);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setIsSaving(true);
      await updateIndustryGroup(editingId, {
        name: editName.trim(),
        keywords: editKeywords.filter(k => k.trim()),
      });
      setEditingId(null);
      setEditName('');
      setEditKeywords([]);
      await loadGroups();
    } catch (err) {
      setError('산업군 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditKeywords([]);
  };

  const handleDeleteClick = (group: IndustryGroup) => {
    setDeleteTarget(group);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteIndustryGroup(deleteTarget.id);
      setDeleteTarget(null);
      await loadGroups();
    } catch (err) {
      setError('산업군 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleInitialize = async () => {
    if (!window.confirm('모든 산업군 데이터가 초기화됩니다. 계속하시겠습니까?\n(주의: 기존 설정된 산업군 정보가 삭제되고 기본값으로 복원됩니다.)')) {
      return;
    }
    try {
      setIsSaving(true);
      await resetToDefaultIndustryGroups();
      await loadGroups();
      alert('산업군이 초기화되었습니다.');
    } catch (err) {
      setError('초기화에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewName('');
    setNewKeywords([]);
  };

  /** 엑셀 파일에서 산업군 데이터 임포트 (기존 데이터 삭제 후 재생성) */
  const importFromExcel = useCallback(async (file: File) => {
    try {
      setIsSaving(true);
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];
      if (!ws) throw new Error('시트를 찾을 수 없습니다.');

      // 엑셀 파싱: 산업군명 → 키워드 목록
      const groupMap = new Map<string, string[]>();
      ws.eachRow((row, rowNum) => {
        if (rowNum <= 1) return; // 헤더 스킵
        let groupName = row.getCell(1).value;
        let keyword = row.getCell(2).value;
        if (groupName && typeof groupName === 'object' && 'richText' in groupName) {
          groupName = (groupName as { richText: { text: string }[] }).richText.map(t => t.text).join('');
        }
        if (keyword && typeof keyword === 'object' && 'richText' in keyword) {
          keyword = (keyword as { richText: { text: string }[] }).richText.map(t => t.text).join('');
        }
        if (!groupName || !keyword) return;
        const name = String(groupName).trim();
        const kw = String(keyword).trim();
        if (!groupMap.has(name)) groupMap.set(name, []);
        groupMap.get(name)!.push(kw);
      });

      if (groupMap.size === 0) throw new Error('유효한 산업군 데이터가 없습니다.');

      // 기존 산업군 삭제
      const existing = await getIndustryGroups();
      const batch = writeBatch(db);
      for (const group of existing) {
        batch.delete(doc(db, 'industry_groups', group.id));
      }

      // 새 산업군 생성
      let sortOrder = 1;
      for (const [name, keywords] of groupMap) {
        const docRef = doc(collection(db, 'industry_groups'));
        batch.set(docRef, {
          name,
          keywords,
          sortOrder: sortOrder++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      await loadGroups();
      alert(`엑셀에서 ${groupMap.size}개 산업군을 가져왔습니다.`);
    } catch (err) {
      setError('엑셀 임포트에 실패했습니다: ' + (err instanceof Error ? err.message : ''));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    setError,
    editingId,
    editName,
    setEditName,
    editKeywords,
    setEditKeywords,
    isAdding,
    setIsAdding,
    newName,
    setNewName,
    newKeywords,
    setNewKeywords,
    isSaving,
    deleteTarget,
    isDeleting,
    handleAdd,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleInitialize,
    cancelAdd,
    importFromExcel,
  };
}
