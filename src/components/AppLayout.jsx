import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/useProfile";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, UserSearch, FolderKanban, Inbox, Bell, User, Settings,
  LogOut, Menu, X, Code2, ChevronDown
} from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLeader = profile?.role === "team_leader";

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Discover Teams", path: "/teams", icon: FolderKanban },
    ...(isLeader ? [{ label: "Discover Participants", path: "/participants", icon: UserSearch }] : []),
    { label: "My Teams", path: "/my-teams", icon: Users },
    { label: "Requests", path: "/requests", icon: Inbox },
    { label: "Notifications", path: "/notifications", icon: Bell },
  ];

  const { data: unread } = useQuery({
    queryKey: ["unreadNotifications", user?.id],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ user_id: user.id, read_status: false });
      return notifs.length;
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  if (!profileLoading && profile === null) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleLogout = () => {
    queryClient.clear();
    logout(false);
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Code2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">HACKEDin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
              {item.path === "/notifications" && unread > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            location.pathname === "/profile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <User style={{ width: 18, height: 18 }} />
          <span>My Profile</span>
        </Link>
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            location.pathname === "/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings style={{ width: 18, height: 18 }} />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut style={{ width: 18, height: 18 }} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card flex flex-col">
            <button className="absolute top-4 right-4 p-1" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Code2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">HACKEDin</span>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread > 9 ? "9" : unread}</span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar src={profile?.profile_photo} name={profile?.full_name || user?.email} size="sm" />
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{profile?.full_name || "User"}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-muted">My Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-muted">Settings</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-muted">Log out</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
