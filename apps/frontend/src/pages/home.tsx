import { useAuthStore } from '../store/auth.store';
import { Ticket, LogOut, Sparkles, CheckCircle2 } from 'lucide-react';

export function Home() {
  const { user, logout } = useAuthStore();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 selection:bg-indigo-500 selection:text-white dark:bg-neutral-950">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 blur-3xl dark:from-indigo-600/15 dark:to-violet-600/15" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/15 to-indigo-500/15 blur-3xl dark:from-blue-600/10 dark:to-indigo-600/10" />

      {/* Main Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl transition-all sm:p-10 dark:border-neutral-800/80 dark:bg-neutral-900/90 dark:shadow-black/40 text-center">
        
        {/* Logo Badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
          <Ticket className="h-7 w-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phiên làm việc đang hoạt động</span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Chào mừng bạn trở lại! 👋
        </h1>
        
        {/* User Info Card */}
        <div className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 text-left dark:border-neutral-800/80 dark:bg-neutral-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Tài khoản đăng nhập
              </p>
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={logout}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-sm font-semibold text-rose-700 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-100 active:scale-[0.99] dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}
