"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Printer, X } from "lucide-react"; 
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
}

interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  schedule: Record<string, ShiftData[]>;
  roles: string[];
  currentDate: Date;
  viewMode?: 'weekly' | 'monthly'; 
}

export default function SchedulePreviewModal({
  isOpen,
  onClose,
  onPublish,
  schedule,
  roles,
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

  const datesToRender = generateDays(); // Array berisi objek Date (bisa 7, 30, atau 31 item)

  // Helper Cek Hari Ini
  const isToday = (dateToCheck: Date) => {
    return dateToCheck.getDate() === browserDate.getDate() &&
           dateToCheck.getMonth() === browserDate.getMonth() &&
           dateToCheck.getFullYear() === browserDate.getFullYear();
  };

  // Helper Format Range Judul
  const getRangeLabel = () => {
    const first = datesToRender[0];
    const last = datesToRender[datesToRender.length - 1];
    
    if(!first || !last) return "-";

    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${first.toLocaleDateString('id-ID', opts)} - ${last.toLocaleDateString('id-ID', opts)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Container Modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* 1. HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800">
                    Konfirmasi Jadwal ({viewMode === 'monthly' ? 'Bulanan' : 'Mingguan'})
                </h3>
                <p className="text-xs text-slate-500">Periode: <span className="font-semibold text-blue-600">{getRangeLabel()}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. ISI TABEL (SCROLLABLE) */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6 relative">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm inline-block min-w-full">
            <table className="border-collapse text-sm w-full">
              <thead className="sticky top-0 z-20">
                <tr className="bg-blue-600 text-white shadow-md">
                  {/* Kolom Nama Role (Sticky Kiri) */}
                  <th className="p-4 text-left font-bold border-r border-blue-500 sticky left-0 bg-blue-600 z-30 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    Posisi / Tanggal
                  </th>
                  
                  {/* Loop Kolom Tanggal Dinamis */}
                  {datesToRender.map((dateObj, i) => {
                    const active = isToday(dateObj);
                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' }); // Sen, Sel...
                    const dayNum = dateObj.getDate();

                    return (
                      <th key={i} className={`p-2 text-center font-bold min-w-[60px] border-l border-blue-500 ${active ? 'bg-amber-400 text-amber-900 ring-4 ring-inset ring-amber-400/20' : ''}`}>
                        <div className="uppercase text-[10px] opacity-80 tracking-widest">{dayName}</div>
                        <div className="text-lg font-bold leading-none mt-1">{dayNum}</div>
                        {active && <span className="inline-block text-[8px] bg-white text-amber-800 rounded px-1 mt-1 font-bold shadow-sm">HARI INI</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {roles.map((role) => (
                  <tr key={role} className="hover:bg-slate-50 transition-colors group">
                    {/* Baris Role (Sticky Kiri) */}
                    <td className="p-4 font-bold text-slate-700 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {role}
                    </td>

                    {/* Loop Isi Jadwal */}
                    {datesToRender.map((dateObj, i) => {
                      // Note: Di sini kita perlu logic pencocokan tanggal yang akurat jika datanya 'monthly'
                      // Karena struktur 'schedule[role]' Anda saat ini mungkin masih array 0-6 (mingguan).
                      // Untuk Full Monthly support, struktur data 'schedule' di parent juga harus disesuaikan.
                      // Code ini mengasumsikan mapping index sederhana untuk preview Weekly.
                      
                      // Fallback visual untuk mode mingguan (menggunakan index i)
                      // Jika mode bulanan, logic pengambilan data harus by Date String, bukan index.
                      
                      const slot = viewMode === 'weekly' ? schedule[role]?.[i] : null; 
                      // TODO: Jika Monthly, cari slot berdasarkan tanggal dateObj.toISOString().split('T')[0]

                      const active = isToday(dateObj);
                      
                      return (
                        <td key={i} className={`p-2 border-l border-slate-100 text-center align-top h-20 min-w-[80px] ${active ? 'bg-amber-50/50' : ''}`}>
                          {/* Logic Tampilan Slot */}
                          {!slot || slot.type === 'empty' ? (
                             <span className="text-slate-200 text-2xl font-light">-</span>
                          ) : slot.type === 'leave' ? (
                             <div className="flex flex-col items-center justify-center h-full">
                                <div className="bg-red-50 text-red-600 text-[9px] font-bold py-1 px-2 rounded-full border border-red-100">
                                    OFF
                                </div>
                             </div>
                          ) : (
                             <div className="flex flex-col gap-1 items-center justify-center h-full">
                                <span className="font-bold text-slate-800 text-[10px] leading-tight block truncate w-full">
                                  {slot.name?.split(' ')[0]}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${active ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                  {slot.shift_name}
                                </span>
                             </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <Printer className="w-4 h-4"/> 
            <span>Mode Tampilan: <strong>{viewMode === 'monthly' ? 'Bulanan (30/31 Hari)' : 'Mingguan (7 Hari)'}</strong></span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="px-6">
              Batal
            </Button>
            <Button onClick={onPublish} className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-100 px-8 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> 
              Publikasikan Jadwal
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}