"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

const NavLinks = () => {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/schedule", label: "Jadwal Shift", icon: CalendarDays },
    { href: "/employees", label: "Karyawan", icon: Users },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <div className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group ${isActive ? 'bg-secondary text-primary font-bold' : 'text-slate-300 hover:bg-primary-foreground/10 hover:text-secondary'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-secondary'}`} />
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

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <aside className="w-64 bg-primary text-slate-300 hidden md:flex flex-col border-r border-primary/20 shadow-xl z-20">
            <div className="p-6 flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/logo-shiftara.png" alt="Shiftara Logo" fill className="object-contain" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter">
                <span className="text-secondary">SHIF</span>TARA
              </h1>
            </div>
            <nav className="flex-1 px-4 space-y-2 py-4">
              <NavLinks />
            </nav>
            <div className="p-4 border-t border-primary/20">
               <button className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium rounded-md text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-5 h-5" /> Keluar
               </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
            <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
              <div className="md:hidden flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-md">
                      <Menu className="text-primary w-6 h-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-primary text-white w-72 p-0 border-r-primary/20">
                    <div className="p-6 border-b border-primary/20 flex items-center gap-3">
                      <div className="relative w-10 h-10">
                        <Image src="/logo-shiftara.png" alt="Shiftara Logo" fill className="object-contain" />
                      </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter">
                          <span className="text-secondary">SHIF</span>TARA
                        </h1>
                    </div>
                    <nav className="p-4 space-y-2">
                      <NavLinks />
                    </nav>
                    <div className="p-4 border-t border-primary/20 absolute bottom-0 w-full">
                       <button className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium rounded-md text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-5 h-5" /> Keluar
                       </button>
                    </div>
                  </SheetContent>
                </Sheet>
                <h1 className="text-lg font-bold text-primary md:hidden">
                  {pathname === '/' ? 'Dashboard' : pathname ? pathname.substring(1).charAt(0).toUpperCase() + pathname.slice(2) : ''}
                </h1>
              </div>
              
              <div className="hidden md:flex items-center gap-4 ml-auto">
                <div className="text-right">
                  <p className="text-sm font-bold text-primary leading-none">Admin Pusat</p>
                  <p className="text-[11px] text-slate-500 font-medium">Manager Operasional karyawan</p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
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