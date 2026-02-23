import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Package, Loader2, AlertCircle, X, Filter } from 'lucide-react';
import {
  useProductManagement,
  ProductAddForm,
  ProductTable,
  DeleteConfirmModal,
} from '@/features/productManagement';

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const {
    products,
    filteredProducts,
    isLoading,
    error,
    setError,
    filterMaintenance,
    setFilterMaintenance,
    editingId,
    editData,
    setEditData,
    isAdding,
    setIsAdding,
    newData,
    setNewData,
    isSaving,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    handleAdd,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleConfirmDelete,
    cancelAdd,
  } = useProductManagement();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500">제품 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">제품 마스터 관리</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {/* Filter & Add Button */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterMaintenance}
                onChange={(e) => setFilterMaintenance(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="all">전체 유형</option>
                <option value="regular">일반 제품</option>
                <option value="maintenance">유지보수</option>
              </select>
              <span className="text-sm text-slate-500">
                {filteredProducts.length}개 / 총 {products.length}개
              </span>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                제품 추가
              </button>
            )}
          </div>

          {isAdding && (
            <ProductAddForm
              newData={newData}
              setNewData={setNewData}
              isSaving={isSaving}
              onAdd={handleAdd}
              onCancel={cancelAdd}
            />
          )}

          <ProductTable
            filteredProducts={filteredProducts}
            totalCount={products.length}
            editingId={editingId}
            editData={editData}
            setEditData={setEditData}
            isSaving={isSaving}
            onEdit={handleEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onDelete={setDeleteTarget}
          />
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          itemLabel="제품"
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
