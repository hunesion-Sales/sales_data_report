import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  resetToDefaultDivisions,
} from '@/firebase/services/divisionService';
import { getUsersByDivision } from '@/firebase/services/userService';
import type { Division } from '@/types';
export default function DivisionManagementPage() {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집/추가 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState<Division | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{
    products: number;
    users: number;
  } | null>(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500">부문 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">영업부문 관리</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 추가 버튼 */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <span className="text-sm text-slate-500">총 {divisions.length}개 부문</span>
            <div className="flex gap-2">
              <button
                onClick={handleInitialize}
                disabled={isSaving}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                초기화
              </button>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  부문 추가
                </button>
              )}
            </div>
          </div>

          {/* 추가 폼 */}
          {isAdding && (
            <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="새 부문명 입력"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || isSaving}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                저장
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 부문 목록 */}
          <div className="divide-y divide-slate-100">
            {divisions.map((division) => (
              <div
                key={division.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                {editingId === division.id ? (
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim() || isSaving}
                      className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {division.sortOrder + 1}
                      </div>
                      <span className="font-medium text-slate-700">{division.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(division)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(division)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {divisions.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                등록된 부문이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">부문 삭제</h3>
            <p className="text-slate-600 mb-4">
              <span className="font-semibold text-slate-800">{deleteTarget.name}</span> 부문을 삭제하시겠습니까?
            </p>
            {deleteCheck && (deleteCheck.products > 0 || deleteCheck.users > 0) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <p className="font-medium mb-1">주의</p>
                <ul className="list-disc list-inside space-y-1">
                  {deleteCheck.products > 0 && (
                    <li>이 부문에 {deleteCheck.products}개의 제품이 배정되어 있습니다.</li>
                  )}
                  {deleteCheck.users > 0 && (
                    <li>이 부문에 {deleteCheck.users}명의 사용자가 소속되어 있습니다.</li>
                  )}
                </ul>
                <p className="mt-2 text-xs">삭제 시 연관 데이터의 부문이 미배정 상태가 됩니다.</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
