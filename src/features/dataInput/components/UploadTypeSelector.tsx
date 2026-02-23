import React from 'react';
import { Package, Building2 } from 'lucide-react';

interface UploadTypeSelectorProps {
  uploadType: 'product' | 'division';
  onChangeType: (type: 'product' | 'division') => void;
}

export default function UploadTypeSelector({ uploadType, onChangeType }: UploadTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onChangeType('product')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'product'
          ? 'bg-purple-600 text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
      >
        <Package className="w-4 h-4" />
        제품별 데이터
      </button>
      <button
        onClick={() => onChangeType('division')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'division'
          ? 'bg-purple-600 text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
      >
        <Building2 className="w-4 h-4" />
        부문별 데이터
      </button>
    </div>
  );
}
