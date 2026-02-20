import { useState, useCallback } from 'react';

interface Notification {
    message: string;
    type: 'success' | 'error';
}

export function useNotification(duration = 3000) {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    }, [duration]);

    return { notification, showNotification };
}
