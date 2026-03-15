export interface MCPEvent {
  id: string;
  title: string;
  type: 'class' | 'event' | 'shift';
  date: string;
  startTime: string;
  endTime: string;
  hourlyWage?: number;
  color: string;
  createdBy: string;
  calendarId: string;
}

export interface ShiftSummary {
  totalHours: number;
  totalPay: number;
  shiftCount: number;
}
