"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" className="w-full justify-start" onClick={onLogout}>
      <LogOut className="h-4 w-4" /> Logout
    </Button>
  );
}
