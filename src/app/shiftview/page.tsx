"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { Clock, Loader2, ChevronLeft, ChevronRight, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShift } from "@/types";
import InboxModal from "@/components/shiftara/InboxModal";
import RequestFormModal from "@/components/shiftara/RequestFormModal";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ShiftViewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <ShiftViewContent />
    </Suspense>
  );
}

function ShiftViewContent() {
  const [schedules, setSchedules] = useState<PublicShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [selectedShift, setSelectedShift] = useState<PublicShift | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState<{ name: string; logo?: string } | null>(null);

  const searchParams = useSearchParams();
  const companyId = searchParams?.get("id");

  useEffect(() => {
    if (!companyId) return;

    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) setLoading(true);
      
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('company_name, logo_url')
          .eq('id', companyId)
          .single();
          
        if (profile && isMounted) {
          setCompanyInfo({ name: profile.company_name, logo: profile.logo_url });
        }

        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); 
        const end = addDays(start, 6); 

        const { data } = await supabase
          .from("schedules")
          .select("*")
          .eq("user_id", companyId)
          .gte("date", format(start, "yyyy-MM-dd"))
          .lte("date", format(end, "yyyy-MM-dd"))
          .neq("type", "empty"); 

        if (data && isMounted) setSchedules(data as unknown as PublicShift[]);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    const channel = supabase.channel(`public-schedule-${companyId}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "schedules", 
        filter: `user_id=eq.${companyId}` 
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => { 
      isMounted = false;
      supabase.removeChannel(channel); 
    };
  }, [currentDate, companyId]); 

  const handleSlotClick = (shift: PublicShift) => {
      setSelectedShift(shift);
      setIsRequestModalOpen(true);
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i);
    return { dateObj: d, dateStr: format(d, "yyyy-MM-dd"), label: format(d, "EEEE, dd MMM", { locale: id }) };
  });

  if (!companyId) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-slate-500 bg-slate-50 p-4 text-center">
              <Building2 className="w-12 h-12 mb-4 text-slate-300" />
              <h1 className="text-xl font-bold text-slate-700">Link Tidak Valid</h1>
              <p className="text-sm mt-2">Pastikan Anda menggunakan link yang diberikan oleh Admin.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 w-full md:w-auto">
            {companyInfo?.logo ? (
               <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-slate-100 shadow-sm shrink-0">
                  <Image src={companyInfo.logo} alt="Logo" fill className="object-cover" />
               </div>
            ) : (
               <div className="w-12 h-12 bg-[#0B4650] rounded-lg flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {companyInfo?.name?.substring(0,1) || "S"}
               </div>
            )}
            
            <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-black text-[#0B4650] truncate">
                    {companyInfo?.name || "Jadwal Shift"}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm mt-0.5 truncate">
                    Jadwal Operasional Mingguan
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-full md:w-auto justify-between md:justify-start">
            <Button size="icon" variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-8 w-8"><ChevronLeft className="w-4 h-4"/></Button>
            <span className="text-xs font-bold w-32 text-center text-slate-600">
                {format(days[0].dateObj, "dd MMM")} - {format(days[6].dateObj, "dd MMM")}
            </span>
            <Button size="icon" variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-8 w-8"><ChevronRight className="w-4 h-4"/></Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => setIsInboxOpen(true)} className="flex gap-2 text-[#0B4650] border-[#0B4650]/20 hover:bg-teal-50 w-full md:w-auto justify-center">
                <Bell className="w-4 h-4" /> Inbox
            </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
         {loading ? (
             <div className="col-span-full h-60 flex flex-col items-center justify-center text-slate-400">
                 <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#0B4650]"/>
                 <p className="text-sm animate-pulse">Sedang memuat jadwal...</p>
             </div>
         ) : days.map((day) => (
             <div key={day.dateStr} className={`bg-white rounded-xl border shadow-sm ${day.dateStr === format(new Date(), "yyyy-MM-dd") ? 'border-orange-400 ring-1 ring-orange-200' : 'border-slate-200'}`}>
                 <div className="px-4 py-3 border-b bg-slate-50/50 flex justify-between items-center">
                    <span className={`font-bold ${day.dateStr === format(new Date(), "yyyy-MM-dd") ? 'text-orange-600' : 'text-slate-700'}`}>
                        {day.label}
                    </span>
                    {day.dateStr === format(new Date(), "yyyy-MM-dd") && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">HARI INI</span>}
                 </div>
                 <div className="p-3 space-y-2">
                    {schedules.filter(s => s.date === day.dateStr).length === 0 && <p className="text-xs text-slate-400 text-center py-4 italic">Tidak ada jadwal</p>}
                    {schedules.filter(s => s.date === day.dateStr).map(shift => (
                        <div key={shift.id} onClick={() => handleSlotClick(shift)} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#0B4650] hover:bg-teal-50/30 cursor-pointer transition-all bg-white group shadow-sm">
                            <div className="w-9 h-9 rounded-full bg-[#0B4650] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md border-2 border-white">
                                {shift.employee_name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate">{shift.employee_name}</p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3 text-[#F58634]"/> <span className="font-medium bg-slate-100 px-1.5 rounded">{shift.shift_time}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
         ))}
      </div>

      <InboxModal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
      <RequestFormModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} selectedShift={selectedShift} />
    </div>
  );
}