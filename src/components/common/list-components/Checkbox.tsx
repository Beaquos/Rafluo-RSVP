import React from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  className?: string;
  label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
  readOnly = false,
  id,
  className = '',
  label,
}) => {
  const isInteractive = !disabled && !readOnly;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInteractive) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isInteractive) {
        onChange(!checked);
      }
    }
  };

  const checkboxElement = (
    <div
      role="checkbox"
      id={id}
      aria-checked={indeterminate ? 'mixed' : checked}
      tabIndex={isInteractive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors select-none ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-[#24152F]/20 bg-gray-100'
          : readOnly
          ? 'cursor-default'
          : 'cursor-pointer'
      } ${
        checked || indeterminate
          ? 'bg-[#1A1033] border-[#1A1033] text-white shadow-2xs'
          : 'bg-white border-[#24152F]/25 ' + (isInteractive ? 'hover:border-[#1A1033]' : '') + ' text-transparent'
      } ${className}`}
    >
      {checked && !indeterminate && (
        <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
      )}
      {indeterminate && (
        <Minus className="w-3.5 h-3.5 stroke-[3] text-white" />
      )}
    </div>
  );

  if (label) {
    return (
      <label
        htmlFor={id}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={`inline-flex items-center gap-2 select-none ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        {checkboxElement}
        <span className="text-xs text-[#24152F]">{label}</span>
      </label>
    );
  }

  return checkboxElement;
};
