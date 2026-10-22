import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectMode = (newMode: ThemeMode) => {
    setMode(newMode);
    setIsOpen(false);
  };

  const getButtonTitle = () => {
    if (mode === 'auto') return `Tema: Automático (atualmente ${theme === 'dark' ? 'escuro' : 'claro'})`;
    if (mode === 'dark') return 'Tema: Escuro';
    return 'Tema: Claro';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="btn-theme-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Selecionar tema (claro, escuro ou automático)"
        title={getButtonTitle()}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#24152F] dark:text-[#F7F1E5] bg-white dark:bg-[#24152F] border border-[#24152F]/15 dark:border-[#3F2553] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] focus:outline-none focus:ring-2 focus:ring-[#DFFF5F] shadow-2xs transition-all duration-200 cursor-pointer group"
      >
        {mode === 'auto' ? (
          <div className="relative flex items-center justify-center">
            <Laptop className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F] transition-transform duration-200 group-hover:scale-110" />
            <span
              className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-[#24152F]"
              style={{ backgroundColor: theme === 'dark' ? '#DFFF5F' : '#F59E0B' }}
              title={`Ativo: ${theme}`}
            />
          </div>
        ) : mode === 'dark' ? (
          <Moon className="w-4 h-4 text-[#DFFF5F] transition-transform duration-200 group-hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        )}
      </button>

      {/* Dropdown Menu com opções: Claro, Escuro e Automático */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/60 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 mb-1">
            Aparência
          </div>

          {/* Claro */}
          <button
            type="button"
            role="menuitem"
            id="theme-option-light"
            onClick={() => selectMode('light')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              mode === 'light'
                ? 'bg-[#FAF6EE] dark:bg-[#2E1B3C] text-[#24152F] dark:text-[#DFFF5F] font-bold'
                : 'text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE]/70 dark:hover:bg-[#2E1B3C]/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Claro</span>
            </div>
            {mode === 'light' && <Check className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />}
          </button>

          {/* Escuro */}
          <button
            type="button"
            role="menuitem"
            id="theme-option-dark"
            onClick={() => selectMode('dark')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              mode === 'dark'
                ? 'bg-[#FAF6EE] dark:bg-[#2E1B3C] text-[#24152F] dark:text-[#DFFF5F] font-bold'
                : 'text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE]/70 dark:hover:bg-[#2E1B3C]/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F] flex-shrink-0" />
              <span>Escuro</span>
            </div>
            {mode === 'dark' && <Check className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />}
          </button>

          {/* Automático (segue sistema) */}
          <button
            type="button"
            role="menuitem"
            id="theme-option-auto"
            onClick={() => selectMode('auto')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border-t border-[#24152F]/5 dark:border-[#3F2553]/40 mt-1 pt-1.5 ${
              mode === 'auto'
                ? 'bg-[#FAF6EE] dark:bg-[#2E1B3C] text-[#24152F] dark:text-[#DFFF5F] font-bold'
                : 'text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE]/70 dark:hover:bg-[#2E1B3C]/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-[#24152F]/70 dark:text-[#D2C4DC] flex-shrink-0" />
              <div>
                <span>Automático</span>
                <span className="block text-[10px] font-normal text-[#24152F]/50 dark:text-[#D2C4DC]/60">
                  Segue o sistema operacional
                </span>
              </div>
            </div>
            {mode === 'auto' && <Check className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />}
          </button>
        </div>
      )}
    </div>
  );
};
