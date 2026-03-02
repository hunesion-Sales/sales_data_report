import { Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import type { IndustryGroup } from '@/types';
import KeywordTags from './KeywordTags';

interface IndustryGroupListProps {
  groups: IndustryGroup[];
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  editKeywords: string[];
  setEditKeywords: (keywords: string[]) => void;
  isSaving: boolean;
  onEdit: (group: IndustryGroup) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (group: IndustryGroup) => void;
}

export default function IndustryGroupList({
  groups,
  editingId,
  editName,
  setEditName,
  editKeywords,
  setEditKeywords,
  isSaving,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: IndustryGroupListProps) {
  return (
    <div className="divide-y divide-slate-100">
      {groups.map((group) => (
        <div
          key={group.id}
          className="p-4 hover:bg-slate-50/50 transition-colors"
        >
          {editingId === group.id ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="산업군명"
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
              <KeywordTags
                keywords={editKeywords}
                onChange={setEditKeywords}
                editable
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-semibold text-sm shrink-0">
                  {group.sortOrder}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-slate-700">{group.name}</span>
                  <div className="mt-1">
                    <KeywordTags keywords={group.keywords} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => onEdit(group)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="수정"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(group)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {groups.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          등록된 산업군이 없습니다.
        </div>
      )}
    </div>
  );
}
