import type { IndustryGroup } from '@/types';

/**
 * 키워드 기반으로 산업군을 매칭
 * 엑셀 데이터의 "항목"(고객구분) 값을 받아서 해당하는 산업군 ID를 반환
 *
 * @param keyword 엑셀 데이터의 항목 값 (예: "공공기관", "1금융", "지자체")
 * @param industryGroups 산업군 마스터 목록
 * @returns 매칭된 산업군 ID, 매칭 실패 시 "기타" 산업군 ID
 */
export function matchIndustryGroup(
  keyword: string,
  industryGroups: IndustryGroup[]
): string | null {
  if (!keyword || keyword.trim() === '') return null;

  const normalizedKeyword = keyword.trim();

  // 정확 매칭 우선
  for (const group of industryGroups) {
    if (group.keywords.some(kw => kw === normalizedKeyword)) {
      return group.id;
    }
  }

  // 부분 매칭 (키워드가 항목에 포함)
  for (const group of industryGroups) {
    if (group.keywords.some(kw => normalizedKeyword.includes(kw) || kw.includes(normalizedKeyword))) {
      return group.id;
    }
  }

  // "기타" 산업군 찾기
  const etcGroup = industryGroups.find(g => g.name === '기타');
  return etcGroup?.id ?? null;
}

/**
 * 제품명이 유지보수 제품인지 확인
 * _MA로 끝나는 제품명은 유지보수
 */
export function isMaintenanceProduct(productName: string): boolean {
  return productName.trim().endsWith('_MA');
}

/**
 * 산업군별 엑셀에서 유지보수코드 섹션인지 판별
 * 유지보수코드 섹션의 모든 데이터는 "유지보수" 산업군으로 합산
 */
export function getIndustryGroupForRow(
  keyword: string,
  isMaintenanceSection: boolean,
  industryGroups: IndustryGroup[]
): string | null {
  // 유지보수코드 섹션의 데이터는 키워드 무관, 모두 "유지보수" 산업군
  if (isMaintenanceSection) {
    const maintenanceGroup = industryGroups.find(g => g.name === '유지보수');
    return maintenanceGroup?.id ?? null;
  }

  // 매출코드 섹션은 키워드로 매칭
  return matchIndustryGroup(keyword, industryGroups);
}

/**
 * 산업군 분류 기본 시드 데이터
 */
export const DEFAULT_INDUSTRY_GROUPS: Array<{ name: string; keywords: string[]; sortOrder: number }> = [
  { name: '공공', keywords: ['공공기관', '공기업', '부,청'], sortOrder: 1 },
  { name: '지자체', keywords: ['지자체'], sortOrder: 2 },
  { name: '국방', keywords: ['국방'], sortOrder: 3 },
  { name: '금융', keywords: ['금융(공공)', '금융(기업)', '1금융', '2금융'], sortOrder: 4 },
  { name: '기업', keywords: ['기업'], sortOrder: 5 },
  { name: '한전', keywords: ['본사', '발전자회사', '전력그룹사'], sortOrder: 6 },
  { name: '방산', keywords: ['방산'], sortOrder: 7 },
  { name: '교육/병원', keywords: ['교육', '병원'], sortOrder: 8 },
  { name: '유지보수', keywords: ['*_MA'], sortOrder: 9 },
  { name: '기타', keywords: ['변경필요'], sortOrder: 10 },
];
