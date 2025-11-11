'use client'

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Trophy,
  Megaphone,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Receipt,
  LogOut,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Shield,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useTheme } from "@/hooks/useTheme";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Admin Accounts", href: "/admin-accounts", icon: UserCog },
  { name: "Security & Monitoring", href: "/admin-sessions", icon: Shield },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Financial Reports", href: "/financial", icon: DollarSign },
  { name: "Payout Management", href: "/payouts", icon: Trophy },
  { name: "Content Management", href: "/content", icon: Megaphone },
  { name: "Integrations", href: "/integrations", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { adminUser, logout } = useAdminUser();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            {!collapsed && (
              <div className="text-sidebar-foreground">
                <h1 className="text-lg font-bold text-blue-600">Home Solutions</h1>
                <p className="text-xs text-sidebar-foreground/70">Admin Panel</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              // Special handling for Security & Monitoring (matches both /admin-sessions and /audit)
              const isActive = item.href === "/admin-sessions" 
                ? pathname === "/admin-sessions" || pathname === "/audit"
                : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-600">Home Solutions</h2>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="relative"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 h-auto">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{adminUser.name}</p>
                    <p className="text-xs text-muted-foreground">{adminUser.email}</p>
                  </div>
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      {adminUser.avatar && <AvatarImage src={adminUser.avatar} alt={adminUser.name} />}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {adminUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {adminUser.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{adminUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {adminUser.email}
                    </p>
                    <Badge variant={adminUser.role === 'super_admin' ? 'destructive' : 'default'} className="text-xs mt-2 w-fit">
                      {adminUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
