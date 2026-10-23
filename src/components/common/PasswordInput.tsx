/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
  showLockIcon?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  helperText,
  id,
  showLockIcon = true,
  className = '',
  value,
  onChange,
  placeholder = 'Digite sua senha',
  disabled,
  required,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-[13px] font-medium text-[#24152F] dark:text-[#F7F1E5] mb-1 font-sans"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...rest}
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={rest.autoComplete || 'current-password'}
          className={`w-full ${
            showLockIcon ? 'pl-9' : 'pl-3.5'
          } pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#1E1128] text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F] dark:focus:ring-[#DFFF5F] transition-all font-sans ${
            error
              ? 'border-rose-500 ring-1 ring-rose-500'
              : 'border-[#24152F]/20 dark:border-[#3F2553]'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        />

        {showLockIcon && (
          <Lock className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}

        <button
          type="button"
          tabIndex={0}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#24152F]/50 dark:text-[#D2C4DC]/60 hover:text-[#24152F] dark:hover:text-[#F7F1E5] hover:bg-[#24152F]/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#24152F]/20 transition-colors cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-sans">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-1 font-sans">
          {helperText}
        </p>
      )}
    </div>
  );
};
