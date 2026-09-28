import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      id="app-toast-notification"
      role="status"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-start sm:items-center gap-3 px-4 py-3 rounded-2xl bg-[#24152F] text-[#F7F1E5] border border-[#3F2553] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 max-w-lg w-auto min-w-[280px] max-w-[calc(100vw-2rem)]"
    >
      <CheckCircle2 className="w-5 h-5 text-[#DFFF5F] flex-shrink-0 mt-0.5 sm:mt-0" />
      <span className="text-xs sm:text-sm font-medium flex-1 break-words leading-snug">{message}</span>
      <button
        type="button"
        id="btn-close-toast"
        onClick={onClose}
        className="p-1 rounded-lg text-[#F7F1E5]/70 hover:text-[#F7F1E5] hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 -mr-1"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
