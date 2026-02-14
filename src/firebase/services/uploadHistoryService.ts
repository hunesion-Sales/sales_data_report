import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

export interface UploadHistoryEntry {
  reportId: string;
  fileName: string;
  monthsAffected: string[];
  productCount: number;
}

/**
 * 업로드 이력 기록
 */
export async function recordUploadHistory(entry: UploadHistoryEntry): Promise<void> {
  const ref = collection(db, 'uploadHistory');
  await addDoc(ref, {
    ...entry,
    uploadedAt: serverTimestamp(),
    uploadedBy: 'anonymous', // Phase 6에서 Auth 연동 시 실제 uid로 교체
  });
}
