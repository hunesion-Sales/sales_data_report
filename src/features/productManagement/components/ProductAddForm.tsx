import { Save, X, Loader2, Wrench } from 'lucide-react';

interface ProductAddFormProps {
  newData: { name: string; isMaintenanceType: boolean };
  setNewData: (data: { name: string; isMaintenanceType: boolean }) => void;
  isSaving: boolean;
  onAdd: () => void;
  onCancel: () => void;
}

export default function ProductAddForm({ newData, setNewData, isSaving, onAdd, onCancel }: ProductAddFormProps) {
  return (
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
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={newData.isMaintenanceType}
            onChange={(e) => setNewData({ ...newData, isMaintenanceType: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <Wrench className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">유지보수</span>
        </label>
        <button
          onClick={onAdd}
          disabled={!newData.name.trim() || isSaving}
          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
