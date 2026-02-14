import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Package,
  Loader2,
  AlertCircle,
  Wrench,
  Building2,
  Filter,
} from 'lucide-react';
import {
  getProductMasters,
  createProductMaster,
  updateProductMaster,
  deleteProductMaster,
} from '@/firebase/services/productMasterService';
import { getDivisions } from '@/firebase/services/divisionService';
import type { ProductMaster, Division } from '@/types';

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [filterMaintenance, setFilterMaintenance] = useState<string>('all');

  // 편집/추가 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    divisionId: string | null;
    isMaintenanceType: boolean;
  }>({ name: '', divisionId: null, isMaintenanceType: false });

  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<{
    name: string;
    divisionId: string | null;
    isMaintenanceType: boolean;
  }>({ name: '', divisionId: null, isMaintenanceType: false });

  const [isSaving, setIsSaving] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<ProductMaster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, divisionsData] = await Promise.all([
        getProductMasters(),
        getDivisions(),
      ]);
      setProducts(productsData);
      setDivisions(divisionsData);
      setError(null);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterDivision !== 'all' && p.divisionId !== filterDivision) return false;
      if (filterMaintenance === 'maintenance' && !p.isMaintenanceType) return false;
      if (filterMaintenance === 'regular' && p.isMaintenanceType) return false;
      return true;
    });
  }, [products, filterDivision, filterMaintenance]);

  const getDivisionName = (divisionId: string | null) => {
    if (!divisionId) return '미배정';
    return divisions.find((d) => d.id === divisionId)?.name || '미배정';
  };

  const handleAdd = async () => {
    if (!newData.name.trim()) return;
    try {
      setIsSaving(true);
      await createProductMaster({
        name: newData.name.trim(),
        divisionId: newData.divisionId,
        isMaintenanceType: newData.isMaintenanceType,
      });
      setNewData({ name: '', divisionId: null, isMaintenanceType: false });
      setIsAdding(false);
      await loadData();
    } catch (err) {
      setError('제품 추가에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: ProductMaster) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      divisionId: product.divisionId,
      isMaintenanceType: product.isMaintenanceType,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return;
    try {
      setIsSaving(true);
      await updateProductMaster(editingId, {
        name: editData.name.trim(),
        divisionId: editData.divisionId,
        isMaintenanceType: editData.isMaintenanceType,
      });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError('제품 수정에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', divisionId: null, isMaintenanceType: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteProductMaster(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError('제품 삭제에 실패했습니다.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

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
          {/* 필터 & 추가 버튼 */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="all">모든 부문</option>
                <option value="">미배정</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
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

          {/* 추가 폼 */}
          {isAdding && (
            <div className="p-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newData.name}
                  onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                  placeholder="제품명 입력"
                  className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  autoFocus
                />
                <select
                  value={newData.divisionId || ''}
                  onChange={(e) =>
                    setNewData({ ...newData, divisionId: e.target.value || null })
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">부문 선택</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newData.isMaintenanceType}
                    onChange={(e) =>
                      setNewData({ ...newData, isMaintenanceType: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Wrench className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">유지보수</span>
                </label>
                <button
                  onClick={handleAdd}
                  disabled={!newData.name.trim() || isSaving}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewData({ name: '', divisionId: null, isMaintenanceType: false });
                  }}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 제품 목록 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">제품명</th>
                  <th className="px-4 py-3 text-left font-medium">부문</th>
                  <th className="px-4 py-3 text-center font-medium">유형</th>
                  <th className="px-4 py-3 text-center font-medium">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product, idx) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {editingId === product.id ? (
                      <>
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            autoFocus
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editData.divisionId || ''}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                divisionId: e.target.value || null,
                              })
                            }
                            className="px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          >
                            <option value="">미배정</option>
                            {divisions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.isMaintenanceType}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  isMaintenanceType: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs text-slate-500">유지보수</span>
                          </label>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editData.name.trim() || isSaving}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                              product.divisionId
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            {getDivisionName(product.divisionId)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.isMaintenanceType ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                              <Wrench className="w-3 h-3" />
                              유지보수
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">일반</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(product)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {products.length === 0
                        ? '등록된 제품이 없습니다.'
                        : '필터 조건에 맞는 제품이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">제품 삭제</h3>
            <p className="text-slate-600 mb-4">
              <span className="font-semibold text-slate-800">{deleteTarget.name}</span>{' '}
              제품을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
