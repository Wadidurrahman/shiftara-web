"use client";

import React, { useState, useEffect } from "react";
import { Search, Edit2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Modal from "@/components/ui/Modal";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: "active" | "inactive";
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    status: "active",
  });

  async function fetchEmployees() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setEmployees(data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    (async () => {
      await fetchEmployees();
    })();
  }, []);

  async function handleSubmit() {
    if (!formData.name || !formData.role) return;

    const { error } = await supabase
      .from("employees")
      .insert([
        { 
          name: formData.name, 
          role: formData.role, 
          phone: formData.phone,
          status: "active" 
        }
      ])
      .select();

    if (!error) {
      setFormData({ name: "", role: "", phone: "", status: "active" });
      setIsModalOpen(false);
      fetchEmployees();
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (!error) {
        fetchEmployees();
      }
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary">Data Karyawan</h2>
          <p className="text-slate-500 font-medium">Kelola informasi personil dan status kepegawaian.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-secondary text-primary hover:bg-secondary/90 font-bold shadow-md rounded-md">
          <UserPlus className="w-5 h-5 mr-2" />
          Tambah Karyawan
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Cari nama atau posisi..." 
            className="pl-10 border-slate-200 focus-visible:ring-primary rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-100/80">
            <TableRow>
              <TableHead className="font-bold text-primary uppercase text-xs tracking-wider">Nama Lengkap</TableHead>
              <TableHead className="font-bold text-primary uppercase text-xs tracking-wider">Posisi</TableHead>
              <TableHead className="font-bold text-primary uppercase text-xs tracking-wider">No. HP</TableHead>
              <TableHead className="font-bold text-primary uppercase text-xs tracking-wider">Status</TableHead>
              <TableHead className="font-bold text-primary uppercase text-xs tracking-wider text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">Memuat data...</TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">Tidak ada data karyawan.</TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp, index) => (
                <motion.tr 
                  key={emp.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-none"
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center font-black text-primary text-sm border border-primary/20 shadow-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm font-semibold">{emp.role}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-sm font-medium">{emp.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-md px-3 py-1 font-bold capitalize ${emp.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {emp.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md">
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(emp.id)}
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Karyawan Baru"
      >
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-primary tracking-wider">Nama Lengkap</label>
            <Input 
              placeholder="Masukkan nama..." 
              className="rounded-md border-slate-300 focus-visible:ring-primary"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-primary tracking-wider">Posisi / Role</label>
            <Input 
              placeholder="Contoh: Barista" 
              className="rounded-md border-slate-300 focus-visible:ring-primary"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-primary tracking-wider">Nomor HP</label>
            <Input 
              placeholder="Contoh: 0812..." 
              className="rounded-md border-slate-300 focus-visible:ring-primary"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="flex gap-3 pt-6">
            <Button variant="outline" className="flex-1 font-bold border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90 font-bold rounded-md">Simpan Data</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}