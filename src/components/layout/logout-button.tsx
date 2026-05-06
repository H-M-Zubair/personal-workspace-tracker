"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      Logout
    </button>
  );
}
