import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const PWAOfflineNotice: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-3 py-1.5 rounded-full bg-[#180D20]/90 text-[#F7F1E5] border border-[#3F2553] text-[11px] font-semibold flex items-center gap-2 shadow-lg backdrop-blur-xs animate-in fade-in duration-200">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Você está offline. Operando em modo de cache local.</span>
    </div>
  );
};
