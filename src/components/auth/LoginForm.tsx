"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

interface LoginFormProps {
  onToggleRegister: () => void;
  onGoogleLogin: () => void;
}

export default function LoginForm({ onToggleRegister, onGoogleLogin }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/shift-manager");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Masukkan email terlebih dahulu."); return; }
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
      if (error) throw error;
      setSuccessMsg("Link reset password dikirim ke email.");
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal kirim reset."); } finally { setLoading(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }} 
      transition={{ duration: 0.3 }}
      className="space-y-2 mb-12"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Selamat Datang</h2>
        <p className="text-slate-500 text-sm font-medium">Masuk untuk mengakses dashboard operasional.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font- semi bold text-slate-700  tracking-wider">Email Kantor</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0B4650] transition-colors" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" required className="h-11 pl-10 rounded-lg border-slate-200 bg-white/80 focus:bg-white focus:border-[#0B4650] focus:ring-2 focus:ring-[#0B4650]/20 text-sm transition-all" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font- semi bold text-slate-700  tracking-wider">Password</label>
            <button type="button" onClick={handleForgotPassword} className="text-[11px] text-[#F58634] font-bold hover:underline focus:outline-none">Lupa Password?</button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0B4650] transition-colors" />
            <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-11 pl-10 pr-10 rounded-lg border-slate-200 bg-white/80 focus:bg-white focus:border-[#0B4650] focus:ring-2 focus:ring-[#0B4650]/20 text-sm transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </div>

        <AnimatePresence>
          {error && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium flex gap-2 border border-red-200"><AlertCircle className="w-4 h-4 mt-0.5" />{error}</motion.div>}
          {successMsg && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-green-50 text-green-700 p-3 rounded-lg text-xs font-medium flex gap-2 border border-green-200"><CheckCircle2 className="w-4 h-4 mt-0.5" />{successMsg}</motion.div>}
        </AnimatePresence>

        <Button type="submit" className="w-full h-11 bg-[#0B4650] hover:bg-[#093e47] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm tracking-wide mt-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Masuk Dashboard"}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 tracking-widest"><span className="bg-white px-3 relative z-10">Atau</span></div>
        </div>
        <Button variant="outline" onClick={onGoogleLogin} className="w-full h-11 font-bold text-slate-700 border-slate-300 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2.5 text-sm shadow-sm bg-white/80">
           <GoogleIcon />
           <span>Google Account</span>
        </Button>
        <div className="text-center pt-2">
          <p className="text-xs text-slate-600">
            Belum punya akun? <button onClick={onToggleRegister} className="text-[#0B4650] font-bold hover:underline">Daftar Sekarang</button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}