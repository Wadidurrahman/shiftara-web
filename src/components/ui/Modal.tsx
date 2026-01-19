import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string; // Menambahkan prop opsional untuk deskripsi
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl gap-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl font-bold text-primary text-left">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 text-left">
             {description || "Silakan lengkapi form di bawah ini."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 text-sm sm:text-base text-slate-700">
          {children}
        </div>

        {footer && (
          <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}