import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';

export interface ReportDoc {
  year: number;
  title: string;
  months: string[];
  monthLabels: Record<string, string>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 연도별 보고서 문서 ID 생성 (예: "report-2026")
 */
function getReportId(year: number): string {
  return `report-${year}`;
}

/**
 * 연도별 보고서를 가져오기 (없으면 null 반환)
 */
export async function getReport(year: number): Promise<{ reportId: string; report: ReportDoc } | null> {
  const reportId = getReportId(year);
  const ref = doc(db, 'reports', reportId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { reportId, report: snap.data() as ReportDoc };
  }
  return null;
}

/**
 * 연도별 보고서를 가져오거나, 없으면 새로 생성 (Admin Only)
 */
export async function getOrCreateReport(year: number): Promise<{ reportId: string; report: ReportDoc }> {
  // 1. 가져오기 시도
  const existing = await getReport(year);
  if (existing) return existing;

  // 2. 없으면 생성 (권한 없으면 Firestore 에러 발생)
  const reportId = getReportId(year);
  const ref = doc(db, 'reports', reportId);

  const newReport: Record<string, unknown> = {
    year,
    title: `${year}년 매출 보고`,
    months: [],
    monthLabels: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, newReport);
  const created = await getDoc(ref);
  return { reportId, report: created.data() as ReportDoc };
}

/**
 * 보고서의 월 메타데이터 업데이트
 */
export async function updateReportMonths(
  reportId: string,
  months: string[],
  monthLabels: Record<string, string>,
): Promise<void> {
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, {
    months,
    monthLabels,
    updatedAt: serverTimestamp(),
  });
}
