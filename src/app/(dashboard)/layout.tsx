import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
