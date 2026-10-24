import React, { useState, useEffect } from 'react';
import { getStoredCompanyLogo, subscribeToCrossTabSync } from '../../utils/storageUtils';

export interface RafluoLogoProps {
  variant?: 'dark' | 'light'; // 'dark' = used on dark background (sidebar); 'light' = used on light background (login, cards)
  size?: 'sm' | 'md' | 'lg';
  showDescriptor?: boolean; // "Gestão inteligente de confirmações."
  showOrigin?: boolean; // "Desenvolvido com carinho por Beaquos Estúdio Criativo"
  symbolOnly?: boolean;
  className?: string;
  alt?: string;
}

export const RafluoLogo: React.FC<RafluoLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showDescriptor = false,
  showOrigin = false,
  symbolOnly = false,
  className = '',
  alt = 'Simfluo by beaquos',
}) => {
  const [companyLogo, setCompanyLogo] = useState<string>(() => {
    return typeof window !== 'undefined' ? getStoredCompanyLogo() : '';
  });

  useEffect(() => {
    const unsubscribe = subscribeToCrossTabSync((type, payload) => {
      if (type === 'company_data_updated') {
        setCompanyLogo(payload?.logo || '');
      }
    });
    return unsubscribe;
  }, []);

  const isDark = variant === 'dark';

  // Sizing definitions preserving the 1104:330 aspect ratio for full logos, and 1:1 for symbols
  const sizeClasses = {
    sm: {
      symbol: 'w-7 h-7 sm:w-8 sm:h-8',
      fullLogo: 'h-7 sm:h-8 w-auto max-w-full',
      descriptor: 'text-[9px]',
      origin: 'text-[9px]',
    },
    md: {
      symbol: 'w-8 h-8 sm:w-9 sm:h-9',
      fullLogo: 'h-8 sm:h-9 md:h-10 w-auto max-w-full',
      descriptor: 'text-[11px]',
      origin: 'text-[10px]',
    },
    lg: {
      symbol: 'w-10 h-10 sm:w-12 sm:h-12',
      fullLogo: 'h-11 sm:h-13 md:h-14 w-auto max-w-full',
      descriptor: 'text-xs',
      origin: 'text-xs',
    },
  }[size];

  // If a custom company logo is stored in hub settings, prioritize it
  if (companyLogo && companyLogo.trim().length > 0) {
    if (symbolOnly) {
      return (
        <div
          className={`relative ${sizeClasses.symbol} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
            isDark ? 'bg-white/10 p-0.5' : 'bg-black/5 p-0.5'
          } ${className}`}
          title="Logo da Empresa"
        >
          <img
            src={companyLogo}
            alt="Logo da Empresa"
            className="w-full h-full object-contain select-none"
            onError={() => setCompanyLogo('')}
          />
        </div>
      );
    }

    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <div
          className={`relative ${sizeClasses.fullLogo} flex items-center justify-center flex-shrink-0 overflow-hidden`}
        >
          <img
            src={companyLogo}
            alt="Logo da Empresa"
            className="max-h-full max-w-full object-contain select-none"
            onError={() => setCompanyLogo('')}
          />
        </div>
        {showDescriptor && (
          <span
            className={`mt-1.5 font-medium tracking-normal text-center ${sizeClasses.descriptor} ${
              isDark ? 'text-[#D2C4DC]' : 'text-[#60526B]'
            }`}
          >
            Gestão inteligente de confirmações.
          </span>
        )}
      </div>
    );
  }

  // Symbol only (e.g. collapsed sidebar or compact app icon)
  if (symbolOnly) {
    return (
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        title="Simfluo"
      >
        <img
          src="/favicon.svg"
          alt={alt}
          className={`${sizeClasses.symbol} object-contain rounded-xl select-none transition-transform hover:scale-105`}
          draggable={false}
          loading="eager"
        />
      </div>
    );
  }

  // Full official logo: logo-dark.svg for dark background, logo-light.svg for light background
  const officialLogoPath = isDark ? '/logo-dark.svg' : '/logo-light.svg';

  return (
    <div className={`inline-flex flex-col items-center sm:items-start ${className}`} title="Simfluo by beaquos">
      <img
        src={officialLogoPath}
        alt={alt}
        className={`${sizeClasses.fullLogo} object-contain select-none transition-opacity hover:opacity-95`}
        draggable={false}
        loading="eager"
      />

      {showDescriptor && (
        <span
          className={`mt-2 font-medium tracking-normal ${sizeClasses.descriptor} ${
            isDark ? 'text-[#D2C4DC]' : 'text-[#60526B]'
          }`}
        >
          Gestão inteligente de confirmações.
        </span>
      )}

      {showOrigin && (
        <span
          className={`mt-1 font-medium ${sizeClasses.origin} ${
            isDark ? 'text-[#D2C4DC]' : 'text-[#8E7E9A]'
          }`}
        >
          Desenvolvido com carinho por{' '}
          <strong className={isDark ? 'text-[#D2C4DC] font-semibold' : 'text-[#4E395B]'}>
            Beaquos Estúdio Criativo
          </strong>
        </span>
      )}
    </div>
  );
};

export const SimfluoLogo = RafluoLogo;
export default RafluoLogo;

