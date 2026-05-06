"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, ListTodo, Settings, Timer } from "lucide-react";
import LogoutButton from "@/components/layout/logout-button";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Timer },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Workspace Tracker</h2>
      <nav className="flex flex-wrap gap-2 md:flex-col">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
