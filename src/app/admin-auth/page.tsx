"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { BarChart3, Users} from "lucide-react";

const HEADLINE_WORDS = ["Lebih Cerdas", "Lebih Efisien", "Lebih Akurat"];

export default function AdminAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % HEADLINE_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}/shift-manager` },
    });
  };

  return (
    <div className="h-screen w-full flex bg-white font-sans overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        className="w-full lg:w-[45%] h-full flex flex-col justify-center px-6 lg:px-16 relative z-20 overflow-hidden bg-white"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-32 -left-32 w-96 h-96 bg-teal-100/40 rounded-full blur-[100px]" />
            <motion.div animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }} className="absolute top-[40%] -right-20 w-80 h-80 bg-orange-100/30 rounded-full blur-[90px]" />
        </div>

        <div className="absolute top-8 left-8 z-20">
             <div className="relative w-28 h-10">
                <Image src="/logo.png" alt="Logo" fill className="object-contain object-left" />
             </div>
        </div>

        <div className="w-full max-w-sm mx-auto flex flex-col h-full justify-center relative z-10 pt-6">
            <div className="lg:hidden mb-6 w-32 h-10 relative">
               <Image src="/logo.png" alt="Logo" fill className="object-contain object-left" />
            </div>

            <AnimatePresence mode="wait">
                {isLogin ? (
                    <LoginForm key="login" onToggleRegister={() => setIsLogin(false)} onGoogleLogin={handleGoogleLogin} />
                ) : (
                    <RegisterForm key="register" onToggleLogin={() => setIsLogin(true)} onGoogleLogin={handleGoogleLogin} />
                )}
            </AnimatePresence>
        </div>

        <div className="absolute bottom-6 left-0 w-full text-center select-none z-20">
            <p className="text-xs font-semibold text-slate-500">v1.0.0 <br/> Developer by Wadidur Rahman</p>
        </div>
      </motion.div>

      <div className="hidden lg:flex w-[55%] h-full bg-[#0B4650] relative overflow-hidden flex-col justify-end items-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[70%] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 w-full h-full flex flex-col justify-end items-center pb-0">
            <div className="absolute top-[4%] w-full flex flex-col items-center space-y-6 z-30">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative w-64 h-20 drop-shadow-2xl">
                    <Image src="/logo.png" alt="Shiftara Brand" fill className="object-contain" quality={100} priority />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-center">
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg flex flex-row items-center justify-center gap-2">
                        <span className="whitespace-nowrap">Kelola Shift</span>
                        <div className="h-10 relative flex justify-start items-center w-48 overflow-hidden">
                           <AnimatePresence mode="wait">
                             <motion.span 
                               key={HEADLINE_WORDS[wordIndex]}
                               initial={{ y: 20, opacity: 0, scale: 0.9 }}
                               animate={{ y: 0, opacity: 1, scale: 1 }}
                               exit={{ y: -20, opacity: 0, scale: 0.9 }}
                               transition={{ duration: 0.4, ease: "backOut" }}
                               className="absolute text-[#F58634] whitespace-nowrap left-0"
                             >
                               {HEADLINE_WORDS[wordIndex]}
                             </motion.span>
                           </AnimatePresence>
                        </div>
                    </h1>
                    <p className="text-teal-100/80 text-sm font-medium tracking-wide max-w-sm mx-auto mt-2">
                        Solusi manajemen terintegrasi untuk efisiensi tim.
                    </p>
                </motion.div>
            </div>

            <div className="relative z-20 w-auto h-[65vh] flex justify-center items-end">
               <motion.div 
                  initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute left-10 top-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl z-30 flex items-center gap-3 w-48"
               >
                  <div className="w-10 h-10 bg-[#F58634] rounded-full flex items-center justify-center text-white"><BarChart3 size={20} /></div>
                  <div><p className="text-xs text-teal-100">Efisiensi</p><p className="text-lg font-bold text-white">+24%</p></div>
               </motion.div>

               <motion.div 
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
                  className="absolute right-8 top-44 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl z-30 flex items-center gap-3 w-44"
               >
                  <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white"><Users size={20} /></div>
                  <div><p className="text-xs text-teal-100">Tim Aktif</p><p className="text-lg font-bold text-white">128</p></div>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }} className="relative z-20 h-full">
                   <Image src="/new.png" alt="Hero" width={1000} height={1200} className="h-full w-auto object-contain object-bottom drop-shadow-2xl" priority quality={100} />
               </motion.div>
            </div>
        </div>
      </div>
    </div>
  );
}