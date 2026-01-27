"use client";

import React from "react";
import { Users } from "lucide-react";
import ShiftCard from "./ShiftCard"; 
import { ShiftData, Employee } from "@/types";

interface ScheduleGridProps {
  schedule: Record<string, ShiftData[]>;
  groupedEmployees: Record<string, Employee[]>;
  sortedDivisions: string[];
  selected: { rowKey: string; index: number } | null;
  swapMode: boolean;
  onSlotClick: (rowKey: string, index: number) => void;
  onMoveShift: (source: {rowKey: string, index: number}, target: {rowKey: string, index: number}) => void;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function ScheduleGrid({ 
  schedule, 
  groupedEmployees, 
  sortedDivisions, 
  selected, 
  swapMode, 
  onSlotClick,
  onMoveShift
}: ScheduleGridProps) {
  
  const handleDragStart = (e: React.DragEvent, rowKey: string, index: number) => {
    const dragData = JSON.stringify({ rowKey, index });
    e.dataTransfer.setData("application/shiftara-slot", dragData);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetRowKey: string, targetIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/shiftara-slot");
    if (!data) return;

    try {
      const source = JSON.parse(data);
      onMoveShift(source, { rowKey: targetRowKey, index: targetIndex });
    } catch (err) {
      console.error("Gagal parsing drag data", err);
    }
  };

  const getHeaderDate = (divName: string, dayIndex: number) => {
    if (!sortedDivisions.length) return "";
    const firstEmp = groupedEmployees[divName]?.[0];
    if (!firstEmp) return "";
    const slot = schedule[firstEmp.id]?.[dayIndex];
    if (!slot?.date) return "";
    return new Date(slot.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="w-full h-full border border-slate-300 rounded-xl shadow-sm bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar w-full relative">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead className="sticky top-0 z-30"> 
            <tr className="bg-slate-100 border-b border-slate-300 h-12 shadow-sm">
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
              <tr><td colSpan={8} className="p-8 text-center text-slate-400 italic">Belum ada data.</td></tr>
            ) : (
              sortedDivisions.map((division) => (
                <React.Fragment key={division}>
                  <tr className="bg-slate-50/80">
                    <td colSpan={8} className="px-2 py-1.5 border-y border-slate-300 sticky left-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <Users className="w-3 h-3" /> {division}
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
                              <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]" title={emp.name}>{emp.name}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide px-1.5 py-0.5 bg-slate-100 rounded w-fit">{emp.role}</span>
                          </div>
                        </td>

                        {empSchedule.map((slot, i) => {
                          const isSelected = selected?.rowKey === rowKey && selected?.index === i;
                          
                          return (
                            <td key={i} className="p-1 border-l border-slate-200 h-auto min-h-[90px] align-top">
                              <ShiftCard 
                                data={slot}
                                isSelected={isSelected}
                                isSwapMode={swapMode}
                                onClick={() => onSlotClick(rowKey, i)}
                                draggable={slot.type === 'filled'} 
                                onDragStart={(e) => handleDragStart(e, rowKey, i)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, rowKey, i)}
                              />
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