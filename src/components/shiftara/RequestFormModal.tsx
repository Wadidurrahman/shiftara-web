"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, CalendarOff, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal"; 
import { PublicShift, RequestPayload } from "@/types";
import { supabase } from "@/lib/supabase";

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShift: PublicShift | null;
}

export default function RequestFormModal({ isOpen, onClose, selectedShift }: RequestFormModalProps) {
  const [pin, setPin] = useState("");
  const [requestType, setRequestType] = useState<'swap' | 'leave' | null>(null);
  const [targetDate, setTargetDate] = useState(""); 
  const [targetShiftId, setTargetShiftId] = useState("");
  const [targetShifts, setTargetShifts] = useState<PublicShift[]>([]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
        setPin("");
        setRequestType(null);
        setErrorMsg("");
        setSuccessMsg("");
        setTargetDate("");
        setTargetShiftId("");
        setReason("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (requestType === 'swap' && targetDate && selectedShift) {
        const fetchTargets = async () => {
            const { data } = await supabase
                .from("schedules")
                .select("*")
                .eq("date", targetDate)
                .neq("employee_id", selectedShift.employee_id);
            if (data) setTargetShifts(data as unknown as PublicShift[]);
        }
        fetchTargets();
    }
  }, [targetDate, requestType, selectedShift]);

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
            reason: reason,
            target_employee_id: undefined
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
        
        setTimeout(() => onClose(), 2500);

    } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Pengajuan">
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
  );
}