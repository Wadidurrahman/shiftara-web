"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Bell, Clock, Lock, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Pengaturan Sistem</h2>
        <p className="text-slate-500 text-lg">Konfigurasi aturan operasional utama dan protokol keamanan aplikasi Shiftara.</p>
      </div>
      
      <div className="grid gap-8">
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                   <Shield className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                   <CardTitle className="text-xl font-bold text-slate-900">Keamanan & Verifikasi</CardTitle>
                   <CardDescription className="text-slate-500 mt-1">Pengaturan otentikasi ganda dan validasi tindakan sensitif.</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
             <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-slate-50 transition-all duration-200">
              <div className="space-y-1">
                 <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" /> Wajib PIN Rekan
                 </Label>
                 <p className="text-sm text-slate-500">Rekan yang diajak tukar shift wajib memasukkan PIN untuk menyetujui permintaan.</p>
              </div>
              <Switch className="data-[state=checked]:bg-blue-700 scale-110" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-slate-50 transition-all duration-200">
              <div className="space-y-1">
                 <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-500" /> Notifikasi Email Admin
                 </Label>
                 <p className="text-sm text-slate-500">Kirim notifikasi ke email admin secara real-time saat ada request yang butuh persetujuan manual.</p>
              </div>
              <Switch className="data-[state=checked]:bg-blue-700 scale-110" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                   <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                   <CardTitle className="text-xl font-bold text-slate-900">Aturan Pertukaran Shift</CardTitle>
                   <CardDescription className="text-slate-500 mt-1">Kontrol batasan waktu dan kuota tukar jadwal antar karyawan.</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-amber-200 hover:bg-slate-50 transition-all duration-200">
              <div className="space-y-1">
                 <Label className="text-base font-semibold text-slate-900">Batas Pengajuan H-1</Label>
                 <p className="text-sm text-slate-500">Sistem akan mengunci fitur tukar shift jika kurang dari 24 jam sebelum shift dimulai.</p>
              </div>
              <Switch className="data-[state=checked]:bg-blue-700 scale-110" defaultChecked />
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-base font-semibold text-slate-900 block mb-3">Maksimal Request Per Bulan</Label>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 max-w-[60%]">Batasi jumlah pengajuan tukar atau izin yang dapat dilakukan oleh satu karyawan dalam satu periode gaji atau perjadwal.</p>
                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
                   <Input type="number" defaultValue={3} className="w-20 border-none shadow-none text-center font-bold text-lg focus-visible:ring-0 text-slate-900" />
                   <div className="bg-slate-100 px-3 py-1.5 rounded-md text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
                      Kali/Bulan
                   </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end pt-4">
           <Button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg px-8 py-6 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
              <Save className="w-5 h-5" />
              Simpan Perubahan
           </Button>
        </div>
      </div>
    </div>
  );
}