import { useState, useEffect } from 'react';
import {
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  resetToDefaultDivisions,
} from '@/firebase/services/divisionService';
import { getUsersByDivision } from '@/firebase/services/userService';
import type { Division } from '@/types';

export function useDivisionManagement() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{ products: number; users: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      setIsLoading(true);
      const data = await getDivisions();
      setDivisions(data);
      setError(null);
    } catch (err) {
      setError('부문 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setIsSaving(true);
      const maxOrder = divisions.length > 0 ? Math.max(...divisions.map(d => d.sortOrder)) : -1;
      await createDivision(newName.trim(), maxOrder + 1);
      setNewName('');
      setIsAdding(false);
      await loadDivisions();
    } catch (err) {
      setError('부문 추가에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (division: Division) => {
    setEditingId(division.id);
    setEditName(division.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setIsSaving(true);
      await updateDivision(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      await loadDivisions();
    } catch (err) {
      setError('부문 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDeleteClick = async (division: Division) => {
    setDeleteTarget(division);
    try {
      const users = await getUsersByDivision(division.id);
      setDeleteCheck({ products: 0, users: users.length });
    } catch (err) {
      console.error(err);
      setDeleteCheck({ products: 0, users: 0 });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteDivision(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteCheck(null);
      await loadDivisions();
    } catch (err) {
      setError('부문 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setDeleteCheck(null);
  };

  const handleInitialize = async () => {
    if (!window.confirm('모든 영업부문 데이터가 초기화됩니다. 계속하시겠습니까?\n(주의: 기존 설정된 부문 정보가 삭제되고 기본값으로 복원됩니다.)')) {
      return;
    }

    try {
      setIsSaving(true);
      await resetToDefaultDivisions();
      await loadDivisions();
      alert('영업부문이 초기화되었습니다.');
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
  };

  return {
    divisions,
    isLoading,
    error,
    setError,
    editingId,
    editName,
    setEditName,
    isAdding,
    setIsAdding,
    newName,
    setNewName,
    isSaving,
    deleteTarget,
    deleteCheck,
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
