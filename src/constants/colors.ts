/** Chart color palette for product-level charts (12 colors, blue-indigo series) */
export const CHART_COLORS = [
    '#3b82f6', // blue-500 (Primary)
    '#6366f1', // indigo-500 (Secondary)
    '#10b981', // emerald-500 (Success/Profit)
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#1d4ed8', // blue-700
    '#4338ca', // indigo-700
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#7c3aed', // violet-600
] as const;

/** Chart color palette for division-level charts (10 colors, blue-sky series) */
export const DIVISION_COLORS = [
    '#2563eb', // blue-600
    '#0ea5e9', // sky-500
    '#6366f1', // indigo-500
    '#06b6d4', // cyan-500
    '#1d4ed8', // blue-700
    '#0284c7', // sky-600
    '#4f46e5', // indigo-600
    '#0891b2', // cyan-600
    '#60a5fa', // blue-400
    '#818cf8', // indigo-400
] as const;

/** Chart color palette for industry group charts (12 colors, green-teal series) */
export const INDUSTRY_GROUP_COLORS = [
    '#059669', // emerald-600
    '#0d9488', // teal-600
    '#0891b2', // cyan-600
    '#2563eb', // blue-600
    '#7c3aed', // violet-600
    '#c026d3', // fuchsia-600
    '#e11d48', // rose-600
    '#ea580c', // orange-600
    '#ca8a04', // yellow-600
    '#16a34a', // green-600
    '#0e7490', // cyan-700
    '#4f46e5', // indigo-600
] as const;

/** Month background color palette for table headers (12 months) */
export const MONTH_COLORS = [
    { bg: 'bg-blue-50/50', bgLight: 'bg-blue-50/30', text: 'text-blue-700' },
    { bg: 'bg-indigo-50/50', bgLight: 'bg-indigo-50/30', text: 'text-indigo-700' },
    { bg: 'bg-violet-50/50', bgLight: 'bg-violet-50/30', text: 'text-violet-700' },
    { bg: 'bg-purple-50/50', bgLight: 'bg-purple-50/30', text: 'text-purple-700' },
    { bg: 'bg-fuchsia-50/50', bgLight: 'bg-fuchsia-50/30', text: 'text-fuchsia-700' },
    { bg: 'bg-pink-50/50', bgLight: 'bg-pink-50/30', text: 'text-pink-700' },
    { bg: 'bg-rose-50/50', bgLight: 'bg-rose-50/30', text: 'text-rose-700' },
    { bg: 'bg-orange-50/50', bgLight: 'bg-orange-50/30', text: 'text-orange-700' },
    { bg: 'bg-amber-50/50', bgLight: 'bg-amber-50/30', text: 'text-amber-700' },
    { bg: 'bg-cyan-50/50', bgLight: 'bg-cyan-50/30', text: 'text-cyan-700' },
    { bg: 'bg-teal-50/50', bgLight: 'bg-teal-50/30', text: 'text-teal-700' },
    { bg: 'bg-emerald-50/50', bgLight: 'bg-emerald-50/30', text: 'text-emerald-700' },
] as const;
