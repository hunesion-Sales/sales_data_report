import { useState } from 'react';

export type ViewMode = 'sales' | 'profit';

export function useViewMode(defaultMode: ViewMode = 'sales') {
    const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
    const isSalesMode = viewMode === 'sales';
    return { viewMode, setViewMode, isSalesMode, isProfitMode: !isSalesMode };
}
