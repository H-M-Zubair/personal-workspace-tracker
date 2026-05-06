"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSupabaseClient } from "@/lib/supabase/client";

type RegisterFields = {
  email: string;
  password: string;
  name: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<RegisterFields>();

  const onSubmit = async (values: RegisterFields) => {
    setLoading(true);
    setError("");

    const supabase = createSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. Please verify your email, then sign in.");
    setLoading(false);
    router.push("/login");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Name" {...register("name", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" type="email" {...register("email", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" type="password" {...register("password", { required: true, minLength: 6 })} />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? "Creating..." : "Sign up"}</button>
      <p className="text-sm text-slate-600">Already registered? <Link className="text-blue-700" href="/login">Sign in</Link></p>
    </form>
  );
}
