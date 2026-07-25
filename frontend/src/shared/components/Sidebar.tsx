import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Factory,
  Building2,
  Users,
  Cog,
  Computer,
  Terminal,
  Wrench,
  Clock,
  ClipboardList,
  ScanLine,
  FileText,
  Layers,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Kanban,
  Zap,
  Map,
  History,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/shared/components/Logo";
import { useSidebarStore } from "@/store/sidebar.store";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NavItem } from "@/shared/types";

const NAV_ITEMS: NavItem[] = [
  { label: "Production Orders", icon: FileText, path: "/production-orders" },
  { label: "Production Planning", icon: LayoutDashboard, path: "/planning/center" },
  { label: "Planning Board", icon: Kanban, path: "/planning/board" },
  { label: "Production Execution", icon: Zap, path: "/iot-demo" },
  { label: "Live Factory", icon: Factory, path: "/live-factory" },
  { label: "QC", icon: ShieldCheck, path: "/qc" },
  { label: "Departments", icon: Building2, path: "/departments" },
  { label: "Workers", icon: Users, path: "/workers" },
  { label: "Machines", icon: Cog, path: "/machines" },
  { label: "Machine Types", icon: Computer, path: "/machine-types" },
  { label: "Terminals", icon: Terminal, path: "/terminals" },
  { label: "Operations", icon: Wrench, path: "/operations" },
  { label: "Shifts", icon: Clock, path: "/shifts" },
  { label: "Assignments", icon: ClipboardList, path: "/assignments" },
  { label: "Attendance", icon: ScanLine, path: "/attendance" },
  { label: "Bundles", icon: Layers, path: "/bundles" },
  { label: "Tag & QC Workflow", icon: Tag, path: "/tag-workflow" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface NavItemButtonProps {
  item: NavItem;
  isCollapsed: boolean;
  onClick?: () => void;
}

function NavItemButton({ item, isCollapsed, onClick }: NavItemButtonProps) {
  const location = useLocation();
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
  const Icon = item.icon;

  const content = (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
        "transition-all duration-150 group",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {/* Active indicator pill */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-primary -z-10"
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
        />
      )}
      <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
      {!isCollapsed && (
        <motion.span
          initial={false}
          animate={{ opacity: 1, width: "auto" }}
          className="truncate leading-none"
        >
          {item.label}
        </motion.span>
      )}
      {item.badge && !isCollapsed && (
        <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary rounded-full px-1.5 py-0.5">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="hidden lg:flex flex-col h-screen bg-card border-r fixed left-0 top-0 z-30 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 border-b flex-shrink-0">
          <Logo collapsed={isCollapsed} />
          <button
            onClick={toggleCollapse}
            className="ml-auto flex-shrink-0 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <NavItemButton key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t flex-shrink-0">
          <Tooltip>
            <TooltipTrigger render={
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full",
                  "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                )}
              >
                <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
                {!isCollapsed && <span>Logout</span>}
              </button>
            } />
            {isCollapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

// ─── Mobile Drawer ──────────────────────────────────────────────────────────

export function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebarStore();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
    closeMobile();
  };

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={closeMobile}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b">
              <Logo />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeMobile}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <NavItemButton key={item.path} item={item} isCollapsed={false} onClick={closeMobile} />
              ))}
            </nav>

            <div className="p-2 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
