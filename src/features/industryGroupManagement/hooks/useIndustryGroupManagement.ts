import { useState, useEffect } from 'react';
import {
  getIndustryGroups,
  createIndustryGroup,
  updateIndustryGroup,
  deleteIndustryGroup,
  resetToDefaultIndustryGroups,
} from '@/firebase/services/industryGroupService';
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

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
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
  };

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
  };
}
