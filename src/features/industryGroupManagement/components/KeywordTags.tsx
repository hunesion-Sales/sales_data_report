import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface KeywordTagsProps {
  keywords: string[];
  onChange?: (keywords: string[]) => void;
  editable?: boolean;
}

/**
 * 산업군 키워드 태그 표시/편집 컴포넌트
 */
export default function KeywordTags({ keywords, onChange, editable = false }: KeywordTagsProps) {
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !onChange) return;
    if (keywords.includes(newKeyword.trim())) {
      setNewKeyword('');
      return;
    }
    onChange([...keywords, newKeyword.trim()]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    if (!onChange) return;
    onChange(keywords.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {keywords.map((keyword, index) => (
        <span
          key={index}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
            editable
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {keyword}
          {editable && (
            <button
              onClick={() => handleRemoveKeyword(index)}
              className="text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}

      {editable && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            placeholder="키워드 추가"
            className="w-24 px-2 py-0.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
            className="p-0.5 text-indigo-500 hover:text-indigo-700 disabled:text-slate-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
