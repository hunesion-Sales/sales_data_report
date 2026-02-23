import { Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  itemName: string;
  itemLabel?: string;
  isDeleting: boolean;
  warningContent?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  itemName,
  itemLabel = '',
  isDeleting,
  warningContent,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{itemLabel} 삭제</h3>
        <p className="text-slate-600 mb-4">
          <span className="font-semibold text-slate-800">{itemName}</span>{' '}
          {itemLabel ? `${itemLabel}을(를)` : '항목을'} 삭제하시겠습니까?
        </p>
        {warningContent}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
