"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  Calendar as CalendarIcon,
  ArrowRightLeft,
  Briefcase,
  Sparkles,
  Zap,
  BarChart3,
  MoreHorizontal
} from "lucide-react";
import Modal from "@/components/ui/Modal";

type ShiftType = "filled" | "empty" | "leave" | "sick";

interface ShiftData {
  id: string;
  day: number;
  type: ShiftType;
  name: string;
  role: string;
  time: string;
}

const DAYS_HEADER = [
  { name: "Senin", date: "12" },
  { name: "Selasa", date: "13" },
  { name: "Rabu", date: "14" },
  { name: "Kamis", date: "15" },
  { name: "Jumat", date: "16" },
  { name: "Sabtu", date: "17" },
  { name: "Minggu", date: "18" },
];

export default function Schedule() {
  const [scheduleData, setScheduleData] = useState<Record<string, ShiftData[]>>({});
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ roleKey: string; shiftIdx: number } | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setIsLoadingData(true);
        setTimeout(() => {
            setIsLoadingData(false);
        }, 1000); 

      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoadingData(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleAutoGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newData = { ...scheduleData };
      Object.keys(newData).forEach((roleKey) => {
        newData[roleKey] = newData[roleKey].map((slot) => {
          if (slot.type === "empty") {
            return {
              ...slot,
              type: "filled",
              name: "AI-Filled",
              time: "08:00 - 16:00",
            };
          }
          return slot;
        });
      });
      setScheduleData(newData);
      setIsProcessing(false);
      setIsAutoScheduleOpen(false);
    }, 1500);
  };

  const handleSlotClick = (roleKey: string, shiftIdx: number) => {
    if (!isSwapMode) return;
    
    if (selectedSlot === null) {
      setSelectedSlot({ roleKey, shiftIdx });
    } else {
      const newData = { ...scheduleData };
      const slotA = newData[selectedSlot.roleKey][selectedSlot.shiftIdx];
      const slotB = newData[roleKey][shiftIdx];

      const temp = { type: slotA.type, name: slotA.name, time: slotA.time };
      
      newData[selectedSlot.roleKey][selectedSlot.shiftIdx] = {
        ...slotA,
        type: slotB.type,
        name: slotB.name,
        time: slotB.time,
      };

      newData[roleKey][shiftIdx] = {
        ...slotB,
        type: temp.type,
        name: temp.name,
        time: temp.time,
      };

      setScheduleData(newData);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 px-3 text-sm font-bold text-slate-700">
              <CalendarIcon className="w-4 h-4 text-slate-400" /> 12 - 18 Jan 2026
            </div>
            <button className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="bg-slate-100 rounded-lg p-1 hidden sm:flex">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === "week" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                viewMode === "month" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all cursor-pointer ${
            isSwapMode ? "bg-indigo-50 border-indigo-200 shadow-inner" : "bg-white border-slate-200"
          }`}
          onClick={() => {
            setIsSwapMode(!isSwapMode);
            setSelectedSlot(null);
          }}
        >
          <div className={`p-1 rounded-full ${isSwapMode ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-200 text-slate-500"}`}>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${isSwapMode ? "text-indigo-700" : "text-slate-600"}`}>Mode Tukar</span>
            <span className="text-[10px] text-slate-400 leading-none hidden sm:block">
              {isSwapMode ? "Pilih 2 slot untuk ditukar" : "Klik untuk aktifkan"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoScheduleOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Auto-Generate</span>
          </button>
          <button className="p-2 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all">
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" /> Share WA
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <div className="min-w-250 h-full flex flex-col">
            <div className="grid grid-cols-[150px_repeat(7,1fr)] sticky top-0 z-30 bg-slate-50 border-b border-slate-200">
              <div className="p-3 border-r border-slate-200 flex items-center justify-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posisi</span>
              </div>
              {DAYS_HEADER.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 text-center border-r border-slate-200 last:border-r-0 ${idx === 3 ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">{day.name}</div>
                  <div className={`text-sm font-bold ${idx === 3 ? "text-indigo-600" : "text-slate-800"}`}>{day.date}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 bg-white">
              {isLoadingData ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-slate-500 font-medium">Memuat Jadwal...</span>
                    </div>
                </div>
              ) : Object.keys(scheduleData).length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    Belum ada data jadwal
                </div>
              ) : (
                Object.entries(scheduleData).map(([role, shifts]) => (
                <div key={role} className="grid grid-cols-[150px_repeat(7,1fr)] border-b border-slate-100 min-h-25">
                  <div className="p-4 border-r border-slate-200 bg-white sticky left-0 z-20 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-600">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pl-1 mt-1">
                      <BarChart3 className="w-3 h-3 text-slate-400" />
                      <span>{shifts.filter((s) => s.type === "filled").length} Shift</span>
                    </div>
                  </div>

                  {shifts.map((shift, shiftIdx) => {
                    const isSelected = selectedSlot?.roleKey === role && selectedSlot?.shiftIdx === shiftIdx;
                    return (
                      <div
                        key={shift.id}
                        onClick={() => handleSlotClick(role, shiftIdx)}
                        className={`border-r border-slate-100 last:border-r-0 p-2 transition-all relative
                          ${isSwapMode ? "cursor-pointer hover:bg-indigo-50/50" : ""}
                          ${isSelected ? "bg-indigo-100 ring-2 ring-inset ring-indigo-500" : ""}
                        `}
                      >
                        {shift.type === "filled" && (
                          <div
                            className={`h-full w-full bg-white border rounded-lg p-2 flex flex-col justify-between shadow-sm relative overflow-hidden group
                              ${isSwapMode ? "pointer-events-none" : "hover:border-indigo-300 hover:shadow-md transition-all"}
                              ${isSelected ? "border-indigo-500" : "border-slate-200"}
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-100 to-slate-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 border border-indigo-50 shrink-0">
                                {shift.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 text-xs block truncate">{shift.name}</span>
                                <span className="text-[10px] text-slate-500 block leading-tight">
                                  {shift.time.split(" - ")[0]}
                                </span>
                              </div>
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-3 h-3 text-slate-400" />
                            </div>
                          </div>
                        )}

                        {shift.type === "empty" && (
                          <div
                            className={`h-full w-full border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1
                              ${isSelected ? "border-indigo-50 bg-indigo-50" : "bg-slate-50/50"}
                            `}
                          >
                            <span className="text-[9px] font-bold text-slate-300 uppercase">Kosong</span>
                          </div>
                        )}

                        {shift.type === "leave" && (
                          <div className="h-full w-full bg-rose-50/50 border border-rose-100 rounded-lg flex flex-col justify-center items-center">
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">CUTI</span>
                            <span className="text-[9px] text-rose-400">{shift.name.split(" ")[0]}</span>
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

      <Modal
        isOpen={isAutoScheduleOpen}
        onClose={() => setIsAutoScheduleOpen(false)}
        title="Generate Jadwal Cerdas"
        footer={
          !isProcessing && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAutoScheduleOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleAutoGenerate}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Jalankan Algoritma
              </button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-bold text-slate-700">AI sedang menghitung ketersediaan...</p>
              <p className="text-xs text-slate-500">Menganalisis slot kosong & distribusi jam kerja.</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-sm flex gap-3">
                <Sparkles className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Algoritma Fairness:</strong> Sistem akan otomatis mengisi slot kosong dengan karyawan yang
                  memiliki jam kerja paling sedikit minggu ini.
                </div>
              </div>
              <p className="text-sm text-slate-600">Apakah Anda yakin ingin melanjutkan?</p>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Bagikan ke WhatsApp"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => window.open("https://wa.me/", "_blank")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Kirim Sekarang
            </button>
          </div>
        }
      >
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 font-mono">
          Halo Tim 👋 <br />
          <br />
          Berikut jadwal final minggu ini (12-18 Jan).
          <br />
          Total Shift: 42
          <br />
          Revisi Terakhir: Baru saja
          <br />
          <br />
          Silakan cek gambar terlampir. Terima kasih!
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">*Gambar jadwal akan digenerate otomatis.</p>
      </Modal>
    </div>
  );
}