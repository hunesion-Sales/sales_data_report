/**
 * 데이터 해시 관련 유틸리티 함수
 * Web Crypto API를 사용하여 SHA-256 해시 생성
 */

import type { ProductData, MonthDataHash } from '@/types';

/**
 * 문자열을 SHA-256 해시로 변환
 * @param data 해시할 문자열
 * @returns 16진수 해시 문자열
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 제품 데이터 배열에서 특정 월의 데이터를 정규화된 문자열로 변환
 * 정렬 순서를 보장하여 동일 데이터는 동일 문자열 생성
 * @param products 제품 데이터 배열
 * @param monthKey 월 키 (예: "2026-01")
 * @returns 정규화된 문자열
 */
export function normalizeMonthData(products: ProductData[], monthKey: string): string {
  // 제품명 기준 정렬
  const sortedProducts = [...products].sort((a, b) => a.product.localeCompare(b.product));

  // 해당 월 데이터만 추출하여 문자열화
  const monthDataStrings = sortedProducts
    .map(product => {
      const monthData = product.months[monthKey];
      if (!monthData) return null;
      return `${product.product}:${monthData.sales}:${monthData.cost}`;
    })
    .filter(Boolean);

  return monthDataStrings.join('|');
}

/**
 * 특정 월의 전체 데이터 통계 계산
 * @param products 제품 데이터 배열
 * @param monthKey 월 키
 * @returns { productCount, totalSales, totalCost }
 */
export function calculateMonthStats(
  products: ProductData[],
  monthKey: string
): { productCount: number; totalSales: number; totalCost: number } {
  let productCount = 0;
  let totalSales = 0;
  let totalCost = 0;

  for (const product of products) {
    const monthData = product.months[monthKey];
    if (monthData) {
      productCount++;
      totalSales += monthData.sales;
      totalCost += monthData.cost;
    }
  }

  return { productCount, totalSales, totalCost };
}

/**
 * 특정 월의 데이터 해시 생성
 * @param products 제품 데이터 배열
 * @param monthKey 월 키
 * @returns MonthDataHash 객체
 */
export async function generateMonthHash(
  products: ProductData[],
  monthKey: string
): Promise<MonthDataHash> {
  const normalizedData = normalizeMonthData(products, monthKey);
  const hash = await generateHash(normalizedData);
  const stats = calculateMonthStats(products, monthKey);

  return {
    monthKey,
    hash,
    ...stats,
  };
}

/**
 * 여러 월의 데이터 해시를 한 번에 생성
 * @param products 제품 데이터 배열
 * @param months 월 키 배열
 * @returns monthKey -> hash 맵
 */
export async function generateMonthHashes(
  products: ProductData[],
  months: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const monthKey of months) {
    const normalizedData = normalizeMonthData(products, monthKey);
    result[monthKey] = await generateHash(normalizedData);
  }

  return result;
}

/**
 * 두 해시가 동일한지 비교
 * @param hash1 첫 번째 해시
 * @param hash2 두 번째 해시
 * @returns 동일 여부
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase() === hash2.toLowerCase();
}

/**
 * 두 제품 데이터 배열의 특정 월 데이터가 동일한지 비교
 * @param products1 첫 번째 제품 배열
 * @param products2 두 번째 제품 배열
 * @param monthKey 비교할 월 키
 * @returns 동일 여부
 */
export async function isMonthDataEqual(
  products1: ProductData[],
  products2: ProductData[],
  monthKey: string
): Promise<boolean> {
  const hash1 = await generateMonthHash(products1, monthKey);
  const hash2 = await generateMonthHash(products2, monthKey);
  return compareHashes(hash1.hash, hash2.hash);
}
