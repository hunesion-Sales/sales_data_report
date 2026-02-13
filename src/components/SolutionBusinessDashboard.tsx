import React, { useState, useMemo, useRef, useCallback } from 'react';
import { parseExcelFile } from '../utils/excelParser';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import {
  LayoutDashboard, Table as TableIcon, Plus, Save, TrendingUp,
  DollarSign, Calendar, Printer, Upload, FileText, X
} from 'lucide-react';

// --- 타입 정의 ---
interface ProductData {
  id: number | string;
  product: string;
  janSales: number;
  janCost: number;
  febSales: number;
  febCost: number;
}

interface ProcessedProduct extends ProductData {
  janProfit: number;
  febProfit: number;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

interface Totals {
  janSales: number;
  janCost: number;
  janProfit: number;
  febSales: number;
  febCost: number;
  febProfit: number;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// --- 초기 데이터 (사용자가 제공한 데이터 기반) ---
const INITIAL_DATA: ProductData[] = [
  { id: 1, product: 'NGS', janSales: 62746250, janCost: 6655000, febSales: 0, febCost: 0 },
  { id: 2, product: 'CamPASS', janSales: 44000, janCost: 0, febSales: 254000, febCost: 0 },
  { id: 3, product: '기타', janSales: 10789769, janCost: 0, febSales: 0, febCost: 0 },
  { id: 4, product: 'i-oneNet', janSales: 33505600, janCost: 115784000, febSales: 247968500, febCost: 27000000 },
  { id: 5, product: 'i-oneNet DD', janSales: 0, janCost: 6270000, febSales: 0, febCost: 0 },
  { id: 6, product: 'i-oneNet_MA', janSales: 271857993, janCost: 19653722, febSales: 46726181, febCost: 12860746 },
  { id: 7, product: 'i-oneNet DD_MA', janSales: 2164560, janCost: 103650, febSales: 0, febCost: 0 },
  { id: 8, product: 'i-oneNet DX_MA', janSales: 0, janCost: 350000, febSales: 0, febCost: 0 },
  { id: 9, product: 'TresDM_MA', janSales: 200000, janCost: 0, febSales: 0, febCost: 0 },
  { id: 10, product: 'NGS_MA', janSales: 61335703, janCost: 981400, febSales: 3716140, febCost: 0 },
  { id: 11, product: 'CamPASS_MA', janSales: 3018278, janCost: 0, febSales: 0, febCost: 0 },
  { id: 12, product: 'MoBiCa_MA', janSales: 11566538, janCost: 0, febSales: 100974, febCost: 0 },
  { id: 13, product: 'ViSiCa_MA', janSales: 2295600, janCost: 1751810, febSales: 0, febCost: 0 },
  { id: 14, product: 'i-oneNAC', janSales: 29200000, janCost: 2200000, febSales: 0, febCost: 0 },
  { id: 15, product: 'Safe IP', janSales: 695000, janCost: 268400, febSales: 943000, febCost: 180400 },
  { id: 16, product: 'i_oneJTac_MA', janSales: 11859925, janCost: 219600, febSales: 1167000, febCost: 0 },
  { id: 17, product: 'i-oneNAC_MA', janSales: 53758172, janCost: 580000, febSales: 10644668, febCost: 0 },
  { id: 18, product: 'NGS CLOUD', janSales: 113417679, janCost: 7286810, febSales: 14711400, febCost: 0 },
  { id: 19, product: 'i-oneNet CLOUD', janSales: 27096480, janCost: 0, febSales: 10196720, febCost: 0 },
  { id: 20, product: 'i-oneJTac CLOUD', janSales: 681250, janCost: 0, febSales: 681250, febCost: 0 },
  { id: 21, product: 'Safe IP_MA', janSales: 752510, janCost: 0, febSales: 752510, febCost: 0 },
  { id: 22, product: 'H/W', janSales: 2100000, janCost: 0, febSales: 0, febCost: 0 },
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

const cleanNumber = (str: string | number | null | undefined): number => {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  if (str.trim() === '-') return 0;
  return Number(str.replace(/,/g, '')) || 0;
};

// --- 컴포넌트 ---
export default function SolutionBusinessDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input'>('dashboard');
  const [data, setData] = useState<ProductData[]>(INITIAL_DATA);
  const [notification, setNotification] = useState<Notification | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [newEntry, setNewEntry] = useState<Omit<ProductData, 'id'>>({
    product: '',
    janSales: 0, janCost: 0,
    febSales: 0, febCost: 0
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 데이터 가공 및 통계 계산 ---
  const processedData = useMemo<ProcessedProduct[]>(() => {
    const aggregatedGroups: Record<string, ProductData> = {
      '유지보수': { id: 'maintenance_total', product: '유지보수', janSales: 0, janCost: 0, febSales: 0, febCost: 0 },
      '기타': { id: 'etc_total', product: '기타', janSales: 0, janCost: 0, febSales: 0, febCost: 0 }
    };
    const regularItems: ProductData[] = [];

    data.forEach(item => {
      if (item.product.endsWith('_MA')) {
        aggregatedGroups['유지보수'].janSales += item.janSales;
        aggregatedGroups['유지보수'].janCost += item.janCost;
        aggregatedGroups['유지보수'].febSales += item.febSales;
        aggregatedGroups['유지보수'].febCost += item.febCost;
      } else if (item.product === 'H/W' || item.product === '기타') {
        aggregatedGroups['기타'].janSales += item.janSales;
        aggregatedGroups['기타'].janCost += item.janCost;
        aggregatedGroups['기타'].febSales += item.febSales;
        aggregatedGroups['기타'].febCost += item.febCost;
      } else {
        regularItems.push(item);
      }
    });

    const aggregatedList = [...regularItems, aggregatedGroups['유지보수'], aggregatedGroups['기타']];

    return aggregatedList.map(item => {
      const janProfit = item.janSales - item.janCost;
      const febProfit = item.febSales - item.febCost;
      const totalSales = item.janSales + item.febSales;
      const totalCost = item.janCost + item.febCost;
      const totalProfit = totalSales - totalCost;

      return { ...item, janProfit, febProfit, totalSales, totalCost, totalProfit };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [data]);

  const totals = useMemo<Totals>(() => {
    return processedData.reduce((acc, curr) => ({
      janSales: acc.janSales + curr.janSales,
      janCost: acc.janCost + curr.janCost,
      janProfit: acc.janProfit + curr.janProfit,
      febSales: acc.febSales + curr.febSales,
      febCost: acc.febCost + curr.febCost,
      febProfit: acc.febProfit + curr.febProfit,
      totalSales: acc.totalSales + curr.totalSales,
      totalCost: acc.totalCost + curr.totalCost,
      totalProfit: acc.totalProfit + curr.totalProfit,
    }), {
      janSales: 0, janCost: 0, janProfit: 0,
      febSales: 0, febCost: 0, febProfit: 0,
      totalSales: 0, totalCost: 0, totalProfit: 0
    });
  }, [processedData]);

  const topProducts = useMemo(() => {
    return [...processedData]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 7);
  }, [processedData]);

  const monthlyTrend = [
    { name: '1월', sales: totals.janSales, profit: totals.janProfit },
    { name: '2월', sales: totals.febSales, profit: totals.febProfit },
  ];

  // --- 핸들러 ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: name === 'product' ? value : Number(value)
    }));
  };

  const handleAddEntry = () => {
    if (!newEntry.product) return showNotification('제품명을 입력해주세요.', 'error');
    setData([...data, { ...newEntry, id: Date.now() }]);
    setNewEntry({ product: '', janSales: 0, janCost: 0, febSales: 0, febCost: 0 });
    showNotification('데이터가 성공적으로 추가되었습니다.');
  };

  const handleDelete = (id: number | string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      setData(data.filter(item => item.id !== id));
      showNotification('데이터가 삭제되었습니다.', 'error');
    }
  };

  // --- 파일 업로드 처리 ---
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      setIsUploading(true);
      try {
        const buffer = await file.arrayBuffer();
        const result = await parseExcelFile(buffer);
        setData(result.data);
        const monthInfo = result.monthsDetected.length > 0
          ? ` (${result.monthsDetected.join(', ')})`
          : '';
        showNotification(`${result.data.length}건의 데이터를 불러왔습니다.${monthInfo}`);
        setActiveTab('dashboard');
      } catch (error) {
        console.error('Excel parsing error:', error);
        const message = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
        showNotification(message, 'error');
      } finally {
        setIsUploading(false);
      }
    } else {
      // 기존 텍스트 파일 파싱 (하위 호환)
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const lines = text.split('\n');
          const parsedData: ProductData[] = [];

          lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            if (trimmedLine.startsWith('계산서') || trimmedLine.startsWith('제품군') || trimmedLine.startsWith('전체')) return;

            let columns = trimmedLine.split('\t');
            if (columns.length < 2) {
              columns = trimmedLine.split(/\s{2,}/);
            }

            if (columns.length > 0) {
              const product = columns[0].trim();
              if (!product) return;

              const janSales = cleanNumber(columns[1]);
              const janCost = cleanNumber(columns[2]);
              const febSales = cleanNumber(columns[4]);
              const febCost = cleanNumber(columns[5]);

              parsedData.push({
                id: Date.now() + index,
                product, janSales, janCost, febSales, febCost
              });
            }
          });

          if (parsedData.length > 0) {
            setData(parsedData);
            showNotification(`${parsedData.length}건의 데이터를 불러왔습니다.`);
            setActiveTab('dashboard');
          } else {
            showNotification('유효한 데이터를 찾을 수 없습니다.', 'error');
          }
        } catch (error) {
          console.error('File parsing error:', error);
          showNotification('파일 처리 중 오류가 발생했습니다.', 'error');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, []);

  // --- 대시보드 뷰 ---
  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">누적 총 매출액</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(totals.totalSales)}</div>
          <p className="text-xs text-slate-400 mt-1">1월~2월 합계</p>
        </div>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">1월 매출</h3>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(totals.janSales)}</div>
          <p className="text-xs text-slate-400 mt-1">이익 {formatCurrencyWithUnit(totals.janProfit)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500">2월 매출</h3>
            <Calendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrencyWithUnit(totals.febSales)}</div>
          <p className="text-xs text-slate-400 mt-1">이익 {formatCurrencyWithUnit(totals.febProfit)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">주요 제품별 매출 및 이익 현황(Top 7)</h3>
          <div className="h-80">
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
          <div className="h-80">
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

      {/* Detailed Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-slate-500" />
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
                <th colSpan={3} className="p-2 border-b border-r border-slate-200 text-center bg-blue-50/50">2026년 1월</th>
                <th colSpan={3} className="p-2 border-b border-r border-slate-200 text-center bg-indigo-50/50">2026년 2월</th>
                <th colSpan={3} className="p-2 border-b border-slate-200 text-center bg-slate-200">전체 합계</th>
              </tr>
              <tr className="text-xs">
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-blue-50/30">매출액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-blue-50/30">매입액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-blue-50/30 text-blue-700">이익</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-indigo-50/30">매출액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-indigo-50/30">매입액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-indigo-50/30 text-indigo-700">이익</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매출액</th>
                <th className="p-2 border-b border-r border-slate-200 min-w-[100px] bg-slate-100">매입액</th>
                <th className="p-2 border-b border-slate-200 min-w-[100px] bg-slate-100 text-slate-900">이익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="p-3 text-left font-medium text-slate-700 border-r border-slate-100 sticky left-0 bg-white">{row.product}</td>
                  <td className="p-3 text-slate-600 border-r border-slate-100">{formatTableCurrency(row.janSales)}</td>
                  <td className="p-3 text-slate-400 border-r border-slate-100">{formatTableCurrency(row.janCost)}</td>
                  <td className={`p-3 font-medium border-r border-slate-100 ${row.janProfit < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                    {formatTableCurrency(row.janProfit)}
                  </td>
                  <td className="p-3 text-slate-600 border-r border-slate-100">{formatTableCurrency(row.febSales)}</td>
                  <td className="p-3 text-slate-400 border-r border-slate-100">{formatTableCurrency(row.febCost)}</td>
                  <td className={`p-3 font-medium border-r border-slate-100 ${row.febProfit < 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                    {formatTableCurrency(row.febProfit)}
                  </td>
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
                <td className="p-3 text-right border-r border-slate-600">{formatTableCurrency(totals.janSales)}</td>
                <td className="p-3 text-right border-r border-slate-600 text-slate-300">{formatTableCurrency(totals.janCost)}</td>
                <td className="p-3 text-right border-r border-slate-600 text-yellow-300">{formatTableCurrency(totals.janProfit)}</td>
                <td className="p-3 text-right border-r border-slate-600">{formatTableCurrency(totals.febSales)}</td>
                <td className="p-3 text-right border-r border-slate-600 text-slate-300">{formatTableCurrency(totals.febCost)}</td>
                <td className="p-3 text-right border-r border-slate-600 text-yellow-300">{formatTableCurrency(totals.febProfit)}</td>
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
        <p className="text-sm text-slate-500 mb-6">
          매출 데이터 엑셀 파일(.xlsx)을 업로드하세요.<br />
          (헤더 행에서 월 정보를 자동 감지합니다)
        </p>
        <div
          className={`border-2 border-dashed border-indigo-200 rounded-xl p-8 bg-indigo-50/50 text-center transition-colors ${isUploading ? 'opacity-60 cursor-wait' : 'hover:bg-indigo-50 cursor-pointer'}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.txt"
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
              <p className="text-indigo-900 font-medium">클릭하여 파일 업로드</p>
              <p className="text-xs text-indigo-400 mt-1">.xlsx, .xls, .txt 파일 지원</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">제품군 명칭</label>
            <input
              type="text" name="product" value={newEntry.product} onChange={handleInputChange}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="예: NGS, i-oneNet"
            />
          </div>

          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800">1월 데이터</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">매출액</label>
              <input
                type="number" name="janSales" value={newEntry.janSales} onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">매입액</label>
              <input
                type="number" name="janCost" value={newEntry.janCost} onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h4 className="font-semibold text-indigo-800">2월 데이터</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">매출액</label>
              <input
                type="number" name="febSales" value={newEntry.febSales} onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">매입액</label>
              <input
                type="number" name="febCost" value={newEntry.febCost} onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
            </div>
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
                <th className="p-3 text-right">1월 매출</th>
                <th className="p-3 text-right">2월 매출</th>
                <th className="p-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700">{item.product}</td>
                  <td className="p-3 text-right text-slate-600">{formatCurrency(item.janSales)}</td>
                  <td className="p-3 text-right text-slate-600">{formatCurrency(item.febSales)}</td>
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

          <div className="flex gap-2">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? <DashboardView /> : <InputView />}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400 text-xs">
        &copy; 2026 Hunesion Solution Business Division. Confidential.
      </footer>
    </div>
  );
}
