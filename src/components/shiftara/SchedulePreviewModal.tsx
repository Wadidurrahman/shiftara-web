"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Printer, X, Users, Clock, User } from "lucide-react"; 
import { Button } from "@/components/ui/button";

interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  shift_name?: string;
  time?: string;
  role?: string;
  date?: string;
  employee_id?: string;
  division?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    division: string;
}

interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  schedule: Record<string, ShiftData[]>;
  groupedEmployees: Record<string, Employee[]>;
  sortedDivisions: string[];
  currentDate: Date;
  viewMode?: 'weekly' | 'monthly'; 
}

export default function SchedulePreviewModal({
  isOpen,
  onClose,
  onPublish,
  schedule,
  groupedEmployees,
  sortedDivisions,
  currentDate,
  viewMode = 'weekly', 
}: SchedulePreviewModalProps) {
  
  const [browserDate, setBrowserDate] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBrowserDate(new Date());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !browserDate) return null;

  const generateDays = () => {
    const dates: Date[] = [];
    const start = new Date(currentDate);

    if (viewMode === 'weekly') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
      start.setDate(diff); 
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }
    } else {
      start.setDate(1); 
      const currentMonth = start.getMonth();
      while (start.getMonth() === currentMonth) {
        dates.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }
    return dates;
  };

  const datesToRender = generateDays();

  const isToday = (dateToCheck: Date) => {
    return dateToCheck.getDate() === browserDate.getDate() &&
           dateToCheck.getMonth() === browserDate.getMonth() &&
           dateToCheck.getFullYear() === browserDate.getFullYear();
  };

  const getRangeLabel = () => {
    const first = datesToRender[0];
    const last = datesToRender[datesToRender.length - 1];
    if(!first || !last) return "-";
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${first.toLocaleDateString('id-ID', opts)} - ${last.toLocaleDateString('id-ID', opts)}`;
  };

  return (
    <div className="fixed inset-[-20] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-16 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[85vw] flex flex-col max-h-[80vh] overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Konfirmasi Jadwal</h3>
                <p className="text-xs text-slate-500">Periode: <span className="font-semibold text-blue-600">{getRangeLabel()}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 px-0 relative">
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm inline-block min-w-full">
            <table className="border-collapse text-sm w-full">
              <thead className="sticky top-0 z-20 px-4">
                <tr className="bg-blue-600 text-white shadow-md">
                  <th className="px-10 text-left font-bold border-r border-blue-500 sticky left-0 bg-blue-600 z-30 min-w-[148px]">
                    Karyawan
                  </th>
                  {datesToRender.map((dateObj, i) => {
                    const active = isToday(dateObj);
                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    return (
                      <th key={i} className={`p-2 text-center font-bold min-w-[80px] border-l border-blue-500 ${active ? 'bg-amber-400 text-amber-900' : ''}`}>
                        <div className="uppercase text-[10px] opacity-80 tracking-widest">{dayName}</div>
                        <div className="text-lg font-bold leading-none mt-1">{dayNum}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-200">
                {sortedDivisions.map((division) => (
                  <React.Fragment key={division}>
                    <tr className="bg-slate-100">
                        <td colSpan={8} className="px-4 py-1.5 font-bold text-xs text-slate-600 sticky left-0 z-10 bg-slate-100 border-y border-slate-300">
                            <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> {division}
                            </div>
                        </td>
                    </tr>

                    {groupedEmployees[division]?.map((emp) => {
                        const rowKey = emp.id;
                        const empSchedule = schedule[rowKey];
                        if (!empSchedule) return null;

                        return (
                            <tr key={rowKey} className="hover:bg-slate-50 transition-colors group">
                                <td className="items-center px-8 border-r border-slate-300 bg-white group-hover:bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                    <div className="items-center text-sm text-slate-500">{emp.role}</div>
                                </td>

                                {datesToRender.map((dateObj, i) => {
                                    const slot = empSchedule[i]; 
                                    const active = isToday(dateObj);
                                    
                                    return (
                                        <td key={i} className={`p-1 border-l border-slate-200 text-center align-top h-16 min-w-[80px] ${active ? 'bg-amber-50/30' : ''}`}>
                                            {!slot || slot.type === 'empty' ? (
                                                <span className="text-slate-300 text-xl font-light block mt-4">-</span>
                                            ) : slot.type === 'leave' ? (
                                                <div className="mt-4 inline-block bg-red-100 text-red-700 text-[9px] font-bold py-0.5 px-2 rounded-full">
                                                    OFF
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 items-center justify-center h-full p-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold border w-full ${active ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                        {slot.shift_name}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-900">
                                                        <User className="w-3 h-3" />
                                                        {slot.name?.split(' ')[0]}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                                        <Clock className="w-2.5 h-2.5"/>
                                                        {slot.time?.split(' - ')[0]}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 z-30">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <Printer className="w-4 h-4"/> 
            <span>Siap Publikasi</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="px-6">Batal</Button>
            <Button onClick={onPublish} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Publikasikan
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}