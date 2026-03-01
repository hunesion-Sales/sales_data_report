import { describe, it, expect } from 'vitest';
import { calculateYoYRate, formatYoYRate, getYoYColorClass } from '../yoyUtils';

describe('calculateYoYRate', () => {
  it('should calculate positive growth', () => {
    expect(calculateYoYRate(120, 100)).toBeCloseTo(20);
  });

  it('should calculate negative growth', () => {
    expect(calculateYoYRate(80, 100)).toBeCloseTo(-20);
  });

  it('should return 100% when previous is 0 and current is positive', () => {
    expect(calculateYoYRate(100, 0)).toBe(100);
  });

  it('should return -100% when previous is 0 and current is negative', () => {
    expect(calculateYoYRate(-50, 0)).toBe(-100);
  });

  it('should return null when both are 0', () => {
    expect(calculateYoYRate(0, 0)).toBeNull();
  });

  it('should handle negative previous values', () => {
    const rate = calculateYoYRate(100, -50);
    // (100 - (-50)) / |-50| * 100 = 300%
    expect(rate).toBeCloseTo(300);
  });
});

describe('formatYoYRate', () => {
  it('should format positive rate with up arrow', () => {
    expect(formatYoYRate(15.5)).toBe('▲ 15.5%');
  });

  it('should format negative rate with down arrow', () => {
    expect(formatYoYRate(-10.3)).toBe('▼ 10.3%');
  });

  it('should return dash for null', () => {
    expect(formatYoYRate(null)).toBe('-');
  });

  it('should format zero rate with up arrow', () => {
    expect(formatYoYRate(0)).toBe('▲ 0.0%');
  });
});

describe('getYoYColorClass', () => {
  it('should return emerald for positive rate', () => {
    expect(getYoYColorClass(10)).toBe('text-emerald-600');
  });

  it('should return rose for negative rate', () => {
    expect(getYoYColorClass(-5)).toBe('text-rose-600');
  });

  it('should return slate for null', () => {
    expect(getYoYColorClass(null)).toBe('text-slate-400');
  });
});
