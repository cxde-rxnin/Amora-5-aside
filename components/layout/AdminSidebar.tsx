"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  CreditCard,
  ScrollText,
  Globe,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Analytics", href: "/admin/dashboard" },
  { icon: CalendarDays, label: "Bookings", href: "/admin/bookings" },
  { icon: Trophy, label: "Tournaments", href: "/admin/tournaments" },
  { icon: CreditCard, label: "Payments", href: "/admin/payments" },
  { icon: ScrollText, label: "Audit Logs", href: "/admin/audit-logs" },
];

interface AdminSidebarProps {
  user: { name: string; email: string };
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: { name: string; email: string };
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <span className="text-xl font-bold text-emerald-400">Amora</span>
        </Link>
        <div className="ml-1 flex flex-col gap-0.5">
          <Badge variant="destructive" className="text-[10px] py-0 px-1 h-4">
            Admin
          </Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-2 border-t border-slate-700" />

        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <Globe className="h-4 w-4 shrink-0" />
          Public Site
        </Link>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-slate-100">
              {user.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-slate-600 bg-red-600 text-red-100 hover:bg-red-800 hover:text-slate-100"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — fixed */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 z-30 bg-slate-900">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center px-4 bg-slate-900 border-b border-slate-700">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-slate-800 text-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="ml-3 font-semibold text-emerald-400">
          Amora Admin
        </span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 z-50 bg-slate-900 transition-transform">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              user={user}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
