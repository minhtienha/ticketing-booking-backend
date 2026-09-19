// pages/register-page.tsx
// Trang Đăng ký tài khoản (Register Page) với giao diện Modern Tech SaaS

import React, { useState } from 'react';
import { FormInput } from '../components/form-input';
import { useAuthStore } from '../store/auth.store';
import {
  Ticket,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register, isLoading, error, clearError } = useAuthStore();

  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email không đúng định dạng';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await register({ email, password });
      setIsSuccess(true);
    } catch (err) {
      console.error('Đăng ký không thành công:', err);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 selection:bg-indigo-500 selection:text-white dark:bg-neutral-950">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/3 -z-10 h-96 w-96 rounded-full bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 blur-3xl dark:from-violet-600/15 dark:to-indigo-600/15" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-500/15 to-emerald-500/15 blur-3xl dark:from-indigo-600/10 dark:to-emerald-600/10" />

      {/* Main Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white/90 p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl transition-all sm:p-10 dark:border-neutral-800/80 dark:bg-neutral-900/90 dark:shadow-black/40">
        
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
            <Ticket className="h-7 w-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
            <span>Ticketing Engine</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tạo tài khoản mới
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Bắt đầu trải nghiệm hệ thống đặt vé nhanh chóng và tiện lợi
          </p>
        </div>

        {/* State: Đăng ký thành công */}
        {isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-500/10 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-950/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Đăng ký thành công!
              </h2>
              <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                Tài khoản của bạn đã được khởi tạo. Bạn có thể tiến hành đăng nhập ngay bây giờ.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99]"
            >
              <span>Chuyển đến Đăng nhập</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        ) : (
          <>
            {/* Server Error Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-sm text-rose-900 backdrop-blur-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                <div>
                  <p className="font-semibold">Đăng ký thất bại</p>
                  <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                id="register-email"
                type="email"
                label="Địa chỉ Email"
                placeholder="name@company.com"
                value={email}
                icon={<Mail className="h-4 w-4" />}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email)
                    setFormErrors({ ...formErrors, email: undefined });
                }}
                error={formErrors.email}
                autoComplete="email"
              />

              <FormInput
                id="register-password"
                type="password"
                label="Mật khẩu"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                icon={<Lock className="h-4 w-4" />}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password)
                    setFormErrors({ ...formErrors, password: undefined });
                }}
                error={formErrors.password}
                autoComplete="new-password"
              />

              <FormInput
                id="register-confirm-password"
                type="password"
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                icon={<ShieldCheck className="h-4 w-4" />}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formErrors.confirmPassword)
                    setFormErrors({
                      ...formErrors,
                      confirmPassword: undefined,
                    });
                }}
                error={formErrors.confirmPassword}
                autoComplete="new-password"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo tài khoản</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 border-t border-neutral-100 pt-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 hover:underline dark:text-indigo-400"
              >
                Đăng nhập ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
