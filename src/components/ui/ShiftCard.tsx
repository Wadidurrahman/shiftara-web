"use client";

import { GraduationCap } from "lucide-react";
import { ShiftData } from "@/types";

interface ShiftCardProps {
  data: ShiftData;
  isTrainee?: boolean;
  onClick: () => void;
  isSelected: boolean;
  isSwapMode: boolean;
}

export default function ShiftCard({ data, isTrainee = false, onClick, isSelected, isSwapMode }: ShiftCardProps) {
  
  if (data.type === "filled") {
    return (
      <div 
        onClick={onClick}
        className={`relative h-full min-h-25 w-full rounded-xl p-3 flex flex-col justify-between transition-all duration-200 border
          ${isSelected 
            ? "bg-teal-50 border-teal-500 ring-2 ring-teal-200 shadow-lg z-10" 
            : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300" 
          }
          ${isSwapMode ? "cursor-pointer hover:scale-[1.02]" : ""}
        `}
      >
        <div className="flex items-start justify-between">
          <div className={`w-2 h-2 rounded-full shadow-sm ${isTrainee ? 'bg-orange-500 animate-pulse' : 'bg-teal-600'}`}></div>
          <span className="text-[10px] font-mono text-slate-400 font-bold">{data.time.split(" - ")[0]}</span>
        </div>

        <div>
           <div className="flex items-center gap-1.5 mb-1">
             <span className="font-bold text-slate-800 text-sm leading-tight line-clamp-1 transition-colors">
                {data.name}
             </span>
             {isTrainee && <GraduationCap className="w-3.5 h-3.5 text-orange-500" />}
           </div>
           
           <span className={`text-[10px] px-2 py-0.5 rounded-md inline-block font-bold border
             ${isTrainee 
                ? "bg-orange-50 text-orange-700 border-orange-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"}
           `}>
             {isTrainee ? "Training" : "Staff Inti"}
           </span>
        </div>

        {isSwapMode && !isSelected && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl border-2 border-dashed border-orange-300">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                PILIH
              </span>
           </div>
        )}
      </div>
    );
  }

  if (data.type === "empty") {
    return (
      <div 
        onClick={onClick}
        className={`h-full min-h-25 w-full rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-all group
          ${isSelected 
             ? "bg-teal-50 border-teal-500" 
             : "bg-slate-50/50 border-slate-300 hover:bg-white hover:border-teal-400"}
          ${isSwapMode ? "cursor-pointer" : ""}
        `}
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-teal-100 text-slate-400 group-hover:text-teal-700 flex items-center justify-center">
           <span className="text-xl font-bold pb-1">+</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600 uppercase tracking-widest">Kosong</span>
      </div>
    );
  }

  return (
    <div className="h-full min-h-25 w-full rounded-xl border border-slate-200 bg-slate-100/50 flex flex-col items-center justify-center text-center p-2 opacity-75">
       <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full mb-2 shadow-sm">CUTI</span>
       <span className="text-[10px] text-slate-600 font-medium truncate w-full">{data.name}</span>
    </div>
  );
}