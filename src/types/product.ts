import type { ProductData } from './core';

export type ProductType = 'General' | 'Cloud' | 'Maintenance';

/** 제품 마스터 (Firestore products_master/{productId}) */
export interface ProductMaster {
  id: string;
  name: string;
  divisionId?: string | null; // @deprecated
  type: ProductType;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 제품 마스터 생성/수정용 입력 타입 */
export interface ProductMasterInput {
  name: string;
  divisionId?: string | null; // @deprecated
  type: ProductType;
  sortOrder?: number;
}

/** 제품 데이터 확장 (divisionId, productMasterId 추가) */
export interface ProductDataExtended extends ProductData {
  divisionId?: string | null;
  productMasterId?: string | null;
}
