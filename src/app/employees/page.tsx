"use client";

import { useState, useEffect } from "react";
import { 
  UserPlus, Search, Edit, Trash2, User, Shield, KeyRound 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/ui/Modal"; 

interface Employee {
  id: string;
  name: string;
  role: string;
  division: string;
  status: 'active' | 'inactive';
  pin?: string;
  phone?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [existingRoles, setExistingRoles] = useState<string[]>([]);
  const [existingDivisions, setExistingDivisions] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: "", role: "", division: "", status: "active", pin: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true });
      
    if (data) {
        setEmployees(data);
        const roles = Array.from(new Set(data.map(item => item.role))).filter(Boolean).sort();
        setExistingRoles(roles.length > 0 ? roles : ["Manager", "Staff", "Admin"]);

        const divisions = Array.from(new Set(data.map(item => item.division))).filter(Boolean).sort();
        setExistingDivisions(divisions.length > 0 ? divisions : ["Umum", "Operasional"]);
    }
    
    if (error) console.error("Error fetching employees:", error);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { 
          ...formData, 
          role: formData.role || "Staff",
          division: formData.division || "Umum"
      };

      if (editingId) {
        await supabase.from("employees").update(payload).eq("id", editingId);
      } else {
        await supabase.from("employees").insert([payload]);
      }
      setIsModalOpen(false);
      fetchEmployees(); 
      resetForm();
    } catch (error) {
      console.error("Error saving employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus karyawan ini?")) return;
    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  };

  const resetForm = () => {
    setFormData({ name: "", role: "", division: "", status: "active", pin: "" });
    setEditingId(null);
  };

  const handleEditClick = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Karyawan</h1>
          <p className="text-slate-500">Kelola daftar karyawan dan jabatan.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="bg-[#0B4650] hover:bg-[#093e47] text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Tambah Karyawan
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input 
          placeholder="Cari nama atau jabatan..." 
          className="pl-10 max-w-sm border-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Nama Karyawan</th>
              <th className="px-6 py-4 font-semibold">Divisi</th>
              <th className="px-6 py-4 font-semibold">Jabatan (Role)</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">PIN</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center p-8">Memuat data...</td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-slate-400">Tidak ada data karyawan.</td></tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[#0B4650]">
                      <User className="w-4 h-4" />
                    </div>
                    {emp.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                     {emp.division || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Shield className="w-3 h-3" /> {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.status === 'active' 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {emp.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono">
                     {emp.pin ? '••••' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0B4650]" onClick={() => handleEditClick(emp)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(emp.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Karyawan" : "Tambah Karyawan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Lengkap</label>
            <Input 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Contoh: Budi Santoso"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Divisi</label>
                <Input 
                    list="divisions-list" 
                    required
                    placeholder="Pilih atau ketik..."
                    value={formData.division}
                    onChange={e => setFormData({...formData, division: e.target.value})}
                />
                <datalist id="divisions-list">
                    {existingDivisions.map((div) => (
                        <option key={div} value={div} />
                    ))}
                </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jabatan</label>
              <Input 
                list="roles-list" 
                required
                placeholder="Pilih atau ketik..."
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
              <datalist id="roles-list">
                 {existingRoles.map((role) => (
                    <option key={role} value={role} />
                 ))}
              </datalist>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-md text-sm"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium flex items-center gap-2">
               <KeyRound className="w-3 h-3"/> PIN Akses (Opsional)
             </label>
             <Input 
               type="text" 
               maxLength={6}
               value={formData.pin || ""} 
               onChange={e => setFormData({...formData, pin: e.target.value})}
               placeholder="123456"
             />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full bg-[#0B4650] hover:bg-[#093e47]" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}