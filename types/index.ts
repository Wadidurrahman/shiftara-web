export type ShiftType = 'filled' | 'empty' | 'leave';

export interface ShiftData {
  id: string;
  type: ShiftType;
  name?: string;
  time: string;
  role: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: 'active' | 'inactive';
}