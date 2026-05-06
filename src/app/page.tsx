import Link from "next/link";

export default function RootPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Workspace Tracker MVP</h1>
      <p className="text-slate-600">Track attendance, tasks, and focused work sessions daily.</p>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-blue-600 px-4 py-2 text-white" href="/login">Login</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700" href="/register">Register</Link>
      </div>
    </div>
  );
}
