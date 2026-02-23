import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Building2, Loader2, AlertCircle, X } from 'lucide-react';
import {
  useDivisionManagement,
  DivisionList,
  DivisionAddForm,
} from '@/features/divisionManagement';
import { DeleteConfirmModal } from '@/features/productManagement';

export default function DivisionManagementPage() {
  const navigate = useNavigate();
  const {
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
  } = useDivisionManagement();

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
          {/* Toolbar */}
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

          {isAdding && (
            <DivisionAddForm
              newName={newName}
              setNewName={setNewName}
              isSaving={isSaving}
              onAdd={handleAdd}
              onCancel={cancelAdd}
            />
          )}

          <DivisionList
            divisions={divisions}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            isSaving={isSaving}
            onEdit={handleEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={handleDeleteClick}
          />
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          itemLabel="부문"
          isDeleting={isDeleting}
          warningContent={
            deleteCheck && (deleteCheck.products > 0 || deleteCheck.users > 0) ? (
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
            ) : undefined
          }
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
