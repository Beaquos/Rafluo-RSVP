import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerIcon?: React.ReactNode;
  headerVariant?: 'dark' | 'light';
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // default max-w-xl
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerIcon,
  headerVariant = 'dark',
  children,
  footer,
  widthClass = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay uniforme bg-black/60 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          className={`w-screen ${widthClass} bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250`}
        >
          {/* Header */}
          {headerVariant === 'dark' ? (
            <div className="p-5 sm:p-6 bg-[#1A1033] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553]">
              <div className="flex items-center gap-3 min-w-0">
                {headerIcon && (
                  <div className="w-9 h-9 rounded-xl bg-[#E4FF4D] text-[#1A1033] flex items-center justify-center flex-shrink-0 font-bold">
                    {headerIcon}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[#D2C4DC] truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#D2C4DC] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-5 sm:p-6 bg-white text-[#24152F] flex items-center justify-between border-b border-[#E9E3D8]">
              <div className="flex items-center gap-3 min-w-0">
                {headerIcon && (
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#1A1033] flex items-center justify-center flex-shrink-0 font-bold border border-[#E9E3D8]">
                    {headerIcon}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#1A1033] truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[#6B6B76] truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#6B6B76] hover:text-[#1A1033] p-2 rounded-lg hover:bg-[#FAF6F0] transition-colors cursor-pointer flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#E9E3D8] flex items-center justify-end gap-3 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
