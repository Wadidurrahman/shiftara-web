"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, Menu, LogOut, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

const NavLinks = () => {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Dashboard Overview", icon: LayoutDashboard },
    { href: "/schedule", label: "Manajemen Jadwal", icon: CalendarDays },
    { href: "/employees", label: "Data Karyawan", icon: Users },
    { href: "/settings", label: "Pengaturan Sistem", icon: Settings },
  ];

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <div className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200 group ${isActive ? 'bg-secondary text-primary font-bold shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-white'}`} />
              {link.label}
            </div>
          </Link>
        )
      })}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/": return "Dashboard Operasional";
      case "/schedule": return "Manajemen Jadwal Shift";
      case "/employees": return "Database Karyawan";
      case "/settings": return "Konfigurasi Sistem";
      default: return "Shiftara System";
    }
  };

  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          
          <aside className="w-64 bg-primary text-slate-300 hidden md:flex flex-col border-r border-slate-800 shadow-2xl z-30">
            <div className="h-16 flex items-center gap-3 px-6 bg-primary border-b border-white/10">
              <div className="relative w-8 h-8">
                <Image src="/logo-shiftara.png" alt="Logo" fill className="object-contain" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter">
                <span className="text-secondary">SHIF</span>TARA
              </h1>
            </div>
            
            <nav className="flex-1 px-3 space-y-1 py-6">
              <div className="px-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Menu Utama</div>
              <NavLinks />
            </nav>
            
            <div className="p-4 border-t border-white/10 bg-primary/50">
               <button className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium rounded-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                <LogOut className="w-4 h-4" /> Keluar Sistem
               </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-20 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-sm">
                        <Menu className="text-slate-700 w-6 h-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-primary text-white w-72 p-0 border-r-slate-800">
                      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
                        <div className="relative w-8 h-8">
                           <Image src="/logo-shiftara.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <h1 className="text-xl font-black text-white">SHIFTARA</h1>
                      </div>
                      <nav className="p-4 space-y-2">
                        <NavLinks />
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
                
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                    {getPageTitle()}
                    </h1>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-1">
                        Administrator Access
                    </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-primary">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </Button>
                
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-none">Admin Pusat</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Manager Operasional</p>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="h-full max-w-7xl mx-auto"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}