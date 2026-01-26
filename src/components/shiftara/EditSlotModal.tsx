"use client";

import { User, Clock, ArrowRightLeft, CalendarOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import { ShiftData } from "@/app/shift-manager/page";

interface Employee {
    id: string;
    name: string;
    role: string;
    division: string;
}

interface ShiftPattern {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

interface EditSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { rowKey: string; index: number; date: string; data: ShiftData } | null;
    employee: Employee | undefined;
    shiftPatterns: ShiftPattern[];
    selectedShiftTime: string;
    onShiftTimeChange: (val: string) => void;
    onSave: () => void;
    onDelete: () => void;
    onMarkLeave: () => void;
    onInitiateSwap: () => void;
    isProcessing: boolean;
}

export default function EditSlotModal({
    isOpen,
    onClose,
    selectedSlot,
    employee,
    shiftPatterns,
    selectedShiftTime,
    onShiftTimeChange,
    onSave,
    onDelete,
    onMarkLeave,
    onInitiateSwap,
    isProcessing
}: EditSlotModalProps) {
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Atur Jadwal">
            <div className="space-y-5">
                {/* Header Info */}
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                    <span className="text-xs font-bold text-[#0B4650] uppercase tracking-wider">
                        {employee ? employee.name : '-'}
                    </span>
                    <div className="font-bold text-slate-800 mt-1">
                        {selectedSlot?.date ? new Date(selectedSlot.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
                    </div>
                </div>

                {/* Form Input */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> Karyawan</label>
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                            {employee?.name || "-"}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Shift</label>
                        <select
                            className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0B4650]"
                            value={selectedShiftTime}
                            onChange={(e) => onShiftTimeChange(e.target.value)}
                        >
                            {shiftPatterns.map(sp => (
                                <option key={sp.id} value={`${sp.start_time.slice(0, 5)} - ${sp.end_time.slice(0, 5)}`}>
                                    {sp.name} ({sp.start_time.slice(0, 5)} - {sp.end_time.slice(0, 5)})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" onClick={onInitiateSwap} className="text-[#0B4650] hover:bg-teal-50 border-teal-200 text-xs">
                        <ArrowRightLeft className="w-3 h-3 mr-1" /> Tukar
                    </Button>
                    <Button variant="outline" onClick={onMarkLeave} className="text-[#F58634] hover:bg-orange-50 border-orange-200 text-xs">
                        <CalendarOff className="w-3 h-3 mr-1" /> Liburkan
                    </Button>
                    <Button variant="outline" onClick={onDelete} className="col-span-2 text-red-600 hover:bg-red-50 border-red-200 text-xs">
                        <Trash2 className="w-3 h-3 mr-1" /> Kosongkan Slot
                    </Button>
                    <Button onClick={onSave} disabled={isProcessing} className="col-span-2 bg-[#0B4650] hover:bg-[#093e47] text-white font-bold py-3 mt-2">
                        {isProcessing ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}