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
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "User Management", href: "/users", icon: Users },
<<<<<<< HEAD
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
=======
  { name: "User Activity", href: "/activity", icon: Activity },
>>>>>>> efa2392 (dd)
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Financial Reports", href: "/financial", icon: DollarSign },
  { name: "Payout Management", href: "/payouts", icon: Trophy },
  { name: "Content Management", href: "/content", icon: Megaphone },
  { name: "Audit Log", href: "/audit", icon: FileText },
  { name: "Integrations", href: "/integrations", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Admin Panel
              </h1>
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
              const isActive = pathname === item.href;
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
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
