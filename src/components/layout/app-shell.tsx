"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { RoleType } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
  Truck,
  Warehouse,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Boxes,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, PermissionAction } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission: PermissionAction;
  group: "Overview" | "Catalog" | "Inventory Operations" | "Partners & Locations" | "Administration";
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard:view",
    group: "Overview",
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    permission: "products:view",
    group: "Catalog",
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
    permission: "categories:view",
    group: "Catalog",
  },
  {
    title: "Stock In",
    href: "/stock-in",
    icon: ArrowDownToLine,
    permission: "stock:in",
    group: "Inventory Operations",
  },
  {
    title: "Stock Out",
    href: "/stock-out",
    icon: ArrowUpFromLine,
    permission: "stock:out",
    group: "Inventory Operations",
  },
  {
    title: "Stock Adjustments",
    href: "/stock-adjustments",
    icon: SlidersHorizontal,
    permission: "stock:adjust",
    group: "Inventory Operations",
  },
  {
    title: "Stock History",
    href: "/stock-history",
    icon: History,
    permission: "stock:history",
    group: "Inventory Operations",
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    permission: "suppliers:view",
    group: "Partners & Locations",
  },
  {
    title: "Warehouses",
    href: "/warehouses",
    icon: Warehouse,
    permission: "warehouses:view",
    group: "Partners & Locations",
  },
  {
    title: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    permission: "reports:view",
    group: "Administration",
  },
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    permission: "users:manage",
    group: "Administration",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "dashboard:view",
    group: "Administration",
  },
];

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: RoleType;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    hasPermission(user.role, item.permission)
  );

  const groups = Array.from(new Set(visibleNavItems.map((i) => i.group)));

  // Build Breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:static",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  NexusIMS
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Enterprise Inventory
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:inline-flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group} className="space-y-1">
              {!collapsed && (
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group}
                </p>
              )}
              {visibleNavItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-indigo-50/90 text-indigo-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-indigo-600" : "text-slate-400"
                        )}
                      />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-100 p-3">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-lg bg-slate-50 p-2",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user.email}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-700 font-medium"
              >
                Workspace
              </Link>
              {segments.map((segment, index) => {
                const href = "/" + segments.slice(0, index + 1).join("/");
                const isLast = index === segments.length - 1;
                const formatted = segment
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <React.Fragment key={href}>
                    <span className="text-slate-300">/</span>
                    {isLast ? (
                      <span className="font-semibold text-slate-900">
                        {formatted.length > 24 ? "Details" : formatted}
                      </span>
                    ) : (
                      <Link
                        href={href}
                        className="text-slate-500 hover:text-slate-900 font-medium"
                      >
                        {formatted}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Right Topbar Controls */}
          <div className="flex items-center gap-3">
            <Badge
              variant={
                user.role === "SUPER_ADMIN"
                  ? "default"
                  : user.role === "ADMIN"
                  ? "success"
                  : user.role === "STAFF"
                  ? "warning"
                  : "secondary"
              }
              className="gap-1.5"
            >
              <ShieldCheck className="h-3 w-3" />
              {user.role.replace("_", " ")}
            </Badge>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
