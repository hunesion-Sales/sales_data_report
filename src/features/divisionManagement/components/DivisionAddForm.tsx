import { Save, X, Loader2 } from 'lucide-react';

interface DivisionAddFormProps {
  newName: string;
  setNewName: (name: string) => void;
  isSaving: boolean;
  onAdd: () => void;
  onCancel: () => void;
}

export default function DivisionAddForm({ newName, setNewName, isSaving, onAdd, onCancel }: DivisionAddFormProps) {
  return (
    <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex items-center gap-3">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="새 부문명 입력"
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
      />
      <button
        onClick={onAdd}
        disabled={!newName.trim() || isSaving}
        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        저장
      </button>
      <button
        onClick={onCancel}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
