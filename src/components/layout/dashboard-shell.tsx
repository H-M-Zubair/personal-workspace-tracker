"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import { TimerProvider } from "@/lib/context/timer-context";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TimerProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </TimerProvider>
  );
}
