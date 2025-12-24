import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Users, CreditCard, TrendingUp, LogOut, CheckCircle, Menu, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  stripeConnection?: {
    stripeAccountId: string;
    createdAt: string;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

// Context for sidebar state
const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: Activity, path: "/dashboard" },
    { name: "Customers", icon: Users, path: "/customers" },
    { name: "Invoices", icon: CreditCard, path: "/invoices" },
    { name: "Analytics", icon: TrendingUp, path: "/analytics" },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 lg:mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black text-white">StripeViz</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all touch-manipulation",
              location.pathname === item.path
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-4">
        {user?.stripeConnection && (
          <Card className="p-3 lg:p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl mb-3 lg:mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white mb-1">Stripe Connected</h4>
                <p className="text-xs text-slate-400 truncate">
                  {user.stripeConnection.stripeAccountId.slice(0, 15)}...
                </p>
              </div>
            </div>
          </Card>
        )}

        {user && (
          <div className="mb-3 lg:mb-4 p-3 lg:p-4 bg-[#25233a] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-white font-semibold truncate">
                {user.name || user.email}
              </div>
              {user.subscription?.plan === "pro" && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold ml-2 flex-shrink-0">
                  PRO
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
          </div>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full bg-[#25233a] border-white/10 text-white hover:bg-[#2d2b42] rounded-xl touch-manipulation"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#1a1625]/90 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-[#25233a] active:bg-[#2d2b42] transition-colors touch-manipulation"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          "fixed top-0 h-full bg-[#1a1625]/95 backdrop-blur-xl border-r border-white/10 p-4 lg:p-6 z-50 flex flex-col",
          // Width
          "w-[280px] sm:w-72 lg:w-64",
          // Transform for mobile slide-in
          "left-0 transform transition-transform duration-300 ease-out",
          // Mobile: hidden by default, shown when open
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white active:text-purple-400 transition-colors touch-manipulation"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent />
      </aside>
    </SidebarContext.Provider>
  );
}

// Hook to get sidebar offset class for main content
export function useSidebarOffset() {
  return "ml-0 lg:ml-64";
}
