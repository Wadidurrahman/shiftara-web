"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";

interface AutoScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export default function AutoScheduleModal({ isOpen, onClose, onConfirm, isProcessing }: AutoScheduleModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Auto-Fill">
            <div className="p-4 space-y-4 text-center">
                <div className="p-4 bg-teal-50 text-[#0B4650] rounded-lg text-sm border border-teal-200">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#0B4650]" />
                    <p>Otomatis mengisi slot kosong dengan <strong>Distribusi Divisi Merata</strong>.</p>
                    <p className="text-xs text-slate-500 mt-1">Sistem menjamin setiap shift memiliki personil dari setiap divisi.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                    <Button className="flex-1 bg-[#0B4650] text-white" onClick={onConfirm} disabled={isProcessing}>
                        {isProcessing ? "Proses..." : "Jalankan"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}