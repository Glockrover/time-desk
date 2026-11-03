"use client";

import { logout } from "@/app/(auth)/actions";
import { clearFaceCameraFlags } from "@/lib/face-camera-flags";

export default function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              td
            </span>
            time-desk
          </span>

          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <a
              href="#entries"
              className="rounded-md bg-slate-100 px-3 py-1.5 font-medium text-slate-900"
            >
              Entries
            </a>
            <a
              href="#reports"
              className="rounded-md px-3 py-1.5 font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              Reports
            </a>
          </nav>
        </div>

        <form action={logout} onSubmit={clearFaceCameraFlags}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
