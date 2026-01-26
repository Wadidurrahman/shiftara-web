"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  // Opsional: Cek apakah user punya session (dari link email)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Jika tidak ada session, mungkin link kadaluarsa atau flow salah
        // Tapi kita biarkan dulu agar user bisa mencoba input
      }
    });
  }, []);

  const handleUpdate = async () => {
    if (!password) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({ text: "Password berhasil diperbarui! Mengalihkan...", type: 'success' });
      
      // Redirect ke dashboard setelah sukses
      setTimeout(() => {
        router.replace("/shift-manager");
      }, 2000);

    } catch (err) {
      setMessage({ 
        text: err instanceof Error ? err.message : "Gagal memperbarui password.", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#0B4650] text-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Atur Ulang Kata Sandi</h1>
          <p className="text-slate-500 text-sm mt-2">Masukkan kata sandi baru untuk akun Anda.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Password Baru</label>
            <Input 
              type="password" 
              placeholder="Minimal 6 karakter" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
              {message.text}
            </div>
          )}

          <Button 
            onClick={handleUpdate} 
            disabled={loading || password.length < 6} 
            className="w-full h-11 bg-[#0B4650] hover:bg-[#093e47] font-bold text-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Password Baru"}
          </Button>
        </div>
      </div>
    </div>
  );
}