"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal"; 
import { Request } from "@/types";
import { supabase } from "@/lib/supabase";

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InboxModal({ isOpen, onClose }: InboxModalProps) {
  const [inboxPin, setInboxPin] = useState("");
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [isInboxLoading, setIsInboxLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inbox Persetujuan">
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
            {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
        </div>
    </Modal>
  );
}