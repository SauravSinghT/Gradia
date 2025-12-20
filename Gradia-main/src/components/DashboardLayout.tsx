import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  LayoutDashboard,
  FolderOpen,
  Target,
  FileText,
  Layers,
  ClipboardCheck,
  BarChart3,
  Rocket,
  ListTodo,
  GraduationCap as ModuleIcon,
  TrendingUp,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const academicItems: NavItem[] = [
  { title: "Study Sets", href: "/dashboard/study-sets", icon: FolderOpen },
  { title: "Priority Topics", href: "/dashboard/priority", icon: Target },
  { title: "AI Summaries", href: "/dashboard/summaries", icon: FileText },
  { title: "Flashcards", href: "/dashboard/flashcards", icon: Layers },
  { title: "Tests & Quizzes", href: "/dashboard/tests", icon: ClipboardCheck },
  { title: "Assessment Analytics", href: "/dashboard/assessment", icon: BarChart3 },
];

const careerItems: NavItem[] = [
  { title: "Go-Getter Guide", href: "/dashboard/career", icon: Rocket },
  { title: "Daily Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { title: "Learning Modules", href: "/dashboard/modules", icon: ModuleIcon },
  { title: "Career Analytics", href: "/dashboard/career-analytics", icon: TrendingUp },
];

const supportItems: NavItem[] = [
  { title: "AI Tutor", href: "/dashboard/tutor", icon: MessageSquare },
  { title: "Community", href: "/dashboard/community", icon: Users },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const NavSection = ({
  title,
  items,
  currentPath,
  isOpen,
  onToggle,
  color,
}: {
  title: string;
  items: NavItem[];
  currentPath: string;
  isOpen: boolean;
  onToggle: () => void;
  color: "primary" | "accent";
}) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {title}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <nav className="space-y-1 mt-1">
              {items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? color === "primary"
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "bg-accent/10 text-accent border-l-2 border-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    academic: true,
    career: true,
    support: true,
  });

  // --- 1. USER STATE ---
  const [user, setUser] = useState({ name: "User", email: "user@example.com" });

  // --- 2. LOAD USER DATA ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- 3. LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSection = (section: "academic" | "career" | "support") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-40"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-sora font-bold"
              >
                Gradia
              </motion.span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        {isSidebarOpen ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-4",
                location.pathname === "/dashboard"
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <NavSection
              title="Academic Mastery"
              items={academicItems}
              currentPath={location.pathname}
              isOpen={openSections.academic}
              onToggle={() => toggleSection("academic")}
              color="primary"
            />

            <NavSection
              title="Career Launch"
              items={careerItems}
              currentPath={location.pathname}
              isOpen={openSections.career}
              onToggle={() => toggleSection("career")}
              color="accent"
            />

            <NavSection
              title="Support"
              items={supportItems}
              currentPath={location.pathname}
              isOpen={openSections.support}
              onToggle={() => toggleSection("support")}
              color="primary"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center justify-center p-2.5 rounded-lg transition-all",
                location.pathname === "/dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            {[...academicItems, ...careerItems, ...supportItems].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center justify-center p-2.5 rounded-lg transition-all",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                title={item.title}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>
        )}

        {/* User Section (Updated with Dynamic Data) */}
        <div className="p-4 border-t border-sidebar-border">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              
              {/* Logout Button */}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // Collapsed Sidebar Logout
            <Button variant="ghost" size="icon" className="w-full" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-sora font-bold">Gradia</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              className="w-80 h-full bg-sidebar border-r border-sidebar-border overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 pt-20 px-4">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 mb-4",
                    location.pathname === "/dashboard"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <NavSection
                  title="Academic Mastery"
                  items={academicItems}
                  currentPath={location.pathname}
                  isOpen={openSections.academic}
                  onToggle={() => toggleSection("academic")}
                  color="primary"
                />

                <NavSection
                  title="Career Launch"
                  items={careerItems}
                  currentPath={location.pathname}
                  isOpen={openSections.career}
                  onToggle={() => toggleSection("career")}
                  color="accent"
                />

                <NavSection
                  title="Support"
                  items={supportItems}
                  currentPath={location.pathname}
                  isOpen={openSections.support}
                  onToggle={() => toggleSection("support")}
                  color="primary"
                />
              </div>

               {/* Mobile Menu User Section */}
               <div className="p-4 border-t border-sidebar-border mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          "lg:ml-[280px]",
          "pt-16 lg:pt-0"
        )}
        style={{
          marginLeft: isSidebarOpen ? undefined : "80px",
        }}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;