import { calculateShiftPay, calculateMonthlySummary } from '../salary';
import { NightShiftSettings } from '../../types';

const nightShiftOff: NightShiftSettings = {
  enabled: false,
  startTime: '22:00',
  multiplier: 1.25,
};

const nightShiftOn: NightShiftSettings = {
  enabled: true,
  startTime: '22:00',
  multiplier: 1.25,
};

describe('calculateShiftPay', () => {
  describe('深夜割増なし', () => {
    it('基本計算: 3時間 × 1000円 = 3000円', () => {
      const result = calculateShiftPay('09:00', '12:00', 1000, nightShiftOff);
      expect(result.hours).toBe(3);
      expect(result.pay).toBe(3000);
      expect(result.normalHours).toBe(3);
      expect(result.nightHours).toBe(0);
    });

    it('30分単位: 1.5時間', () => {
      const result = calculateShiftPay('10:00', '11:30', 1000, nightShiftOff);
      expect(result.hours).toBe(1.5);
      expect(result.pay).toBe(1500);
    });

    it('8時間シフト', () => {
      const result = calculateShiftPay('09:00', '17:00', 1200, nightShiftOff);
      expect(result.hours).toBe(8);
      expect(result.pay).toBe(9600);
    });
  });

  describe('深夜割増あり', () => {
    it('全て通常時間帯のシフト', () => {
      const result = calculateShiftPay('09:00', '17:00', 1000, nightShiftOn);
      expect(result.nightHours).toBe(0);
      expect(result.normalHours).toBe(8);
      expect(result.pay).toBe(8000);
    });

    it('深夜時間帯にかかるシフト (18:00-23:00)', () => {
      const result = calculateShiftPay('18:00', '23:00', 1000, nightShiftOn);
      // 18:00-22:00 = 4h通常、22:00-23:00 = 1h深夜
      expect(result.normalHours).toBe(4);
      expect(result.nightHours).toBe(1);
      expect(result.pay).toBe(4000 + Math.round(1 * 1000 * 1.25));
    });

    it('完全深夜シフト (22:00-02:00)', () => {
      const result = calculateShiftPay('22:00', '02:00', 1000, nightShiftOn);
      // 22:00-02:00 = 4h全て深夜（22:00以降 or 05:00以前）
      expect(result.hours).toBe(4);
      expect(result.nightHours).toBe(4);
      expect(result.normalHours).toBe(0);
      expect(result.pay).toBe(Math.round(4 * 1000 * 1.25));
    });

    it('日をまたぐシフト (23:00-07:00)', () => {
      const result = calculateShiftPay('23:00', '07:00', 1000, nightShiftOn);
      // 23:00-05:00 = 6h深夜、05:00-07:00 = 2h通常
      expect(result.hours).toBe(8);
      expect(result.nightHours).toBe(6);
      expect(result.normalHours).toBe(2);
    });
  });

  describe('エッジケース', () => {
    it('0円時給', () => {
      const result = calculateShiftPay('09:00', '12:00', 0, nightShiftOff);
      expect(result.pay).toBe(0);
    });

    it('同じ開始終了時刻 → 24時間扱い', () => {
      const result = calculateShiftPay('09:00', '09:00', 1000, nightShiftOff);
      expect(result.hours).toBe(24);
    });
  });
});

describe('calculateMonthlySummary', () => {
  it('空配列は0', () => {
    const result = calculateMonthlySummary([], nightShiftOff);
    expect(result.totalHours).toBe(0);
    expect(result.totalPay).toBe(0);
  });

  it('複数シフトの合算', () => {
    const shifts = [
      { startTime: '09:00', endTime: '12:00', hourlyWage: 1000 },
      { startTime: '13:00', endTime: '17:00', hourlyWage: 1000 },
    ];
    const result = calculateMonthlySummary(shifts, nightShiftOff);
    expect(result.totalHours).toBe(7);
    expect(result.totalPay).toBe(7000);
  });

  it('異なる時給のシフト', () => {
    const shifts = [
      { startTime: '09:00', endTime: '12:00', hourlyWage: 1000 },
      { startTime: '18:00', endTime: '21:00', hourlyWage: 1200 },
    ];
    const result = calculateMonthlySummary(shifts, nightShiftOff);
    expect(result.totalHours).toBe(6);
    expect(result.totalPay).toBe(3000 + 3600);
  });
});
