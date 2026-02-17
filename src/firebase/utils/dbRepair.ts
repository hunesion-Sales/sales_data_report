import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { getReport, updateReportMonths } from '../services/reportService';
import { getProducts } from '../services/productService';
import { seedDefaultDivisions } from '../services/divisionService';
import { getMonthFullLabel } from '@/types';

/**
 * DB 점검 및 복구 결과
 */
export interface RepairResult {
    success: boolean;
    message: string;
    details?: string[];
}

/**
 * 보고서 메타데이터(월 정보)를 제품 데이터와 동기화
 */
export async function repairReportMetadata(year: number): Promise<RepairResult> {
    const details: string[] = [];
    try {
        // 1. 제품 데이터 모두 조회
        const reportId = `report-${year}`;
        console.log(`[Repair] Querying products for reportId: ${reportId}`);
        const products = await getProducts(reportId);
        console.log(`[Repair] Found ${products.length} products`);

        if (products.length > 0) {
            console.log('[Repair] Sample product:', JSON.stringify(products[0], null, 2));
        }

        if (products.length === 0) {
            return { success: true, message: `제품 데이터가 없습니다. (경로: reports/${reportId}/products)` };
        }

        details.push(`발견된 제품 수: ${products.length}개`);

        // 2. 모든 제품에서 월 키 수집 (Set으로 중복 제거)
        const monthSet = new Set<string>();
        products.forEach(p => {
            if (p.months) {
                Object.keys(p.months).forEach(m => monthSet.add(m));
            }
        });

        const unsortedMonths = Array.from(monthSet);
        const sortedMonths = unsortedMonths.sort();

        details.push(`발견된 월 데이터: ${sortedMonths.join(', ')}`);

        if (sortedMonths.length === 0) {
            return { success: true, message: '제품 데이터에 월 정보가 없습니다.' };
        }

        // 3. 보고서 문서 확인 및 생성
        const reportDocRef = doc(db, 'reports', reportId);
        const reportSnap = await getDoc(reportDocRef);

        if (!reportSnap.exists()) {
            details.push(`보고서 문서(${reportId})가 없어 새로 생성합니다.`);
            await setDoc(reportDocRef, {
                year,
                title: `${year}년 매출 보고`,
                months: [],
                monthLabels: {},
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        // 4. 월 라벨 생성
        const monthLabels: Record<string, string> = {};
        sortedMonths.forEach(m => {
            monthLabels[m] = getMonthFullLabel(m);
        });

        // 5. 보고서 메타데이터 업데이트
        await updateReportMonths(reportId, sortedMonths, monthLabels);
        details.push('보고서 메타데이터(월 목록) 업데이트 완료');

        return {
            success: true,
            message: '데이터 동기화 완료했습니다.',
            details
        };

    } catch (error) {
        console.error('Repair error:', error);
        return {
            success: false,
            message: '동기화 중 오류가 발생했습니다.',
            details: [`Error: ${error}`]
        };
    }
}

/**
 * 부문 데이터 확인 및 초기화
 */
export async function checkAndSeedDivisions(): Promise<RepairResult> {
    try {
        const seeded = await seedDefaultDivisions();
        if (seeded) {
            return { success: true, message: '기본 영업부문 데이터를 초기화했습니다.' };
        } else {
            return { success: true, message: '영업부문 데이터가 이미 존재합니다.' };
        }
    } catch (error) {
        return { success: false, message: '영업부문 확인 중 오류 발생', details: [`Error: ${error}`] };
    }
}

/**
 * 제품 마스터 초기화 (22개 제품 등록)
 */
export async function registerInitialProductMasters(): Promise<RepairResult> {
    try {
        const { seedInitialProductMasters } = await import('../services/productMasterService');
        const result = await seedInitialProductMasters();
        return {
            success: true,
            message: `제품 마스터 초기화 완료: ${result.created}개 생성, ${result.skipped}개 건너뜀`,
        };
    } catch (error) {
        return { success: false, message: '제품 마스터 초기화 중 오류 발생', details: [`Error: ${error}`] };
    }
}
