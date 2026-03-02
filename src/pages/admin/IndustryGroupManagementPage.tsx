import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Factory, Loader2, AlertCircle, X, Upload } from 'lucide-react';
import {
  useIndustryGroupManagement,
  IndustryGroupList,
  IndustryGroupAddForm,
} from '@/features/industryGroupManagement';
import { DeleteConfirmModal } from '@/features/productManagement';

export default function IndustryGroupManagementPage() {
  const navigate = useNavigate();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useIndustryGroupManagement();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-slate-500">산업군 목록을 불러오는 중...</p>
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
              <Factory className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">산업군 관리</h1>
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
            <span className="text-sm text-slate-500">총 {groups.length}개 산업군</span>
            <div className="flex gap-2">
              <input
                type="file"
                ref={excelInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await importFromExcel(file);
                  e.target.value = '';
                }}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <button
                onClick={() => excelInputRef.current?.click()}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                엑셀 가져오기
              </button>
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
                  산업군 추가
                </button>
              )}
            </div>
          </div>

          {isAdding && (
            <IndustryGroupAddForm
              newName={newName}
              setNewName={setNewName}
              newKeywords={newKeywords}
              setNewKeywords={setNewKeywords}
              isSaving={isSaving}
              onAdd={handleAdd}
              onCancel={cancelAdd}
            />
          )}

          <IndustryGroupList
            groups={groups}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            editKeywords={editKeywords}
            setEditKeywords={setEditKeywords}
            isSaving={isSaving}
            onEdit={handleEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={handleDeleteClick}
          />
        </div>

        {/* 안내 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">산업군 분류 안내</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>각 산업군의 키워드는 엑셀 데이터의 "고객구분" 값과 매칭됩니다.</li>
            <li>유지보수 데이터(유지보수코드 섹션)는 키워드 무관하게 "유지보수" 산업군으로 자동 분류됩니다.</li>
            <li>매칭되지 않는 항목은 "기타" 산업군으로 분류됩니다.</li>
          </ul>
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          itemLabel="산업군"
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
