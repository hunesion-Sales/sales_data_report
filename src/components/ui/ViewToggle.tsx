
import { DollarSign, TrendingUp } from 'lucide-react';

interface ViewToggleProps {
    viewMode: 'sales' | 'profit';
    onChange: (mode: 'sales' | 'profit') => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
    return (
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
                onClick={() => onChange('sales')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'sales'
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
            >
                <DollarSign className="w-4 h-4" />
                매출액 보기
            </button>
            <button
                onClick={() => onChange('profit')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'profit'
                        ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
            >
                <TrendingUp className="w-4 h-4" />
                매출이익 보기
            </button>
        </div>
    );
}
