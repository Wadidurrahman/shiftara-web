"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Calendar as CalendarIcon, ArrowRightLeft, 
  ShieldCheck, AlertCircle, Share2, Printer, 
  ChevronLeft, ChevronRight, Sparkles, Send
} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import ScheduleGrid from "@/components/shiftara/ScheduleGrid";
import Modal from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

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
  const [swapMode, setSwapMode] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const [sourceSlot, setSourceSlot] = useState<{role: string, idx: number} | null>(null);
  const [targetSlot, setTargetSlot] = useState<{role: string, idx: number} | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pin, setPin] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); 
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

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

  // ✅ FIX: Gunakan useCallback agar fetchScheduleData stabil dan tidak memicu re-render loop
  const fetchScheduleData = useCallback(async () => {
    const roles = ["Manager Store", "Barista Senior", "Barista Junior", "Cashier", "Kitchen Staff"];
    
    // ✅ FIX: 'let' diganti 'const' karena tidak di-reassign
    const query = supabase.from("schedules").select("*");
    
    // Opsional: Filter tanggal jika database mendukung
    // const { start, end } = getWeekRange(currentDate);
    // query.gte('date', start.toISOString()).lte('date', end.toISOString());

    const { data: dbSchedules } = await query;

    const daysCount = viewMode === 'week' ? 7 : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const formattedSchedule: Record<string, ShiftData[]> = {};
    roles.forEach(role => {
      formattedSchedule[role] = Array(daysCount).fill(null).map((_, i) => {
        const found = dbSchedules?.find(s => s.role === role && s.day_index === i);
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
             role: role
           };
      });
    });
    setSchedule(formattedSchedule);
  }, [currentDate, viewMode]); // Dependensi fetch hanya berubah jika tanggal/mode berubah

  // ✅ FIX: Masukkan fetchScheduleData ke dependency array
  useEffect(() => {
    fetchScheduleData();

    const channel = supabase
      .channel('realtime-schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        fetchScheduleData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        // Bisa tambah logic fetch request count di sini
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScheduleData]); 

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
        alert("Pilih jadwal yang SUDAH TERISI oleh Anda.");
        return;
      }
      setSourceSlot({ role, idx });
    } 
    else if (!targetSlot) {
      const slot = schedule[role][idx];
      if (slot.type !== 'filled') {
        alert("Target tukar juga harus terisi.");
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

      if (pinError || !empData) {
        throw new Error("PIN Salah! Konfirmasi gagal.");
      }

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

      alert("Permintaan tukar shift berhasil dikirim! Menunggu persetujuan Admin.");
      setIsConfirmOpen(false);
      setSwapMode(false);
      setSourceSlot(null);
      setTargetSlot(null);

    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Terjadi kesalahan tidak dikenal.");
      }
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
    <div className="flex flex-col h-full space-y-4"> 
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
                <button onClick={() => setViewMode("month")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "month" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>Bulanan</button>
            </div>
        </div>

        <div className="flex items-center gap-3">
           <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrepareShare}
                className="h-10 w-10 border-green-200 text-green-600 hover:text-green-700 hover:border-green-300 rounded-md bg-green-50 hover:bg-green-100"
                title="Bagikan ke WhatsApp Group"
            >
                <Share2 className="w-5 h-5" />
            </Button>
           </motion.div>

           <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 text-slate-500 hover:text-primary hover:border-primary rounded-md">
                <Printer className="w-5 h-5" /> 
           </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => { 
                setSwapMode(!swapMode); 
                setSourceSlot(null); 
                setTargetSlot(null); 
              }}
              className={`gap-2 font-bold rounded-md border transition-all ${swapMode ? "bg-secondary text-primary border-secondary ring-2 ring-primary/20" : "bg-white text-primary border-slate-200"}`}
            >
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
        
        <ScheduleGrid 
            schedule={schedule}
            selected={sourceSlot} 
            swapMode={swapMode}
            onSlotClick={handleSlotClick}
        />
      </div>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Validasi Broadcast WhatsApp">
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md flex gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>Periksa draft pesan di bawah ini sebelum dikirim ke grup tim.</p>
            </div>
            
            <textarea 
                className="w-full h-64 p-3 border border-slate-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
            />

            <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsShareModalOpen(false)} className="flex-1 font-bold text-slate-500">
                    Batal
                </Button>
                <Button 
                    onClick={handleFinalSend} 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md flex items-center justify-center gap-2"
                >
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
                <input 
                    type="password"
                    placeholder="Masukkan PIN Karyawan (Default: 1234)"
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none text-center font-mono text-lg tracking-widest"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                />
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
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                Fitur ini akan mengisi slot kosong secara otomatis.
            </div>
            <Button className="w-full" onClick={() => setIsAutoScheduleOpen(false)}>Tutup</Button>
         </div>
      </Modal>
    </div>
  );
}