"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Sparkles, User, Clock, 
  CheckCircle2, AlertCircle, Trash2, CalendarOff, 
  Send, X, ArrowRightLeft, Calendar as CalendarIcon
} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import ScheduleGrid from "@/components/shiftara/ScheduleGrid";
import SchedulePreviewModal from "@/components/shiftara/SchedulePreviewModal"; 
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  employee_id?: string;
  time: string;
  role: string;
  date?: string;
  shift_name?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    status: string;
    pin?: string;
}

interface ShiftPattern {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

const getWeekRange = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay(); 
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); 
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const formatDateRange = (date: Date) => {
  const { start, end } = getWeekRange(date);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const yearOpts: Intl.DateTimeFormatOptions = { year: 'numeric' };
  return `${start.toLocaleDateString('id-ID', opts)} - ${end.toLocaleDateString('id-ID', opts)} ${end.toLocaleDateString('id-ID', yearOpts)}`;
};

const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<Record<string, ShiftData[]>>({});
  const [dynamicRoles, setDynamicRoles] = useState<string[]>([]);
  const [employeesByRole, setEmployeesByRole] = useState<Record<string, Employee[]>>({});
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [isSlotActionOpen, setIsSlotActionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwapMode, setIsSwapMode] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<{role: string, index: number, date: string, data: ShiftData} | null>(null);
  const [swapSourceSlot, setSwapSourceSlot] = useState<ShiftData | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedShiftTime, setSelectedShiftTime] = useState("");
  const [waLink, setWaLink] = useState("");

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getShiftNameFromTime = useCallback((timeRange: string) => {
      if (!timeRange) return "Shift";
      const startTimeToCheck = timeRange.split(' - ')[0]; 
      const found = shiftPatterns.find(p => p.start_time.startsWith(startTimeToCheck));
      return found ? found.name : "Shift";
  }, [shiftPatterns]);

  const fetchScheduleData = useCallback(async () => {
    const { start, end } = getWeekRange(currentDate);
    
    // FIX: Gunakan maybeSingle() agar tidak error 406 jika data kosong
    const { data: settings } = await supabase.from('app_settings').select('wa_group_link').maybeSingle();
    if (settings) setWaLink(settings.wa_group_link || "");

    const { data: shifts } = await supabase.from('shift_patterns').select('*').order('start_time');
    if (shifts && shifts.length > 0) {
        setShiftPatterns(shifts);
    } else {
        // Fallback default jika tabel shift_patterns kosong
        setShiftPatterns([{ id: 'def', name: 'Regular', start_time: '08:00', end_time: '17:00' }]);
    }

    const { data: employees } = await supabase.from("employees").select("*").eq("status", "active");
    const rolesSet = new Set<string>();
    const empMap: Record<string, Employee[]> = {};

    if (employees) {
        employees.forEach((emp: Employee) => {
            rolesSet.add(emp.role);
            if (!empMap[emp.role]) empMap[emp.role] = [];
            empMap[emp.role].push(emp);
        });
    }

    const uniqueRoles = Array.from(rolesSet).sort();
    setDynamicRoles(uniqueRoles.length > 0 ? uniqueRoles : ["Manager", "Staff"]);
    setEmployeesByRole(empMap);

    const { data: dbSchedules } = await supabase
      .from("schedules")
      .select("*")
      .gte('date', start.toISOString())
      .lte('date', end.toISOString());

    const formattedSchedule: Record<string, ShiftData[]> = {};
    (uniqueRoles.length > 0 ? uniqueRoles : ["Manager", "Staff"]).forEach(role => {
      formattedSchedule[role] = Array(7).fill(null).map((_, i) => {
        const slotDate = new Date(start);
        slotDate.setDate(slotDate.getDate() + i);
        const dateString = slotDate.toISOString().split('T')[0];
        const found = dbSchedules?.find(s => s.role === role && s.date === dateString);

        if (found) {
            return {
                id: found.id,
                type: (found.type === 'leave' ? 'leave' : 'filled') as 'filled' | 'leave',
                name: found.type === 'leave' ? "CUTI / LIBUR" : (found.employee_name || "Terisi"),
                employee_id: found.employee_id,
                time: found.shift_time || "-",
                role: found.role,
                date: found.date,
                shift_name: found.shift_name
            };
        }
        return {
             id: `empty-${role}-${i}`,
             type: 'empty',
             name: "",
             time: "",
             role: role,
             date: dateString,
             shift_name: ""
        };
      });
    });
    setSchedule(formattedSchedule);
  }, [currentDate]); 

  useEffect(() => {
    let isMounted = true;
    const run = async () => { if(isMounted) await fetchScheduleData(); };
    run();
    return () => { isMounted = false; };
  }, [fetchScheduleData]); 

  const handleSlotClick = async (role: string, idx: number) => {
    const clickedSlot = schedule[role][idx];
    if(!clickedSlot || !clickedSlot.date) return;

    if (isSwapMode && swapSourceSlot) {
        setIsProcessing(true);
        const sourcePayload = {
            role: swapSourceSlot.role,
            date: swapSourceSlot.date,
            employee_id: clickedSlot.employee_id || null, 
            employee_name: clickedSlot.name === "Kosong" ? null : clickedSlot.name,
            shift_time: clickedSlot.time,
            shift_name: clickedSlot.shift_name || getShiftNameFromTime(clickedSlot.time),
            type: clickedSlot.type === 'empty' ? 'empty' : clickedSlot.type
        };
        const targetPayload = {
            role: clickedSlot.role,
            date: clickedSlot.date,
            employee_id: swapSourceSlot.employee_id,
            employee_name: swapSourceSlot.name,
            shift_time: swapSourceSlot.time,
            shift_name: swapSourceSlot.shift_name || getShiftNameFromTime(swapSourceSlot.time),
            type: 'filled'
        };

        if (sourcePayload.type === 'empty' || !sourcePayload.employee_id) {
            await supabase.from("schedules").delete().eq('role', swapSourceSlot.role).eq('date', swapSourceSlot.date);
        } else {
            await supabase.from("schedules").upsert(sourcePayload, { onConflict: 'role, date' });
        }
        await supabase.from("schedules").upsert(targetPayload, { onConflict: 'role, date' });

        showToast("Shift berhasil ditukar!", "success");
        setIsSwapMode(false);
        setSwapSourceSlot(null);
        await fetchScheduleData();
        setIsProcessing(false);
        return;
    }

    setSelectedSlot({ role, index: idx, date: clickedSlot.date, data: clickedSlot });
    setSelectedEmployeeId(clickedSlot.employee_id || "");
    if (clickedSlot.time && clickedSlot.time !== '-' && clickedSlot.time !== "") {
        setSelectedShiftTime(clickedSlot.time);
    } else if (shiftPatterns.length > 0) {
        const first = shiftPatterns[0];
        setSelectedShiftTime(`${first.start_time.slice(0,5)} - ${first.end_time.slice(0,5)}`);
    }
    setIsSlotActionOpen(true);
  };

  const handleInitiateSwap = () => {
      if(!selectedSlot) return;
      setSwapSourceSlot(selectedSlot.data);
      setIsSlotActionOpen(false);
      setIsSwapMode(true);
      showToast("Pilih slot target untuk ditukar", "success");
  };

  const handleSaveSlot = async () => {
    if (!selectedSlot) return;
    setIsProcessing(true);
    const employee = employeesByRole[selectedSlot.role]?.find(e => e.id === selectedEmployeeId);
    if (employee) {
       const payload = {
          role: selectedSlot.role,
          date: selectedSlot.date,
          employee_id: employee.id,
          employee_name: employee.name,
          shift_time: selectedShiftTime,
          shift_name: getShiftNameFromTime(selectedShiftTime),
          type: 'filled'
       };
       const { error } = await supabase.from("schedules").upsert(payload, { onConflict: 'role, date' });
       if (error) showToast("Gagal: " + error.message, "error");
       else showToast("Jadwal tersimpan", "success");
    }
    await fetchScheduleData();
    setIsProcessing(false);
    setIsSlotActionOpen(false);
  };

  const handleDeleteSlot = async () => {
      if (!selectedSlot) return;
      setIsProcessing(true);
      await supabase.from("schedules").delete().eq('role', selectedSlot.role).eq('date', selectedSlot.date);
      showToast("Slot dikosongkan", "success");
      await fetchScheduleData();
      setIsProcessing(false);
      setIsSlotActionOpen(false);
  };

  const handleMarkLeave = async () => {
      if (!selectedSlot) return;
      setIsProcessing(true);
      const payload = {
          role: selectedSlot.role,
          date: selectedSlot.date,
          type: 'leave',
          employee_name: 'CUTI / LIBUR',
          shift_time: '-',
          shift_name: 'Libur'
      };
      await supabase.from("schedules").upsert(payload, { onConflict: 'role, date' });
      showToast("Ditandai sebagai Libur", "success");
      await fetchScheduleData();
      setIsProcessing(false);
      setIsSlotActionOpen(false);
  };

  const handlePublish = () => {
      showToast("Jadwal Terpublikasi!", "success");
      setIsPreviewOpen(false);
      if (waLink) window.open(waLink, '_blank');
  };

  const handleAutoGenerate = async () => {
    setIsProcessing(true);
    const updates: {
        role: string;
        date: string;
        shift_name: string;
        shift_time: string;
        employee_name: string | undefined;
        employee_id: string | undefined;
        type: string;
    }[] = [];
    const { start } = getWeekRange(currentDate);
    const weekNum = getWeekNumber(start);

    // Ambil pola shift dari database
    const availableShifts = shiftPatterns.length > 0 
        ? shiftPatterns 
        : [{ id: 'def', name: 'Regular', start_time: '08:00', end_time: '17:00' }];

    // Loop setiap Role
    dynamicRoles.forEach((role, roleIndex) => {
        const staffList = [...(employeesByRole[role] || [])]; 
        
        // Acak urutan staff agar tidak selalu orang yang sama di awal
        staffList.sort(() => Math.random() - 0.5);

        if (staffList.length === 0) return;

        const totalStaff = staffList.length;
        const totalShiftsType = availableShifts.length; 

        // Loop 7 Hari (Senin - Minggu)
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const targetDate = new Date(start);
            targetDate.setDate(targetDate.getDate() + dayIndex);
            const dateStr = targetDate.toISOString().split('T')[0];

            const currentSlot = schedule[role]?.[dayIndex];

            // Hanya isi slot yang kosong
            if (currentSlot && currentSlot.type === 'empty') {
                
                // LOGIKA 1: ROTASI SHIFT HARIAN (ZIG-ZAG)
                // (Minggu + UrutanJabatan + Hari) % TotalTipeShift
                // Hasil: Senin (Pagi), Selasa (Malam), Rabu (Pagi), dst.
                const shiftIndex = (weekNum + roleIndex + dayIndex) % totalShiftsType;
                const selectedShift = availableShifts[shiftIndex];

                // LOGIKA 2: GILIRAN KARYAWAN
                // Pastikan karyawan juga bergilir setiap hari
                const selectedStaffIndex = dayIndex % totalStaff;
                const selectedStaff = staffList[selectedStaffIndex];

                updates.push({
                    role: role,
                    date: dateStr,
                    shift_name: selectedShift.name,
                    shift_time: `${selectedShift.start_time.slice(0,5)} - ${selectedShift.end_time.slice(0,5)}`,
                    employee_name: selectedStaff.name,
                    employee_id: selectedStaff.id,
                    type: 'filled'
                });
            }
        }
    });

    if (updates.length > 0) {
        await supabase.from("schedules").upsert(updates, { onConflict: 'role, date' });
        showToast(`Berhasil generate ${updates.length} jadwal dengan variasi shift!`, "success");
        await fetchScheduleData();
    } else {
        showToast("Tidak ada slot kosong yang perlu diisi.", "error");
    }
    
    setIsProcessing(false);
    setIsAutoScheduleOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
       <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
              toast.type === 'success' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-red-600 border-red-500 text-white"
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4 opacity-80 hover:opacity-100"/></button>
          </motion.div>
        )}
      </AnimatePresence>

       {isSwapMode && (
         <div className="fixed inset-x-0 top-24 z-40 flex justify-center pointer-events-none">
            <motion.div 
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[#0B4650] text-white px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-3 animate-pulse cursor-pointer border-2 border-white pointer-events-auto"
              onClick={() => { setIsSwapMode(false); setSwapSourceSlot(null); }}
            >
               <ArrowRightLeft className="w-5 h-5" /> Mode Tukar Aktif: Klik Target (Batal)
            </motion.div>
         </div>
       )}

       <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}><ChevronLeft className="w-5 h-5" /></Button>
              <div className="flex items-center gap-2 px-4 text-sm font-bold text-slate-800 min-w-[220px] justify-center">
                 <CalendarIcon className="w-4 h-4 text-[#0B4650]" /> {formatDateRange(currentDate)}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}><ChevronRight className="w-5 h-5" /></Button>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => setIsAutoScheduleOpen(true)} className="gap-2 border-slate-200 text-slate-600 hover:text-[#0B4650]">
                <Sparkles className="w-4 h-4" /> Auto-Fill
             </Button>
             <Button onClick={() => setIsPreviewOpen(true)} className="gap-2 bg-[#0B4650] hover:bg-[#093e47] text-white shadow-md font-semibold px-6">
                <Send className="w-4 h-4" /> Preview & Publish
            </Button>
          </div>
       </div>

       <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <ScheduleGrid 
            schedule={schedule} 
            selected={null} 
            swapMode={isSwapMode} 
            onSlotClick={handleSlotClick} 
          />
       </div>

       <SchedulePreviewModal 
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onPublish={handlePublish}
          schedule={schedule}
          roles={dynamicRoles}
          currentDate={currentDate}
       />

       <Modal isOpen={isSlotActionOpen} onClose={() => setIsSlotActionOpen(false)} title="Atur Jadwal">
          <div className="space-y-5">
             <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                <span className="text-xs font-bold text-[#0B4650] uppercase tracking-wider">{selectedSlot?.role}</span>
                <div className="font-bold text-slate-800 mt-1">
                    {selectedSlot?.date ? new Date(selectedSlot.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'}) : '-'}
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3 h-3"/> Karyawan</label>
                    <select 
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4650]"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                        <option value="">-- Pilih Karyawan --</option>
                        {employeesByRole[selectedSlot?.role || ""]?.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Shift</label>
                    <select 
                        className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4650]"
                        value={selectedShiftTime}
                        onChange={(e) => setSelectedShiftTime(e.target.value)}
                    >
                        {shiftPatterns.map(sp => (
                            <option key={sp.id} value={`${sp.start_time.slice(0,5)} - ${sp.end_time.slice(0,5)}`}>
                                {sp.name} ({sp.start_time.slice(0,5)} - {sp.end_time.slice(0,5)})
                            </option>
                        ))}
                    </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2 pt-2">
                 <Button variant="outline" onClick={handleInitiateSwap} className="text-[#0B4650] hover:bg-teal-50 border-teal-200 text-xs">
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Tukar
                 </Button>
                 <Button variant="outline" onClick={handleMarkLeave} className="text-[#F58634] hover:bg-orange-50 border-orange-200 text-xs">
                    <CalendarOff className="w-3 h-3 mr-1" /> Liburkan
                 </Button>
                 <Button variant="outline" onClick={handleDeleteSlot} className="col-span-2 text-red-600 hover:bg-red-50 border-red-200 text-xs">
                    <Trash2 className="w-3 h-3 mr-1" /> Kosongkan Slot
                 </Button>
                 <Button onClick={handleSaveSlot} disabled={isProcessing} className="col-span-2 bg-[#0B4650] hover:bg-[#093e47] text-white font-bold py-3 mt-2">
                    {isProcessing ? "Menyimpan..." : "Simpan Perubahan"}
                 </Button>
             </div>
          </div>
       </Modal>

       <Modal isOpen={isAutoScheduleOpen} onClose={() => setIsAutoScheduleOpen(false)} title="Konfirmasi Auto-Fill">
         <div className="p-4 space-y-4 text-center">
            <div className="p-4 bg-teal-50 text-[#0B4650] rounded-lg text-sm border border-teal-200">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#0B4650]" />
                <p>Sistem akan mengisi <strong>{Object.keys(schedule).length * 7} slot</strong> secara otomatis.</p>
                <p className="text-xs text-slate-500 mt-1">Menggunakan algoritma rotasi cerdas (Pagi/Malam).</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAutoScheduleOpen(false)}>Batal</Button>
                <Button className="flex-1 bg-[#0B4650] text-white" onClick={handleAutoGenerate} disabled={isProcessing}>
                    {isProcessing ? "Proses..." : "Jalankan"}
                </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}