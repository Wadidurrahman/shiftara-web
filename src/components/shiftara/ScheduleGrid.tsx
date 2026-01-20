"use client";

import { Briefcase } from "lucide-react";
import ShiftCard from "./ShiftCard";
import { ShiftData } from "@/types";
import { motion } from "framer-motion";

interface SelectedSlot {
  role: string;
  idx: number;
}

interface Props { 
  schedule: Record<string, ShiftData[]>; 
  selected: SelectedSlot | null; 
  swapMode: boolean; 
  onSlotClick: (role: string, idx: number) => void; 
}

export default function ScheduleGrid({ schedule, selected, swapMode, onSlotClick }: Props) {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const dates = [12, 13, 14, 15, 16, 17, 18];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-275">
          <div className="grid grid-cols-[240px_repeat(7,1fr)] bg-primary text-white border-b border-primary/20 sticky top-0 z-30 shadow-sm">
            <div className="p-4 text-xs font-black uppercase tracking-widest sticky left-0 bg-primary border-r border-primary/20 z-40 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-secondary" /> Divisi
            </div>
            {days.map((d, i) => (
              <div key={i} className="p-3 text-center border-r border-primary/20 relative group overflow-hidden">
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="text-[10px] font-bold text-secondary uppercase relative z-10">{d}</div>
                <div className="text-xl font-black relative z-10">{dates[i]}</div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {Object.entries(schedule).map(([role, shifts], roleIdx) => (
              <motion.div 
                key={role} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: roleIdx * 0.1 }}
                className="grid grid-cols-[240px_repeat(7,1fr)] min-h-36 group"
              >
                <div className="p-4 flex flex-col justify-center border-r border-slate-200 bg-white sticky left-0 z-20 group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shadow-md border-2 border-white">
                      <Briefcase className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="font-black text-primary text-sm uppercase tracking-tight">{role}</span>
                  </div>
                </div>
                {shifts.map((s, idx) => (
                  <div key={idx} className="p-2 border-r border-slate-100 bg-white group-hover:bg-slate-50/50 transition-colors relative">
                    <ShiftCard 
                      data={s} 
                      onClick={() => onSlotClick(role, idx)} 
                      isSelected={selected?.role === role && selected?.idx === idx} 
                      isSwapMode={swapMode} 
                    />
                    {swapMode && !selected && (
                      <div className="absolute inset-0 bg-primary/5 pointer-events-none z-0"></div>
                    )}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}