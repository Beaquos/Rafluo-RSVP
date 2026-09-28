import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="system-footer"
      className="w-full py-4 px-6 border-t border-[#24152F]/10 dark:border-[#3F2553] bg-[#FAF6EE]/80 dark:bg-[#180D20] text-center select-none"
    >
      <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC] font-medium tracking-wide">
        Desenvolvido com carinho por{' '}
        <span className="font-semibold text-[#24152F] dark:text-[#D2C4DC]">Beaquos Estúdio Criativo</span>
      </p>
    </footer>
  );
};
