export interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  employee_id?: string;
  time: string;
  role: string;
  date?: string;
  shift_name?: string;
  division?: string;
  user_id?: string;
  employee_name?: string; 
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  division: string;
  status: string;
  user_id?: string;
  pin?: string;
}

export interface PublicShift {
  id: string;
  employee_id: string;
  employee_name: string;
  role: string;
  shift_name: string;
  shift_time: string;
  date: string;
  type: string;
  division?: string;
}

export interface Request {
  id: string;
  type: 'swap' | 'leave';
  status: string;
  requester_name?: string;
  original_date: string;
  target_date?: string;
  reason: string;
  target_employee_id?: string;
  requester_id: string;
}

export interface RequestPayload {
  requester_id: string;
  type: 'swap' | 'leave';
  status: string;
  leave_date: string | null;
  original_date: string;
  target_date: string | null;
  reason: string;
  target_employee_id?: string;
}

export interface ShiftPattern {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}