import React from 'react';

interface RafluoLogoProps {
  variant?: 'dark' | 'light'; // 'dark' = used on dark purple background; 'light' = used on beige/white background
  size?: 'sm' | 'md' | 'lg';
  showDescriptor?: boolean; // "Gestão inteligente de confirmações."
  showOrigin?: boolean; // "Desenvolvido com carinho por Beaquos Estúdio Criativo"
  symbolOnly?: boolean;
  className?: string;
}

export const RafluoLogo: React.FC<RafluoLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showDescriptor = false,
  showOrigin = false,
  symbolOnly = false,
  className = '',
}) => {
  const isDark = variant === 'dark'; // Dark purple background (text is beige/white, accent neon)

  const sizeClasses = {
    sm: {
      symbol: 'w-7 h-7',
      text: 'text-lg',
      descriptor: 'text-[9px]',
      origin: 'text-[9px]',
    },
    md: {
      symbol: 'w-8 h-8',
      text: 'text-xl',
      descriptor: 'text-[11px]',
      origin: 'text-[10px]',
    },
    lg: {
      symbol: 'w-10 h-10',
      text: 'text-2xl',
      descriptor: 'text-xs',
      origin: 'text-xs',
    },
  }[size];

  // Symbol element: Geometric, modern, fluid monogram representing intelligence & RSVP flow
  const renderSymbol = () => (
    <div
      className={`relative ${sizeClasses.symbol} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
        isDark
          ? 'bg-[#180D20] border border-[#3F2553] shadow-inner'
          : 'bg-[#24152F] shadow-sm'
      }`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >
        {/* Sleek dynamic fluid 'R' stem & curve */}
        <path
          d="M9 7C9 5.89543 9.89543 5 11 5H18C21.3137 5 24 7.68629 24 11C24 13.973 21.8398 16.441 19 16.9V17L23.5 25C23.9 25.7 23.4 26.5 22.5 26.5H19.5C18.9 26.5 18.4 26.1 18.1 25.6L14 17.5H12V25.5C12 26.0523 11.5523 26.5 11 26.5C10.4477 26.5 10 26.0523 10 25.5V8"
          stroke={isDark ? '#F7F1E5' : '#F7F1E5'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Upper inner bowl accent */}
        <path
          d="M12 13.5H17.5C18.8807 13.5 20 12.3807 20 11C20 9.61929 18.8807 8.5 17.5 8.5H12V13.5Z"
          fill={isDark ? '#2E1B3C' : '#3F2553'}
        />
        {/* Neon Green Confirmation Spark/Dot */}
        <circle cx="21" cy="7.5" r="2.2" fill="#DFFF5F" />
      </svg>
      {/* Subtle indicator ring */}
      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#DFFF5F] ring-2 ring-[#24152F]" />
    </div>
  );

  if (symbolOnly) {
    return (
      <div className={`inline-flex items-center ${className}`} title="Rafluo">
        {renderSymbol()}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5">
        {renderSymbol()}
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black tracking-tight ${sizeClasses.text} ${
                isDark ? 'text-[#F7F1E5]' : 'text-[#24152F]'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Rafluo
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF5F] ml-0.5 mb-0.5 inline-block" />
          </div>

          {showDescriptor && (
            <span
              className={`mt-1 font-medium tracking-normal ${sizeClasses.descriptor} ${
                isDark ? 'text-[#D2C4DC]' : 'text-[#60526B]'
              }`}
            >
              Gestão inteligente de confirmações.
            </span>
          )}
        </div>
      </div>

      {showOrigin && (
        <span
          className={`mt-1.5 font-medium ${sizeClasses.origin} ${
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
