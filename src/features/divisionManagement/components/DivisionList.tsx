import { Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import type { Division } from '@/types';

interface DivisionListProps {
  divisions: Division[];
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  isSaving: boolean;
  onEdit: (division: Division) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (division: Division) => void;
}

export default function DivisionList({
  divisions,
  editingId,
  editName,
  setEditName,
  isSaving,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: DivisionListProps) {
  return (
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
                onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
              />
              <button
                onClick={onSaveEdit}
                disabled={!editName.trim() || isSaving}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button
                onClick={onCancelEdit}
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
                  onClick={() => onEdit(division)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(division)}
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
  );
}
