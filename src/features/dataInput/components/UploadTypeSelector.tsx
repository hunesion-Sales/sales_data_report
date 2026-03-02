import React from 'react';
import { BarChart3, ClipboardList } from 'lucide-react';

export type UploadType = 'performance' | 'backlog';

interface UploadTypeSelectorProps {
  uploadType: UploadType;
  onChangeType: (type: UploadType) => void;
}

export default function UploadTypeSelector({ uploadType, onChangeType }: UploadTypeSelectorProps) {
  const buttons: { type: UploadType; label: string; icon: React.ElementType; description: string }[] = [
    { type: 'performance', label: '실적 데이터', icon: BarChart3, description: '제품별/부문별/산업군별 자동 감지' },
    { type: 'backlog', label: '수주잔액', icon: ClipboardList, description: '제품별/부문별/산업군별 자동 감지' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {buttons.map(({ type, label, icon: Icon, description }) => (
        <button
          key={type}
          onClick={() => onChangeType(type)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === type
            ? 'bg-purple-600 text-white shadow-sm'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <Icon className="w-4 h-4" />
          <div className="text-left">
            <div>{label}</div>
            <div className={`text-xs font-normal ${uploadType === type ? 'text-purple-200' : 'text-gray-400'}`}>
              {description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
