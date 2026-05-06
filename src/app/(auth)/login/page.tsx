"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";

type LoginFields = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFields>();

  const onSubmit = (values: LoginFields) => {
    console.log("[LoginForm] submit", values.email);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" type="email" {...register("email", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" type="password" {...register("password", { required: true })} />
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white" type="submit">Sign in</button>
      <p className="text-sm text-slate-600">No account? <Link className="text-blue-700" href="/register">Create one</Link></p>
    </form>
  );
}
