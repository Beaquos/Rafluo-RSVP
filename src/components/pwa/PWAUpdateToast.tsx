import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const PWAUpdateToast: React.FC = () => {
  const { needRefresh, updateApp } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm w-full mx-auto">
      <div className="bg-[#24152F] text-[#F7F1E5] p-3.5 sm:p-4 rounded-2xl border border-[#DFFF5F]/40 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0 shadow-2xs">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate flex items-center gap-1.5">
              <span>Nova versão disponível</span>
              <Sparkles className="w-3 h-3 text-[#DFFF5F]" />
            </p>
            <p className="text-[11px] text-[#D2C4DC] truncate">
              Toque para carregar as melhorias recentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={updateApp}
            className="px-3 py-1.5 rounded-lg bg-[#DFFF5F] text-[#180D20] text-xs font-extrabold hover:bg-[#CEF04A] transition-colors cursor-pointer shadow-xs"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-[#F7F1E5]/60 hover:text-[#F7F1E5] transition-colors cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
