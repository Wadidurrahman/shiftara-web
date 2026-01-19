"use client";

import { GraduationCap, User } from "lucide-react";
import { ShiftData } from "@/types";
import { motion } from "framer-motion";

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
      <motion.div 
        whileHover={{ scale: isSwapMode ? 1.02 : 1, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative h-full min-h-28 w-full rounded-lg p-3 flex flex-col justify-between transition-all duration-200 border shadow-sm
          ${isSelected 
            ? "bg-secondary/20 border-secondary ring-2 ring-secondary shadow-md z-10" 
            : "bg-white border-slate-200 hover:border-primary hover:shadow-md" 
          }
          ${isSwapMode ? "cursor-pointer" : ""}
        `}
      >
        <div className="flex items-start justify-between">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${isTrainee ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}`}>
            <div className={`w-2 h-2 rounded-full ${isTrainee ? 'bg-orange-500 animate-pulse' : 'bg-primary'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{isTrainee ? 'Training' : 'Inti'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-bold">{data.time.split(" - ")[0]}</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
           <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-sm border border-white ${isTrainee ? 'bg-orange-50 text-orange-600' : 'bg-primary text-white'}`}>
             {isTrainee ? <GraduationCap className="w-5 h-5" /> : <User className="w-5 h-5" />}
           </div>
           <div>
             <span className={`font-bold text-sm leading-tight line-clamp-1 ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                {data.name}
             </span>
             <span className="text-[10px] text-slate-500 font-medium block -mt-0.5">{data.role}</span>
           </div>
        </div>

        {isSwapMode && !isSelected && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] flex items-center justify-center rounded-lg border-2 border-dashed border-secondary z-20"
           >
              <span className="bg-secondary text-primary text-xs font-black px-4 py-2 rounded-md shadow-lg uppercase tracking-widest transform scale-90 hover:scale-100 transition-transform">
                PILIH
              </span>
           </motion.div>
        )}
      </motion.div>
    );
  }

  if (data.type === "empty") {
    return (
      <motion.div 
        whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`h-full min-h-28 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group bg-slate-50/50
          ${isSelected 
             ? "border-secondary bg-secondary/10" 
             : "border-slate-300 hover:border-primary"}
          ${isSwapMode ? "cursor-pointer" : ""}
        `}
      >
        <div className="w-10 h-10 rounded-md bg-white group-hover:bg-primary text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shadow-sm border border-slate-200 group-hover:border-primary">
           <span className="text-2xl font-light pb-1">+</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest transition-colors">Kosong</span>
      </motion.div>
    );
  }

  return (
    <div className="h-full min-h-28 w-full rounded-lg border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-center p-2 opacity-75 grayscale">
       <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md mb-2 shadow-sm uppercase tracking-wider">CUTI</span>
       <span className="text-xs text-slate-600 font-bold truncate w-full">{data.name}</span>
    </div>
  );
}