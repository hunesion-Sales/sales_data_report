/**
 * 화폐 단위 포맷팅 유틸리티
 */

/**
 * 백만원 단위로 변환 및 포맷팅 (소수점 2자리 고정)
 * 예: 12345678 -> "12.35"
 */
export const formatMillionWon = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '-';
    return (value / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * 차트 축/툴팁용 백만원 단위 포맷팅 (0도 숫자로 표시)
 * 예: 0 -> "0.00", 12345678 -> "12.35"
 */
export const formatMillionWonChart = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0.00';
    return (value / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * 전체 금액 포맷팅 (천단위 콤마)
 * 예: 12345678 -> "12,345,678"
 */
export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    return Math.round(value).toLocaleString();
};
