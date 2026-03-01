
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductData } from '@/types';
import { useReport } from '@/hooks/useReport';
import { useYoYReport } from '@/hooks/useYoYReport';
import { CURRENT_YEAR } from '@/config/appConfig';
import { calculateYoYRate } from '@/utils/yoyUtils';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import {
  useDashboardData,
  DashboardKPICards,
  MonthlyTrendChart,
  TopProductsChart,
  DivisionOverviewChart,
  DashboardDetailModal,
} from '@/features/dashboard';

// --- 초기 데이터 (동적 월 구조) ---
const DEFAULT_MONTHS: string[] = [];
const DEFAULT_MONTH_LABELS: Record<string, string> = {};
const INITIAL_DATA: ProductData[] = [];

export default function SolutionBusinessDashboard() {
  const navigate = useNavigate();
  const { user, firebaseUser, authReady, isAdmin } = useAuth();

  // View Mode State
  const { viewMode, setViewMode } = useViewMode('profit');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'division'>('product');

  // Achievement Data (Yearly for Dashboard)
  const {
    achievements: divisionAchievements,
    divisionItems,
    overallSalesAchievementRate,
    overallProfitAchievementRate,
    totalSalesTarget,
    totalProfitTarget,
    setYear: setAchievementYear,
    setPeriod: setAchievementPeriod
  } = useAchievement(user?.divisionId, isAdmin);

  // Ensure Year mode for dashboard
  useEffect(() => {
    setAchievementYear(new Date().getFullYear());
    setAchievementPeriod('Year');
  }, [setAchievementYear, setAchievementPeriod]);

  // Report Data
  const {
    data, months,
    isLoading, isSaving, error: firestoreError,
  } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
    firebaseUser,
    authReady,
  });

  // Dashboard computed data
  const {
    processedData,
    totals,
    monthlyTrendData,
    allProducts,
    divisionChartData,
    monthRangeText,
  } = useDashboardData({
    data,
    months,
    viewMode,
    divisionAchievements,
    totalSalesTarget,
    totalProfitTarget,
  });

  // YoY 전년도 비교 데이터
  const { previousData, previousMonths } = useYoYReport(CURRENT_YEAR, true);

  const yoyMetrics = useMemo(() => {
    if (previousData.length === 0) return undefined;
    let previousSales = 0;
    let previousProfit = 0;
    previousData.forEach(item => {
      Object.values(item.months).forEach(md => {
        previousSales += md.sales;
        previousProfit += md.sales - md.cost;
      });
    });
    return {
      salesRate: calculateYoYRate(totals.totalSales, previousSales),
      profitRate: calculateYoYRate(totals.totalProfit, previousProfit),
      previousSales,
      previousProfit,
    };
  }, [previousData, totals]);

  // 월별 트렌드에 전년도 데이터 병합
  const enrichedTrendData = useMemo(() => {
    if (previousData.length === 0) return monthlyTrendData;
    // 전년도 데이터를 월별로 집계
    const prevByMonth: Record<string, { sales: number; profit: number }> = {};
    previousData.forEach(item => {
      Object.entries(item.months).forEach(([mk, md]) => {
        const monthNum = mk.split('-')[1]; // "01", "02", etc.
        if (!prevByMonth[monthNum]) prevByMonth[monthNum] = { sales: 0, profit: 0 };
        prevByMonth[monthNum].sales += md.sales;
        prevByMonth[monthNum].profit += md.sales - md.cost;
      });
    });

    return monthlyTrendData.map(entry => {
      // name is like "1월", "2월" etc.
      const match = entry.name.match(/^(\d+)월/);
      const monthNum = match ? match[1].padStart(2, '0') : null;
      const prev = monthNum ? prevByMonth[monthNum] : null;
      return {
        ...entry,
        previousSales: prev?.sales ?? 0,
        previousProfit: prev?.profit ?? 0,
      };
    });
  }, [monthlyTrendData, previousData]);

  const handleProductClick = useCallback((data: any) => {
    if (data && data.activeLabel) {
      setSelectedProduct(data.activeLabel);
      setModalType('product');
      setIsModalOpen(true);
    } else if (data && data.product) {
      setSelectedProduct(data.product);
      setModalType('product');
      setIsModalOpen(true);
    }
  }, []);

  const handleDivisionClick = useCallback((data: any) => {
    if (data && data.activeLabel) {
      const divName = data.activeLabel;
      const div = divisionChartData.find(d => d.name === divName);
      setSelectedDivision(div ? div.divisionId : divName);
      setModalType('division');
      setIsModalOpen(true);
    }
  }, [divisionChartData]);

  const handleSalesClick = useCallback(() => {
    setSelectedProduct('Total');
    setViewMode('sales');
    setModalType('product');
    setIsModalOpen(true);
  }, [setViewMode]);

  const handleProfitClick = useCallback(() => {
    setSelectedProduct('Total');
    setViewMode('profit');
    setModalType('product');
    setIsModalOpen(true);
  }, [setViewMode]);

  const handleAchievementClick = useCallback(() => navigate('/achievement'), [navigate]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">매출 현황 <span className="text-slate-500 font-normal text-base">({monthRangeText})</span></h1>
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

      {/* KPI Cards */}
      <DashboardKPICards
        totals={totals}
        monthRangeText={monthRangeText}
        overallSalesAchievementRate={overallSalesAchievementRate}
        overallProfitAchievementRate={overallProfitAchievementRate}
        onSalesClick={handleSalesClick}
        onProfitClick={handleProfitClick}
        onAchievementClick={handleAchievementClick}
        yoyMetrics={yoyMetrics}
      />

      {/* Charts Section */}
      <div className="space-y-6 no-print">
        <MonthlyTrendChart data={enrichedTrendData} viewMode={viewMode} showYoY={previousData.length > 0} />
        <TopProductsChart data={allProducts} onProductClick={handleProductClick} />
        <div>
          <DivisionOverviewChart data={divisionChartData} viewMode={viewMode} onDivisionClick={handleDivisionClick} />
        </div>
      </div>

      {/* Detailed Modal */}
      <DashboardDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalType={modalType}
        selectedProduct={selectedProduct}
        selectedDivision={selectedDivision}
        viewMode={viewMode}
        months={months}
        processedData={processedData}
        divisionChartData={divisionChartData}
        divisionItems={divisionItems}
      />
    </div>
  );
}
