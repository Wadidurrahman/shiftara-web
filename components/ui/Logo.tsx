"use client";

import { motion } from "framer-motion";

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${className} relative flex items-center justify-center`}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full shadow-indigo-500/20 shadow-lg rounded-xl">
        {/* Background Tegas Kotak dengan Sudut Tumpul */}
        <rect width="100" height="100" rx="20" fill="#1e3a8a" />
        
        {/* Lingkaran Dekoratif Halus */}
        <circle cx="50" cy="50" r="40" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        
        {/* Ikon "S" Terpusat (Indigo & Gold) */}
        <path 
          d="M30 35C30 25 45 20 50 20C65 20 75 30 75 45C75 55 60 65 50 65C40 65 30 55 30 45" 
          stroke="#d4af37" 
          strokeWidth="12" 
          strokeLinecap="square"
        />
        <path 
          d="M70 65C70 75 55 80 50 80C35 80 25 70 25 55C25 45 40 35 50 35C60 35 70 45 70 55" 
          stroke="#ffffff" 
          strokeWidth="12" 
          strokeLinecap="square"
        />
        
        <path d="M22 45L30 35L38 45" stroke="#d4af37" strokeWidth="6" strokeLinecap="square" />
        <path d="M78 55L70 65L62 55" stroke="#ffffff" strokeWidth="6" strokeLinecap="square" />
      </svg>
    </motion.div>
  );
}