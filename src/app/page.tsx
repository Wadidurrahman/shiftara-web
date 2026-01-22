"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, AlertCircle, Clock, CheckCircle2, ArrowRight, CalendarDays, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { format, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

interface DashboardMetrics {
  onDutyToday: number;
  emptyShifts: number;
  pendingRequests: number;
}

interface ShiftItem {
  id: string;
  name: string;
  role: string;
  time: string;
  status: 'filled' | 'empty' | 'leave';
}

interface RawShiftData {
  id: string;
  employee_name: string | null;
  role: string;
  shift_time: string | null;
  type: 'filled' | 'empty' | 'leave';
  date: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({ onDutyToday: 0, emptyShifts: 0, pendingRequests: 0 });
  const [yesterdayRoster, setYesterdayRoster] = useState<ShiftItem[]>([]);
  const [todayRoster, setTodayRoster] = useState<ShiftItem[]>([]);
  const [tomorrowRoster, setTomorrowRoster] = useState<ShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateInfo, setDateInfo] = useState({ today: new Date(), yesterday: new Date(), tomorrow: new Date() });

  useEffect(() => {
    async function fetchOperationalData() {
      try {
        setIsLoading(true);
        const todayDate = new Date();
        const yesterdayDate = subDays(todayDate, 1);
        const tomorrowDate = addDays(todayDate, 1);
        
        setDateInfo({ today: todayDate, yesterday: yesterdayDate, tomorrow: tomorrowDate });

        const todayStr = format(todayDate, 'yyyy-MM-dd');
        const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');
        const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

        const [schedulesRes, pendingRes, emptyTotalRes] = await Promise.all([
          supabase.from('schedules').select('*').gte('date', yesterdayStr).lte('date', tomorrowStr),
          supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_admin'),
          supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('type', 'empty')
        ]);

        const allShifts = (schedulesRes.data as unknown as RawShiftData[]) || [];

        const processRoster = (dateStr: string) => {
            return allShifts
                .filter(s => s.date === dateStr)
                .map(s => ({
                    id: s.id,
                    name: s.employee_name || "-",
                    role: s.role,
                    time: s.shift_time || "-",
                    status: s.type
                }))
                .sort((a, b) => {
                   if (a.status === 'empty' && b.status !== 'empty') return -1;
                   if (a.status !== 'empty' && b.status === 'empty') return 1;
                   return 0;
                });
        };

        setYesterdayRoster(processRoster(yesterdayStr));
        setTodayRoster(processRoster(todayStr));
        setTomorrowRoster(processRoster(tomorrowStr));

        setMetrics({
          onDutyToday: processRoster(todayStr).filter(s => s.status === 'filled').length,
          emptyShifts: emptyTotalRes.count || 0,
          pendingRequests: pendingRes.count || 0,
        });

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOperationalData();
  }, []);

  const RosterList = ({ data, emptyMessage }: { data: ShiftItem[], emptyMessage: string }) => {
    if (data.length === 0) {
        return <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">{emptyMessage}</div>;
    }
    return (
        <div className="overflow-y-auto flex-1 pr-2 space-y-1 custom-scrollbar">
            {data.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-white border border-slate-100 rounded-lg hover:border-slate-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`px-2 py-1 rounded text-[10px] font-bold w-14 text-center shrink-0 ${item.status === 'empty' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
                            {item.time?.split(' - ')[0] || '00:00'}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${item.status === 'empty' ? 'text-red-500' : 'text-slate-700'}`}>
                                {item.status === 'empty' ? "KOSONG" : item.name.split(' ')[0]}
                            </p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide truncate">{item.role}</p>
                        </div>
                    </div>
                    <div>
                        {item.status === 'filled' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Hadir"></div>}
                        {item.status === 'leave' && <div className="w-2 h-2 rounded-full bg-amber-400" title="Cuti"></div>}
                        {item.status === 'empty' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Kosong"></div>}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <motion.div 
      className="flex flex-col h-[calc(100vh-100px)] gap-4" 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        
        <Link href="/schedule" className="block">
            <Card className={`border shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-center ${metrics.emptyShifts > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${metrics.emptyShifts > 0 ? 'text-red-600' : 'text-slate-500'}`}>Shift Kosong</p>
                        <div className="text-2xl font-black text-slate-800 mt-0.5">{isLoading ? "-" : metrics.emptyShifts}</div>
                    </div>
                    <AlertCircle className={`w-6 h-6 ${metrics.emptyShifts > 0 ? 'text-red-500' : 'text-slate-200'}`} />
                </div>
            </Card>
        </Link>

        <div className="block">
            <Card className={`border shadow-sm h-full flex flex-col justify-center ${metrics.pendingRequests > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${metrics.pendingRequests > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Request Baru</p>
                        <div className="text-2xl font-black text-slate-800 mt-0.5">{isLoading ? "-" : metrics.pendingRequests}</div>
                    </div>
                    <Clock className={`w-6 h-6 ${metrics.pendingRequests > 0 ? 'text-amber-600' : 'text-slate-200'}`} />
                </div>
            </Card>
        </div>

        <div className="block">
            <Card className="border shadow-sm bg-white h-full flex flex-col justify-center">
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-[#0B4650] uppercase tracking-wider">Personil Hari Ini</p>
                        <div className="text-2xl font-black text-slate-800 mt-0.5">{isLoading ? "-" : metrics.onDutyToday}</div>
                    </div>
                    <Users className="w-6 h-6 text-[#0B4650]/20" />
                </div>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        <motion.div variants={itemVariants} className="flex flex-col h-full min-h-0">
            <Card className="border-slate-200 shadow-sm h-full flex flex-col bg-slate-50/50">
                <div className="py-3 px-4 border-b border-slate-200 bg-white rounded-t-xl shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <RefreshCcw className="w-3 h-3" /> Kemarin
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{format(dateInfo.yesterday, 'dd MMM', { locale: id })}</div>
                    </div>
                </div>
                <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {isLoading ? <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 bg-slate-200 rounded animate-pulse"/>)}</div> 
                    : <RosterList data={yesterdayRoster} emptyMessage="Data histori kosong" />}
                </div>
            </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col h-full min-h-0 relative z-10 -mt-1 lg:mt-0">
            <Card className="border-[#0B4650] shadow-lg h-full flex flex-col ring-1 ring-[#0B4650]/10 bg-white">
                <div className="py-3 px-4 border-b border-[#0B4650]/10 bg-[#0B4650] text-white shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#F58634]" /> HARI INI
                        </div>
                        <div className="text-xs font-bold bg-[#083a42] px-2 py-0.5 rounded text-[#F58634] shadow-sm">
                            {format(dateInfo.today, 'dd MMM', { locale: id })}
                        </div>
                    </div>
                </div>
                <div className="p-3 flex-1 flex flex-col min-h-0 bg-[#F8FAFC] overflow-hidden">
                    {isLoading ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-slate-200 rounded animate-pulse"/>)}</div> 
                    : <RosterList data={todayRoster} emptyMessage="Belum ada jadwal hari ini" />}
                    
                    <div className="pt-3 mt-2 border-t border-slate-200 text-center shrink-0">
                        <Link href="/schedule">
                            <button className="text-xs font-bold text-[#F58634] hover:text-[#d66e23] flex items-center justify-center gap-1 w-full py-1 hover:bg-orange-50 rounded transition-colors">
                                Kelola Jadwal Penuh <ArrowRight className="w-3 h-3" />
                            </button>
                        </Link>
                    </div>
                </div>
            </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col h-full min-h-0">
            <Card className="border-slate-200 shadow-sm h-full flex flex-col bg-white">
                <div className="py-3 px-4 border-b border-slate-100 bg-blue-50/30 rounded-t-xl shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <CalendarDays className="w-3 h-3" /> Besok
                        </div>
                        <div className="text-[10px] font-mono text-blue-400">{format(dateInfo.tomorrow, 'dd MMM', { locale: id })}</div>
                    </div>
                </div>
                <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {isLoading ? <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 bg-slate-200 rounded animate-pulse"/>)}</div> 
                    : <RosterList data={tomorrowRoster} emptyMessage="Belum ada jadwal besok" />}
                </div>
            </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}