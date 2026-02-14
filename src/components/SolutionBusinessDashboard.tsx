import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseExcelFile } from '@/utils/excelParser';
import { parseDivisionExcelFile } from '@/utils/divisionExcelParser';
import type { ProductData, ProcessedProduct, Totals, Notification, Division } from '@/types';
import { getMonthShortLabel, getMonthFullLabel } from '@/types';
import { useReport, type UploadMergeMode } from '@/hooks/useReport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import {
  LayoutDashboard, Table as TableIcon, Plus, Save, TrendingUp,
  DollarSign, Calendar, Printer, Upload, FileText, X, Cloud, CloudOff, Loader2,
  LogOut, User, Settings, Building2, Package, Users, ChevronDown, BarChart3, Target,
  RefreshCcw, GitMerge
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievement } from '@/hooks/useAchievement';
import { getDivisions } from '@/firebase/services/divisionService';
import { saveDivisionData } from '@/firebase/services/divisionDataService';
import { getCurrentQuarter, getQuarterLabel } from '@/utils/periodUtils';

// --- 초기 데이터 (동적 월 구조) ---
const DEFAULT_MONTHS = ['2026-01', '2026-02'];
const DEFAULT_MONTH_LABELS: Record<string, string> = {
  '2026-01': '1월 2026',
  '2026-02': '2월 2026',
};

const INITIAL_DATA: ProductData[] = [
  { id: 1, product: 'NGS', months: { '2026-01': { sales: 62746250, cost: 6655000 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 2, product: 'CamPASS', months: { '2026-01': { sales: 44000, cost: 0 }, '2026-02': { sales: 254000, cost: 0 } } },
  { id: 3, product: '기타', months: { '2026-01': { sales: 10789769, cost: 0 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 4, product: 'i-oneNet', months: { '2026-01': { sales: 33505600, cost: 115784000 }, '2026-02': { sales: 247968500, cost: 27000000 } } },
  { id: 5, product: 'i-oneNet DD', months: { '2026-01': { sales: 0, cost: 6270000 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 6, product: 'i-oneNet_MA', months: { '2026-01': { sales: 271857993, cost: 19653722 }, '2026-02': { sales: 46726181, cost: 12860746 } } },
  { id: 7, product: 'i-oneNet DD_MA', months: { '2026-01': { sales: 2164560, cost: 103650 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 8, product: 'i-oneNet DX_MA', months: { '2026-01': { sales: 0, cost: 350000 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 9, product: 'TresDM_MA', months: { '2026-01': { sales: 200000, cost: 0 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 10, product: 'NGS_MA', months: { '2026-01': { sales: 61335703, cost: 981400 }, '2026-02': { sales: 3716140, cost: 0 } } },
  { id: 11, product: 'CamPASS_MA', months: { '2026-01': { sales: 3018278, cost: 0 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 12, product: 'MoBiCa_MA', months: { '2026-01': { sales: 11566538, cost: 0 }, '2026-02': { sales: 100974, cost: 0 } } },
  { id: 13, product: 'ViSiCa_MA', months: { '2026-01': { sales: 2295600, cost: 1751810 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 14, product: 'i-oneNAC', months: { '2026-01': { sales: 29200000, cost: 2200000 }, '2026-02': { sales: 0, cost: 0 } } },
  { id: 15, product: 'Safe IP', months: { '2026-01': { sales: 695000, cost: 268400 }, '2026-02': { sales: 943000, cost: 180400 } } },
  { id: 16, product: 'i_oneJTac_MA', months: { '2026-01': { sales: 11859925, cost: 219600 }, '2026-02': { sales: 1167000, cost: 0 } } },
  { id: 17, product: 'i-oneNAC_MA', months: { '2026-01': { sales: 53758172, cost: 580000 }, '2026-02': { sales: 10644668, cost: 0 } } },
  { id: 18, product: 'NGS CLOUD', months: { '2026-01': { sales: 113417679, cost: 7286810 }, '2026-02': { sales: 14711400, cost: 0 } } },
  { id: 19, product: 'i-oneNet CLOUD', months: { '2026-01': { sales: 27096480, cost: 0 }, '2026-02': { sales: 10196720, cost: 0 } } },
  { id: 20, product: 'i-oneJTac CLOUD', months: { '2026-01': { sales: 681250, cost: 0 }, '2026-02': { sales: 681250, cost: 0 } } },
  { id: 21, product: 'Safe IP_MA', months: { '2026-01': { sales: 752510, cost: 0 }, '2026-02': { sales: 752510, cost: 0 } } },
  { id: 22, product: 'H/W', months: { '2026-01': { sales: 2100000, cost: 0 }, '2026-02': { sales: 0, cost: 0 } } },
];

// --- 월별 배경색 팔레트 (테이블 헤더용) ---
const MONTH_COLORS = [
  { bg: 'bg-blue-50/50', bgLight: 'bg-blue-50/30', text: 'text-blue-700' },
  { bg: 'bg-indigo-50/50', bgLight: 'bg-indigo-50/30', text: 'text-indigo-700' },
  { bg: 'bg-violet-50/50', bgLight: 'bg-violet-50/30', text: 'text-violet-700' },
  { bg: 'bg-purple-50/50', bgLight: 'bg-purple-50/30', text: 'text-purple-700' },
  { bg: 'bg-fuchsia-50/50', bgLight: 'bg-fuchsia-50/30', text: 'text-fuchsia-700' },
  { bg: 'bg-pink-50/50', bgLight: 'bg-pink-50/30', text: 'text-pink-700' },
  { bg: 'bg-rose-50/50', bgLight: 'bg-rose-50/30', text: 'text-rose-700' },
  { bg: 'bg-orange-50/50', bgLight: 'bg-orange-50/30', text: 'text-orange-700' },
  { bg: 'bg-amber-50/50', bgLight: 'bg-amber-50/30', text: 'text-amber-700' },
  { bg: 'bg-cyan-50/50', bgLight: 'bg-cyan-50/30', text: 'text-cyan-700' },
  { bg: 'bg-teal-50/50', bgLight: 'bg-teal-50/30', text: 'text-teal-700' },
  { bg: 'bg-emerald-50/50', bgLight: 'bg-emerald-50/30', text: 'text-emerald-700' },
];

// --- 유틸리티 함수 ---
const formatCurrency = (value: number): string => {
  if (value === 0 || value === undefined) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
};

const formatTableCurrency = (value: number): string => {
  if (value === 0 || value === undefined) return '-';
  return Math.round(value / 1000000).toLocaleString();
};

const formatCurrencyWithUnit = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  } else if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(0)}백만`;
  }
  return value.toLocaleString();
};

// --- 컴포넌트 ---
export default function SolutionBusinessDashboard() {
  const navigate = useNavigate();
  const { user, firebaseUser, authReady, logout, isAdmin } = useAuth();
  const { overallAchievementRate } = useAchievement(user?.divisionId, isAdmin);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input'>('dashboard');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const {
    data, months, monthLabels,
    isLoading, isSaving, error: firestoreError,
    saveUploadedData, addEntry, removeEntry,
  } = useReport(INITIAL_DATA, DEFAULT_MONTHS, DEFAULT_MONTH_LABELS, {
    firebaseUser,
    authReady,
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'product' | 'division'>('product');
  const [mergeMode, setMergeMode] = useState<UploadMergeMode>('overwrite');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 제품의 특정 월 데이터를 안전하게 가져오기
  const getMonthData = (item: ProductData, monthKey: string) => {
    return item.months[monthKey] ?? { sales: 0, cost: 0 };
  };

  // --- 데이터 가공 및 통계 계산 ---
  const processedData = useMemo<ProcessedProduct[]>(() => {
    // 빈 월 데이터 생성 헬퍼
    const emptyMonths = (): Record<string, { sales: number; cost: number }> => {
      const m: Record<string, { sales: number; cost: number }> = {};
      months.forEach(key => { m[key] = { sales: 0, cost: 0 }; });
      return m;
    };

    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', months: emptyMonths() },
      '기타': { id: 'etc_total', product: '기타', months: emptyMonths() },
    };
    const regularItems: ProductData[] = [];

    data.forEach(item => {
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
      } else {
        regularItems.push(item);
      }
    });

    const aggregatedList = [...regularItems, aggregatedGroups['유지보수'], aggregatedGroups['기타']];

    return aggregatedList.map(item => {
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
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [data, months]);

  const totals = useMemo<Totals>(() => {
    const byMonth: Record<string, { sales: number; cost: number; profit: number }> = {};
    months.forEach(mk => { byMonth[mk] = { sales: 0, cost: 0, profit: 0 }; });

    let totalSales = 0;
    let totalCost = 0;

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

  const topProducts = useMemo(() => {
    return [...processedData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 7);
  }, [processedData]);

  const monthlyTrend = useMemo(() => {
    return months.map(mk => ({
      name: getMonthShortLabel(mk),
      sales: totals.byMonth[mk]?.sales ?? 0,
      profit: totals.byMonth[mk]?.profit ?? 0,
    }));
  }, [months, totals]);

  // 월 범위 텍스트 (예: "1월~2월")
  const monthRangeText = useMemo(() => {
    if (months.length === 0) return '';
    if (months.length === 1) return getMonthShortLabel(months[0]);
    return `${getMonthShortLabel(months[0])}~${getMonthShortLabel(months[months.length - 1])}`;
  }, [months]);

  // --- 핸들러 ---
  const handleAddEntry = async () => {
    const entryMonths: Record<string, { sales: number; cost: number }> = {};
    months.forEach(mk => { entryMonths[mk] = { sales: 0, cost: 0 }; });

    const product = (document.getElementById('new-product') as HTMLInputElement)?.value?.trim();
    if (!product) return showNotification('제품명을 입력해주세요.', 'error');

    // 월별 입력 값 수집
    months.forEach(mk => {
      const salesInput = document.getElementById(`new-sales-${mk}`) as HTMLInputElement;
      const costInput = document.getElementById(`new-cost-${mk}`) as HTMLInputElement;
      entryMonths[mk] = {
        sales: Number(salesInput?.value) || 0,
        cost: Number(costInput?.value) || 0,
      };
    });

    await addEntry({ id: Date.now(), product, months: entryMonths });
    showNotification('데이터가 성공적으로 추가되었습니다.');

    // 폼 리셋
    const productInput = document.getElementById('new-product') as HTMLInputElement;
    if (productInput) productInput.value = '';
    months.forEach(mk => {
      const salesInput = document.getElementById(`new-sales-${mk}`) as HTMLInputElement;
      const costInput = document.getElementById(`new-cost-${mk}`) as HTMLInputElement;
      if (salesInput) salesInput.value = '0';
      if (costInput) costInput.value = '0';
    });
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await removeEntry(id);
      showNotification('데이터가 삭제되었습니다.', 'error');
    }
  };

  // --- 부문 매칭 로직 ---
  const matchDivision = (excelName: string, divisions: Division[]): Division | null => {
    // 1. 정확 일치
    const exact = divisions.find(d => d.name === excelName);
    if (exact) return exact;
    // 2. 포함 매칭 (둘 중 하나가 다른 하나를 포함)
    const partial = divisions.find(d =>
      d.name.includes(excelName) || excelName.includes(d.name)
    );
    return partial || null;
  };

  // --- 파일 업로드 처리 ---
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isExcel) {
      showNotification('지원하지 않는 파일 형식입니다. .xlsx 파일을 업로드해주세요.', 'error');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();

      if (uploadType === 'division') {
        // 부문별 엑셀 파싱
        const result = await parseDivisionExcelFile(buffer);
        const divisions = await getDivisions();

        // 부문명 자동 매칭 및 Firestore 저장용 데이터 생성
        let matchedCount = 0;
        let unmatchedCount = 0;
        const items = result.data.map(row => {
          const matched = matchDivision(row.divisionName, divisions);
          if (matched) {
            matchedCount++;
          } else {
            unmatchedCount++;
          }
          return {
            divisionName: row.divisionName,
            divisionId: matched?.id ?? 'unmatched',
            months: row.months,
          };
        });

        // 현재 보고서 ID (useReport에서 사용하는 reportId)
        const currentYear = new Date().getFullYear();
        const reportId = `report-${currentYear}`;
        await saveDivisionData(reportId, items);

        showNotification(
          `${items.length}개 부문 데이터가 업로드되었습니다 (${matchedCount}개 매칭, ${unmatchedCount}개 미매칭)`
        );
      } else {
        // 제품별 엑셀 파싱 (병합 모드 지원)
        const result = await parseExcelFile(buffer);
        const { newCount, updatedCount } = await saveUploadedData(
          result.data,
          result.months,
          result.monthLabels,
          file.name,
          mergeMode,
        );

        const monthInfo = result.months.length > 0
          ? ` (${result.months.map(m => getMonthShortLabel(m)).join(', ')})`
          : '';

        if (mergeMode === 'merge') {
          showNotification(
            `데이터가 병합되었습니다: 신규 ${newCount}건, 업데이트 ${updatedCount}건${monthInfo}`
          );
        } else {
          showNotification(`${result.data.length}건의 데이터를 불러왔습니다.${monthInfo}`);
        }
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Excel parsing error:', error);
      const message = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
      showNotification(message, 'error');
    } finally {
      setIsUploading(false);
    }
    e.target.value = '';
  }, [saveUploadedData, uploadType, mergeMode]);

  // --- 대시보드 뷰 ---
  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 누적 총 매출액 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 총 매출액</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(totals.totalSales)}</div>
          <p className="text-xs text-slate-400 mt-1">{monthRangeText} 합계</p>
        </div>
        {/* 누적 매출이익 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 매출이익</h3>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(totals.totalProfit)}</div>
          <p className="text-xs text-emerald-600 mt-1">
            이익률 {totals.totalSales > 0 ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1) : 0}%
          </p>
        </div>
        {/* 월별 KPI (최근 2개월) */}
        {months.slice(-2).map(mk => {
          const md = totals.byMonth[mk];
          return (
            <div key={mk} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-slate-500">{getMonthShortLabel(mk)} 매출</h3>
                <Calendar className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(md?.sales ?? 0)}</div>
              <p className="text-xs text-slate-400 mt-1">이익 {formatCurrencyWithUnit(md?.profit ?? 0)}</p>
            </div>
          );
        })}
      </div>

      {/* 분기 달성율 KPI */}
      {overallAchievementRate !== null && (
        <div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
          onClick={() => navigate('/achievement')}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">{getQuarterLabel(getCurrentQuarter())} 달성율</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold ${overallAchievementRate >= 100 ? 'text-emerald-600' :
            overallAchievementRate >= 75 ? 'text-blue-600' :
              overallAchievementRate >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
            {overallAchievementRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">클릭하여 상세 보기</p>
        </div>
      )}

      {/* Charts Section - 인쇄 시 숨김 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">주요 제품별 매출 및 이익 현황(Top 7)</h3>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="product" scale="point" padding={{ left: 30, right: 30 }} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tickFormatter={formatCurrencyWithUnit} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrencyWithUnit} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalSales" name="매출액" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="totalProfit" name="매출이익" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">월별 매출 추이</h3>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrencyWithUnit} tick={{ fontSize: 11 }} width={45} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="sales" name="매출" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 인쇄용 헤더 - 화면에서는 숨김 */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold text-center">Hunesion Solution 사업본부 매출 현황</h1>
        <p className="text-sm text-center text-slate-600 mt-1">
          {monthRangeText} 실적 보고서 | 출력일: {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-avoid-break">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-slate-500 no-print" />
            상세 실적 보고서
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">(단위 : 백만원, 부가세별도)</span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-600 transition-colors no-print"
            >
              <Printer className="w-4 h-4" />
              인쇄 / PDF 저장
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold">
              <tr>
                <th rowSpan={2} className="p-3 text-left border-b border-r border-slate-200 min-w-[150px] bg-slate-200 sticky left-0 z-10">제품군</th>
                {months.map((mk, idx) => {
                  const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                  return (
                    <th key={mk} colSpan={3} className={`p-2 border-b border-r border-slate-200 text-center ${color.bg}`}>
                      {getMonthFullLabel(mk)}
                    </th>
                  );
                })}
                <th colSpan={3} className="p-2 border-b border-slate-200 text-center bg-slate-200">전체 합계</th>
              </tr>
              <tr className="text-xs">
                {months.map((mk, idx) => {
                  const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                  return (
                    <React.Fragment key={mk}>
                      <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매출액</th>
                      <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight}`}>매입액</th>
                      <th className={`p-2 border-b border-r border-slate-200 min-w-[100px] ${color.bgLight} ${color.text}`}>이익</th>
                    </React.Fragment>
                  );
                })}
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매출액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매입액</th>
                <th className="p-2 border-b border-slate-200 min-w-[100px] bg-slate-100 text-slate-900">이익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-3 text-left font-medium text-slate-700 border-r border-slate-100 sticky left-0 bg-white">{row.product}</td>
                  {months.map((mk, idx) => {
                    const md = row.months[mk] ?? { sales: 0, cost: 0, profit: 0 };
                    const color = MONTH_COLORS[idx % MONTH_COLORS.length];
                    return (
                      <React.Fragment key={mk}>
                        <td className="p-3 text-slate-600 border-r border-slate-100">{formatTableCurrency(md.sales)}</td>
                        <td className="p-3 text-slate-400 border-r border-slate-100">{formatTableCurrency(md.cost)}</td>
                        <td className={`p-3 font-medium border-r border-slate-100 ${md.profit < 0 ? 'text-red-500' : color.text}`}>
                          {formatTableCurrency(md.profit)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-3 font-semibold text-slate-800 border-r border-slate-100 bg-slate-50/30">{formatTableCurrency(row.totalSales)}</td>
                  <td className="p-3 text-slate-500 border-r border-slate-100 bg-slate-50/30">{formatTableCurrency(row.totalCost)}</td>
                  <td className={`p-3 font-bold border-r border-slate-100 bg-slate-50/30 ${row.totalProfit < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatTableCurrency(row.totalProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-800 text-white font-bold sticky bottom-0">
              <tr>
                <td className="p-3 text-center border-r border-slate-600 sticky left-0 bg-slate-800 z-10">합계</td>
                {months.map(mk => {
                  const md = totals.byMonth[mk] ?? { sales: 0, cost: 0, profit: 0 };
                  return (
                    <React.Fragment key={mk}>
                      <td className="p-3 text-right border-r border-slate-600">{formatTableCurrency(md.sales)}</td>
                      <td className="p-3 text-right border-r border-slate-600 text-slate-300">{formatTableCurrency(md.cost)}</td>
                      <td className="p-3 text-right border-r border-slate-600 text-yellow-300">{formatTableCurrency(md.profit)}</td>
                    </React.Fragment>
                  );
                })}
                <td className="p-3 text-right border-r border-slate-600 bg-slate-900">{formatTableCurrency(totals.totalSales)}</td>
                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-slate-300">{formatTableCurrency(totals.totalCost)}</td>
                <td className="p-3 text-right border-r border-slate-600 bg-slate-900 text-yellow-400">{formatTableCurrency(totals.totalProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  // --- 데이터 입력 뷰 ---
  const InputView = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* 파일 업로드 섹션 */}
      <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6 text-indigo-600" />
          데이터 파일 일괄 업로드
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          매출 데이터 엑셀 파일(.xlsx)을 업로드하세요.<br />
          (헤더 행에서 월 정보를 자동 감지합니다)
        </p>

        {/* 업로드 타입 토글 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setUploadType('product')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'product'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <Package className="w-4 h-4" />
            제품별 데이터
          </button>
          <button
            onClick={() => setUploadType('division')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadType === 'division'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <Building2 className="w-4 h-4" />
            부문별 데이터
          </button>
        </div>

        {/* 병합 모드 (제품별 데이터에서만 표시) */}
        {uploadType === 'product' && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">업로드 방식</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={mergeMode === 'overwrite'}
                  onChange={() => setMergeMode('overwrite')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <RefreshCcw className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-sm font-medium text-slate-700">덮어쓰기</span>
                  <p className="text-xs text-slate-500">기존 데이터를 새 데이터로 대체</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={mergeMode === 'merge'}
                  onChange={() => setMergeMode('merge')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <GitMerge className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-sm font-medium text-slate-700">병합</span>
                  <p className="text-xs text-slate-500">기존 데이터와 합치기 (같은 제품은 업데이트)</p>
                </div>
              </label>
            </div>
          </div>
        )}
        <div
          className={`border-2 border-dashed border-indigo-200 rounded-xl p-8 bg-indigo-50/50 text-center transition-colors ${isUploading ? 'opacity-60 cursor-wait' : 'hover:bg-indigo-50 cursor-pointer'}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          {isUploading ? (
            <>
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-indigo-900 font-medium">파일 처리 중...</p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <p className="text-indigo-900 font-medium">
                클릭하여 {uploadType === 'division' ? '부문별' : '제품별'} 파일 업로드
              </p>
              <p className="text-xs text-indigo-400 mt-1">.xlsx, .xls 파일 지원</p>
            </>
          )}
        </div>
      </div>

      {/* 개별 입력 섹션 */}
      <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-blue-600" />
          개별 데이터 입력
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">제품군 명칭</label>
            <input
              id="new-product"
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="예: NGS, i-oneNet"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {months.map((mk, idx) => {
              const color = MONTH_COLORS[idx % MONTH_COLORS.length];
              return (
                <div key={mk} className={`space-y-4 p-4 rounded-lg border ${color.bgLight} border-slate-200`}>
                  <h4 className="font-semibold text-slate-800">{getMonthShortLabel(mk)} 데이터</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">매출액</label>
                    <input
                      id={`new-sales-${mk}`}
                      type="number"
                      defaultValue={0}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">매입액</label>
                    <input
                      id={`new-cost-${mk}`}
                      type="number"
                      defaultValue={0}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleAddEntry}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-md transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            데이터 저장
          </button>
        </div>
      </div>

      {/* 목록 리스트 */}
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-4">현재 데이터 목록({data.length}건)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">제품군</th>
                {months.map(mk => (
                  <th key={mk} className="p-3 text-right">{getMonthShortLabel(mk)} 매출</th>
                ))}
                <th className="p-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{item.product}</td>
                  {months.map(mk => (
                    <td key={mk} className="p-3 text-right text-slate-600">
                      {formatCurrency(getMonthData(item, mk).sales)}
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce-in ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
          {notification.type === 'error' ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hunesion Solution</h1>
              <p className="text-xs text-slate-500 font-medium">사업본부 매출 현황(Executive Report)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Firestore 동기화 상태 */}
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
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Cloud className="w-3.5 h-3.5" />
                동기화됨
              </span>
            ) : null}

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              대시보드
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'input' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Plus className="w-4 h-4" />
              데이터 입력
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-slate-600 hover:bg-slate-100"
            >
              <BarChart3 className="w-4 h-4" />
              부문별 보고서
            </button>
            <button
              onClick={() => navigate('/achievement')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-slate-600 hover:bg-slate-100"
            >
              <Target className="w-4 h-4" />
              달성 현황
            </button>

            {/* 관리자 메뉴 */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-slate-600 hover:bg-slate-100"
                >
                  <Settings className="w-4 h-4" />
                  관리
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
                </button>
                {showAdminMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAdminMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                      <button
                        onClick={() => {
                          navigate('/admin/divisions');
                          setShowAdminMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        영업부문 관리
                      </button>
                      <button
                        onClick={() => {
                          navigate('/admin/products');
                          setShowAdminMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-emerald-500" />
                        제품 마스터 관리
                      </button>
                      <button
                        onClick={() => {
                          navigate('/admin/users');
                          setShowAdminMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4 text-blue-500" />
                        사용자 관리
                      </button>
                      <button
                        onClick={() => {
                          navigate('/admin/targets');
                          setShowAdminMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Target className="w-4 h-4 text-amber-500" />
                        목표 관리
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 사용자 정보 및 로그아웃 */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{user?.displayName}</span>
                {isAdmin && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">관리자</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">데이터를 불러오는 중...</p>
          </div>
        ) : (
          activeTab === 'dashboard' ? <DashboardView /> : <InputView />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400 text-xs">
        &copy; 2026 Hunesion Solution Business Division. Confidential.
      </footer>
    </div>
  );
}
