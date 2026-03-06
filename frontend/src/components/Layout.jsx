import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  HardHat,
  CalendarDays,
  Settings,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Flotte", href: "/flotte", icon: Truck },
  { name: "Chauffeurs", href: "/chauffeurs", icon: Users },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Chantiers", href: "/chantiers", icon: HardHat },
  { name: "Planning", href: "/planning", icon: CalendarDays },
];

const getPageTitle = (pathname) => {
  const page = navigation.find(
    (item) => item.href === pathname || (pathname !== "/" && item.href !== "/" && pathname.startsWith(item.href))
  );
  return page ? page.name : "Tableau de bord";
};

export const Layout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="sidebar-nav-item w-full" data-testid="nav-settings">
          <Settings className="w-5 h-5" />
          <span>Paramètres</span>
        </button>
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
              <span>Terre de Beauce</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                {getPageTitle(location.pathname)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white text-sm font-medium">
              TB
            </div>
          </div>
        </header>

        <div className="page-content animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
