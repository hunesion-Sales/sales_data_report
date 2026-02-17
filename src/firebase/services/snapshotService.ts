/**
 * 주차별 스냅샷 관리 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type {
  ProductData,
  MonthData,
  WeekKey,
  WeeklySnapshot,
  MonthConflict,
  UploadAnalysisResult,
  ConflictResolution,
  ConflictResolutionSaveResult,
} from '@/types';
import { getWeekKey } from '@/utils/weekUtils';
import { generateMonthHashes, generateMonthHash, compareHashes, calculateMonthStats } from '@/utils/hashUtils';
import { getMonthFullLabel } from '@/types';

/**
 * 스냅샷 메타데이터 조회
 */
export async function getSnapshot(
  reportId: string,
  weekKey: WeekKey
): Promise<WeeklySnapshot | null> {
  const ref = doc(db, 'reports', reportId, 'snapshots', weekKey);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    weekKey: data.weekKey,
    uploadedAt: (data.uploadedAt as Timestamp)?.toDate() ?? new Date(),
    uploadedBy: data.uploadedBy ?? 'anonymous',
    fileName: data.fileName ?? '',
    monthsIncluded: data.monthsIncluded ?? [],
    monthLabels: data.monthLabels ?? {},
    productCount: data.productCount ?? 0,
    monthHashes: data.monthHashes ?? {},
  };
}

/**
 * 모든 스냅샷 메타데이터 조회 (최신순)
 */
export async function getSnapshots(reportId: string): Promise<WeeklySnapshot[]> {
  const ref = collection(db, 'reports', reportId, 'snapshots');
  const q = query(ref, orderBy('uploadedAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data();
    return {
      weekKey: d.id,
      uploadedAt: (data.uploadedAt as Timestamp)?.toDate() ?? new Date(),
      uploadedBy: data.uploadedBy ?? 'anonymous',
      fileName: data.fileName ?? '',
      monthsIncluded: data.monthsIncluded ?? [],
      monthLabels: data.monthLabels ?? {},
      productCount: data.productCount ?? 0,
      monthHashes: data.monthHashes ?? {},
    };
  });
}

/**
 * 특정 스냅샷의 제품 데이터 조회
 */
export async function getSnapshotProducts(
  reportId: string,
  weekKey: WeekKey
): Promise<ProductData[]> {
  const ref = collection(db, 'reports', reportId, 'snapshots', weekKey, 'products');
  const q = query(ref, orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      product: data.product as string,
      months: data.months as Record<string, MonthData>,
    };
  });
}

/**
 * 최신 스냅샷의 월별 해시 조회
 */
export async function getLatestMonthHashes(
  reportId: string
): Promise<{ weekKey: WeekKey; hashes: Record<string, string>; snapshot: WeeklySnapshot } | null> {
  const snapshots = await getSnapshots(reportId);
  if (snapshots.length === 0) return null;

  const latestSnapshot = snapshots[0];
  return {
    weekKey: latestSnapshot.weekKey,
    hashes: latestSnapshot.monthHashes,
    snapshot: latestSnapshot,
  };
}

/**
 * 업로드 데이터 분석 (충돌 감지)
 */
export async function analyzeUpload(
  reportId: string,
  newProducts: ProductData[],
  newMonths: string[],
  newMonthLabels: Record<string, string>
): Promise<UploadAnalysisResult> {
  const currentWeekKey = getWeekKey();

  // 새 데이터의 월별 해시 생성
  const newMonthHashes = await generateMonthHashes(newProducts, newMonths);

  // 최신 스냅샷의 해시 조회
  const latestData = await getLatestMonthHashes(reportId);

  const result: UploadAnalysisResult = {
    weekKey: currentWeekKey,
    newMonths: [],
    unchangedMonths: [],
    conflicts: [],
    products: newProducts,
    monthLabels: newMonthLabels,
  };

  if (!latestData) {
    // 첫 업로드: 모든 월이 신규
    result.newMonths = [...newMonths];
    return result;
  }

  const { hashes: existingHashes, snapshot: latestSnapshot } = latestData;

  // 각 월별로 분석
  for (const monthKey of newMonths) {
    const newHash = newMonthHashes[monthKey];
    const existingHash = existingHashes[monthKey];

    if (!existingHash) {
      // 기존에 없던 월: 신규
      result.newMonths.push(monthKey);
    } else if (compareHashes(newHash, existingHash)) {
      // 해시 동일: 변경 없음
      result.unchangedMonths.push(monthKey);
    } else {
      // 해시 다름: 충돌
      const newStats = calculateMonthStats(newProducts, monthKey);

      // 기존 스냅샷의 제품 데이터를 조회하여 통계 계산
      const existingProducts = await getSnapshotProducts(reportId, latestSnapshot.weekKey);
      const existingStats = calculateMonthStats(existingProducts, monthKey);

      const conflict: MonthConflict = {
        monthKey,
        monthLabel: newMonthLabels[monthKey] || getMonthFullLabel(monthKey),
        existingData: {
          weekKey: latestSnapshot.weekKey,
          uploadedAt: latestSnapshot.uploadedAt,
          totalSales: existingStats.totalSales,
          totalCost: existingStats.totalCost,
          hash: existingHash,
        },
        newData: {
          totalSales: newStats.totalSales,
          totalCost: newStats.totalCost,
          hash: newHash,
        },
      };
      result.conflicts.push(conflict);
    }
  }

  return result;
}

/**
 * 주차별 스냅샷 저장
 */
export async function saveWeeklySnapshot(
  reportId: string,
  weekKey: WeekKey,
  products: ProductData[],
  months: string[],
  monthLabels: Record<string, string>,
  fileName: string,
  userId: string
): Promise<void> {
  const snapshotRef = doc(db, 'reports', reportId, 'snapshots', weekKey);

  // 월별 해시 생성
  const monthHashes = await generateMonthHashes(products, months);

  // 스냅샷 메타데이터 저장
  await setDoc(snapshotRef, {
    weekKey,
    uploadedAt: serverTimestamp(),
    uploadedBy: userId,
    fileName,
    monthsIncluded: months,
    monthLabels,
    productCount: products.length,
    monthHashes,
  });

  // 스냅샷 제품 데이터 저장
  const productsColRef = collection(snapshotRef, 'products');

  // 기존 제품 데이터 삭제 (같은 주차에 재업로드 시)
  const existing = await getDocs(productsColRef);
  if (existing.size > 0) {
    const deleteBatch = writeBatch(db);
    existing.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();
  }

  // 새 제품 데이터 저장 (450건 단위 batch)
  const BATCH_LIMIT = 450;
  for (let i = 0; i < products.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const chunk = products.slice(i, i + BATCH_LIMIT);

    chunk.forEach((product, idx) => {
      const docRef = doc(productsColRef);
      batch.set(docRef, {
        product: product.product,
        months: product.months,
        sortOrder: i + idx,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

/**
 * 충돌 해결 후 데이터 저장
 */
export async function saveWithResolutions(
  reportId: string,
  analysisResult: UploadAnalysisResult,
  resolutions: ConflictResolution[],
  fileName: string,
  userId: string
): Promise<ConflictResolutionSaveResult> {
  const { weekKey, products, newMonths, unchangedMonths, conflicts, monthLabels } = analysisResult;

  // 충돌 해결 맵 생성
  const resolutionMap = new Map(resolutions.map(r => [r.monthKey, r.resolution]));

  // 최신 스냅샷의 기존 데이터 조회 (필요한 경우)
  let existingProducts: ProductData[] = [];
  const latestData = await getLatestMonthHashes(reportId);
  if (latestData) {
    existingProducts = await getSnapshotProducts(reportId, latestData.weekKey);
  }

  // 최종 제품 데이터 구성
  const finalProducts: ProductData[] = [];
  const finalMonths = new Set<string>();
  const skippedMonths: string[] = [...unchangedMonths];

  // 제품명 기준 맵 생성
  const productMap = new Map<string, ProductData>();

  // 기존 데이터를 먼저 추가
  for (const product of existingProducts) {
    productMap.set(product.product, { ...product });
  }

  // 신규 월 데이터 적용
  for (const monthKey of newMonths) {
    finalMonths.add(monthKey);
    for (const product of products) {
      const monthData = product.months[monthKey];
      if (monthData) {
        const existing = productMap.get(product.product);
        if (existing) {
          existing.months[monthKey] = monthData;
        } else {
          productMap.set(product.product, {
            ...product,
            months: { [monthKey]: monthData },
          });
        }
      }
    }
  }

  // 충돌 해결 적용
  for (const conflict of conflicts) {
    const resolution = resolutionMap.get(conflict.monthKey) || 'keep_existing';

    if (resolution === 'use_new') {
      // 신규 데이터 사용
      finalMonths.add(conflict.monthKey);
      for (const product of products) {
        const monthData = product.months[conflict.monthKey];
        if (monthData) {
          const existing = productMap.get(product.product);
          if (existing) {
            existing.months[conflict.monthKey] = monthData;
          } else {
            productMap.set(product.product, {
              ...product,
              months: { [conflict.monthKey]: monthData },
            });
          }
        }
      }
    } else {
      // 기존 데이터 유지 (이미 productMap에 있음)
      finalMonths.add(conflict.monthKey);
      skippedMonths.push(conflict.monthKey);
    }
  }

  // 변경 없는 월도 포함
  for (const monthKey of unchangedMonths) {
    finalMonths.add(monthKey);
  }

  // 최종 제품 배열 생성
  for (const product of productMap.values()) {
    finalProducts.push(product);
  }

  // 최종 월 목록 정렬
  const sortedMonths = Array.from(finalMonths).sort();

  // 스냅샷 저장
  await saveWeeklySnapshot(
    reportId,
    weekKey,
    finalProducts,
    sortedMonths,
    monthLabels,
    fileName,
    userId
  );

  // 활성 데이터 업데이트 (reports/{reportId}/products)
  const { saveProducts } = await import('./productService');
  await saveProducts(reportId, finalProducts);

  // 보고서 메타데이터 업데이트
  const { updateReportMonths } = await import('./reportService');
  await updateReportMonths(reportId, sortedMonths, monthLabels);

  // latestWeekKey 업데이트
  const reportRef = doc(db, 'reports', reportId);
  await setDoc(reportRef, { latestWeekKey: weekKey }, { merge: true });

  return {
    newCount: newMonths.length,
    updatedCount: conflicts.filter(c => resolutionMap.get(c.monthKey) === 'use_new').length,
    skippedMonths,
  };
}

/**
 * 스냅샷 데이터만 저장 (충돌 없이)
 */
export async function saveSnapshotOnly(
  reportId: string,
  products: ProductData[],
  months: string[],
  monthLabels: Record<string, string>,
  fileName: string,
  userId: string
): Promise<{ weekKey: WeekKey }> {
  const weekKey = getWeekKey();

  // 스냅샷 저장
  await saveWeeklySnapshot(reportId, weekKey, products, months, monthLabels, fileName, userId);

  // 활성 데이터 업데이트
  const { saveProducts } = await import('./productService');
  await saveProducts(reportId, products);

  // 보고서 메타데이터 업데이트
  const { updateReportMonths } = await import('./reportService');
  await updateReportMonths(reportId, months, monthLabels);

  // latestWeekKey 업데이트
  const reportRef = doc(db, 'reports', reportId);
  await setDoc(reportRef, { latestWeekKey: weekKey }, { merge: true });

  return { weekKey };
}
