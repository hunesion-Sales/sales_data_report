import { Pencil, Trash2, Save, X, Loader2, Wrench } from 'lucide-react';
import type { ProductMaster } from '@/types';

interface ProductTableProps {
  filteredProducts: ProductMaster[];
  totalCount: number;
  editingId: string | null;
  editData: { name: string; isMaintenanceType: boolean };
  setEditData: (data: { name: string; isMaintenanceType: boolean }) => void;
  isSaving: boolean;
  onEdit: (product: ProductMaster) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (product: ProductMaster) => void;
}

export default function ProductTable({
  filteredProducts,
  totalCount,
  editingId,
  editData,
  setEditData,
  isSaving,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">제품명</th>
            <th className="px-4 py-3 text-center font-medium">유형</th>
            <th className="px-4 py-3 text-center font-medium">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredProducts.map((product, idx) => (
            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
              {editingId === product.id ? (
                <>
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.isMaintenanceType}
                        onChange={(e) => setEditData({ ...editData, isMaintenanceType: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-500">유지보수</span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={onSaveEdit}
                        disabled={!editData.name.trim() || isSaving}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={onCancelEdit}
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
                  <td className="px-4 py-3 font-medium text-slate-700">{product.name}</td>
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
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
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
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                {totalCount === 0
                  ? '등록된 제품이 없습니다.'
                  : '필터 조건에 맞는 제품이 없습니다.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
