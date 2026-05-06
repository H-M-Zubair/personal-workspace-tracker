"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";

type RegisterFields = {
  email: string;
  password: string;
  name: string;
};

export default function RegisterPage() {
  const { register, handleSubmit } = useForm<RegisterFields>();

  const onSubmit = (values: RegisterFields) => {
    console.log("[RegisterForm] submit", values.email, values.name);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Name" {...register("name", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" type="email" {...register("email", { required: true })} />
      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" type="password" {...register("password", { required: true })} />
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white" type="submit">Sign up</button>
      <p className="text-sm text-slate-600">Already registered? <Link className="text-blue-700" href="/login">Sign in</Link></p>
    </form>
  );
}
