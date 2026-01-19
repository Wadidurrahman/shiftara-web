"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Users, Search, KeyRound, Phone, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  pin: string;
  status: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Default loading true saat awal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "Barista Senior",
    phone: "",
    pin: "",
  });

  // ✅ PERBAIKAN: Fungsi ini HANYA mengambil data, tidak mengubah state loading sendiri
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEmployees(data || []);
    }
  }, []);

  // ✅ PERBAIKAN: Loading diatur di sini, terpisah dari fungsi fetch
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await fetchEmployees();
      setIsLoading(false);
    };
    initData();
  }, [fetchEmployees]);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        name: employee.name,
        role: employee.role,
        phone: employee.phone || "",
        pin: employee.pin || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", role: "Barista Senior", phone: "", pin: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.pin) {
      alert("Nama dan PIN wajib diisi!");
      return;
    }

    setIsLoading(true); // Mulai loading saat tombol ditekan

    let error;

    if (editingId) {
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          pin: formData.pin,
        })
        .eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("employees").insert([
        {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          pin: formData.pin,
          status: "active",
        },
      ]);
      error = insertError;
    }

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      await fetchEmployees(); // Refresh data tanpa mengatur loading lagi (karena dihandle di bawah)
      setIsModalOpen(false);
    }
    setIsLoading(false); // Selesai loading
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus karyawan ini? Data jadwal mereka juga akan hilang.")) return;

    setIsLoading(true);
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (!error) {
      await fetchEmployees();
    } else {
      alert("Gagal menghapus: " + error.message);
    }
    setIsLoading(false);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 border border-slate-300 shadow-sm rounded-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Data Karyawan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manajemen database personel dan akses sistem.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm rounded-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Personel
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          placeholder="Cari ID atau Nama Karyawan..." 
          className="pl-9 bg-white border-slate-300 focus:border-primary rounded-sm shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="p-4 font-semibold text-slate-800 uppercase tracking-wider text-xs">Nama Lengkap</th>
                <th className="p-4 font-semibold text-slate-800 uppercase tracking-wider text-xs">Jabatan</th>
                <th className="p-4 font-semibold text-slate-800 uppercase tracking-wider text-xs">Kontak</th>
                <th className="p-4 font-semibold text-slate-800 uppercase tracking-wider text-xs">PIN Akses</th>
                <th className="p-4 font-semibold text-slate-800 uppercase tracking-wider text-xs text-right">Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">Sinkronisasi data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-800 border-r border-transparent group-hover:border-slate-200">{emp.name}</td>
                    <td className="p-4 border-r border-transparent group-hover:border-slate-200">
                      <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                        emp.role.includes("Manager") ? "bg-purple-50 text-purple-700 border-purple-200" :
                        emp.role.includes("Barista") ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 border-r border-transparent group-hover:border-slate-200">
                       {emp.phone ? <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {emp.phone}</div> : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-4 font-mono text-slate-700 border-r border-transparent group-hover:border-slate-200">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-3 h-3 text-slate-400" /> 
                            <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-300 text-xs">{emp.pin}</span>
                        </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleOpenModal(emp)} 
                          className="h-8 w-8 rounded-sm border-slate-300 hover:border-blue-500 hover:text-blue-600"
                          title="Edit Data"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDelete(emp.id)} 
                          className="h-8 w-8 rounded-sm border-slate-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Data Personel" : "Registrasi Personel Baru"}
      >
        <div className="space-y-4 py-2">
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nama Lengkap</label>
            <Input 
              placeholder="Masukan nama lengkap..." 
              className="rounded-sm border-slate-300 focus:ring-1 focus:ring-primary"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Jabatan</label>
            <select 
              className="w-full p-2.5 rounded-sm border border-slate-300 text-sm focus:ring-1 focus:ring-primary outline-none bg-white"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="Manager Store">Manager Store</option>
              <option value="Barista Senior">Barista Senior</option>
              <option value="Barista Junior">Barista Junior</option>
              <option value="Cashier">Cashier</option>
              <option value="Kitchen Staff">Kitchen Staff</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">WhatsApp</label>
            <Input 
              placeholder="08..." 
              className="rounded-sm border-slate-300 focus:ring-1 focus:ring-primary"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-primary" /> PIN Keamanan
            </label>
            <div className="flex gap-2">
                <Input 
                placeholder="1234" 
                maxLength={6}
                className="font-mono text-center text-lg border-slate-300 bg-slate-50 rounded-sm focus:ring-1 focus:ring-primary"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                />
                <div className="text-[10px] text-slate-500 leading-tight w-2/3 flex items-center">
                    PIN ini digunakan untuk validasi tukar shift. Wajib unik.
                </div>
            </div>
          </div>

          <div className="pt-6 flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-sm border-slate-300 font-bold text-slate-600">
                Batal
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1 bg-primary text-white font-bold rounded-sm shadow-sm hover:bg-primary/90">
                {isLoading ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Simpan Data")}
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
}