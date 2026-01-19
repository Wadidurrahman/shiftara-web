"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRightLeft, Sparkles, Zap, Printer, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScheduleGrid from "@/components/shiftara/ScheduleGrid";
import Modal from "@/components/ui/Modal";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  time: string;
  role: string;
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Record<string, ShiftData[]>>({});
  const [swapMode, setSwapMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{role: string, idx: number} | null>(null);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  async function fetchScheduleData() {
    const roles = ["Manager Store", "Barista Senior", "Barista Junior", "Cashier", "Kitchen Staff"];
    
    const { data: dbSchedules, error } = await supabase
      .from("schedules")
      .select("*");

    if (error) {
      console.error("Gagal mengambil jadwal:", error.message);
      return;
    }

    const formattedSchedule: Record<string, ShiftData[]> = {};
    roles.forEach(role => {
      formattedSchedule[role] = Array(7).fill(null).map((_, i) => {
        const found = dbSchedules?.find(s => s.role === role && s.day_index === i);
        return found ? {
          id: found.id,
          type: found.type,
          name: found.employee_name,
          time: found.shift_time || "08:00 - 16:00",
          role: found.role
        } : {
          id: Math.random().toString(),
          type: 'empty',
          time: "08:00 - 16:00",
          role: role
        };
      });
    });

    setSchedule(formattedSchedule);
  }

  useEffect(() => {
    (async () => {
      await fetchScheduleData();
    })();
  }, []);

  const handleSlotClick = async (role: string, idx: number) => {
    if (swapMode) {
      if (selectedSlot === null) {
        setSelectedSlot({ role, idx }); 
      } else {
        const slotA = schedule[selectedSlot.role][selectedSlot.idx];
        const slotB = schedule[role][idx];

        if (slotA.type === 'filled' && slotB.type === 'filled') {
          setIsProcessing(true);
          
          const { error: errA } = await supabase
            .from("schedules")
            .update({ employee_name: slotB.name })
            .eq("id", slotA.id);

          const { error: errB } = await supabase
            .from("schedules")
            .update({ employee_name: slotA.name })
            .eq("id", slotB.id);

          if (!errA && !errB) {
            await fetchScheduleData();
          }
          setIsProcessing(false);
        }
        setSelectedSlot(null);
      }
    }
  };

  const handleAutoGenerate = async () => {
    setIsProcessing(true);

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("name, role")
      .eq("status", "active");

    if (empError || !employees) {
      setIsProcessing(false);
      return;
    }

    const updates = [];

    for (const role in schedule) {
      for (let i = 0; i < schedule[role].length; i++) {
        const slot = schedule[role][i];
        if (slot.type === "empty") {
          const possibleStaff = employees.filter(e => e.role === role);
          if (possibleStaff.length > 0) {
            const randomStaff = possibleStaff[Math.floor(Math.random() * possibleStaff.length)];
            
            updates.push({
              role: role,
              day_index: i,
              type: 'filled',
              employee_name: randomStaff.name,
              shift_time: "08:00 - 16:00"
            });
          }
        }
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from("schedules").upsert(updates, { onConflict: 'role,day_index' });
      if (!error) await fetchScheduleData();
    }

    setIsProcessing(false);
    setIsAutoScheduleOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4"> 
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200 shadow-inner">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md text-slate-500"><ChevronLeft className="w-5 h-5" /></Button>
                <div className="flex items-center gap-2 px-4 text-sm font-bold text-primary">
                   <CalendarIcon className="w-5 h-5 text-secondary" /> 12 - 18 Jan 2026
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md text-slate-500"><ChevronRight className="w-5 h-5" /></Button>
            </div>
            <div className="bg-slate-100 rounded-md p-1 hidden sm:flex shadow-inner border border-slate-200">
                <button onClick={() => setViewMode("week")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "week" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>Mingguan</button>
                <button onClick={() => setViewMode("month")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "month" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>Bulanan</button>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => { setSwapMode(!swapMode); setSelectedSlot(null); }}
              className={`gap-2 font-bold rounded-md border transition-all ${swapMode ? "bg-secondary text-primary border-secondary shadow-md animate-pulse" : "bg-white text-primary border-slate-200 hover:bg-slate-50 hover:border-primary"}`}
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{swapMode ? "Mode Tukar Aktif" : "Tukar Shift"}</span>
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setIsAutoScheduleOpen(true)} className="gap-2 bg-primary text-white hover:bg-primary/90 font-bold rounded-md shadow-md border-2 border-primary/50">
                <Sparkles className="w-5 h-5 text-secondary" /> <span className="hidden lg:inline">Auto-Generate</span>
            </Button>
          </motion.div>
          
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500 hover:text-primary hover:border-primary rounded-md">
                <Printer className="w-5 h-5" /> 
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 border-green-200 text-green-600 hover:text-green-700 hover:border-green-300 rounded-md bg-green-50 hover:bg-green-100">
                <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ScheduleGrid 
            schedule={schedule}
            selected={selectedSlot}
            swapMode={swapMode}
            onSlotClick={handleSlotClick}
        />
      </div>

      <Modal isOpen={isAutoScheduleOpen} onClose={() => !isProcessing && setIsAutoScheduleOpen(false)} title="Generate Jadwal Cerdas">
        <div className="space-y-6 py-4">
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative w-20 h-20">
                         <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-t-secondary border-r-primary animate-spin"></div>
                         <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-secondary animate-pulse" />
                    </div>
                    <p className="text-lg font-black text-primary">AI sedang bekerja...</p>
                    <p className="text-sm text-slate-500 font-medium text-center px-4">Menganalisis ketersediaan karyawan dan mengisi slot kosong secara optimal.</p>
                </div>
            ) : (
                <>
                    <div className="p-4 bg-primary/5 text-primary rounded-lg border-2 border-dashed border-primary/30 text-sm flex gap-4 items-start">
                        <div className="p-2 bg-white rounded-md shadow-sm shrink-0">
                           <Sparkles className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <strong className="block text-lg font-black mb-1">Algoritma Smart-Fill</strong>
                            Sistem akan secara otomatis mengisi slot jadwal yang masih berstatus &quot;Kosong&quot; dengan karyawan yang memiliki peran (role) yang sesuai dan tersedia.
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 font-bold border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setIsAutoScheduleOpen(false)}>Batal</Button>
                        <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                            <Button onClick={handleAutoGenerate} className="w-full bg-primary hover:bg-primary/90 font-bold rounded-md flex items-center justify-center gap-2 shadow-md text-white">
                                <Zap className="w-5 h-5 text-secondary" /> Jalankan Algoritma
                            </Button>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
      </Modal>
    </div>
  );
}