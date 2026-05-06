import { getTodayLabel } from "@/lib/utils/date";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">{getTodayLabel()}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Hours logged today",
          "Tasks completed",
          "Success ratio",
          "Current streak",
        ].map((label) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">--</p>
          </article>
        ))}
      </div>
    </section>
  );
}
