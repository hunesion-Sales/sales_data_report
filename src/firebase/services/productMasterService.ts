import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import type { ProductMaster, ProductMasterInput } from '../../types';

const COLLECTION_NAME = 'products_master';

/**
 * Firestore 문서를 ProductMaster로 변환
 */
function docToProductMaster(id: string, data: Record<string, unknown>): ProductMaster {
  // Add fallback for legacy isMaintenanceType
  const legacyType = data.isMaintenanceType ? 'Maintenance' : 'General';
  return {
    id,
    name: data.name as string,
    // divisionId: (data.divisionId as string) || null, // Removed
    type: (data.type as any) || legacyType,
    productGroup: (data.productGroup as string) || undefined,
    sortOrder: data.sortOrder as number || 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

/**
 * 모든 제품 마스터 조회 (sortOrder 정렬)
 */
export async function getProductMasters(): Promise<ProductMaster[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToProductMaster(doc.id, doc.data()));
}

// getProductMastersByDivision removed as it is no longer used

/**
 * 단일 제품 마스터 조회
 */
export async function getProductMaster(productId: string): Promise<ProductMaster | null> {
  const docRef = doc(db, COLLECTION_NAME, productId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToProductMaster(docSnap.id, docSnap.data());
}

/**
 * 제품명으로 제품 마스터 조회
 */
export async function getProductMasterByName(name: string): Promise<ProductMaster | null> {
  const q = query(collection(db, COLLECTION_NAME), where('name', '==', name));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return docToProductMaster(doc.id, doc.data());
}

/**
 * 제품 마스터 생성
 */
export async function createProductMaster(input: ProductMasterInput): Promise<ProductMaster> {
  const docRef = doc(collection(db, COLLECTION_NAME));

  // sortOrder가 지정되지 않으면 마지막 순서로 설정
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const existing = await getProductMasters();
    sortOrder = existing.length > 0 ? Math.max(...existing.map(p => p.sortOrder)) + 1 : 0;
  }

  const data: Record<string, unknown> = {
    name: input.name,
    type: input.type,
    sortOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.productGroup) {
    data.productGroup = input.productGroup;
  }

  await setDoc(docRef, data);

  return {
    id: docRef.id,
    name: input.name,
    type: input.type,
    productGroup: input.productGroup,
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 제품 마스터 업데이트
 */
export async function updateProductMaster(
  productId: string,
  updates: Partial<ProductMasterInput>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, productId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 제품 마스터 삭제
 */
export async function deleteProductMaster(productId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, productId);
  await deleteDoc(docRef);
}

/**
 * 기존 제품 데이터에서 제품 마스터 자동 생성 (마이그레이션용)
 * - 제품명이 _MA로 끝나면 isMaintenanceType = true
 * - 중복 제품명은 생략
 */
export async function seedProductMastersFromProducts(productNames: string[]): Promise<number> {
  const existing = await getProductMasters();
  const existingNames = new Set(existing.map(p => p.name));

  const newProducts = productNames.filter(name => !existingNames.has(name));
  if (newProducts.length === 0) return 0;

  const batch = writeBatch(db);
  let sortOrder = existing.length > 0 ? Math.max(...existing.map(p => p.sortOrder)) + 1 : 0;

  for (const name of newProducts) {
    const docRef = doc(collection(db, COLLECTION_NAME));
    const isMaintenance = name.endsWith('_MA') || name.includes('_MA');
    const isCloud = name.includes('CLOUD') || name.includes('Cloud');
    const type = isMaintenance ? 'Maintenance' : (isCloud ? 'Cloud' : 'General');

    batch.set(docRef, {
      name,
      // divisionId: null, // Removed
      type,
      sortOrder: sortOrder++,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return newProducts.length;
}

/**
 * 제품 마스터 순서 일괄 업데이트
 */
export async function updateProductMasterOrders(
  orders: { id: string; sortOrder: number }[]
): Promise<void> {
  const batch = writeBatch(db);

  for (const { id, sortOrder } of orders) {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.update(docRef, {
      sortOrder,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * 초기 제품 마스터 목록 (순서 중요)
 */
export const INITIAL_PRODUCT_MASTERS = [
  'NGS',
  'CamPASS',
  'i-oneJTac',
  'i-oneNAC',
  'i-oneNet',
  'i-oneNet DD',
  'i-oneNet DX',
  'i-oneNet UC',
  'i-Spector',
  'KCDS-GUARD',
  'MoBiCa',
  'Multi Anti Virus',
  'OtoRAS',
  'Safe IP',
  'ViSiCa',
  '기타',
  'S/W',
  'H/W',
  'i_oneJTac_MA',
  'i-oneNAC_MA',
  'i-oneNet_MA',
  'i-oneNet DD_MA',
  'i-oneNet DX_MA',
  'TresDM_MA',
  'NGS_MA',
  'CamPASS_MA',
  'MoBiCa_MA',
  'ViSiCa_MA',
  'Safe IP_MA',
  'NGS CLOUD',
  'i-oneNet CLOUD',
  'i-oneJTac CLOUD',
  'H/W',
];

/**
 * 초기 제품 마스터 데이터 시딩
 * - 기존 데이터가 있으면 건너뜀 (이름 기준)
 * - 없으면 생성 (순서 보장)
 * - _MA 또는 MA 포함 시 유지보수 타입 자동 지정
 */
export async function seedInitialProductMasters(): Promise<{ created: number; skipped: number }> {
  const existing = await getProductMasters();
  const existingNames = new Set(existing.map(p => p.name));

  const batch = writeBatch(db);
  let createdCount = 0;
  let skippedCount = 0;

  INITIAL_PRODUCT_MASTERS.forEach((name, index) => {
    if (existingNames.has(name)) {
      skippedCount++;
      return;
    }

    const docRef = doc(collection(db, COLLECTION_NAME));
    const isMaintenance = name.endsWith('_MA') || name.includes('_MA'); // _MA로 끝나거나 포함되면 유지보수
    const isCloud = name.includes('CLOUD') || name.includes('Cloud');
    const type = isMaintenance ? 'Maintenance' : (isCloud ? 'Cloud' : 'General');

    batch.set(docRef, {
      name,
      // divisionId: null, // Removed
      type,
      sortOrder: index, // 리스트 순서대로 0, 1, 2...
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    createdCount++;
  });

  if (createdCount > 0) {
    await batch.commit();
  }

  return { created: createdCount, skipped: skippedCount };
}

/**
 * 기존 데이터를 신규 type 체계로 일괄 마이그레이션 확인/적용용 함수
 */
export async function updateAllProductTypes(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const batch = writeBatch(db);
  let updatedCount = 0;

  for (const d of snapshot.docs) {
    const data = d.data();
    const name = data.name as string;

    // 이미 type 필드가 들어있으면 스킵
    if (data.type) continue;

    const isMaintenance = name.endsWith('_MA') || name.includes('_MA');
    const isCloud = name.includes('CLOUD') || name.includes('Cloud');
    const type = isMaintenance ? 'Maintenance' : (isCloud ? 'Cloud' : 'General');

    batch.update(doc(db, COLLECTION_NAME, d.id), {
      type,
    });
    updatedCount++;
  }

  if (updatedCount > 0) {
    await batch.commit();
  }
  return updatedCount;
}

/**
 * 제품군 매핑 데이터
 * 제품명 → 제품군 매핑
 */
export const PRODUCT_GROUP_MAPPING: Record<string, string> = {
  'i-oneNet': 'i-oneNet',
  'i-oneNet UC': 'i-oneNet',
  'i-oneNet DX': 'i-oneNet DD/DX',
  'i-oneNet DD': 'i-oneNet DD/DX',
  'NGS': 'NGS',
  'i-oneNAC': 'i-oneNAC & Safe IP',
  'Safe IP': 'i-oneNAC & Safe IP',
  'i-oneJTac': 'i-oneJTac',
  'CamPASS': 'CamPASS',
  'i-Spector': 'i-Spector',
  'MoBiCa': 'MoBiCa',
  'ViSiCa': 'MoBiCa',
  'NGS CLOUD': 'Cloud (NGS, ION, Jtac)',
  'i-oneNet CLOUD': 'Cloud (NGS, ION, Jtac)',
  'i-oneJTac CLOUD': 'Cloud (NGS, ION, Jtac)',
  '기타': '기타',
  'Multi Anti Virus': '기타',
  'S/W': '기타',
  'KCDS-GUARD': '기타',
  'OtoRAS': '기타',
  'H/W': '기타',
  // 유지보수 제품 (_MA)
  'i-oneNet_MA': '유지보수',
  'i-oneNet DD_MA': '유지보수',
  'i-oneNet DX_MA': '유지보수',
  'i-oneNAC_MA': '유지보수',
  'i_oneJTac_MA': '유지보수',
  'NGS_MA': '유지보수',
  'CamPASS_MA': '유지보수',
  'MoBiCa_MA': '유지보수',
  'ViSiCa_MA': '유지보수',
  'Safe IP_MA': '유지보수',
  'TresDM_MA': '유지보수',
  'i-Spector_MA': '유지보수',
};

/**
 * 제품군 목록 (고유 값)
 */
export const PRODUCT_GROUPS = [
  'i-oneNet',
  'i-oneNet DD/DX',
  'NGS',
  'i-oneNAC & Safe IP',
  'i-oneJTac',
  'CamPASS',
  'i-Spector',
  'MoBiCa',
  'Cloud (NGS, ION, Jtac)',
  '기타',
  '유지보수',
] as const;

/**
 * 기존 products_master에 제품군(productGroup) 필드를 일괄 업데이트
 */
export async function batchUpdateProductGroups(): Promise<number> {
  const products = await getProductMasters();
  const batch = writeBatch(db);
  let updatedCount = 0;

  for (const product of products) {
    const productGroup = PRODUCT_GROUP_MAPPING[product.name];
    if (productGroup && productGroup !== product.productGroup) {
      batch.update(doc(db, COLLECTION_NAME, product.id), {
        productGroup,
        updatedAt: serverTimestamp(),
      });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
  }
  return updatedCount;
}
