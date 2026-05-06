"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "@/lib/supabase/client";

type LoginFields = {
  email: string;
  password: string;
};

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password. If you just registered, verify your email first.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please verify your email before logging in.";
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<LoginFields>();

  const onSubmit = async (values: LoginFields) => {
    setLoading(true);
    setError("");

    const supabase = createSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });

    if (signInError) {
      setError(mapAuthError(signInError.message));
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" type="email" {...register("email", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" type="password" {...register("password", { required: true })} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
      <p className="text-sm text-slate-600">No account? <Link className="text-blue-700" href="/register">Create one</Link></p>
    </form>
  );
}
