/**
 * 스냅샷 조회 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
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
} from '@/types';

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
