import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * 최신 데이터 업로드 일자 조회 훅
 */
export function useUploadDate() {
  const [uploadDate, setUploadDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLatest = async () => {
      try {
        const ref = collection(db, 'uploadHistory');
        const q = query(ref, orderBy('uploadedAt', 'desc'), limit(1));
        const snap = await getDocs(q);

        if (!cancelled && !snap.empty) {
          const data = snap.docs[0].data();
          if (data.uploadedAt?.toDate) {
            const d = data.uploadedAt.toDate();
            setUploadDate(
              `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
            );
          }
        }
      } catch {
        // 업로드 이력이 없는 경우 무시
      }
    };

    fetchLatest();
    return () => { cancelled = true; };
  }, []);

  return uploadDate;
}
