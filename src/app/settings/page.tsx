"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, Clock, Save, MessageCircle, 
  Loader2, ExternalLink, CheckCircle2, AlertCircle, X, Plus, Trash2,
  Building2, Camera, 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ShiftPattern {
    id?: string;
    name: string;
    start_time: string;
    end_time: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const [settings, setSettings] = useState({
    id: "",
    wa_group_link: "",
    min_request_days: 1,
    require_pin: true,
    max_requests_per_month: 3
  });

  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    logo_url: "" as string | null
  });
  const [userId, setUserId] = useState<string | null>(null);

  const [shifts, setShifts] = useState<ShiftPattern[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          setUserId(user.id);
          
          const { data: profile } = await supabase
            .from('users')
            .select('company_name, logo_url')
            .eq('id', user.id)
            .maybeSingle();
            
          if (profile) {
              setCompanyProfile({
                  name: profile.company_name || "",
                  logo_url: profile.logo_url
              });
          } else {
              setCompanyProfile({
                  name: user.user_metadata?.company_name || "",
                  logo_url: null
              });
          }
      }

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

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0 || !userId) {
        throw new Error('Pilih gambar terlebih dahulu.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      
      setCompanyProfile(prev => ({ ...prev, logo_url: data.publicUrl }));
      showToast("Logo berhasil diupload!", "success");

    } catch (error) {
      console.error(error);
      showToast("Gagal upload gambar. Pastikan format sesuai.", "error");
    } finally {
      setIsUploading(false);
    }
  };

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
        if (!userId) throw new Error("User tidak ditemukan");

        const { error: profileError } = await supabase
            .from('users')
            .upsert({ 
                id: userId,
                company_name: companyProfile.name,
                logo_url: companyProfile.logo_url,
                updated_at: new Date()
            });

        if (profileError) throw profileError;

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

        if (shifts.length > 0) {
            const { data: existing } = await supabase.from('shift_patterns').select('id');
            const existingIds = existing?.map(e => e.id) || [];
            
            const currentIds = shifts.filter(s => s.id).map(s => s.id);
            const toDelete = existingIds.filter(id => !currentIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from('shift_patterns').delete().in('id', toDelete);
            }

            const toUpsert = shifts.map(s => ({
                id: s.id, 
                name: s.name,
                start_time: s.start_time,
                end_time: s.end_time
            }));

            const { error: shiftError } = await supabase.from('shift_patterns').upsert(toUpsert);
            if (shiftError) throw shiftError;
        }

        const { data: refreshedShifts } = await supabase.from('shift_patterns').select('*').order('start_time');
        if (refreshedShifts) {
             const formatted = refreshedShifts.map(s => ({
                ...s,
                start_time: s.start_time.slice(0, 5),
                end_time: s.end_time.slice(0, 5)
            }));
            setShifts(formatted);
        }

        showToast("Pengaturan berhasil disimpan!", "success");
        setTimeout(() => window.location.reload(), 1000);

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
          <div className="flex h-[80vh] items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B4650]" />
                <p className="text-slate-700 font-bold animate-pulse">Memuat Data...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="pb-32 font-sans bg-slate-100 min-h-screen pt-8">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-8">
            <div className="rounded-lg shadow-sm border border-slate-200 bg-white">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-white">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                        <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Identitas Perusahaan</h3>
                </div>
                
                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                        {companyProfile.logo_url ? (
                            <div className="w-32 h-32 rounded-full overflow-hidden border-[3px] border-slate-200 shadow-sm group-hover:border-slate-400 transition-all relative">
                                <Image 
                                    src={companyProfile.logo_url} 
                                    alt="Logo" 
                                    fill 
                                    sizes="128px" 
                                    unoptimized
                                    className="object-cover" 
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border-[3px] border-dashed border-slate-300 group-hover:border-slate-400 group-hover:text-slate-600 transition-all">
                                <Building2 className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-[#0B4650] animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    <input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleUploadLogo} 
                        disabled={isUploading}
                    />
                    
                    <div className="w-full space-y-2">
                        <Label className="text-sm font-bold text-slate-700 block">Nama Entitas</Label>
                        <Input 
                            value={companyProfile.name} 
                            onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})}
                            placeholder="PT. Contoh Sejahtera" 
                            className="h-11 border-slate-300 focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] font-bold text-slate-900 text-center rounded-md"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg shadow-sm border border-slate-200 bg-white">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-white">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                        <Shield className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Kontrol & Validasi</h3>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg">
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Wajib PIN Karyawan</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Otorisasi untuk tukar/cuti.</p>
                        </div>
                        <Switch 
                            checked={settings.require_pin}
                            onCheckedChange={(checked) => setSettings({...settings, require_pin: checked})}
                            className="data-[state=checked]:bg-[#0B4650] data-[state=unchecked]:bg-slate-300 border-2 border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 block">Batas Min. H-Hari</Label>
                            <div className="relative">
                                <Input 
                                    type="number" min={0} 
                                    className="pr-12 h-11 font-bold border-slate-300 focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] rounded-md"
                                    value={settings.min_request_days}
                                    onChange={(e) => setSettings({...settings, min_request_days: parseInt(e.target.value) || 0})}
                                />
                                <span className="absolute right-3 top-3 text-xs font-bold text-slate-500 bg-slate-100 px-1 rounded">HARI</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 block">Maks. Request/Bln</Label>
                            <div className="relative">
                                <Input 
                                    type="number" min={0} 
                                    className="pr-12 h-11 font-bold border-slate-300 focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] rounded-md"
                                    value={settings.max_requests_per_month}
                                    onChange={(e) => setSettings({...settings, max_requests_per_month: parseInt(e.target.value) || 0})}
                                />
                                <span className="absolute right-3 top-3 text-xs font-bold text-slate-500 bg-slate-100 px-1 rounded">KALI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
            <div className="rounded-lg shadow-sm border border-slate-200 bg-white">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                            <Clock className="w-5 h-5 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Master Pola Shift</h3>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={addShift} 
                        variant="outline"
                        className="border-[#0B4650] text-[#0B4650] hover:bg-[#0B4650] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors rounded-md"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Tambah Pola
                    </Button>
                </div>

                <div className="p-6 space-y-4 bg-slate-50">
                    {shifts.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-700 font-bold text-base">Belum ada data shift.</p>
                             <p className="text-slate-500 text-sm">Silakan tambahkan pola kerja baru.</p>
                        </div>
                    ) : shifts.map((shift, idx) => (
                        <div key={idx} className="group flex flex-col md:flex-row gap-4 items-end md:items-center p-5 bg-white border border-slate-200 shadow-sm rounded-lg transition-all">
                            <div className="w-full md:w-4/12">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Nama Shift</label>
                                <Input 
                                    placeholder="Contoh: Pagi" 
                                    value={shift.name} 
                                    onChange={(e) => updateShift(idx, 'name', e.target.value)}
                                    className="border-slate-300 font-bold text-slate-900 focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] h-10 rounded-md"
                                />
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-6/12">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Jam Masuk</label>
                                    <Input 
                                        type="time" 
                                        value={shift.start_time} 
                                        onChange={(e) => updateShift(idx, 'start_time', e.target.value)}
                                        className="border-slate-300 font-mono font-bold text-sm focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] h-10 rounded-md"
                                    />
                                </div>
                                <span className="text-slate-400 mt-7 font-bold text-lg hidden md:block">→</span>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Jam Pulang</label>
                                    <Input 
                                        type="time" 
                                        value={shift.end_time} 
                                        onChange={(e) => updateShift(idx, 'end_time', e.target.value)}
                                        className="border-slate-300 font-mono font-bold text-sm focus:border-[#0B4650] focus:ring-1 focus:ring-[#0B4650] h-10 rounded-md"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex justify-end mt-2 md:mt-6">
                                <Button size="icon" variant="ghost" onClick={() => removeShift(idx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md h-10 w-10">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-lg shadow-sm border border-slate-200 bg-white">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-white">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                        <MessageCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Integrasi Eksternal</h3>
                </div>
                
                <div className="p-6 bg-slate-50">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 block">Tautan Grup Komunikasi (WhatsApp)</label>
                        <div className="flex gap-0 shadow-sm rounded-md overflow-hidden border border-slate-300 focus-within:border-[#0B4650] focus-within:ring-1 focus-within:ring-[#0B4650]">
                            <div className="bg-slate-100 border-r border-slate-300 px-4 flex items-center text-slate-600 rounded-l-md">
                                <span className="text-xs font-extrabold">URL</span>
                            </div>
                            <Input 
                                placeholder="https://chat.whatsapp.com/..." 
                                className="font-mono text-sm border-0 rounded-none focus:ring-0 flex-1 bg-white"
                                value={settings.wa_group_link}
                                onChange={(e) => setSettings({...settings, wa_group_link: e.target.value})}
                            />
                            <Button 
                                variant="ghost" 
                                className="rounded-none border-l border-slate-300 hover:bg-slate-100 text-slate-600"
                                onClick={() => settings.wa_group_link && window.open(settings.wa_group_link, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="w-4 h-4 text-[#0B4650]" />
                            Tautan ini akan ditampilkan di dasbor utama karyawan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:px-8 z-40 flex justify-end items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:static md:bg-transparent md:border-none md:shadow-none md:mt-8 md:mb-16">
        <div className="flex items-center gap-4 w-full md:w-auto justify-end bg-white md:bg-transparent p-2 md:p-0 rounded-lg">
            <p className="text-sm text-slate-500 font-medium hidden sm:block mr-2">Pastikan data sudah sesuai.</p>
            <Button 
                onClick={handleSave} 
                disabled={isSaving || isUploading}
                className="bg-[#0B4650] hover:bg-[#093e47] text-white shadow-md font-bold px-6 h-12 rounded-md transition-all active:scale-95 text-sm flex items-center gap-2 w-full md:w-auto justify-center tracking-wide"
            >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SIMPAN KONFIGURASI
            </Button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-24 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-l-4 ${
              toast.type === 'success' ? "bg-white border-l-[#0B4650] text-[#0B4650]" : "bg-white border-l-red-600 text-red-600"
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600"/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}