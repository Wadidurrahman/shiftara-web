"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, Clock, Save, MessageCircle, 
  Loader2, ExternalLink, Lock, CheckCircle2, AlertCircle, X, Plus, Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface ShiftPattern {
    id?: string;
    name: string;
    start_time: string;
    end_time: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Settings Umum
  const [settings, setSettings] = useState({
    id: "",
    wa_group_link: "",
    min_request_days: 1,
    require_pin: true,
    max_requests_per_month: 3
  });

  // Settings Shift Dinamis
  const [shifts, setShifts] = useState<ShiftPattern[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Ambil Settings Umum
      const { data: settingsData } = await supabase.from('app_settings').select('*').single();
      if (settingsData) {
        setSettings({
            id: settingsData.id,
            wa_group_link: settingsData.wa_group_link || "",
            min_request_days: settingsData.min_request_days || 1,
            require_pin: settingsData.require_pin ?? true,
            max_requests_per_month: settingsData.max_requests_per_month || 3
        });
      }

      // 2. Ambil Pola Shift
      const { data: shiftData } = await supabase.from('shift_patterns').select('*').order('start_time', { ascending: true });
      if (shiftData) {
          const formattedShifts = shiftData.map(s => ({
              ...s,
              start_time: s.start_time.slice(0, 5),
              end_time: s.end_time.slice(0, 5)
          }));
          setShifts(formattedShifts);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- LOGIC CRUD SHIFT ---
  const addShift = () => {
      setShifts([...shifts, { name: "", start_time: "08:00", end_time: "16:00" }]);
  };

  const removeShift = (index: number) => {
      const newShifts = [...shifts];
      newShifts.splice(index, 1);
      setShifts(newShifts);
  };

  const updateShift = (index: number, field: keyof ShiftPattern, value: string) => {
      const newShifts = [...shifts];
      newShifts[index] = { ...newShifts[index], [field]: value };
      setShifts(newShifts);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        // 1. Simpan Settings Umum
        const { error: settingsError } = await supabase
        .from('app_settings')
        .update({
            wa_group_link: settings.wa_group_link,
            min_request_days: parseInt(settings.min_request_days.toString()),
            require_pin: settings.require_pin,
            max_requests_per_month: parseInt(settings.max_requests_per_month.toString())
        })
        .eq('id', settings.id);

        if (settingsError) throw settingsError;

        // 2. Simpan Shift
        if (shifts.length > 0) {
            // A. Ambil semua ID yang ada di DB
            const { data: existing } = await supabase.from('shift_patterns').select('id');
            const existingIds = existing?.map(e => e.id) || [];
            
            // B. Pisahkan mana yang baru, mana yang update, mana yang hapus
            const currentIds = shifts.filter(s => s.id).map(s => s.id);
            const toDelete = existingIds.filter(id => !currentIds.includes(id));

            // C. Delete yang dihapus user
            if (toDelete.length > 0) {
                await supabase.from('shift_patterns').delete().in('id', toDelete);
            }

            // D. Upsert (Update atau Insert)
            const toUpsert = shifts.map(s => ({
                id: s.id, 
                name: s.name,
                start_time: s.start_time,
                end_time: s.end_time
            }));

            const { error: shiftError } = await supabase.from('shift_patterns').upsert(toUpsert);
            if (shiftError) throw shiftError;
        }

        // Refresh data shift agar ID baru ter-load
        const { data: refreshedShifts } = await supabase.from('shift_patterns').select('*').order('start_time');
        if (refreshedShifts) {
             const formatted = refreshedShifts.map(s => ({
                ...s,
                start_time: s.start_time.slice(0, 5),
                end_time: s.end_time.slice(0, 5)
            }));
            setShifts(formatted);
        }

        showToast("Pengaturan tersimpan sukses!", "success");

    } catch (error: unknown) {
        let errorMessage = "Terjadi kesalahan saat menyimpan.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        showToast("Gagal menyimpan: " + errorMessage, "error");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
              toast.type === 'success' ? "bg-emerald-500 border-emerald-400 text-white" : "bg-red-500 border-red-400 text-white"
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4 opacity-80 hover:opacity-100"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KARTU 1: PENGATURAN SHIFT (FITUR UTAMA) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-slate-800">Master Pola Shift</h3>
                        <p className="text-xs text-slate-500">Tentukan jumlah shift dan jam operasional toko Anda.</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={addShift} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Shift
                </Button>
            </div>

            {/* List Shift Input */}
            <div className="space-y-3">
                {shifts.map((shift, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-end md:items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-full md:w-1/3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nama Shift</label>
                            <Input 
                                placeholder="Contoh: Pagi / Opening" 
                                value={shift.name} 
                                onChange={(e) => updateShift(idx, 'name', e.target.value)}
                                className="bg-white border-slate-300 font-bold text-slate-700"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-1/3">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mulai</label>
                                <Input 
                                    type="time" 
                                    value={shift.start_time} 
                                    onChange={(e) => updateShift(idx, 'start_time', e.target.value)}
                                    className="bg-white border-slate-300"
                                />
                            </div>
                            <span className="text-slate-400 mt-5">-</span>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Selesai</label>
                                <Input 
                                    type="time" 
                                    value={shift.end_time} 
                                    onChange={(e) => updateShift(idx, 'end_time', e.target.value)}
                                    className="bg-white border-slate-300"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto flex justify-end mt-2 md:mt-5">
                            <Button size="icon" variant="ghost" onClick={() => removeShift(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                ))}
                
                {shifts.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                        Belum ada pola shift. Klik tombol <strong>+ Tambah Shift</strong> di atas.
                    </div>
                )}
            </div>
        </div>

        {/* KARTU 2: WA & INTEGRASI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-700 rounded-full">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-slate-800">WhatsApp Gateway</h3>
                    <p className="text-xs text-slate-500">Koneksi ke grup koordinasi tim.</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Link Invite Grup</label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="https://chat.whatsapp.com/..." 
                        className="font-mono text-sm bg-slate-50 border-slate-200 focus:ring-green-500 focus:border-green-500"
                        value={settings.wa_group_link}
                        onChange={(e) => setSettings({...settings, wa_group_link: e.target.value})}
                    />
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 hover:bg-green-50 hover:text-green-600 border-slate-200"
                        onClick={() => settings.wa_group_link && window.open(settings.wa_group_link, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-[10px] text-slate-400">
                    *Link ini akan digunakan pada tombol &quot;Gabung Grup&quot; di dashboard karyawan.
                </p>
            </div>
        </div>

        {/* KARTU 3: KEAMANAN & LAINNYA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-base text-slate-800">Keamanan & Aturan</h3>
                    <p className="text-xs text-slate-500">Validasi dan batasan sistem.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="space-y-1">
                        <label className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-500" /> Wajib PIN
                        </label>
                        <p className="text-[10px] text-slate-500">Validasi saat request tukar/cuti.</p>
                    </div>
                    <Switch 
                        checked={settings.require_pin}
                        onCheckedChange={(checked) => setSettings({...settings, require_pin: checked})}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">H-Min Request</label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                min={0} 
                                className="pr-8 h-9 text-sm font-bold border-slate-200"
                                value={settings.min_request_days}
                                onChange={(e) => setSettings({...settings, min_request_days: parseInt(e.target.value) || 0})}
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">HARI</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Max Req/Bulan</label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                min={0} 
                                className="pr-8 h-9 text-sm font-bold border-slate-200"
                                value={settings.max_requests_per_month}
                                onChange={(e) => setSettings({...settings, max_requests_per_month: parseInt(e.target.value) || 0})}
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-slate-400">KALI</span>
                        </div>
                    </div>
                </div>
                
            </div>
        </div>

      </div>
      <div className="flex justify-end pt-4">
        <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-md font-bold px-6 transition-all active:scale-95"
        >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}