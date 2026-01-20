"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Calendar as CalendarIcon, ArrowRightLeft, 
  ShieldCheck, AlertCircle, Share2, Printer, 
  ChevronLeft, ChevronRight, Sparkles, Send,
  CheckCircle2, X
} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import ScheduleGrid from "@/components/shiftara/ScheduleGrid";
import Modal from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// --- TIPE DATA ---
export interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  employee_id?: string;
  time: string;
  role: string;
  date?: string;
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Record<string, ShiftData[]>>({});
  const [dynamicRoles, setDynamicRoles] = useState<string[]>([]);
  const [swapMode, setSwapMode] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // State Drag/Swap
  const [sourceSlot, setSourceSlot] = useState<{role: string, idx: number} | null>(null);
  const [targetSlot, setTargetSlot] = useState<{role: string, idx: number} | null>(null);

  // State Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State Form
  const [pin, setPin] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ STATE NOTIFIKASI (PENGGANTI ALERT)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Helper: Show Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    // Hilang otomatis setelah 3 detik
    setTimeout(() => setToast(null), 3000);
  };

  const getWeekRange = useCallback((date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); 
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); 
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, []);

  const formatDateRange = (date: Date) => {
    if (viewMode === 'week') {
      const { start, end } = getWeekRange(date);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', { ...options, year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  };

  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // --- FETCH DATA ---
  const fetchScheduleData = useCallback(async () => {
    const { start, end } = getWeekRange(currentDate);
    
    // 1. Ambil Role Dinamis
    const { data: employees } = await supabase
      .from("employees")
      .select("role")
      .eq("status", "active");
    
    const uniqueRoles = Array.from(new Set(employees?.map(e => e.role) || [])).sort();
    const rolesToUse = uniqueRoles.length > 0 ? uniqueRoles : ["Manager Store", "Staff"];
    setDynamicRoles(rolesToUse);

    // 2. Ambil Jadwal
    const { data: dbSchedules } = await supabase
      .from("schedules")
      .select("*")
      .gte('date', start.toISOString())
      .lte('date', end.toISOString());

    const formattedSchedule: Record<string, ShiftData[]> = {};
    
    rolesToUse.forEach(role => {
      formattedSchedule[role] = Array(7).fill(null).map((_, i) => {
        const slotDate = new Date(start);
        slotDate.setDate(slotDate.getDate() + i);
        const dateString = slotDate.toISOString().split('T')[0];

        const found = dbSchedules?.find(s => s.role === role && s.date === dateString);

        return found ? {
             id: found.id,
             type: found.employee_id ? 'filled' : 'empty',
             name: found.employee_name || "Slot Tersedia",
             employee_id: found.employee_id,
             time: found.shift_time || "08:00 - 16:00",
             role: found.role,
             date: found.date
           } : {
             id: `temp-${role}-${i}`,
             type: 'empty',
             time: "08:00 - 16:00",
             role: role,
             date: dateString 
           };
      });
    });
    setSchedule(formattedSchedule);
  }, [currentDate, getWeekRange]); 

  useEffect(() => {
    fetchScheduleData();
    const channel = supabase.channel('realtime-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchScheduleData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchScheduleData]); 

  // --- AUTO GENERATE (FIXED: Removing day_index) ---
  const handleAutoGenerate = async () => {
    setIsProcessing(true);

    const { data: employees } = await supabase
      .from("employees")
      .select("id, name, role")
      .eq("status", "active");

    if (!employees || employees.length === 0) {
      showToast("Data Karyawan Kosong! Silakan input data dulu.", "error");
      setIsProcessing(false);
      return;
    }

    const updates = [];
    const { start } = getWeekRange(currentDate);

    for (const role of dynamicRoles) {
        const eligibleStaff = employees.filter(e => e.role === role);
        if (eligibleStaff.length === 0) continue;
        if (!schedule[role]) continue;

        for (let i = 0; i < 7; i++) {
            const slot = schedule[role][i];
            
            if (slot.type === "empty") {
                const randomStaff = eligibleStaff[Math.floor(Math.random() * eligibleStaff.length)];
                
                const targetDate = new Date(start);
                targetDate.setDate(targetDate.getDate() + i);
                const dateString = targetDate.toISOString().split('T')[0];

                updates.push({
                    role: role,
                    // ❌ day_index dihapus karena menyebabkan error schema
                    date: dateString, 
                    shift_name: 'Pagi',
                    employee_name: randomStaff.name,
                    employee_id: randomStaff.id,
                    shift_time: "08:00 - 16:00",
                });
            }
        }
    }

    if (updates.length > 0) {
        const { error } = await supabase
            .from("schedules")
            .upsert(updates, { onConflict: 'role, date' }); 
        
        if (error) {
            showToast("Error Database: " + error.message, "error");
        } else {
            showToast(`Sukses! ${updates.length} slot jadwal terisi otomatis.`, "success");
            await fetchScheduleData();
            setIsAutoScheduleOpen(false);
        }
    } else {
        showToast("Tidak ada slot kosong atau data karyawan kurang.", "info");
    }

    setIsProcessing(false);
  };

  const handlePrepareShare = () => {
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    let message = `*📅 JADWAL OPERASIONAL ${formatDateRange(currentDate).toUpperCase()}*\n----------------------------------\n`;

    for (let i = 0; i < 7; i++) {
        let hasShift = false;
        let dayMessage = `\n*${days[i]}*:\n`;

        Object.keys(schedule).forEach(role => {
            const slot = schedule[role][i];
            if (slot && slot.type === 'filled' && slot.name) {
                hasShift = true;
                dayMessage += `• ${role}: ${slot.name} (${slot.time})\n`;
            }
        });

        if (hasShift) {
            message += dayMessage;
        }
    }
    message += "\n_Dikirim otomatis via Sistem Shiftara_ 🚀";
    setShareMessage(message); 
    setIsShareModalOpen(true); 
  };

  const handleFinalSend = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
    setIsShareModalOpen(false);
  };

  const handleSlotClick = (role: string, idx: number) => {
    if (!swapMode) return;
    if (!sourceSlot) {
      const slot = schedule[role][idx];
      if (slot.type !== 'filled') {
        showToast("Pilih jadwal yang SUDAH TERISI oleh Anda.", "error");
        return;
      }
      setSourceSlot({ role, idx });
    } else if (!targetSlot) {
      const slot = schedule[role][idx];
      if (slot.type !== 'filled') {
        showToast("Target tukar juga harus terisi.", "error");
        return;
      }
      setTargetSlot({ role, idx });
      setIsConfirmOpen(true);
      setPin(""); 
      setErrorMsg("");
    }
  };

  const handleSubmitSwap = async () => {
    if (!sourceSlot || !targetSlot) return;
    setIsProcessing(true);
    setErrorMsg("");

    const slotA = schedule[sourceSlot.role][sourceSlot.idx];
    const slotB = schedule[targetSlot.role][targetSlot.idx];

    try {
      const { data: empData, error: pinError } = await supabase
        .from("employees")
        .select("id")
        .eq("id", slotA.employee_id)
        .eq("pin", pin)
        .single();

      if (pinError || !empData) throw new Error("PIN Salah! Konfirmasi gagal.");

      const { error: reqError } = await supabase
        .from("requests")
        .insert({
          requester_id: slotA.employee_id,
          target_employee_id: slotB.employee_id,
          schedule_id_from: slotA.id,
          schedule_id_to: slotB.id,
          type: 'swap',
          status: 'pending_admin'
        });

      if (reqError) throw new Error(reqError.message);

      showToast("Permintaan tukar berhasil dikirim!", "success");
      setIsConfirmOpen(false);
      setSwapMode(false);
      setSourceSlot(null);
      setTargetSlot(null);
    } catch (error) {
      if (error instanceof Error) setErrorMsg(error.message);
      else setErrorMsg("Terjadi kesalahan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setTargetSlot(null);
    setErrorMsg("");
  };

  const getSlotData = (slotRef: {role: string, idx: number} | null) => {
    if (!slotRef) return null;
    return schedule[slotRef.role][slotRef.idx];
  };

  const slotA = getSlotData(sourceSlot);
  const slotB = getSlotData(targetSlot);

  return (
    <div className="flex flex-col h-full space-y-4 relative"> 
      
      {/* ✅ KOMPONEN TOAST (NOTIFIKASI MELAYANG) */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
              toast.type === 'success' ? "bg-emerald-600 border-emerald-500 text-white" :
              toast.type === 'error' ? "bg-red-600 border-red-500 text-white" :
              "bg-slate-800 border-slate-700 text-white"
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
             <ShieldCheck className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100"><X className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center bg-slate-100 rounded-md p-1 border border-slate-200 shadow-inner">
                <Button variant="ghost" size="icon" onClick={handlePrevDate} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md text-slate-500">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 px-4 text-sm font-bold text-primary min-w-[180px] justify-center">
                   <CalendarIcon className="w-5 h-5 text-secondary" /> {formatDateRange(currentDate)}
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextDate} className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md text-slate-500">
                  <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
            
            <div className="bg-slate-100 rounded-md p-1 hidden sm:flex shadow-inner border border-slate-200">
                <button onClick={() => setViewMode("week")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "week" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>Mingguan</button>
            </div>
        </div>

        <div className="flex items-center gap-3">
           <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="icon" onClick={handlePrepareShare} className="h-10 w-10 border-green-200 text-green-600 hover:text-green-700 hover:border-green-300 rounded-md bg-green-50 hover:bg-green-100">
                <Share2 className="w-5 h-5" />
            </Button>
           </motion.div>

           <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500 hover:text-primary hover:border-primary rounded-md">
                <Printer className="w-5 h-5" /> 
           </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={() => { setSwapMode(!swapMode); setSourceSlot(null); setTargetSlot(null); }} className={`gap-2 font-bold rounded-md border transition-all ${swapMode ? "bg-secondary text-primary border-secondary ring-2 ring-primary/20" : "bg-white text-primary border-slate-200"}`}>
              <ArrowRightLeft className="w-5 h-5" />
              {swapMode ? "Batal Tukar" : "Request Tukar"}
            </Button>
          </motion.div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setIsAutoScheduleOpen(true)} className="gap-2 bg-primary text-white hover:bg-primary/90 font-bold rounded-md shadow-md border-2 border-primary/50">
                <Sparkles className="w-5 h-5 text-secondary" /> <span className="hidden lg:inline">Auto-Generate</span>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {swapMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
            {!sourceSlot ? "Pilih Jadwal ANDA" : "Pilih Jadwal TARGET"}
          </div>
        )}
        <ScheduleGrid schedule={schedule} selected={sourceSlot} swapMode={swapMode} onSlotClick={handleSlotClick} />
      </div>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Validasi Broadcast WhatsApp">
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>Periksa draft pesan sebelum dikirim.</p>
            </div>
            <textarea className="w-full h-64 p-3 border border-slate-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} />
            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsShareModalOpen(false)} className="flex-1 font-bold text-slate-500">Batal</Button>
                <Button onClick={handleFinalSend} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Validasi & Kirim WA
                </Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={handleCancel} title="Konfirmasi Tukar Shift">
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 text-center space-y-1">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jadwal Anda</div>
                    <div className="font-black text-primary text-lg">{slotA?.name}</div>
                    <div className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{slotA?.role}</div>
                </div>
                <div className="text-slate-300"><ArrowRightLeft className="w-6 h-6" /></div>
                <div className="flex-1 text-center space-y-1">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Target Tukar</div>
                    <div className="font-black text-secondary text-lg">{slotB?.name}</div>
                    <div className="inline-block bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded text-xs font-medium">{slotB?.role}</div>
                </div>
            </div>
            <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Verifikasi Identitas
                </label>
                <input type="password" placeholder="Masukkan PIN Karyawan" className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary outline-none text-center font-mono text-lg tracking-widest" value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {errorMsg}
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleCancel} className="flex-1 font-bold text-slate-500">Batal</Button>
                <Button onClick={handleSubmitSwap} disabled={isProcessing || !pin} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold shadow-md">
                    {isProcessing ? "Memproses..." : "Kirim Request"}
                </Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isAutoScheduleOpen} onClose={() => setIsAutoScheduleOpen(false)} title="Generate Jadwal">
         <div className="p-4 space-y-4 text-center">
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                Fitur ini akan mengisi slot yang <strong>MASIH KOSONG</strong> di minggu ini (<strong>{formatDateRange(currentDate)}</strong>) dengan karyawan yang sesuai secara acak.
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAutoScheduleOpen(false)}>Batal</Button>
                <Button className="flex-1 bg-primary text-white" onClick={handleAutoGenerate} disabled={isProcessing}>
                    {isProcessing ? "Sedang Mengisi..." : "Jalankan Auto-Fill"}
                </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}