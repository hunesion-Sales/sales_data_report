import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import type { ProductData, TargetAchievement } from '@/types';

const mockData: ProductData[] = [
  {
    id: '1',
    product: 'Product A',
    months: {
      '2026-01': { sales: 1000000, cost: 600000 },
      '2026-02': { sales: 2000000, cost: 1200000 },
    },
  },
  {
    id: '2',
    product: 'Product B',
    months: {
      '2026-01': { sales: 500000, cost: 300000 },
      '2026-02': { sales: 800000, cost: 400000 },
    },
  },
  {
    id: '3',
    product: 'Test_MA',
    months: {
      '2026-01': { sales: 100000, cost: 50000 },
      '2026-02': { sales: 150000, cost: 80000 },
    },
  },
];

const mockMonths = ['2026-01', '2026-02'];
const emptyAchievements: TargetAchievement[] = [];

const defaultOpts = {
  data: mockData,
  months: mockMonths,
  viewMode: 'sales' as const,
  divisionAchievements: emptyAchievements,
  totalSalesTarget: 10000000,
  totalProfitTarget: 5000000,
  selectedMonthKeys: ['2026-01', '2026-02'],
  backlogMonthKeys: ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'],
  previousData: [] as ProductData[],
  backlogByMonth: {} as Record<string, { sales: number; cost: number }>,
  backlogByProductGroup: {} as Record<string, { sales: number; cost: number }>,
  backlogByDivision: {} as Record<string, { sales: number; cost: number }>,
  backlogByIndustryGroup: {} as Record<string, { sales: number; cost: number }>,
  industryGroupData: [] as Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>,
  prevIndustryGroupData: [] as Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }>,
  productGroupTargetTotal: { sales: 10000000, profit: 5000000 },
  productGroupTargetByGroup: {} as Record<string, { sales: number; profit: number }>,
  year: 2026,
};

describe('useDashboardData', () => {
  it('computes kpiData with correct actual total (sales mode)', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));

    // total sales: 1000000+2000000+500000+800000+100000+150000 = 4550000
    expect(result.current.kpiData.actual).toBe(4550000);
  });

  it('computes kpiData with correct actual total (profit mode)', () => {
    const { result } = renderHook(() =>
      useDashboardData({ ...defaultOpts, viewMode: 'profit' })
    );

    // total profit: (1000000-600000)+(2000000-1200000)+(500000-300000)+(800000-400000)+(100000-50000)+(150000-80000)
    // = 400000 + 800000 + 200000 + 400000 + 50000 + 70000 = 1920000
    expect(result.current.kpiData.actual).toBe(1920000);
  });

  it('computes achievementRate correctly', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));

    // annualActual (all 12 months, only 01/02 have data) = 4550000
    // annualTarget = 10000000
    // achievementRate = 4550000 / 10000000 * 100 = 45.5
    expect(result.current.kpiData.achievementRate).toBeCloseTo(45.5, 1);
  });

  it('computes backlog in expectedPerformance', () => {
    const backlogByMonth = {
      '2026-03': { sales: 500000, cost: 200000 },
      '2026-04': { sales: 300000, cost: 100000 },
    };

    const { result } = renderHook(() =>
      useDashboardData({ ...defaultOpts, backlogByMonth })
    );

    // expectedPerformance = annualActual(4550000) + annualBacklog(800000) = 5350000
    expect(result.current.kpiData.expectedPerformance).toBe(5350000);
    expect(result.current.kpiData.backlogTotal).toBe(800000);
  });

  it('computes YoY growth rate', () => {
    const previousData: ProductData[] = [
      {
        id: 'p1',
        product: 'Product A',
        months: {
          '2025-01': { sales: 800000, cost: 500000 },
          '2025-02': { sales: 1500000, cost: 900000 },
        },
      },
    ];

    const { result } = renderHook(() =>
      useDashboardData({ ...defaultOpts, previousData })
    );

    // prevYearActual (months 01, 02) = 800000 + 1500000 = 2300000
    // current actual (months 01, 02) = 4550000
    // growthRate = (4550000 - 2300000) / 2300000 * 100 ≈ 97.83
    expect(result.current.kpiData.prevYearActual).toBe(2300000);
    expect(result.current.kpiData.periodGrowthRate).toBeCloseTo(97.83, 0);
  });

  it('generates monthRangeText correctly', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));
    expect(result.current.monthRangeText).toBe('1월~2월');
  });

  it('generates 12 monthly trend data points', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));

    expect(result.current.monthlyTrendData).toHaveLength(12);
    expect(result.current.monthlyTrendData[0].name).toBe('1월');
    expect(result.current.monthlyTrendData[11].name).toBe('12월');
  });

  it('monthly trend includes correct currentActual values', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));

    // January: 1000000+500000+100000 = 1600000
    expect(result.current.monthlyTrendData[0].currentActual).toBe(1600000);
    // February: 2000000+800000+150000 = 2950000
    expect(result.current.monthlyTrendData[1].currentActual).toBe(2950000);
    // March: 0 (no data)
    expect(result.current.monthlyTrendData[2].currentActual).toBe(0);
  });

  it('generates productGroupChartData sorted by currentActual descending', () => {
    const { result } = renderHook(() => useDashboardData(defaultOpts));

    const pgData = result.current.productGroupChartData;
    expect(pgData.length).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < pgData.length - 1; i++) {
      expect(pgData[i].currentActual).toBeGreaterThanOrEqual(pgData[i + 1].currentActual);
    }
  });

  it('generates industryGroupChartData from industryGroupData', () => {
    const industryGroupData: Array<{ industryGroupName: string; months: Record<string, { sales: number; cost: number }> }> = [
      {
        industryGroupName: '공공',
        months: { '2026-01': { sales: 500000, cost: 200000 }, '2026-02': { sales: 300000, cost: 100000 } },
      },
      {
        industryGroupName: '금융',
        months: { '2026-01': { sales: 200000, cost: 80000 } },
      },
    ];

    const { result } = renderHook(() =>
      useDashboardData({ ...defaultOpts, industryGroupData })
    );

    const igData = result.current.industryGroupChartData;
    expect(igData.length).toBe(2);
    // sorted by currentActual desc: 공공(800000) > 금융(200000)
    expect(igData[0].name).toBe('공공');
    expect(igData[0].currentActual).toBe(800000);
    expect(igData[1].name).toBe('금융');
    expect(igData[1].currentActual).toBe(200000);
  });

  it('generates divisionChartData from achievements', () => {
    const divisionAchievements: TargetAchievement[] = [
      {
        target: {
          id: 't1', year: 2026, quarter: 'Q1',
          divisionId: 'div1', salesTarget: 5000000, profitTarget: 2000000,
          createdBy: 'admin', createdAt: new Date(), updatedAt: new Date(),
        },
        divisionName: '솔루션사업1부',
        actualSales: 3000000,
        actualProfit: 1200000,
        salesAchievementRate: 60,
        profitAchievementRate: 60,
        status: 'behind',
      },
    ];

    const { result } = renderHook(() =>
      useDashboardData({ ...defaultOpts, divisionAchievements })
    );

    const divData = result.current.divisionChartData;
    expect(divData.length).toBe(1);
    expect(divData[0].name).toBe('솔루션사업1부');
    expect(divData[0].target).toBe(5000000);
    expect(divData[0].actual).toBe(3000000);
    expect(divData[0].achievementRate).toBe(60);
  });

  it('handles empty data gracefully', () => {
    const { result } = renderHook(() =>
      useDashboardData({
        ...defaultOpts,
        data: [],
        months: [],
        selectedMonthKeys: [],
        backlogMonthKeys: [],
      })
    );

    expect(result.current.kpiData.actual).toBe(0);
    expect(result.current.monthlyTrendData).toHaveLength(12);
    expect(result.current.productGroupChartData).toHaveLength(0);
    expect(result.current.monthRangeText).toBe('');
  });
});
