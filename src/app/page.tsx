"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Calendar, Clock, Activity } from "lucide-react"; // Tambah icon
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    emptyShifts: 0,
    pendingRequests: 0,
    productivity: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setIsLoading(true);
        const { count: empCount, error: empError } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        if (empError) throw empError;

        const { count: emptyCount } = await supabase
          .from('schedules') 
          .select('*', { count: 'exact', head: true })
          .eq('type', 'empty');
        
        setStats({
          totalEmployees: empCount || 0,
          emptyShifts: emptyCount || 0,
          pendingRequests: 3, 
          productivity: 92  
        });

      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary">Dasbor Operasional</h2>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Data Real-time dari Database</span>
          </div>
        </div>  
      </div>
      
      {/* Grid Layout 4 Kolom */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KARTU 1: TOTAL KARYAWAN */}
        <Card className="border-none shadow-lg bg-primary text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-secondary">Jumlah Karyawan</CardTitle>
            <Users className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">
                {isLoading ? "..." : stats.totalEmployees}
            </div>
            <p className="text-xs text-slate-200 mt-1 font-medium">Karyawan terdaftar di DB</p>
          </CardContent>
        </Card>

        {/* KARTU 2: SHIFT KOSONG */}
        <Card className="border-none shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Shift Kosong</CardTitle>
            <div className="p-2 bg-red-100 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">
                {isLoading ? "..." : stats.emptyShifts}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Butuh alokasi segera</p>
          </CardContent>
        </Card>

        {/* KARTU 3: REQUEST PENDING (Pelengkap UI) */}
        <Card className="border-none shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Request Pending</CardTitle>
            <div className="p-2 bg-amber-100 rounded-md">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800">
                {isLoading ? "..." : stats.pendingRequests}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Menunggu persetujuan</p>
          </CardContent>
        </Card>

        {/* KARTU 4: PRODUKTIVITAS (Pelengkap UI) */}
        <Card className="border-none shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Produktivitas Tim</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-md">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-800">
                {isLoading ? "..." : stats.productivity}%
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Performa minggu ini</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}