import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export interface ExportDataDropdownProps {
  onExportXLSX: () => void;
  onExportPDF: () => void;
  buttonLabel?: string;
  className?: string;
  align?: 'left' | 'right';
  id?: string;
}

/**
 * Componente unificado de exportação de dados com dropdown (Excel XLSX ou PDF)
 * Padrão consistente em todo o sistema Rafluo (WCAG AA acessível)
 */
export const ExportDataDropdown: React.FC<ExportDataDropdownProps> = ({
  onExportXLSX,
  onExportPDF,
  buttonLabel = 'Exportar Dados',
  className = '',
  align = 'right',
  id = 'btn-export-data',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className={`relative block sm:inline-block text-left w-full sm:w-auto max-w-full ${className}`} ref={dropdownRef}>
      {/* Botão Unificado "Exportar Dados" */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-full sm:w-auto max-w-full flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl sm:rounded-lg bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] dark:bg-[#FAF6EE] dark:text-[#180D20] dark:hover:bg-white text-xs font-semibold shadow-2xs border border-[#3F2553] dark:border-[#FAF6EE] transition-all cursor-pointer active:scale-98"
        title="Exportar dados do sistema (Excel ou PDF)"
      >
        <Download className="w-3.5 h-3.5 text-[#DFFF5F] dark:text-[#180D20] flex-shrink-0" />
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#DFFF5F] dark:text-[#180D20] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menu Dropdown com Opções - Seguro para Mobile sem corte ou overflow */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute mt-2 z-50 rounded-2xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150 left-0 right-0 w-full min-w-0 max-w-full sm:w-64 sm:min-w-[240px] sm:max-w-[calc(100vw-2rem)] ${
            align === 'right' ? 'sm:left-auto sm:right-0' : 'sm:right-auto sm:left-0'
          }`}
        >
          <div className="px-3.5 py-1.5 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/60">
              Formato de Exportação
            </p>
          </div>

          {/* Opção 1: Planilha Excel (.xlsx) */}
          <button
            type="button"
            id={`${id}-xlsx`}
            role="menuitem"
            onClick={() => handleSelect(onExportXLSX)}
            className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] flex items-start gap-3 transition-colors cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] group-hover:text-emerald-800 dark:group-hover:text-emerald-300 truncate">
                Excel (.xlsx)
              </p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/70 leading-tight mt-0.5 break-words">
                Planilha completa organizada por colunas e status
              </p>
            </div>
          </button>

          {/* Opção 2: Documento PDF (.pdf) */}
          <button
            type="button"
            id={`${id}-pdf`}
            role="menuitem"
            onClick={() => handleSelect(onExportPDF)}
            className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] flex items-start gap-3 transition-colors cursor-pointer group border-t border-[#24152F]/5 dark:border-[#3F2553]/40 min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#24152F] dark:text-[#DFFF5F] border border-[#24152F]/15 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileText className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] group-hover:text-[#3F2553] dark:group-hover:text-[#DFFF5F] truncate">
                PDF (.pdf)
              </p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/70 leading-tight mt-0.5 break-words">
                Relatório oficial diagramado pronto para impressão
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
