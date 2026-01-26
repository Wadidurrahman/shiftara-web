"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { Clock, CalendarCheck, Loader2, Lock, ArrowRightLeft, CalendarOff, AlertCircle, CheckCircle2, Bell, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal"; 

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

interface Request {
    id: string;
    type: 'swap' | 'leave';
    status: string;
    requester_name?: string;
    original_date: string;
    target_date?: string;
    reason: string;
    target_employee_id?: string;
}

interface RequestPayload {
    requester_id: string;
    type: 'swap' | 'leave';
    status: string;
    leave_date: string | null;
    original_date: string;
    target_date: string | null;
    reason: string;
    target_employee_id?: string;
}

interface AppSettings {
  max_leaves_per_month: number; 
}

export default function JadwalShiftPage() {
  const [schedules, setSchedules] = useState<PublicShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedShift, setSelectedShift] = useState<PublicShift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxPin, setInboxPin] = useState("");
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(false);

  const [pin, setPin] = useState("");
  const [requestType, setRequestType] = useState<'swap' | 'leave' | null>(null);
  const [targetDate, setTargetDate] = useState(""); 
  const [targetShiftId, setTargetShiftId] = useState("");
  const [targetShifts, setTargetShifts] = useState<PublicShift[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [settings, setSettings] = useState<AppSettings>({ max_leaves_per_month: 2 });

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
      if (requestType === 'swap' && targetDate) {
          const fetchTargets = async () => {
              const { data } = await supabase
                  .from("schedules")
                  .select("*")
                  .eq("date", targetDate)
                  .neq("employee_id", selectedShift?.employee_id);
              if (data) setTargetShifts(data as unknown as PublicShift[]);
          }
          fetchTargets();
      }
  }, [targetDate, requestType, selectedShift]);

  useEffect(() => {
    fetchSchedules();
    const channel = supabase.channel("public-schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedules" }, () => fetchSchedules())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSchedules]);

  const handleSlotClick = (shift: PublicShift) => {
      setSelectedShift(shift);
      setPin("");
      setErrorMsg("");
      setSuccessMsg("");
      setRequestType(null); 
      setTargetDate("");
      setTargetShiftId("");
      setReason("");
      setIsModalOpen(true);
  };

  const handleCheckInbox = async () => {
      if (inboxPin.length < 4) return;
      setIsInboxLoading(true);
      setErrorMsg("");
      try {
          const { data: emp, error: empError } = await supabase.from("employees").select("id").eq("pin", inboxPin).single();
          if (empError || !emp) throw new Error("PIN Tidak Ditemukan.");

          const { data: reqs, error: reqError } = await supabase
            .from("requests")
            .select(`*, requester:employees!requester_id(name)`)
            .eq("target_employee_id", emp.id)
            .eq("status", "pending_partner");

          if (reqError) throw reqError;
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setMyRequests(reqs.map((r: any) => ({
              ...r,
              requester_name: r.requester?.name || "Rekan Kerja"
          })));

      } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Gagal memuat pesan.");
      } finally {
          setIsInboxLoading(false);
      }
  };

  const handleApproveSwap = async (reqId: string, approve: boolean) => {
      const newStatus = approve ? 'pending_admin' : 'rejected';
      await supabase.from("requests").update({ status: newStatus }).eq("id", reqId);
      handleCheckInbox();
  };

  const verifyAndSubmit = async () => {
      if (!selectedShift || !requestType) return;
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
          const { data: emp, error: pinError } = await supabase
              .from("employees")
              .select("id, name")
              .eq("id", selectedShift.employee_id)
              .eq("pin", pin) 
              .single();

          if (pinError || !emp) throw new Error("PIN Salah! Pastikan PIN Anda benar.");

          const payload: RequestPayload = {
              requester_id: emp.id,
              type: requestType,
              status: requestType === 'swap' ? 'pending_partner' : 'pending_admin',
              leave_date: requestType === 'leave' ? selectedShift.date : null,
              original_date: selectedShift.date, 
              target_date: requestType === 'swap' ? targetDate : null, 
              reason: reason
          };

          if (requestType === 'swap') {
              if (!targetShiftId) throw new Error("Pilih shift teman yang ingin ditukar.");
              
              const targetShift = targetShifts.find(s => s.id === targetShiftId);
              if (!targetShift) throw new Error("Data shift target tidak valid.");

              payload.target_employee_id = targetShift.employee_id;
          } 

          const { error: reqError } = await supabase.from("requests").insert(payload);
          if (reqError) throw reqError;

          setSuccessMsg(requestType === 'swap' 
            ? "Terkirim! Menunggu persetujuan rekan kerja Anda." 
            : "Permintaan izin dikirim ke Admin.");
          
          setTimeout(() => setIsModalOpen(false), 2500);

      } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
    return { dateObj: d, dateStr: format(d, "yyyy-MM-dd"), label: format(d, "EEEE, dd MMM", { locale: id }) };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
            <h1 className="text-xl md:text-2xl font-black text-[#0B4650] flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 md:w-8 md:h-8" /> Jadwal Operasional
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
                Klik nama Anda untuk request. Cek <span className="font-bold text-[#0B4650]">Inbox</span> untuk persetujuan.
            </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <Button size="icon" variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-8 w-8"><ChevronLeft className="w-4 h-4"/></Button>
            <span className="text-xs font-bold w-32 text-center text-slate-600">
                {format(days[0].dateObj, "dd MMM")} - {format(days[6].dateObj, "dd MMM")}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-8 w-8"><ChevronRight className="w-4 h-4"/></Button>
        </div>

        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsInboxOpen(true)} className="flex gap-2 text-[#0B4650] border-[#0B4650]/20 hover:bg-teal-50">
                <Bell className="w-4 h-4" /> Inbox
            </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
         {loading ? (
             <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-400">
                 <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#0B4650]"/>
                 <p className="text-sm">Memuat jadwal...</p>
             </div>
         ) : days.map((day) => (
             <div key={day.dateStr} className={`bg-white rounded-xl border shadow-sm ${day.dateStr === format(new Date(), "yyyy-MM-dd") ? 'border-orange-400 ring-1 ring-orange-200' : 'border-slate-200'}`}>
                 <div className="px-4 py-3 border-b bg-slate-50/50 flex justify-between items-center">
                    <span className="font-bold text-slate-700">{day.label}</span>
                 </div>
                 <div className="p-3 space-y-2">
                    {schedules.filter(s => s.date === day.dateStr).length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Kosong</p>}
                    {schedules.filter(s => s.date === day.dateStr).map(shift => (
                        <div key={shift.id} onClick={() => handleSlotClick(shift)} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#0B4650] hover:bg-teal-50/30 cursor-pointer transition-all bg-white group">
                            <div className="w-8 h-8 rounded-full bg-[#0B4650] text-white flex items-center justify-center text-xs font-bold">{shift.employee_name.substring(0,2).toUpperCase()}</div>
                            <div>
                                <p className="font-bold text-sm text-slate-800">{shift.employee_name}</p>
                                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {shift.shift_time}</p>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
         ))}
      </div>

      <Modal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} title="Inbox Persetujuan">
          <div className="space-y-4">
              <div className="flex gap-2">
                  <Input 
                    type="password" 
                    placeholder="PIN Karyawan (6 Digit)" 
                    value={inboxPin} 
                    onChange={e => setInboxPin(e.target.value)} 
                    maxLength={6} 
                    className="text-center font-bold tracking-widest"
                  />
                  <Button onClick={handleCheckInbox} disabled={isInboxLoading || inboxPin.length < 4}>
                      {isInboxLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Buka Inbox"}
                  </Button>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
                  {myRequests.length === 0 && !isInboxLoading && (
                      <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-xl">
                          Tidak ada permintaan masuk.
                      </div>
                  )}
                  {myRequests.map(req => (
                      <div key={req.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-2">
                          <p className="text-sm text-slate-700 leading-relaxed">
                              <span className="font-bold text-[#0B4650]">{req.requester_name}</span> ingin menukar shift tanggal 
                              <span className="font-bold"> {req.original_date}</span> dengan shift Anda di tanggal 
                              <span className="font-bold"> {req.target_date}</span>.
                          </p>
                          <p className="text-xs italic text-slate-500 bg-slate-50 p-2 rounded">&quot;{req.reason}&quot;</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-9" onClick={() => handleApproveSwap(req.id, true)}>
                                  <Check className="w-4 h-4 mr-1"/> Setuju
                              </Button>
                              <Button size="sm" variant="destructive" className="h-9" onClick={() => handleApproveSwap(req.id, false)}>
                                  <X className="w-4 h-4 mr-1"/> Tolak
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Form Pengajuan">
         <div className="space-y-5">
            {successMsg ? (
                <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center border border-green-200 animate-in zoom-in">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <h3 className="font-bold text-lg">Berhasil!</h3>
                    <p className="text-sm mt-1">{successMsg}</p>
                </div>
            ) : (
                <>
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

                            {targetShifts.length > 0 && requestType === 'swap' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">Tukar dengan Siapa?</label>
                                    <select className="w-full p-2 border rounded bg-white text-sm" value={targetShiftId} onChange={e => setTargetShiftId(e.target.value)}>
                                        <option value="">-- Pilih Rekan --</option>
                                        {targetShifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.employee_name} ({s.shift_time})</option>
                                        ))}
                                    </select>
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