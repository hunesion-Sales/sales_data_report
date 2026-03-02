
import React, { useState, useEffect, useMemo } from 'react';
import type { ProductData } from '@/types';
import { useReport } from '@/hooks/useReport';
import { useYoYReport } from '@/hooks/useYoYReport';
import { CURRENT_YEAR } from '@/config/appConfig';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import { getIndustryGroupData } from '@/firebase/services/industryGroupDataService';
import { getIndustryGroups } from '@/firebase/services/industryGroupService';
import { getProductGroupTargetsByYear } from '@/firebase/services/productGroupTargetService';
import { remapIndustryGroupData, DEFAULT_INDUSTRY_GROUPS } from '@/utils/industryGroupMapper';
import type { IndustryGroup } from '@/types';
import {
  useDashboardData,
  usePeriodSelector,
  useBacklogData,
  useUploadDate,
  DashboardKPICards,
  MonthlyTrendChart,
  ProductGroupChart,
  IndustryGroupChart,
  DivisionOverviewChart,
  PeriodSelector,
} from '@/features/dashboard';

const DEFAULT_MONTHS: string[] = [];
const DEFAULT_MONTH_LABELS: Record<string, string> = {};
const INITIAL_DATA: ProductData[] = [];

export default function SolutionBusinessDashboard() {
  const { user, firebaseUser, authReady, isAdmin } = useAuth();
  const { viewMode, setViewMode } = useViewMode('profit');

  // 기간 선택
  const { selection, setSelection, selectedMonthKeys, backlogMonthKeys, periodLabel } = usePeriodSelector();

  // 데이터 업로드 기준일
  const uploadDate = useUploadDate();

  // Achievement Data
  const {
    achievements: divisionAchievements,
    overallSalesAchievementRate,
    overallProfitAchievementRate,
    totalSalesTarget,
    totalProfitTarget,
    setYear: setAchievementYear,
    setPeriod: setAchievementPeriod,
  } = useAchievement(user?.divisionId, isAdmin);

  useEffect(() => {
    setAchievementYear(selection.year);
    setAchievementPeriod('Year');
  }, [selection.year, setAchievementYear, setAchievementPeriod]);

  // Report Data
  const {
    data, months,
    isLoading, isSaving, error: firestoreError,
  } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
    firebaseUser,
    authReady,
  });

  // 전년도 비교 데이터
  const { previousData } = useYoYReport(selection.year, true);

  // 산업군 마스터 설정 (수주잔액 및 실적 데이터 재분류용)
  const [industryGroupConfig, setIndustryGroupConfig] = useState<
    Array<{ name: string; keywords: string[] }>
  >([]);

  useEffect(() => {
    getIndustryGroups()
      .then(groups => setIndustryGroupConfig(groups.map(g => ({ name: g.name, keywords: g.keywords }))))
      .catch(() => setIndustryGroupConfig(DEFAULT_INDUSTRY_GROUPS));
  }, []);

  // 수주잔액 데이터 (산업군 설정 기준으로 재분류)
  const {
    backlogByMonth,
    backlogByProductGroup,
    backlogByDivision,
    backlogByIndustryGroup,
  } = useBacklogData(selection.year, industryGroupConfig);

  // 산업군별 실적 데이터 (당년 + 전년)
  const [industryGroupData, setIndustryGroupData] = useState<
    Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>
  >([]);
  const [prevIndustryGroupData, setPrevIndustryGroupData] = useState<
    Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>
  >([]);

  useEffect(() => {
    const fetchIndustryGroupData = async () => {
      try {
        // 산업군 마스터 조회 (키워드 매핑용) - 캐시된 config 사용
        const groups = industryGroupConfig.length > 0
          ? industryGroupConfig
          : await getIndustryGroups().catch(() => DEFAULT_INDUSTRY_GROUPS);

        // 당년 데이터
        const reportId = `report-${selection.year}`;
        const rawData = await getIndustryGroupData(reportId).catch(() => []);
        const mappedData = remapIndustryGroupData(rawData, groups);
        setIndustryGroupData(mappedData);

        // 전년 데이터
        const prevReportId = `report-${selection.year - 1}`;
        const rawPrevData = await getIndustryGroupData(prevReportId).catch(() => []);
        const mappedPrevData = remapIndustryGroupData(rawPrevData, groups);
        setPrevIndustryGroupData(mappedPrevData);
      } catch {
        setIndustryGroupData([]);
        setPrevIndustryGroupData([]);
      }
    };

    fetchIndustryGroupData();
  }, [selection.year, industryGroupConfig]);

  // 제품군별 목표 합계 + 개별 목표
  const [productGroupTargetTotal, setProductGroupTargetTotal] = useState({ sales: 0, profit: 0 });
  const [productGroupTargetByGroup, setProductGroupTargetByGroup] = useState<Record<string, { sales: number; profit: number }>>({});

  useEffect(() => {
    getProductGroupTargetsByYear(selection.year)
      .then(targets => {
        let sales = 0;
        let profit = 0;
        const byGroup: Record<string, { sales: number; profit: number }> = {};
        for (const t of targets) {
          sales += t.salesTarget;
          profit += t.profitTarget;
          if (!byGroup[t.productGroup]) {
            byGroup[t.productGroup] = { sales: 0, profit: 0 };
          }
          byGroup[t.productGroup].sales += t.salesTarget;
          byGroup[t.productGroup].profit += t.profitTarget;
        }
        setProductGroupTargetTotal({ sales, profit });
        setProductGroupTargetByGroup(byGroup);
      })
      .catch(() => {
        setProductGroupTargetTotal({ sales: 0, profit: 0 });
        setProductGroupTargetByGroup({});
      });
  }, [selection.year]);

  // 대시보드 집계 데이터
  const {
    kpiData,
    monthlyTrendData,
    productGroupChartData,
    industryGroupChartData,
    divisionChartData,
    monthRangeText,
  } = useDashboardData({
    data,
    months,
    viewMode,
    divisionAchievements,
    totalSalesTarget,
    totalProfitTarget,
    selectedMonthKeys,
    backlogMonthKeys,
    previousData,
    backlogByMonth,
    backlogByProductGroup,
    backlogByDivision,
    backlogByIndustryGroup,
    industryGroupData,
    prevIndustryGroupData,
    productGroupTargetTotal,
    productGroupTargetByGroup,
    year: selection.year,
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              매출 현황 <span className="text-slate-500 font-normal text-base">({monthRangeText || periodLabel})</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">실시간 프로젝트 매출 및 손익 관리</p>
          </div>

          <div className="flex items-center gap-4">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />

            <div className="flex items-center gap-3">
              {isSaving ? (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  저장 중...
                </span>
              ) : firestoreError ? (
                <span className="flex items-center gap-1 text-xs text-red-500" title={firestoreError}>
                  <CloudOff className="w-3.5 h-3.5" />
                  오프라인
                </span>
              ) : !isLoading ? (
                <span className="flex items-center gap-1 text-xs text-accent-600">
                  <Cloud className="w-3.5 h-3.5" />
                  동기화됨
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* 기간 선택기 + 업로드 기준일 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <PeriodSelector selection={selection} onSelectionChange={setSelection} />
          {uploadDate && (
            <span className="text-xs text-slate-400">
              데이터 업로드 기준 일자: {uploadDate}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards (2행, 9카드) */}
      <DashboardKPICards
        data={kpiData}
        periodLabel={periodLabel}
        viewMode={viewMode}
      />

      {/* Charts Section */}
      <div className="space-y-6 no-print">
        {/* 1. 월별 실적 및 예측 현황 */}
        <MonthlyTrendChart data={monthlyTrendData} viewMode={viewMode} />

        {/* 2. 주요 제품군별 실적 순위 현황 */}
        <ProductGroupChart data={productGroupChartData} viewMode={viewMode} />

        {/* 3. 주요 산업군별 누적 실적 순위 현황 */}
        <IndustryGroupChart data={industryGroupChartData} viewMode={viewMode} />

        {/* 4. 부문별 매출이익 목표 및 실적 / 달성율 */}
        <DivisionOverviewChart data={divisionChartData} viewMode={viewMode} />
      </div>
    </div>
  );
}
