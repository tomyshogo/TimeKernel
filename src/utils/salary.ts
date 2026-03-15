import { NightShiftSettings } from '../types';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

interface ShiftPayResult {
  hours: number;
  pay: number;
  normalHours: number;
  nightHours: number;
}

export function calculateShiftPay(
  startTime: string,
  endTime: string,
  hourlyWage: number,
  nightShift: NightShiftSettings
): ShiftPayResult {
  let startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);

  // Handle overnight shifts (e.g., 22:00 - 02:00)
  if (endMin <= startMin) {
    endMin += 24 * 60;
  }

  const totalMinutes = endMin - startMin;

  if (!nightShift.enabled) {
    const hours = minutesToHours(totalMinutes);
    return {
      hours,
      pay: Math.round(hours * hourlyWage),
      normalHours: hours,
      nightHours: 0,
    };
  }

  const nightStartMin = timeToMinutes(nightShift.startTime);
  let normalMinutes = 0;
  let nightMinutes = 0;

  for (let min = startMin; min < endMin; min++) {
    const timeOfDay = min % (24 * 60);
    if (timeOfDay >= nightStartMin || timeOfDay < 5 * 60) {
      nightMinutes++;
    } else {
      normalMinutes++;
    }
  }

  const normalHours = minutesToHours(normalMinutes);
  const nightHours = minutesToHours(nightMinutes);
  const pay = Math.round(
    normalHours * hourlyWage + nightHours * hourlyWage * nightShift.multiplier
  );

  return {
    hours: minutesToHours(totalMinutes),
    pay,
    normalHours,
    nightHours,
  };
}

export function calculateMonthlySummary(
  shifts: Array<{ startTime: string; endTime: string; hourlyWage: number }>,
  nightShift: NightShiftSettings
): { totalHours: number; totalPay: number } {
  let totalHours = 0;
  let totalPay = 0;

  for (const shift of shifts) {
    const result = calculateShiftPay(
      shift.startTime,
      shift.endTime,
      shift.hourlyWage,
      nightShift
    );
    totalHours += result.hours;
    totalPay += result.pay;
  }

  return { totalHours: Math.round(totalHours * 100) / 100, totalPay };
}
