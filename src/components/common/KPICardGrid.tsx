import type { ViewMode } from '@/hooks/useViewMode';

interface KPICardData {
    label: string;
    value: string;
    subtitle?: string;
    tooltip?: string;
    color: 'indigo' | 'emerald' | 'violet';
    highlightWhen?: ViewMode;
}

interface KPICardGridProps {
    cards: KPICardData[];
    viewMode?: ViewMode;
    columns?: 3 | 4;
}

const COLOR_MAP = {
    indigo: {
        active: 'border-indigo-200 ring-1 ring-indigo-100',
        text: 'text-slate-900',
    },
    emerald: {
        active: 'border-emerald-200 ring-1 ring-emerald-100',
        text: 'text-emerald-600',
    },
    violet: {
        active: 'border-violet-200 ring-1 ring-violet-100',
        text: 'text-indigo-600',
    },
} as const;

export default function KPICardGrid({ cards, viewMode, columns = 3 }: KPICardGridProps) {
    const gridCols = columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

    return (
        <div className={`grid grid-cols-1 ${gridCols} gap-4 print-avoid-break`}>
            {cards.map((card, i) => {
                const isHighlighted = viewMode && card.highlightWhen === viewMode;
                const colorConfig = COLOR_MAP[card.color];
                const borderClass = isHighlighted
                    ? colorConfig.active
                    : 'border-slate-200';

                return (
                    <div
                        key={i}
                        className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${borderClass}`}
                        title={card.tooltip}
                    >
                        <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                        <p className={`text-2xl font-bold ${colorConfig.text}`}>
                            {card.value}
                        </p>
                        {card.subtitle && (
                            <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
