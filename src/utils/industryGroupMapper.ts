import type { IndustryGroup } from '@/types';

/**
 * 산업군 데이터 아이템 타입
 */
export interface IndustryGroupDataItem {
  industryGroupName: string;
  months: Record<string, { sales: number; cost: number }>;
}

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

/**
 * 수주잔액 산업군별 데이터를 설정된 산업군 기준으로 재분류
 * - "_MA"로 끝나는 고객구분 → "유지보수" 산업군
 * - 산업군명과 정확히 일치 → 해당 산업군
 * - 키워드 매칭 → 해당 산업군
 * - 미매칭 → "기타"로 분류
 */
export function remapBacklogByIndustryGroup(
  backlogMap: Record<string, { sales: number; cost: number }>,
  groups: { name: string; keywords: string[] }[],
): Record<string, { sales: number; cost: number }> {
  const result: Record<string, { sales: number; cost: number }> = {};

  for (const [rawName, data] of Object.entries(backlogMap)) {
    let targetName: string;

    // 1. "_MA"로 끝나는 고객구분은 유지보수 산업군으로 분류
    if (rawName.trim().endsWith('_MA')) {
      targetName = '유지보수';
    }
    // 2. 산업군명과 정확히 일치
    else if (groups.find(g => g.name === rawName)) {
      targetName = rawName;
    }
    // 3. 키워드 매칭
    else {
      const matched = groups.find(g =>
        g.keywords.some(kw =>
          kw === rawName ||
          rawName.includes(kw) ||
          kw.includes(rawName)
        )
      );
      targetName = matched?.name ?? '기타';
    }

    if (!result[targetName]) {
      result[targetName] = { sales: 0, cost: 0 };
    }
    result[targetName].sales += data.sales;
    result[targetName].cost += data.cost;
  }

  return result;
}

/**
 * 저장된 데이터를 설정된 산업군 기준으로 재분류
 * - "_MA"로 끝나는 고객구분 → "유지보수" 산업군 (2025년 데이터 호환)
 * - 산업군명과 정확히 일치 → 해당 산업군
 * - 키워드 매칭 → 해당 산업군
 * - 미매칭 → "기타"로 분류
 */
export function remapIndustryGroupData(
  dataItems: IndustryGroupDataItem[],
  groups: { name: string; keywords: string[] }[],
): IndustryGroupDataItem[] {
  const groupMap = new Map<string, Record<string, { sales: number; cost: number }>>();

  for (const item of dataItems) {
    let targetName: string;

    // 1. "_MA"로 끝나는 고객구분은 유지보수 산업군으로 분류 (2025년 데이터 호환)
    if (item.industryGroupName.trim().endsWith('_MA')) {
      targetName = '유지보수';
    }
    // 2. 산업군명과 정확히 일치
    else if (groups.find(g => g.name === item.industryGroupName)) {
      targetName = item.industryGroupName;
    }
    // 3. 키워드 매칭
    else {
      const matched = groups.find(g =>
        g.keywords.some(kw =>
          kw === item.industryGroupName ||
          item.industryGroupName.includes(kw) ||
          kw.includes(item.industryGroupName)
        )
      );
      targetName = matched?.name ?? '기타';
    }

    const existing = groupMap.get(targetName) || {};
    for (const [monthKey, data] of Object.entries(item.months)) {
      if (existing[monthKey]) {
        existing[monthKey] = {
          sales: existing[monthKey].sales + data.sales,
          cost: existing[monthKey].cost + data.cost,
        };
      } else {
        existing[monthKey] = { ...data };
      }
    }
    groupMap.set(targetName, existing);
  }

  return Array.from(groupMap.entries()).map(([name, months]) => ({
    industryGroupName: name,
    months,
  }));
}
