"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Share2, Printer, 
  Calendar as CalendarIcon, ArrowRightLeft, 
  Sparkles, Zap, BarChart3, MoreHorizontal, Briefcase 
} from "lucide-react"; 
import { supabase } from "@/lib/supabase";
import Modal from "@/components/ui/Modal";
import { format, startOfWeek, endOfWeek, addDays, subDays, isSameDay } from "date-fns";
import { id } from "date-fns/locale"; // Untuk format tanggal Indonesia

// --- TIPE DATA SESUAI DB ---
interface ShiftData {
  id: string; // schedule.id
  type: 'filled' | 'leave' | 'empty';
  name?: string; // employee.name
  employee_id?: string;
  time: string; // shift_time
  role: string;
  date?: string;
}

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<Record<string, ShiftData[]>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State UI
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ role: string, idx: number } | null>(null);

  // --- 1. HELPER TANGGAL ---
  // Mendapatkan rentang Senin - Minggu berdasarkan currentDate
  const getWeekRange = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Senin
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { start, end };
  };

  // Generate Header Tanggal (Senin 12, Selasa 13, dst)
  const daysHeader = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
    return {
      name: format(dayDate, 'EEEE', { locale: id }),
      date: format(dayDate, 'd', { locale: id }),
      fullDate: dayDate
    };
  });

  // --- 2. FETCH DATA REAL ---
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const { start, end } = getWeekRange();
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // A. Ambil semua Role yang ada dari karyawan aktif (agar barisnya dinamis)
      const { data: employees } = await supabase
        .from('employees')
        .select('role')
        .eq('status', 'active');
      
      // Buat list role unik, misal: ['Barista', 'Kasir', 'Kitchen']
      const uniqueRoles = Array.from(new Set(employees?.map(e => e.role) || [])).sort();

      // B. Ambil Jadwal yang sudah ada di range tanggal ini
      const { data: schedules } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      // C. Mapping Data ke Struktur Grid (Role x 7 Hari)
      const newScheduleData: Record<string, ShiftData[]> = {};

      uniqueRoles.forEach(role => {
        // Untuk setiap role, buat array 7 hari
        newScheduleData[role] = daysHeader.map((day) => {
          const dateStr = format(day.fullDate, 'yyyy-MM-dd');
          
          // Cari apakah ada jadwal di DB untuk Role ini & Tanggal ini
          const found = schedules?.find(s => s.role === role && s.date === dateStr);

          if (found) {
            return {
              id: found.id,
              type: found.type === 'leave' ? 'leave' : 'filled',
              name: found.type === 'leave' ? 'CUTI / LIBUR' : found.employee_name,
              employee_id: found.employee_id,
              time: found.shift_time || '08:00 - 16:00', // Default jika null
              role: role,
              date: dateStr
            };
          }

          // Jika tidak ada, return slot kosong
          return {
            id: `empty-${role}-${dateStr}`,
            type: 'empty',
            name: '',
            time: '',
            role: role,
            date: dateStr
          };
        });
      });

      setScheduleData(newScheduleData);

    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]); // Re-fetch jika tanggal berubah

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // --- ACTIONS ---
  const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  // Placeholder Logic untuk UI (Belum connect ke update DB di snippet ini)
  const handleSlotClick = (role: string, idx: number) => {
    if (isSwapMode) {
        if (!selectedSlot) {
            setSelectedSlot({ role, idx });
        } else {
            // Logic tukar shift di sini (Panggil API Update)
            console.log("Tukar:", selectedSlot, "dengan", { role, idx });
            setIsSwapMode(false);
            setSelectedSlot(null);
            // Refresh data setelah update
            // fetchSchedule(); 
        }
    } else {
        // Logic buka modal edit/tambah shift
        console.log("Edit slot:", role, idx);
    }
  };

  const handleAutoGenerate = async () => {
      setIsProcessing(true);
      // Simulasi proses AI (Nanti diganti logic insert bulk ke Supabase)
      await new Promise(r => setTimeout(r, 1500)); 
      setIsProcessing(false);
      setIsAutoScheduleOpen(false);
      fetchSchedule(); // Refresh
  };

  const { start, end } = getWeekRange();
  const dateLabel = `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy', { locale: id })}`;

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button onClick={handlePrevWeek} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 px-4 text-sm font-bold text-slate-700 min-w-[180px] justify-center">
              <CalendarIcon className="w-4 h-4 text-slate-400" /> {dateLabel}
            </div>
            <button onClick={handleNextWeek} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* MODE TUKAR */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
            isSwapMode ? "bg-indigo-50 border-indigo-200 shadow-inner" : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
          onClick={() => { setIsSwapMode(!isSwapMode); setSelectedSlot(null); }}
        >
          <div className={`p-1 rounded-full ${isSwapMode ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-200 text-slate-500"}`}>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${isSwapMode ? "text-indigo-700" : "text-slate-600"}`}>Mode Tukar</span>
            <span className="text-[10px] text-slate-400 leading-none hidden sm:block">
              {isSwapMode ? "Pilih 2 slot" : "Klik untuk aktifkan"}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAutoScheduleOpen(true)} className="flex items-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Auto-Fill</span>
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold shadow-md">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* SCHEDULE GRID */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <div className="min-w-[1000px] h-full flex flex-col">
            
            {/* GRID HEADER (HARI) */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] sticky top-0 z-30 bg-slate-50 border-b border-slate-200">
              <div className="p-3 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posisi / Role</span>
              </div>
              {daysHeader.map((day, idx) => {
                 const active = isSameDay(day.fullDate, new Date());
                 return (
                    <div key={idx} className={`p-2 text-center border-r border-slate-200 last:border-r-0 ${active ? "bg-indigo-50/50" : ""}`}>
                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">{day.name}</div>
                        <div className={`text-sm font-bold ${active ? "text-indigo-600" : "text-slate-800"}`}>{day.date}</div>
                    </div>
                 );
              })}
            </div>

            {/* GRID BODY (DATA) */}
            <div className="flex-1 bg-white">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-slate-500 font-medium">Sinkronisasi Database...</span>
                </div>
              ) : Object.keys(scheduleData).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <CalendarIcon className="w-10 h-10 mb-2 opacity-20"/>
                    <span className="text-sm">Belum ada karyawan aktif untuk dijadwalkan.</span>
                </div>
              ) : (
                Object.entries(scheduleData).map(([role, shifts]) => (
                <div key={role} className="grid grid-cols-[180px_repeat(7,1fr)] border-b border-slate-100 min-h-[100px]">
                  
                  {/* KOLOM KIRI (ROLE) */}
                  <div className="p-4 border-r border-slate-200 bg-white sticky left-0 z-20 flex flex-col justify-center group">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm capitalize">{role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-1 mt-1">
                      <BarChart3 className="w-3 h-3 text-slate-400" />
                      <span>{shifts.filter((s) => s.type === "filled").length} Shift</span>
                    </div>
                  </div>

                  {/* KOLOM SHIFT (7 HARI) */}
                  {shifts.map((shift, shiftIdx) => {
                    const isSelected = selectedSlot?.role === role && selectedSlot?.idx === shiftIdx;
                    
                    return (
                      <div
                        key={`${role}-${shiftIdx}`}
                        onClick={() => handleSlotClick(role, shiftIdx)}
                        className={`border-r border-slate-100 last:border-r-0 p-2 transition-all relative
                          ${isSwapMode ? "cursor-pointer hover:bg-indigo-50/50" : ""}
                          ${isSelected ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500 z-10" : ""}
                        `}
                      >
                        {shift.type === "filled" && (
                          <div className={`h-full w-full bg-white border rounded-lg p-2 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${isSelected ? "border-indigo-500" : "border-slate-200 hover:border-indigo-300"}`}>
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 shrink-0">
                                {shift.name?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 text-xs block truncate">{shift.name?.split(' ')[0]}</span>
                                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                  {shift.time.split(" - ")[0]}
                                </span>
                              </div>
                            </div>
                            {/* Tombol Opsi (Titik Tiga) hanya hiasan dulu */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-3 h-3 text-slate-400" />
                            </div>
                          </div>
                        )}

                        {shift.type === "empty" && (
                          <div className={`h-full w-full border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors ${isSelected ? "border-indigo-300 bg-indigo-50" : "bg-slate-50/30 hover:bg-slate-50"}`}>
                            <PlusIcon className="w-3 h-3 text-slate-300" />
                          </div>
                        )}

                        {shift.type === "leave" && (
                          <div className="h-full w-full bg-rose-50 border border-rose-100 rounded-lg flex flex-col justify-center items-center">
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">OFF</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL AUTO GENERATE */}
      <Modal
        isOpen={isAutoScheduleOpen}
        onClose={() => setIsAutoScheduleOpen(false)}
        title="Generate Jadwal"
        footer={!isProcessing && (
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAutoScheduleOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-md">Batal</button>
              <button onClick={handleAutoGenerate} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2">
                <Zap className="w-4 h-4" /> Proses
              </button>
            </div>
        )}
      >
        <div className="space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold text-slate-700">Sedang menyusun jadwal...</p>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-sm flex gap-3">
              <Sparkles className="w-5 h-5 shrink-0" />
              <div>Mengisi slot kosong secara otomatis berdasarkan ketersediaan karyawan.</div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL SHARE */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Bagikan Jadwal"
        footer={
          <div className="flex justify-end">
            <button onClick={() => window.open(settingsWaLink || "https://wa.me/", "_blank")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Kirim ke Grup
            </button>
          </div>
        }
      >
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono">
          Halo Tim 👋 <br /><br />
          Jadwal minggu {dateLabel} sudah terbit.<br />
          Silakan cek aplikasi untuk detailnya.
        </div>
      </Modal>
    </div>
  );
}

// Icon Helper Kecil
function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
}

// Dummy link placeholder, nanti bisa ambil dari settings table juga
const settingsWaLink = "";