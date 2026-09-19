import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  type = 'text',
  error,
  helperText,
  icon,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5 text-left">
      <label
        htmlFor={id}
        className="block text-xs font-semibold tracking-wide uppercase text-neutral-600 dark:text-neutral-300"
      >
        {label}
      </label>

      {/* Input container */}
      <div className="relative">
        {/* Left Icon (nếu có) */}
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 dark:text-neutral-500">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={inputType}
          className={`w-full rounded-xl border bg-neutral-50/50 py-2.5 text-sm text-neutral-900 shadow-xs transition-all duration-200
            placeholder:text-neutral-400 hover:border-neutral-400/80
            focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15
            dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder:text-neutral-500
            dark:focus:bg-neutral-900
            ${icon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-11' : 'pr-3.5'}
            ${
              error
                ? 'border-rose-400 ring-4 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-600'
                : 'border-neutral-200/90 focus:border-indigo-500 dark:border-neutral-700/80 dark:focus:border-indigo-400'
            }
            ${className}`}
          {...props}
        />

        {/* Nút ẩn/hiện mật khẩu */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-rose-500 dark:text-rose-400">
          <span>•</span> {error}
        </p>
      )}

      {/* Chú thích trợ giúp */}
      {!error && helperText && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
      )}
    </div>
  );
};
