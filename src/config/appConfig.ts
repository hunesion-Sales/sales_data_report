/**
 * 애플리케이션 전역 설정
 */

// 앱 정보
export const APP_NAME = 'Hunesion Solution';
export const APP_DESCRIPTION = '사업본부 매출 현황';

// 페이지네이션
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 캐시 설정 (밀리초)
export const CACHE_STALE_TIME = 5 * 60 * 1000; // 5분
export const CACHE_CACHE_TIME = 10 * 60 * 1000; // 10분

// 타임아웃 설정 (밀리초)
export const API_TIMEOUT = 30000; // 30초
export const TOAST_DURATION = 3000; // 3초

// 파일 업로드
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.xlsx', '.xls'];

// 연도 설정
export const CURRENT_YEAR = new Date().getFullYear();
export const VALID_YEAR_RANGE = { min: 2020, max: 2030 };

// 숫자 포맷
export const CURRENCY_LOCALE = 'ko-KR';

// 날짜 포맷
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

// 테이블 단위 (백만원)
export const TABLE_UNIT_DIVISOR = 1000000;
