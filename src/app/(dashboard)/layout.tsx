import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
