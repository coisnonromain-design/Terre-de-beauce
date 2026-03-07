import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  HardHat,
  CalendarDays,
  ClipboardList,
  FileText,
  FileSignature,
  Settings,
  ChevronRight,
  Menu,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navigation = [
  { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { name: "Flotte", href: "/admin/flotte", icon: Truck },
  { name: "Chauffeurs", href: "/admin/chauffeurs", icon: Users },
  { name: "Clients", href: "/admin/clients", icon: Building2 },
  { name: "Chantiers", href: "/admin/chantiers", icon: HardHat },
  { name: "Planning", href: "/admin/planning", icon: CalendarDays },
  { name: "Pointages", href: "/admin/pointages", icon: ClipboardList },
  { name: "Factures", href: "/admin/factures", icon: FileText },
  { name: "Contrats", href: "/admin/contrats", icon: FileSignature },
];

const getPageTitle = (pathname) => {
  const cleanPath = pathname.replace('/admin', '') || '/admin';
  const page = navigation.find(
    (item) => item.href === pathname || 
    (pathname !== "/admin" && item.href !== "/admin" && pathname.startsWith(item.href))
  );
  if (pathname.includes('administrateurs')) return 'Administrateurs';
  if (pathname.includes('configuration')) return 'Configuration';
  return page ? page.name : "Tableau de bord";
};

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem("admin_token");
    const info = localStorage.getItem("admin_info");
    
    if (!token) {
      navigate("/admin/login");
      return;
    }
    
    if (info) {
      setAdminInfo(JSON.parse(info));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_info");
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const getInitials = () => {
    if (adminInfo) {
      return `${adminInfo.prenom?.[0] || ''}${adminInfo.nom?.[0] || ''}`.toUpperCase();
    }
    return 'AD';
  };

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="w-10 h-10 rounded-lg bg-[#D9A520] flex items-center justify-center">
            <Truck className="w-6 h-6 text-[#1A1D1F]" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-['Barlow_Condensed'] tracking-wide">
              TERRE DE BEAUCE
            </h1>
            <p className="text-xs text-gray-400">Transport Agricole</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
            data-testid={`nav-${item.href.replace("/admin/", "").replace("/admin", "dashboard") || "dashboard"}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <NavLink 
          to="/admin/administrateurs"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `sidebar-nav-item w-full ${isActive ? "active" : ""}`
          }
          data-testid="nav-administrateurs"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Administrateurs</span>
        </NavLink>
        <NavLink 
          to="/admin/configuration"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `sidebar-nav-item w-full ${isActive ? "active" : ""}`
          }
          data-testid="nav-configuration"
        >
          <Settings className="w-5 h-5" />
          <span>Configuration</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-[#1A1D1F]">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="main-content lg:ml-[260px]">
        <header className="main-header flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Administration</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                {getPageTitle(location.pathname)}
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" data-testid="admin-menu-btn">
                <div className="w-8 h-8 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white text-sm font-medium">
                  {getInitials()}
                </div>
                <span className="hidden sm:inline text-sm">
                  {adminInfo ? `${adminInfo.prenom} ${adminInfo.nom}` : 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-sm text-muted-foreground" disabled>
                {adminInfo?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="page-content animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
