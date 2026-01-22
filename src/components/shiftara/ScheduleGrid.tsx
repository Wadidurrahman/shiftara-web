"use client";

import React from "react";
import { Clock, Users } from "lucide-react";

export interface ShiftData {
  id: string;
  type: 'filled' | 'leave' | 'empty';
  name?: string;
  employee_id?: string;
  time: string;
  role: string;
  date?: string;
  shift_name?: string;
  division?: string;
}

interface Employee {
    id: string;
    name: string;
    role: string;
    division: string;
}

interface ScheduleGridProps {
  schedule: Record<string, ShiftData[]>;
  groupedEmployees: Record<string, Employee[]>;
  sortedDivisions: string[];
  selected: { rowKey: string; index: number } | null;
  swapMode: boolean;
  onSlotClick: (rowKey: string, index: number) => void;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function ScheduleGrid({ 
  schedule, 
  groupedEmployees, 
  sortedDivisions, 
  selected, 
  swapMode, 
  onSlotClick 
}: ScheduleGridProps) {
  
  const getHeaderDate = (divName: string, dayIndex: number) => {
    if (!sortedDivisions.length) return "";
    const firstEmp = groupedEmployees[divName]?.[0];
    if (!firstEmp) return "";
    
    const slot = schedule[firstEmp.id]?.[dayIndex];
    if (!slot?.date) return "";
    
    const dateObj = new Date(slot.date);
    return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="w-full h-full border border-slate-300 rounded-xl shadow-sm bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar w-full relative">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          
          <thead className="sticky top-0 z-30"> 
            <tr className="bg-slate-100 border-b border-slate-300 h-12  shadow-sm">
              <th className="p-4 px-8 text-left text-xs font-bold text-slate-600 uppercase tracking-wider min-w-[200px] sticky left-0 top-0 z-40 bg-slate-100 border-r border-slate-300">
                Karyawan
              </th>
              {DAYS.map((day, i) => (
                <th key={day} className="p-2 text-center w-[12.5%] border-l border-slate-300 bg-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase">{day}</div>
                  {sortedDivisions.length > 0 && (
                    <div className="text-sm font-medium text-slate-500 mt-0.5">
                      {getHeaderDate(sortedDivisions[0], i)}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedDivisions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm italic">
                  Belum ada data karyawan.
                </td>
              </tr>
            ) : (
              sortedDivisions.map((division) => (
                <React.Fragment key={division}>
                  <tr className="bg-slate-50/80">
                    <td colSpan={8} className="px-2 py-1.5 border-y border-slate-300 sticky left-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <Users className="w-3 h-3" />
                            {division}
                        </div>
                    </td>
                  </tr>

                  {groupedEmployees[division]?.map((emp) => {
                    const rowKey = emp.id;
                    const empSchedule = schedule[rowKey];

                    if (!empSchedule) return null;

                    return (
                      <tr key={rowKey} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-2 sticky left-0 bg-white z-20 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                          <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]" title={emp.name}>
                                {emp.name}
                              </span>
                              <span className="text-s, text-slate-500 mt-0.5">
                                {emp.role}
                              </span>
                          </div>
                        </td>

                        {empSchedule.map((slot, i) => {
                          const isSelected = selected?.rowKey === rowKey && selected?.index === i;
                          
                          let cardStyle = "border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-400 hover:shadow-sm"; 
                          
                          if (slot.type === 'filled') {
                            cardStyle = "bg-white border-slate-300 text-slate-800 shadow-sm hover:ring-2 hover:ring-blue-200";
                          } else if (slot.type === 'leave') {
                            cardStyle = "bg-red-50/50 border-red-200 text-red-600 hover:border-red-400";
                          }

                          if (isSelected) cardStyle = "ring-2 ring-blue-600 border-blue-600 bg-blue-50 z-10 shadow-md";
                          if (swapMode && isSelected) cardStyle = "ring-2 ring-amber-500 border-amber-500 bg-amber-50 z-10 animate-pulse";

                          return (
                            <td key={i} className="p-1 border-l border-slate-200 h-auto min-h-[80px] align-top">
                              <div
                                onClick={() => onSlotClick(rowKey, i)}
                                className={`w-full min-h-[75px] rounded border p-1.5 cursor-pointer transition-all duration-150 flex flex-col justify-between relative group ${cardStyle}`}
                              >
                           
                                <div className="flex justify-between items-start mb-1">
                                   <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${slot.type === 'filled' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>
                                      {slot.shift_name || "Shift"}
                                   </span>
                                   {slot.type === 'empty' && (
                                     <div className="opacity-0 group-hover:opacity-100 text-[9px] text-blue-500 font-bold">+</div>
                                   )}
                                </div>

                                {slot.type === 'filled' && (
                                    <>
                                        {/* Nama Karyawan (Highlight) */}
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[11px] font-black text-blue-950 truncate leading-tight">
                                                {slot.name?.split(' ')[0]}
                                            </span>
                                        </div>
                                        
                                        {/* Info Tambahan: Jam & Divisi Kecil */}
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded-sm">
                                                <Clock className="w-2.5 h-2.5" />
                                                {slot.time ? slot.time.split(' - ')[0] : "-"}
                                            </div>
                                            {/* Badge Divisi Kecil jika perlu */}
                                            <div className="text-[8px] text-slate-400 bg-white border border-slate-200 px-1 rounded-sm">
                                                {slot.division || emp.division}
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                {slot.type === 'leave' && (
                                    <div className="flex flex-col items-center justify-center h-full gap-1">
                                        <span className="text-[10px] font-extrabold text-red-500 tracking-wide">LIBUR</span>
                                    </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}