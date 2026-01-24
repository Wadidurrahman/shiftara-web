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
  division?: string;
  user_id?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    division: string;
    status: string;
    pin?: string;
    user_id?: string;
}

interface ShiftPattern {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    user_id?: string;
}

interface SchedulePayload {
    role: string;
    date: string;
    shift_name: string;
    shift_time: string;
    employee_name: string;
    employee_id: string;
    type: string;
    user_id: string;
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

const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

export default function ShiftManagerPage() {
  const [schedule, setSchedule] = useState<Record<string, ShiftData[]>>({});
  const [groupedEmployees, setGroupedEmployees] = useState<Record<string, Employee[]>>({});
  const [sortedDivisions, setSortedDivisions] = useState<string[]>([]);
  const [employeesByRowKey, setEmployeesByRowKey] = useState<Record<string, Employee>>({});
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [isSlotActionOpen, setIsSlotActionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSwapMode, setIsSwapMode] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<{rowKey: string, index: number, date: string, data: ShiftData} | null>(null);
  const [swapSourceSlot, setSwapSourceSlot] = useState<ShiftData | null>(null);
  const [selectedShiftTime, setSelectedShiftTime] = useState("");
  const [waLink, setWaLink] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
        }
    };
    getUser();
  }, []);

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

    const { data: settings } = await supabase.from('app_settings').select('wa_group_link').maybeSingle();
    if (settings) setWaLink(settings.wa_group_link || "");

    const { data: shifts } = await supabase.from('shift_patterns').select('*').order('start_time');
    if (shifts && shifts.length > 0) {
        setShiftPatterns(shifts as ShiftPattern[]);
    } else {
        setShiftPatterns([{ id: 'default', name: 'Pagi', start_time: '08:00', end_time: '16:00' }]);
    }

    const { data: employees } = await supabase.from("employees").select("*").eq("status", "active")
        .order('division', { ascending: true })
        .order('name', { ascending: true });

    if (!employees) return;

    setAllEmployees(employees as Employee[]);

    const groups: Record<string, Employee[]> = {};
    const empMap: Record<string, Employee> = {};

    employees.forEach(emp => {
        const divName = emp.division || "Umum";
        if (!groups[divName]) groups[divName] = [];
        groups[divName].push(emp as Employee);
        empMap[emp.id] = emp as Employee;
    });

    setGroupedEmployees(groups);
    setSortedDivisions(Object.keys(groups).sort());
    setEmployeesByRowKey(empMap);

    const { data: dbSchedules } = await supabase
      .from("schedules")
      .select("*")
      .gte('date', start.toISOString())
      .lte('date', end.toISOString());

    const formattedSchedule: Record<string, ShiftData[]> = {};

    employees.forEach(emp => {
      const rowKey = emp.id;

      formattedSchedule[rowKey] = Array(7).fill(null).map((_, i) => {
        const slotDate = new Date(start);
        slotDate.setDate(slotDate.getDate() + i);
        const dateString = slotDate.toISOString().split('T')[0];

        const found = dbSchedules?.find(s => s.employee_id === emp.id && s.date === dateString);

        if (found) {
            return {
                id: found.id,
                type: (found.type === 'leave' ? 'leave' : 'filled') as 'filled' | 'leave',
                name: found.type === 'leave' ? "CUTI / LIBUR" : (found.employee_name || "Terisi"),
                employee_id: found.employee_id,
                time: found.shift_time || "-",
                role: found.role,
                date: found.date,
                shift_name: found.shift_name,
                division: emp.division,
                user_id: found.user_id
            };
        }

        return {
             id: `empty-${emp.id}-${i}`,
             type: 'empty',
             name: "",
             time: "",
             role: emp.role,
             date: dateString,
             shift_name: "",
             division: emp.division
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

  const handleSlotClick = async (rowKey: string, idx: number) => {
    const clickedSlot = schedule[rowKey][idx];
    if(!clickedSlot || !clickedSlot.date) return;

    if(!currentUserId) {
        showToast("Sesi login berakhir. Silakan refresh.", "error");
        return;
    }

    if (isSwapMode && swapSourceSlot) {
        setIsProcessing(true);
        if (!swapSourceSlot.employee_id || !employeesByRowKey[rowKey]?.id) {
             showToast("Data karyawan tidak valid", "error");
             setIsProcessing(false);
             return;
        }

        await supabase.from("schedules").delete().match({ employee_id: swapSourceSlot.employee_id, date: swapSourceSlot.date });
        await supabase.from("schedules").delete().match({ employee_id: employeesByRowKey[rowKey].id, date: clickedSlot.date });

        if(swapSourceSlot.type !== 'empty') {
             await supabase.from("schedules").insert([{
                 role: employeesByRowKey[rowKey].role,
                 date: clickedSlot.date,
                 employee_name: employeesByRowKey[rowKey].name,
                 employee_id: employeesByRowKey[rowKey].id,
                 shift_time: swapSourceSlot.time,
                 shift_name: swapSourceSlot.shift_name,
                 type: 'filled',
                 user_id: currentUserId
             }]);
        }

        if(clickedSlot.type !== 'empty') {
            await supabase.from("schedules").insert([{
                role: swapSourceSlot.role,
                date: swapSourceSlot.date,
                employee_name: swapSourceSlot.name,
                employee_id: swapSourceSlot.employee_id,
                shift_time: clickedSlot.time,
                shift_name: clickedSlot.shift_name,
                type: 'filled',
                user_id: currentUserId
            }]);
        }

        showToast("Shift berhasil ditukar!", "success");
        setIsSwapMode(false);
        setSwapSourceSlot(null);
        await fetchScheduleData();
        setIsProcessing(false);
        return;
    }

    setSelectedSlot({ rowKey, index: idx, date: clickedSlot.date, data: clickedSlot });
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
    if (!selectedSlot || !currentUserId) return;
    setIsProcessing(true);
    const employee = employeesByRowKey[selectedSlot.rowKey];

    if (employee) {
       const payload = {
          role: employee.role,
          date: selectedSlot.date,
          employee_id: employee.id,
          employee_name: employee.name,
          shift_time: selectedShiftTime,
          shift_name: getShiftNameFromTime(selectedShiftTime),
          type: 'filled',
          user_id: currentUserId
       };
       await supabase.from("schedules").delete().match({ employee_id: employee.id, date: selectedSlot.date });
       const { error } = await supabase.from("schedules").insert(payload);

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
      const employee = employeesByRowKey[selectedSlot.rowKey];
      await supabase.from("schedules").delete().match({ employee_id: employee.id, date: selectedSlot.date });
      showToast("Slot dikosongkan", "success");
      await fetchScheduleData();
      setIsProcessing(false);
      setIsSlotActionOpen(false);
  };

  const handleMarkLeave = async () => {
      if (!selectedSlot || !currentUserId) return;
      setIsProcessing(true);
      const employee = employeesByRowKey[selectedSlot.rowKey];
      const payload = {
          role: employee.role,
          date: selectedSlot.date,
          employee_id: employee.id,
          type: 'leave',
          employee_name: 'CUTI / LIBUR',
          shift_time: '-',
          shift_name: 'Libur',
          user_id: currentUserId
      };
      await supabase.from("schedules").delete().match({ employee_id: employee.id, date: selectedSlot.date });
      await supabase.from("schedules").insert(payload);
      showToast("Ditandai sebagai Libur", "success");
      await fetchScheduleData();
      setIsProcessing(false);
      setIsSlotActionOpen(false);
  };

  const handlePublish = async () => {
      setIsPreviewOpen(false);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const publicLink = `${baseUrl}/jadwal-shift`;

      const message = `📢 *PENGUMUMAN JADWAL OPERASIONAL*\n\n` +
                      `Kepada Seluruh Staff,\n` +
                      `Jadwal shift terbaru telah diterbitkan.\n\n` +
                      `🔗 *CEK JADWAL ANDA DISINI:*\n${publicLink}\n\n` +
                      `Terima kasih.`;

      try {
          await navigator.clipboard.writeText(message);
          showToast("Pesan Resmi Tersalin! Paste di Grup WA.", "success");
          if (waLink) {
              setTimeout(() => { window.open(waLink, '_blank'); }, 1000);
          }
      } catch {
          showToast("Gagal menyalin otomatis. Silakan copy manual.", "error");
      }
  };

  const handleAutoGenerate = async () => {
    if (!currentUserId) return;
    setIsProcessing(true);
    const updates: SchedulePayload[] = [];
    const { start } = getWeekRange(currentDate);

    const availableShifts = shiftPatterns.length > 0
        ? shiftPatterns
        : [{ id: 'def', name: 'Regular', start_time: '08:00', end_time: '17:00' }];

    const staffByDivision: Record<string, Employee[]> = {};
    allEmployees.forEach(emp => {
        const div = emp.division || "Umum";
        if (!staffByDivision[div]) staffByDivision[div] = [];
        staffByDivision[div].push(emp);
    });

    const ROTATION_BLOCK_DAYS = 2;

    for (const division in staffByDivision) {
        let staffList = staffByDivision[division];
        staffList = shuffleArray([...staffList]);

        staffList.forEach((emp, staffIndex) => {
            const startShiftOffset = staffIndex % availableShifts.length;
            const rowKey = emp.id;
            let workingDayCounter = 0;

            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const targetDate = new Date(start);
                targetDate.setDate(targetDate.getDate() + dayIndex);
                const dateStr = targetDate.toISOString().split('T')[0];
                const currentSlot = schedule[rowKey]?.[dayIndex];

                if (currentSlot && (currentSlot.type === 'leave' || currentSlot.type === 'filled')) {
                    if(currentSlot.type === 'filled') workingDayCounter++;
                    continue;
                }

                const shiftBlock = Math.floor(workingDayCounter / ROTATION_BLOCK_DAYS);
                const shiftIndex = (startShiftOffset + shiftBlock) % availableShifts.length;
                const selectedShift = availableShifts[shiftIndex];

                updates.push({
                    role: emp.role,
                    date: dateStr,
                    shift_name: selectedShift.name,
                    shift_time: `${selectedShift.start_time.slice(0,5)} - ${selectedShift.end_time.slice(0,5)}`,
                    employee_name: emp.name,
                    employee_id: emp.id,
                    type: 'filled',
                    user_id: currentUserId
                });
                workingDayCounter++;
            }
        });
    }

    if (updates.length > 0) {
        for (const update of updates) {
             await supabase.from("schedules").delete().match({ employee_id: update.employee_id, date: update.date });
        }
        const { error } = await supabase.from("schedules").insert(updates);
        if (error) {
            showToast("Gagal menyimpan: " + error.message, "error");
        } else {
            showToast(`Berhasil mengisi ${updates.length} slot!`, "success");
            await fetchScheduleData();
        }
    } else {
        showToast("Semua slot sudah terisi penuh.", "success");
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
               <ArrowRightLeft className="w-5 h-5" /> Mode Tukar Aktif
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
            groupedEmployees={groupedEmployees}
            sortedDivisions={sortedDivisions}
            selected={selectedSlot ? { rowKey: selectedSlot.rowKey, index: selectedSlot.index } : null}
            swapMode={isSwapMode}
            onSlotClick={handleSlotClick}
          />
       </div>

       <SchedulePreviewModal
         isOpen={isPreviewOpen}
         onClose={() => setIsPreviewOpen(false)}
         onPublish={handlePublish}
         schedule={schedule}
         groupedEmployees={groupedEmployees}
         sortedDivisions={sortedDivisions}
         currentDate={currentDate}
       />

       <Modal isOpen={isSlotActionOpen} onClose={() => setIsSlotActionOpen(false)} title="Atur Jadwal">
          <div className="space-y-5">
             <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                <span className="text-xs font-bold text-[#0B4650] uppercase tracking-wider">
                    {selectedSlot ? employeesByRowKey[selectedSlot.rowKey]?.name : '-'}
                </span>
                <div className="font-bold text-slate-800 mt-1">
                    {selectedSlot?.date ? new Date(selectedSlot.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'}) : '-'}
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3 h-3"/> Karyawan</label>
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                        {employeesByRowKey[selectedSlot?.rowKey || ""]?.name || "-"}
                    </div>
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
                <p>Otomatis mengisi slot kosong dengan <strong>Distribusi Divisi Merata</strong>.</p>
                <p className="text-xs text-slate-500 mt-1">Sistem menjamin setiap shift memiliki personil dari setiap divisi.</p>
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