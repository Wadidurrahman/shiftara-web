"use client";

import { Clock } from "lucide-react";
import { ShiftData } from "@/app/shift-manager/page";
import { motion } from "framer-motion";
import React from "react";

interface ShiftCardProps {
  data: ShiftData;
  onClick: () => void;
  isSelected: boolean;
  isSwapMode: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function ShiftCard({ 
  data, 
  onClick, 
  isSelected, 
  isSwapMode, 
  draggable, 
  onDragStart, 
  onDragOver, 
  onDrop 
}: ShiftCardProps) {
  
  const baseClasses = `
    relative h-full min-h-[80px] w-full rounded-lg p-2.5 flex flex-col justify-between 
    transition-all duration-200 border select-none group
    ${isSelected ? "ring-2 ring-blue-500 border-blue-500 z-10 bg-blue-50/50" : ""}
    ${isSwapMode && !isSelected ? "cursor-copy hover:ring-2 hover:ring-amber-400 hover:bg-amber-50" : ""}
    ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
  `;

  if (data.type === "filled") {
    return (
      <motion.div 
        layoutId={`shift-${data.id}`}
        className={`${baseClasses} bg-white border-slate-200 hover:shadow-md hover:border-blue-300`}
        onClick={onClick}
        draggable={draggable}
        onDragStart={(e) => onDragStart && onDragStart(e as unknown as React.DragEvent<HTMLDivElement>)}
        onDragOver={(e) => onDragOver && onDragOver(e as unknown as React.DragEvent<HTMLDivElement>)}
        onDrop={(e) => onDrop && onDrop(e as unknown as React.DragEvent<HTMLDivElement>)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-100">
             <Clock className="w-2.5 h-2.5" />
             {data.time ? data.time.split(" - ")[0] : "-"}
          </div>
          <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1 rounded">
            {data.shift_name || "Shift"}
          </span>
        </div>

        <div className="flex items-center gap-2">
           <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-white
             ${data.role === 'Senior' ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white'}
           `}>
             {data.name?.substring(0,2).toUpperCase()}
           </div>
           <div className="overflow-hidden">
             <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                {data.name}
             </p>
             <p className="text-[9px] text-slate-500 truncate -mt-0.5">{data.role}</p>
           </div>
        </div>
      </motion.div>
    );
  }

  if (data.type === "empty") {
    return (
      <div 
        className={`${baseClasses} bg-slate-50 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 flex items-center justify-center`}
        onClick={onClick}
        onDragOver={onDragOver} 
        onDrop={onDrop}         
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
           <span className="text-xl text-blue-400 font-light">+</span>
           <span className="text-[9px] text-blue-400 font-bold uppercase">Isi</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} bg-red-50/50 border-red-100 flex flex-col items-center justify-center opacity-80`}
      onClick={onClick}
    >
       <span className="text-[10px] font-black text-red-400 bg-white border border-red-100 px-2 py-0.5 rounded shadow-sm uppercase tracking-widest mb-1">
         OFF
       </span>
       <span className="text-[10px] text-red-300 font-medium truncate w-full text-center">
         {data.name}
       </span>
    </div>
  );
}