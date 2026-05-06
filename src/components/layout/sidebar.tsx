import Link from "next/link";
import LogoutButton from "@/components/layout/logout-button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 md:w-64 md:border-b-0 md:border-r">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Workspace Tracker</h2>
      <nav className="flex flex-wrap gap-2 md:flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}
