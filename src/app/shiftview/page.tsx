"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { Clock, CalendarCheck, Loader2, Lock, ArrowRightLeft, CalendarOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal"; 

// Tipe Data
interface PublicShift {
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

interface AppSettings {
  max_leaves_per_month: number; 
}

export default function JadwalShiftPage() {
  const [schedules, setSchedules] = useState<PublicShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State Modal Request
  const [selectedShift, setSelectedShift] = useState<PublicShift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [requestType, setRequestType] = useState<'swap' | 'leave' | null>(null);
  const [targetDate, setTargetDate] = useState(""); 
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // Feedback sukses
  const [settings, setSettings] = useState<AppSettings>({ max_leaves_per_month: 2 });

  // Fetch Data (Dibungkus useCallback agar aman di useEffect)
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); 
    const end = addDays(start, 6); 

    const { data } = await supabase
      .from("schedules")
      .select("*")
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))
      .neq("type", "empty"); 

    const { data: setts } = await supabase.from('app_settings').select('*').maybeSingle();
    if (setts) setSettings(setts as unknown as AppSettings);

    if (data) setSchedules(data as unknown as PublicShift[]);
    setLoading(false);
  }, [currentDate]);

  useEffect(() => {
    fetchSchedules();
    const channel = supabase.channel("public-schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedules" }, () => fetchSchedules())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules]);

  const handleSlotClick = (shift: PublicShift) => {
      // Reset State
      setSelectedShift(shift);
      setPin("");
      setErrorMsg("");
      setSuccessMsg("");
      setRequestType(null); 
      setTargetDate("");
      setReason("");
      setIsModalOpen(true);
  };

  const verifyAndSubmit = async () => {
      if (!selectedShift || !requestType) return;
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
          // 1. Validasi PIN Karyawan
          const { data: emp, error: pinError } = await supabase
              .from("employees")
              .select("id, name")
              .eq("id", selectedShift.employee_id)
              .eq("pin", pin) 
              .single();

          if (pinError || !emp) throw new Error("PIN Salah! Pastikan PIN Anda benar.");

          // 2. Cek Kuota Libur (Hanya jika Request Libur)
          if (requestType === 'leave') {
              const startOfMonth = format(new Date(), 'yyyy-MM-01');
              const { count } = await supabase
                  .from("requests")
                  .select("*", { count: 'exact', head: true })
                  .eq("requester_id", emp.id)
                  .eq("type", "leave")
                  .gte("created_at", startOfMonth);
              
              if ((count || 0) >= settings.max_leaves_per_month) {
                  throw new Error(`Kuota request libur bulan ini habis (Max: ${settings.max_leaves_per_month}x).`);
              }
          }

          // 3. Simpan Request ke Database
          const payload = {
              requester_id: emp.id,
              type: requestType,
              status: 'pending_admin', 
              leave_date: requestType === 'leave' ? selectedShift.date : null,
              original_date: selectedShift.date, 
              target_date: requestType === 'swap' ? targetDate : null, 
              reason: reason
          };

          const { error: reqError } = await supabase.from("requests").insert(payload);
          if (reqError) throw reqError;

          setSuccessMsg("Permintaan Berhasil Dikirim! Menunggu persetujuan Admin.");
          
          // Tutup modal otomatis setelah 2 detik
          setTimeout(() => {
              setIsModalOpen(false);
          }, 2000);

      } catch (err) {
          if (err instanceof Error) {
            setErrorMsg(err.message);
          } else {
            setErrorMsg("Terjadi kesalahan sistem.");
          }
      } finally {
          setIsSubmitting(false);
      }
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
    return {
        dateObj: d,
        dateStr: format(d, "yyyy-MM-dd"),
        label: format(d, "EEEE, dd MMM", { locale: id })
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
            <h1 className="text-xl md:text-2xl font-black text-[#0B4650] flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 md:w-8 md:h-8" />
                Jadwal Operasional
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
                Klik nama Anda di jadwal untuk mengajukan <span className="font-bold text-[#0B4650]">Tukar Shift</span> atau <span className="font-bold text-red-500">Izin Libur</span>.
            </p>
        </div>
        
        <div className="flex gap-2 items-center bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-3 py-2 hover:bg-white text-slate-600 rounded-md transition-all shadow-sm">←</button>
            <span className="px-4 py-2 text-xs font-bold text-slate-700 bg-white rounded-md border min-w-[140px] text-center">
                {format(days[0].dateObj, "dd MMM")} - {format(days[6].dateObj, "dd MMM yyyy")}
            </span>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-3 py-2 hover:bg-white text-slate-600 rounded-md transition-all shadow-sm">→</button>
        </div>
      </div>

      {/* Grid Jadwal */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
        {loading ? (
            <div className="col-span-full h-60 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B4650]" /> 
                <span className="text-sm font-medium">Memuat data terbaru...</span>
            </div>
        ) : (
            days.map((day) => {
                const daySchedules = schedules.filter(s => s.date === day.dateStr);
                const isToday = day.dateStr === format(new Date(), "yyyy-MM-dd");

                return (
                    <div key={day.dateStr} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${isToday ? 'ring-2 ring-orange-400 border-orange-400' : 'border-slate-200'}`}>
                        {/* Header Hari */}
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${isToday ? 'bg-orange-50' : 'bg-slate-50'}`}>
                            <span className={`font-bold ${isToday ? 'text-orange-700' : 'text-slate-700'}`}>{day.label}</span>
                            {isToday && <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">HARI INI</span>}
                        </div>

                        {/* List Shift */}
                        <div className="p-3 space-y-2 min-h-[100px]">
                            {daySchedules.length === 0 ? (
                                <div className="text-center text-slate-400 text-xs py-8 italic bg-slate-50/50 rounded border border-dashed">
                                    Tidak ada jadwal
                                </div>
                            ) : (
                                daySchedules.map((shift) => (
                                    <div 
                                        key={shift.id} 
                                        onClick={() => handleSlotClick(shift)}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#0B4650] hover:bg-teal-50/30 cursor-pointer transition-all bg-white group relative"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${shift.type === 'leave' ? 'bg-red-400' : 'bg-[#0B4650]'}`}>
                                            {shift.employee_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 text-sm truncate">{shift.employee_name}</p>
                                                {shift.type === 'leave' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">OFF</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                {shift.type !== 'leave' && (
                                                    <>
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600 tracking-wide border border-slate-200">{shift.shift_name || "Shift"}</span>
                                                        <span className="flex items-center gap-1 text-[10px] font-medium"><Clock className="w-3 h-3" /> {shift.shift_time?.split(' - ')[0]}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Indikator Klik */}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white p-1 rounded-full shadow border text-[#0B4650]">
                                                <ArrowRightLeft className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* MODAL REQUEST & VALIDASI PIN */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Form Pengajuan">
         <div className="space-y-5">
            {/* Header Info */}
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                <p className="text-xs text-teal-600 uppercase font-bold tracking-wider mb-1">Permintaan Atas Nama</p>
                <p className="font-black text-[#0B4650] text-xl">{selectedShift?.employee_name}</p>
                <p className="text-xs text-slate-500 mt-1 flex justify-center items-center gap-1">
                    <Clock className="w-3 h-3"/> Shift: {selectedShift?.date && format(new Date(selectedShift.date), "dd MMM yyyy", { locale: id })}
                </p>
            </div>

            {/* Jika Sukses */}
            {successMsg ? (
                <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-200 text-center animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <h3 className="font-bold text-lg">Berhasil!</h3>
                    <p className="text-sm">{successMsg}</p>
                </div>
            ) : (
                <>
                    {/* Tahap 1: Pilih Jenis Request */}
                    {!requestType ? (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={() => setRequestType('swap')} className="flex flex-col items-center gap-3 p-5 border-2 border-slate-100 rounded-xl hover:border-[#0B4650] hover:bg-teal-50 transition-all group">
                                <div className="p-3 rounded-full bg-white shadow-sm text-[#0B4650] group-hover:scale-110 group-hover:shadow-md transition-all"><ArrowRightLeft className="w-6 h-6" /></div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#0B4650]">Tukar Shift</span>
                            </button>
                            <button onClick={() => setRequestType('leave')} className="flex flex-col items-center gap-3 p-5 border-2 border-slate-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group">
                                <div className="p-3 rounded-full bg-white shadow-sm text-red-500 group-hover:scale-110 group-hover:shadow-md transition-all"><CalendarOff className="w-6 h-6" /></div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-red-600">Izin Libur</span>
                            </button>
                        </div>
                    ) : (
                        /* Tahap 2: Form Detail */
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                    {requestType === 'swap' ? <><ArrowRightLeft className="w-4 h-4 text-[#0B4650]"/> Form Tukar Shift</> : <><CalendarOff className="w-4 h-4 text-red-500"/> Form Izin Libur</>}
                                </h4>
                                <button onClick={() => setRequestType(null)} className="text-xs text-blue-600 hover:underline font-medium">Ganti Pilihan</button>
                            </div>

                            {requestType === 'swap' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Ingin tukar ke tanggal berapa?</label>
                                    <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white" />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600">Alasan / Keterangan</label>
                                <Input placeholder={requestType === 'swap' ? "Misal: Ada acara keluarga mendadak" : "Misal: Sakit demam / Urusan Penting"} value={reason} onChange={e => setReason(e.target.value)} className="bg-slate-50 border-slate-200 focus:bg-white" />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg mt-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-yellow-800 flex items-center gap-1.5">
                                        <Lock className="w-3 h-3" /> Verifikasi Keamanan
                                    </label>
                                    <Input 
                                        type="password" 
                                        placeholder="Masukkan 6 Digit PIN Anda" 
                                        className="text-center text-xl font-bold tracking-[0.3em] h-12 border-yellow-200 focus:border-yellow-400 bg-white placeholder:tracking-normal placeholder:text-sm placeholder:font-normal" 
                                        maxLength={6} 
                                        value={pin} 
                                        onChange={e => setPin(e.target.value)} 
                                    />
                                    <p className="text-[10px] text-yellow-700/80 text-center">*PIN didapat saat registrasi karyawan.</p>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-start gap-2 font-medium border border-red-100 animate-pulse">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {errorMsg}
                                </div>
                            )}

                            <Button onClick={verifyAndSubmit} disabled={isSubmitting || pin.length < 4} className="w-full bg-[#0B4650] hover:bg-[#093e47] text-white font-bold h-12 shadow-lg shadow-teal-900/10 mt-2">
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Memverifikasi...</span>
                                ) : "Kirim Permintaan"}
                            </Button>
                        </div>
                    )}
                </>
            )}
         </div>
      </Modal>
    </div>
  );
}