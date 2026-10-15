import React from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';

interface ListHeaderProps {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onFilterClick?: () => void;
  isFilterActive?: boolean;
  actionButton: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export const ListHeader: React.FC<ListHeaderProps> = ({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  onFilterClick,
  isFilterActive = false,
  actionButton,
}) => {
  const ActionIcon = actionButton.icon || Plus;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Esquerda: Título da página e subtítulo padronizados */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
          {subtitle}
        </p>
      </div>

      {/* Direita: Busca em pílula + Botão Primário */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
        {/* Campo de busca em pílula (h-12 / 48px, w-full sm:w-[360px]) */}
        <div className="relative flex-1 sm:w-[360px]">
          <Search className="w-5 h-5 text-[#6B6B76] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-12 pl-11 pr-11 rounded-full border border-[#E9E3D8] bg-white text-xs sm:text-sm text-[#1A1033] placeholder:text-[#6B6B76]/70 focus:outline-none focus:ring-2 focus:ring-[#1A1033] focus:border-transparent transition-all shadow-2xs"
          />
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              title="Filtrar resultados"
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors cursor-pointer ${
                isFilterActive
                  ? 'bg-[#E4FF4D] text-[#1A1033]'
                  : 'text-[#6B6B76] hover:text-[#1A1033] hover:bg-[#FAF6F0]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão Primário: fundo escuro, texto branco, h-12 / 52px aproximado, quadradinho lime com "+" */}
        <button
          type="button"
          onClick={actionButton.onClick}
          className="flex items-center justify-center gap-3 px-5 h-12 rounded-[14px] bg-[#1A1033] hover:bg-[#120919] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-98 cursor-pointer flex-shrink-0 border border-[#3F2553]"
        >
          <div className="w-6 h-6 rounded-md bg-[#E4FF4D] text-[#1A1033] flex items-center justify-center flex-shrink-0">
            <ActionIcon className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span>{actionButton.label}</span>
        </button>
      </div>
    </div>
  );
};
