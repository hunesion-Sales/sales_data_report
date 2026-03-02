/** 산업군 마스터 (Firestore industry_groups/{groupId}) */
export interface IndustryGroup {
  id: string;
  name: string;
  keywords: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 산업군 생성/수정용 입력 타입 */
export interface IndustryGroupInput {
  name: string;
  keywords: string[];
  sortOrder?: number;
}

/** 산업군별 실적 데이터 (Firestore reports/{year}/industry_group_data/{docId}) */
export interface IndustryGroupData {
  industryGroupId: string;
  industryGroupName: string;
  months: Record<string, { sales: number; cost: number }>;
  updatedAt: Date;
}
