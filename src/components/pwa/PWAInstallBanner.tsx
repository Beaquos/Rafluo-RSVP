import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  className?: string;
  variant?: 'banner' | 'card' | 'button';
  targetRole?: 'admin' | 'client';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onDismiss,
  className = '',
  variant = 'card',
  targetRole = 'client',
}) => {
  const { isInstalled, canInstall, isIOS, installApp } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed or dismissed, do not render banner/card
  if (isInstalled || (isDismissed && variant !== 'button')) {
    return null;
  }

  const handleInstallClick = () => {
    if (canInstall) {
      installApp();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback instruction
      alert('Para instalar o app, use a opção "Adicionar à Tela Inicial" ou "Instalar Aplicativo" no menu do seu navegador.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Instalar Aplicativo</span>
        </button>

        {showIOSModal && (
          <IOSInstallModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all ${
          targetRole === 'client'
            ? 'bg-gradient-to-br from-[#24152F] to-[#180D20] text-[#F7F1E5] border-[#3F2553] shadow-lg'
            : 'bg-[#FAF6EE] text-[#24152F] border-[#24152F]/15 shadow-xs'
        } ${className}`}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
            targetRole === 'client'
              ? 'text-[#F7F1E5]/60 hover:text-[#F7F1E5] hover:bg-white/10'
              : 'text-[#24152F]/60 hover:text-[#24152F] hover:bg-[#24152F]/10'
          }`}
          title="Dispensar aviso"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
              targetRole === 'client'
                ? 'bg-[#DFFF5F] text-[#180D20]'
                : 'bg-[#24152F] text-[#DFFF5F]'
            }`}
          >
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-bold text-sm tracking-tight ${
                targetRole === 'client' ? 'text-[#F7F1E5]' : 'text-[#24152F]'
              }`}
            >
              {targetRole === 'client'
                ? 'Instale o Painel do Seu Evento no Celular'
                : 'Instale o Rafluo no Celular ou Desktop'}
            </h4>
            <p
              className={`text-xs mt-1 leading-relaxed ${
                targetRole === 'client' ? 'text-[#D2C4DC]' : 'text-[#24152F]/70'
              }`}
            >
              {targetRole === 'client'
                ? 'Acompanhe confirmações em tempo real com tela cheia, navegação ultra-rápida e sem barra do navegador.'
                : 'Acesse o sistema com um toque, atalhos rápidos e suporte a navegação offline.'}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                id="btn-pwa-install-action"
                onClick={handleInstallClick}
                className="px-4 py-2 rounded-xl bg-[#DFFF5F] hover:bg-[#CEF04A] text-[#180D20] text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  targetRole === 'client'
                    ? 'text-[#F7F1E5]/70 hover:text-[#F7F1E5]'
                    : 'text-[#24152F]/70 hover:text-[#24152F]'
                }`}
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstallModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
};

export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#24152F]/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#1E1128] text-[#24152F] dark:text-[#F7F1E5] rounded-3xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between border-b border-[#24152F]/10 dark:border-[#3F2553] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">Instalar no iPhone / iPad</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#24152F]/50 dark:text-[#D2C4DC]/50 hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed">
          Para instalar o Rafluo no iOS, siga estes 2 passos simples no Safari:
        </p>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
            <div className="w-7 h-7 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Toque no botão Compartilhar
              </p>
              <p className="text-[11px] text-[#24152F]/65 dark:text-[#D2C4DC]/65 mt-0.5 flex items-center gap-1.5">
                Ícone <Share2 className="w-3.5 h-3.5 inline text-[#24152F] dark:text-[#DFFF5F]" /> na barra inferior do Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
            <div className="w-7 h-7 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">
                "Adicionar à Tela de Início"
              </p>
              <p className="text-[11px] text-[#24152F]/65 dark:text-[#D2C4DC]/65 mt-0.5 flex items-center gap-1.5">
                Role para baixo e toque em <PlusSquare className="w-3.5 h-3.5 inline text-[#24152F] dark:text-[#DFFF5F]" /> Adicionar.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] text-xs font-bold cursor-pointer transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
