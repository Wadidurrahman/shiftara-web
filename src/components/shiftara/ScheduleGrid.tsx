"use client";

import React from "react";
import { User, Clock, CalendarOff } from "lucide-react";
import { ShiftData } from "@/app/schedule/page";

interface ScheduleGridProps {
  schedule: Record<string, ShiftData[]>;
  selected: { role: string; index: number } | null;
  swapMode: boolean;
  onSlotClick: (role: string, index: number) => void;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function ScheduleGrid({ schedule, selected, swapMode, onSlotClick }: ScheduleGridProps) {
  const roles = Object.keys(schedule);

  // Helper untuk format tanggal di header (misal: 20 Jan)
  const getHeaderDate = (roleKey: string, dayIndex: number) => {
    const slot = schedule[roleKey]?.[dayIndex];
    if (!slot?.date) return "";
    const dateObj = new Date(slot.date);
    return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
      <table className="w-full min-w-[1000px] border-collapse">
        {/* --- HEADER TABLE (HARI) --- */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32 sticky left-0 bg-slate-50 z-10">
              Posisi / Role
            </th>
            {DAYS.map((day, i) => (
              <th key={day} className="p-3 text-center w-[12.5%] border-l border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase">{day}</div>
                {roles.length > 0 && (
                  <div className="text-[10px] font-medium text-slate-400 mt-1">
                    {getHeaderDate(roles[0], i)}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* --- BODY TABLE (ISI JADWAL) --- */}
        <tbody className="divide-y divide-slate-100">
          {roles.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-400 text-sm italic">
                Belum ada data karyawan. Silakan tambah karyawan di menu settings/database.
              </td>
            </tr>
          ) : (
            roles.map((role) => (
              <tr key={role} className="hover:bg-slate-50/50 transition-colors">
                {/* Kolom Role */}
                <td className="p-4 font-bold text-slate-800 text-sm sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {role}
                </td>

                {/* Kolom Hari */}
                {schedule[role].map((slot, i) => {
                  const isSelected = selected?.role === role && selected?.index === i;
                  
                  // Styling Status
                  let cardStyle = "border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-300 hover:shadow-md"; // Default (Empty)
                  let icon = <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto" />; // Strip kosong

                  if (slot.type === 'filled') {
                    cardStyle = "bg-white border-blue-100 text-slate-700 shadow-sm hover:border-blue-400 hover:shadow-md hover:ring-2 hover:ring-blue-100";
                    icon = <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
                  } else if (slot.type === 'leave') {
                    cardStyle = "bg-red-50 border-red-100 text-red-600 hover:border-red-300";
                    icon = <CalendarOff className="w-3.5 h-3.5 text-red-500 shrink-0" />;
                  }

                  if (isSelected) {
                    cardStyle = "ring-2 ring-blue-600 border-blue-600 bg-blue-50 z-20 transform scale-105 shadow-xl";
                  }

                  if (swapMode && isSelected) {
                     cardStyle = "ring-2 ring-amber-500 border-amber-500 bg-amber-50 z-20 animate-pulse";
                  }

                  return (
                    <td key={i} className="p-2 border-l border-slate-100 h-28 align-top">
                      <div
                        onClick={() => onSlotClick(role, i)}
                        className={`
                          h-full w-full rounded-lg border p-2.5 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group
                          ${cardStyle}
                        `}
                      >
                        {/* Header Slot: Nama Shift / Jam */}
                        <div className="flex justify-between items-start">
                           <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${slot.type === 'filled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                              {slot.shift_name || "Shift"}
                           </span>
                           {slot.type === 'empty' && (
                             <div className="opacity-0 group-hover:opacity-100 text-[9px] text-blue-400 font-bold">
                               + ISI
                             </div>
                           )}
                        </div>

                        {/* Content Slot: Nama Karyawan */}
                        <div className="flex items-center gap-2 mt-1">
                           {slot.type !== 'empty' && icon}
                           <span className={`text-xs font-bold truncate leading-tight ${slot.type === 'empty' ? 'text-slate-300' : ''}`}>
                              {slot.name || "Kosong"}
                           </span>
                        </div>

                        {/* Footer Slot: Jam */}
                        {slot.type !== 'empty' && slot.type !== 'leave' && (
                           <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 bg-slate-50/50 p-1 rounded">
                              <Clock className="w-3 h-3" />
                              {slot.time ? slot.time.replace(" - ", "-") : "-"}
                           </div>
                        )}
                        
                        {/* Label Libur */}
                        {slot.type === 'leave' && (
                            <div className="mt-2 text-[10px] font-bold text-red-400 text-center border border-red-100 rounded bg-white py-0.5">
                                OFF DAY
                            </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}