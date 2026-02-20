
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductData, ProcessedProduct, Totals, ProcessedProduct as ProcessedProductType } from '@/types';
import { getMonthShortLabel } from '@/types';
import { useReport } from '@/hooks/useReport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ComposedChart, Line, ResponsiveContainer
} from 'recharts';
import {
  Table as TableIcon, TrendingUp, DollarSign, Calendar,
  Cloud, CloudOff, Loader2, Target, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import { getCurrentQuarter, getQuarterLabel } from '@/utils/periodUtils';
import { ChartWrapper } from '@/components/charts';
import { formatMillionWon, formatCurrency as formatCurrencyFull, formatMillionWonChart, formatMillionWonTooltip } from '@/utils/formatUtils';
import ViewToggle from '@/components/ui/ViewToggle';
import { useViewMode } from '@/hooks/useViewMode';
import DualAxisChart from '@/components/charts/DualAxisChart';
import { Modal } from '@/components/ui/Modal';
import { calculateCumulativeAchievement, isCloudProduct } from '@/utils/achievementUtils';

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

  // 제품의 특정 월 데이터를 안전하게 가져오기
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  // --- 데이터 가공 (기존 로직 + Cloud 그룹핑) ---
  const processedData = useMemo<ProcessedProduct[]>(() => {
    const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
      const m: Record<string, { sales: number; cost: number }> = {};
      months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
      return m;
    };

    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
      '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
      '클라우드 서비스': { id: 'cloud_total', product: '클라우드 서비스', months: emptyMonths() },
    };

    // Cloud products accumulator
    const cloudProducts: ProductData[] = [];
    const regularItems: ProductData[] = [];

    data.forEach(item => {
      // 1. Special Groups
      if (item.product.endsWith('_MA')) {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['유지보수'].months[mk].sales += md.sales;
          aggregatedGroups['유지보수'].months[mk].cost += md.cost;
        });
      } else if (item.product === 'H/W' || item.product === '기타') {
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['기타'].months[mk].sales += md.sales;
          aggregatedGroups['기타'].months[mk].cost += md.cost;
        });
      }
      // 2. Cloud Grouping
      else if (isCloudProduct(item.product)) {
        cloudProducts.push(item); // Keep original for reference if needed? No, user wants aggregation.
        months.forEach(mk => {
          const md = getMonthData(item, mk);
          aggregatedGroups['클라우드 서비스'].months[mk].sales += md.sales;
          aggregatedGroups['클라우드 서비스'].months[mk].cost += md.cost;
        });
      }
      // 3. Regular Items
      else {
        regularItems.push(item);
      }
    });

    // Create final list
    const itemsToProcess = [...regularItems, aggregatedGroups['유지보수'], aggregatedGroups['기타']];
    // Only add Cloud Service if it has data
    const cloudTotalSales = Object.values(aggregatedGroups['클라우드 서비스'].months).reduce((acc, m) => acc + m.sales, 0);
    if (cloudTotalSales > 0 || cloudProducts.length > 0) {
      itemsToProcess.push(aggregatedGroups['클라우드 서비스']);
    }

    return itemsToProcess.map(item => {
      const processedMonths: Record<string, { sales: number; cost: number; profit: number }> = {};
      let totalSales = 0;
      let totalCost = 0;

      months.forEach(mk => {
        const md = getMonthData(item, mk);
        const profit = md.sales - md.cost;
        processedMonths[mk] = { sales: md.sales, cost: md.cost, profit };
        totalSales += md.sales;
        totalCost += md.cost;
      });

      return {
        id: item.id,
        product: item.product,
        months: processedMonths,
        totalSales,
        totalCost,
        totalProfit: totalSales - totalCost,
      };
    }).sort((a, b) => {
      const valA = viewMode === 'sales' ? a.totalSales : a.totalProfit;
      const valB = viewMode === 'sales' ? b.totalSales : b.totalProfit;
      return valB - valA;
    });
  }, [data, months, viewMode]);

  const totals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

    // Use processedData (already has aggregations)
    processedData.forEach(item => {
      months.forEach(mk => {
        const md = item.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
        byMonth[mk].sales += md.sales;
        byMonth[mk].cost += md.cost;
        byMonth[mk].profit += md.profit;
      });
      totalSales += item.totalSales;
      totalCost += item.totalCost;
    });

    return { byMonth, totalSales, totalCost, totalProfit: totalSales - totalCost };
  }, [processedData, months]);

  // --- Monthly Trend Data (Dual Axis) ---
  const monthlyTrendData = useMemo(() => {
    // Generate all 12 months for the current year (or the year of loaded data)
    // If months array is empty, default to current year.
    // If months array has data, use its year? `months` is string 'YYYY-MM'.
    const year = months.length > 0 ? months[0].split('-')[0] : new Date().getFullYear().toString();
    const fullMonths = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return `${year}-${m.toString().padStart(2, '0')}`;
    });

    // Calculate cumulative achievement for ALL months?
    // calculateCumulativeAchievement handles sparse data?
    // It expects `months` array. If we pass `fullMonths`, it will try to find data for them.
    // If data missing, it should handle 0.
    const achievementData = calculateCumulativeAchievement(
      fullMonths,
      totals.byMonth,
      totalSalesTarget,
      totalProfitTarget
    );

    return fullMonths.map((mk, idx) => {
      const stats = achievementData[idx];
      const items = totals.byMonth[mk] || { sales: 0, profit: 0 };
      return {
        name: getMonthShortLabel(mk),
        sales: items.sales,
        profit: items.profit,
        rate: viewMode === 'sales' ? stats.salesRate : stats.profitRate,
      };
    });
  }, [months, totals, viewMode, totalSalesTarget, totalProfitTarget]);

  // --- All Products (Sorted by Sales) ---
  const allProducts = useMemo(() => {
    return [...processedData].sort((a, b) => b.totalSales - a.totalSales);
  }, [processedData]);

  // --- Division Data for Chart (Sales & Profit) ---
  const divisionChartData = useMemo(() => {
    return divisionAchievements.map(ach => ({
      name: ach.divisionName,
      sales: ach.actualSales,
      profit: ach.actualProfit,
      rate: viewMode === 'sales' ? ach.salesAchievementRate : (ach.profitAchievementRate || 0),
      divisionId: ach.target.divisionId
    })).sort((a, b) => b.sales - a.sales); // Sort by Sales descending?
  }, [divisionAchievements, viewMode]);




  // --- Modal Data Logic ---
  const getModalChartData = () => {
    if (modalType === 'product' && selectedProduct) {
      // Find product in processedData OR in original data for specific cloud items if needed?
      // Requirement: "Cloud Service 클릭시 상세 페이지 모달 표시"
      // If selectedProduct is 'Cloud Service', we should show breakdown of Cloud products?
      // Or just the trend of the aggregated Cloud Service?
      // "상세 페이지 모달" usually means Breakdown. 
      // But for generic product, it means Trend.
      // Let's implement Trend for now. If Cloud, maybe I'll list child products in future.
      // For now, simple trend of the selected item.
      const item = processedData.find(p => p.product === selectedProduct);
      if (!item) return [];

      return months.map(mk => ({
        name: getMonthShortLabel(mk),
        value: viewMode === 'sales' ? item.months[mk].sales : item.months[mk].profit
      }));
    }
    else if (modalType === 'division' && selectedDivision) {
      // Division Trend - use divisionItems (monthly data from Firestore)
      const targetDiv = divisionChartData.find(d => d.divisionId === selectedDivision || d.name === selectedDivision);
      if (!targetDiv) return [];

      // Find the matching DivisionDataItem by divisionId or name
      const divItem = divisionItems.find(item => {
        if (item.divisionId === selectedDivision) return true;
        const normalizedItemName = item.divisionName.replace(/\s+/g, '');
        const normalizedTargetName = targetDiv.name.replace(/\s+/g, '');
        return normalizedItemName === normalizedTargetName;
      });

      if (!divItem) return [];

      return months.map(mk => {
        const md = divItem.months[mk];
        const sales = md ? (md.sales || 0) : 0;
        const cost = md ? (md.cost || 0) : 0;
        const profit = sales - cost;
        return {
          name: getMonthShortLabel(mk),
          value: viewMode === 'sales' ? sales : profit
        };
      });
    }
    return [];
  };

  const handleProductClick = (data: any) => {
    if (data && data.activeLabel) { // Chart click
      // For categorical charts, activeLabel is the category name (Product Name)
      setSelectedProduct(data.activeLabel);
      setModalType('product');
      setIsModalOpen(true);
    } else if (data && data.product) { // Direct object click if implemented
      setSelectedProduct(data.product);
      setModalType('product');
      setIsModalOpen(true);
    }
  };

  const handleDivisionClick = (data: any) => {
    // Find division ID/Name from click
    if (data && data.activeLabel) {
      const divName = data.activeLabel;
      // Find ID if possible
      const div = divisionChartData.find(d => d.name === divName);
      setSelectedDivision(div ? div.divisionId : divName);
      setModalType('division');
      setIsModalOpen(true);
    }
  };

  const monthRangeText = useMemo(() => {
    if (months.length === 0) return '';
    if (months.length === 1) return getMonthShortLabel(months[0]);
    return `${getMonthShortLabel(months[0])}~${getMonthShortLabel(months[months.length - 1])}`;
  }, [months]);

  const currentCumulative = viewMode === 'sales' ? totals.totalSales : totals.totalProfit;
  const currentAchievementRate = viewMode === 'sales' ? overallSalesAchievementRate : overallProfitAchievementRate;

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

          {/* Firestore Data Status */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 누적 매출액 */}
        <div
          className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
          onClick={() => { setSelectedProduct('Total'); setViewMode('sales'); setModalType('product'); setIsModalOpen(true); }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 매출액 (백만원)</h3>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatMillionWon(totals.totalSales)}</div>
          <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
        </div>

        {/* 2. 매출 달성율 */}
        <div
          className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
          onClick={() => navigate('/achievement')}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">매출 달성율</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold ${overallSalesAchievementRate && overallSalesAchievementRate >= 100 ? 'text-indigo-600' : overallSalesAchievementRate && overallSalesAchievementRate >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
            {overallSalesAchievementRate ? overallSalesAchievementRate.toFixed(1) : '-'}%
          </div>
          <p className="text-xs text-slate-400 mt-1">연간 목표 대비</p>
        </div>

        {/* 3. 누적 매출이익 */}
        <div
          className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-emerald-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
          onClick={() => { setSelectedProduct('Total'); setViewMode('profit'); setModalType('product'); setIsModalOpen(true); }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 매출이익 (백만원)</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatMillionWon(totals.totalProfit)}</div>
          <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
        </div>

        {/* 4. 이익 달성율 */}
        <div
          className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-violet-500 border-x border-b cursor-pointer transition-all hover:shadow-md"
          onClick={() => navigate('/achievement')}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">매출이익 달성율</h3>
            <Target className="w-5 h-5 text-violet-500" />
          </div>
          <div className={`text-2xl font-bold ${overallProfitAchievementRate && overallProfitAchievementRate >= 100 ? 'text-violet-600' : overallProfitAchievementRate && overallProfitAchievementRate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {overallProfitAchievementRate ? overallProfitAchievementRate.toFixed(1) : '-'}%
          </div>
          <p className="text-xs text-slate-400 mt-1">연간 목표 대비</p>
        </div>
      </div>

      {/* Charts Section */}

      <div className="space-y-6 no-print">
        {/* 1. 월별 매출/이익 및 달성율 추이 (누적) */}
        <ChartWrapper title="월별 매출/매출이익 및 달성율 추이 (누적)" height={350}>
          <ComposedChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} label={{ value: '(%)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
            <RechartsTooltip formatter={(value: any, name: any) => {
              if (name === '달성율') return [`${Number(value).toFixed(1)}%`, viewMode === 'sales' ? '매출목표 달성율' : '매출이익 달성율'];
              return formatMillionWonTooltip(value);
            }} />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="profit" name="매출이익" fill="#10b981" barSize={30} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="rate" name="달성율" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ChartWrapper>

        {/* 2. 제품별 현황 (All Products) */}
        <ChartWrapper title="제품별 현황 (클릭 시 상세정보 확인)" height={350}>
          <ComposedChart data={allProducts} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} onClick={handleProductClick}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="product" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
            <RechartsTooltip formatter={(value: any) => formatMillionWonTooltip(value)} cursor={{ fill: 'transparent' }} />
            <Legend />
            <Bar dataKey="totalSales" name="매출액" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalProfit" name="매출이익" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} />
          </ComposedChart>
        </ChartWrapper>

        {/* 3. 부문별 매출/이익 및 달성율 */}
        <div onClick={(e: any) => {
          // Wrapper click not effective for ComposedChart internal elements but good for general area
        }}>
          <ChartWrapper title="부문별 매출/매출이익 및 달성율" height={350}>
            <ComposedChart data={divisionChartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} onClick={handleDivisionClick}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={formatMillionWonChart} tick={{ fontSize: 11 }} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val.toFixed(0)}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} label={{ value: '(%)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
              <RechartsTooltip formatter={(value: any, name: any) => {
                if (name === '달성율') return [`${Number(value).toFixed(1)}%`, viewMode === 'sales' ? '매출목표 달성율' : '매출이익 달성율'];
                return formatMillionWonTooltip(value);
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" name="매출액" fill="#6366f1" barSize={30} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="profit" name="매출이익" fill="#059669" barSize={30} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="rate" name="달성율" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ChartWrapper>
        </div>
      </div>

      {/* Detailed Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${modalType === 'product' ? (selectedProduct || '제품') : (divisionChartData.find(d => d.divisionId === selectedDivision)?.name || selectedDivision || '부문')} 월별 ${viewMode === 'sales' ? '매출' : '매출이익'} 추이`}
        size="2xl"
      >
        <div style={{ height: 300 }}>
          <ChartWrapper height={300}>
            <BarChart data={getModalChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatMillionWonChart} width={60} label={{ value: '(백만원)', position: 'top', offset: 10, fontSize: 11, fill: '#64748b' }} />
              <RechartsTooltip formatter={(value: any) => formatMillionWonTooltip(value)} />
              <Bar
                dataKey="value"
                name={viewMode === 'sales' ? '매출액' : '매출이익'}
                fill={viewMode === 'sales' ? '#3b82f6' : '#10b981'}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ChartWrapper>
        </div>
      </Modal>

    </div>
  );
}
