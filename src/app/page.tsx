"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, Clock, Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
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

        const { count: empCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: emptyCount } = await supabase
          .from('schedules') 
          .select('*', { count: 'exact', head: true })
          .eq('type', 'empty');

        const { count: pendingCount } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_admin');

        const { count: totalShiftCount } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true });

        const filledShifts = (totalShiftCount || 0) - (emptyCount || 0);
        const productivityRate = totalShiftCount ? Math.round((filledShifts / totalShiftCount) * 100) : 0;
        
        setStats({
          totalEmployees: empCount || 0,
          emptyShifts: emptyCount || 0,
          pendingRequests: pendingCount || 0, 
          productivity: productivityRate
        });

      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Karyawan</CardTitle>
            <div className="p-2 bg-blue-50 rounded-sm">
                <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-slate-800">
                    {isLoading ? "-" : stats.totalEmployees}
                </div>
                <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> Aktif
                </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Terdaftar dalam database</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shift Kosong</CardTitle>
            <div className="p-2 bg-red-50 rounded-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">
                {isLoading ? "-" : stats.emptyShifts}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Jadwal belum ada petugas</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Request Baru</CardTitle>
            <div className="p-2 bg-amber-50 rounded-sm">
                <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">
                {isLoading ? "-" : stats.pendingRequests}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Menunggu persetujuan Admin</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-primary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-wider">Shift Terisi</CardTitle>
            <div className="p-2 bg-white/10 rounded-sm">
                <Activity className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-secondary">
                {isLoading ? "-" : `${stats.productivity}%`}
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                <div 
                    className="bg-secondary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.productivity}%` }}
                ></div>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-medium">Efisiensi penjadwalan minggu ini</p>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-2">
         <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Grafik Statistik akan ditampilkan di sini</p>
            <p className="text-xs text-slate-400">(Sedang dalam pengembangan)</p>
         </div>
         <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
                <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Aktivitas Karyawan Terbaru</p>
            <p className="text-xs text-slate-400">(Sedang dalam pengembangan)</p>
         </div>
      </div>
    </div>
  );
}