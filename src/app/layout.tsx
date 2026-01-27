"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, CalendarDays, Users, Settings, 
  Menu, LogOut, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; 
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [companyName, setCompanyName] = useState("Memuat...");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('company_name, logo_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
            setCompanyName(profile.company_name || "Perusahaan");
            setLogoUrl(profile.logo_url);
        } else {
            setCompanyName(user.user_metadata?.company_name || "Shiftara Company");
        }
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin-auth");
  };

  const isPublicPage = pathname === "/admin-auth" || pathname.startsWith("/jadwal-shift") || pathname.startsWith("/shiftview") || pathname.startsWith("/update-password");

  if (isPublicPage) {
    return (
      <html lang="id">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    );
  }

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/shift-manager", label: "Jadwal Shift", icon: CalendarDays },
    { href: "/employees", label: "Karyawan", icon: Users },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ];

  const getPageTitle = () => {
    switch (pathname) {
      case "/": return "Dashboard Overview";
      case "/shift-manager": return "Manajemen Jadwal";
      case "/employees": return "Data Karyawan";
      case "/settings": return "Konfigurasi Sistem";
      default: return "Shiftara";
    }
  };

  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <motion.aside 
            initial={false}
            animate={{ width: isSidebarOpen ? 280 : 80 }}
            className="bg-[#0B4650] text-slate-300 hidden md:flex flex-col border-r border-[#083a42] shadow-2xl z-30 relative shrink-0"
          >
            <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10 bg-[#093e47] overflow-hidden relative">
              <div className="relative w-9 h-9 shrink-0 bg-white rounded-lg p-1">
                <Image 
                  src="/logo-shiftara.png" 
                  alt="Logo" 
                  fill 
                  sizes="36px"
                  unoptimized
                  className="object-contain p-0.5" 
                  priority
                />
              </div>
              <motion.div 
                animate={{ opacity: isSidebarOpen ? 1 : 0, x: isSidebarOpen ? 0 : -20 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-2xl font-black text-white tracking-tighter leading-none">
                  <span className="text-[#F58634]">Shif</span>Tara
                </h1>
              </motion.div>
            </div>

            <button 
              onClick={toggleSidebar}
              className="absolute -right-3 top-24 bg-white text-[#0B4650] border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 z-50 transition-transform hover:scale-110"
            >
              {isSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            
            <nav className="flex-1 px-3 space-y-2 py-8 overflow-x-hidden">
              {isSidebarOpen && (
                <div className="px-4 pb-2 text-lg font-bold text-white tracking-widest opacity-80 animate-in fade-in duration-300">
                  Menu Utama
                </div>
              )}
              
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <div 
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                        ${isActive 
                          ? 'bg-white text-[#0B4650] shadow-lg translate-x-1' 
                          : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        }
                        ${!isSidebarOpen && 'justify-center'}
                      `}
                    >
                      <Icon 
                        className={`
                          w-5 h-5 shrink-0 transition-colors duration-300
                          ${isActive ? 'text-[#F58634]' : 'text-slate-400 group-hover:text-white'}
                        `} 
                      />
                      
                      {isSidebarOpen && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`font-medium whitespace-nowrap ${isActive ? 'font-bold' : ''}`}
                        >
                          {link.label}
                        </motion.span>
                      )}

                      {!isSidebarOpen && isActive && (
                        <div className="absolute right-0 top-2 bottom-2 w-1 bg-[#F58634] rounded-l-full" />
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>
            
            <div className="p-4 border-t border-white/10 bg-[#08353d]">
               <button 
                onClick={handleLogout}
                className={`flex items-center gap-3 px-3 py-3 w-full text-sm font-medium rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors group ${!isSidebarOpen && 'justify-center'}`}
               >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                {isSidebarOpen && <span>Keluar Sistem</span>}
               </button>
            </div>
          </motion.aside>

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-20 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger>
                      <div className="p-2 hover:bg-slate-100 rounded-lg text-[#0B4650] cursor-pointer">
                        <Menu className="w-6 h-6" />
                      </div>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-[#0B4650] text-white w-72 p-0 border-r-[#083a42]">
                      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 bg-[#093e47]">
                        <div className="relative w-8 h-8 bg-white rounded p-1 flex items-center justify-center font-bold text-[#0B4650]">
                           S
                        </div>
                        <h1 className="text-xl font-black text-white">
                            <span className="text-[#F58634]">Shif</span>Tara
                        </h1>
                      </div>
                      <nav className="p-4 space-y-2">
                        {links.map((link) => {
                          const Icon = link.icon;
                          const isActive = pathname === link.href;
                          return (
                            <Link key={link.href} href={link.href}>
                              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white text-[#0B4650] font-bold shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F58634]' : 'text-slate-400'}`} />
                                {link.label}
                              </div>
                            </Link>
                          )
                        })}
                        <div 
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/20 cursor-pointer mt-4"
                        >
                            <LogOut className="w-5 h-5" /> Keluar
                        </div>
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>
                
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                      {getPageTitle()}
                    </h1>
                    <span className="text-[10px] text-[#0B4650] font-bold uppercase tracking-wide mt-1 opacity-70">
                        Administrator Access
                    </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-none">{companyName}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Perusahaan</p>
                  </div>
                  {logoUrl ? (
                     <div className="h-9 w-9 relative rounded-full overflow-hidden shadow-sm ring-2 ring-slate-100">
                        <Image src={logoUrl} alt="Logo" fill sizes="36px" unoptimized className="object-cover" />
                     </div>
                  ) : (
                     <div className="h-9 w-9 bg-[#0B4650] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                        {companyName.substring(0, 1).toUpperCase()}
                     </div>
                  )}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-full max-w-[1920px] mx-auto"
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