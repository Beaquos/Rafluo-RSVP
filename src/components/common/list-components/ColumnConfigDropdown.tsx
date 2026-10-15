import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, RefreshCw } from 'lucide-react';

export interface ColumnDefinition<T> {
  id: string;
  label: string;
  width?: string;
  sortable?: boolean;
  isDefaultVisible?: boolean;
  render: (item: T) => React.ReactNode;
}

interface ColumnConfigDropdownProps<T> {
  columns: ColumnDefinition<T>[];
  visibleColumnIds: string[];
  onChangeVisible: (ids: string[]) => void;
  onResetDefaults?: () => void;
}

export const ColumnConfigDropdown = <T,>({
  columns,
  visibleColumnIds,
  onChangeVisible,
  onResetDefaults,
}: ColumnConfigDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const toggleColumn = (colId: string) => {
    if (visibleColumnIds.includes(colId)) {
      if (visibleColumnIds.length === 1) return; // Prevent removing all columns
      onChangeVisible(visibleColumnIds.filter((id) => id !== colId));
    } else {
      onChangeVisible([...visibleColumnIds, colId]);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Configurar colunas da tabela"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E9E3D8] bg-white hover:bg-[#FAF6F0] text-[#1A1033] text-xs font-medium transition-all cursor-pointer shadow-2xs"
      >
        <SlidersHorizontal className="w-4 h-4 text-[#6B6B76]" />
        <span>Colunas</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-60 z-50 rounded-xl bg-white border border-[#E9E3D8] shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E3D8]">
            <span className="text-xs font-bold text-[#1A1033]">Exibir Colunas</span>
            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="text-[11px] text-[#6B6B76] hover:text-[#1A1033] flex items-center gap-1 transition-colors"
                title="Restaurar padrão"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {columns.map((col) => {
              const isChecked = visibleColumnIds.includes(col.id);
              return (
                <label
                  key={col.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(col.id);
                  }}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#FAF6F0] cursor-pointer text-xs select-none"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-[#1A1033] border-[#1A1033] text-white'
                        : 'bg-white border-[#E9E3D8] text-transparent'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs text-[#24152F]">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
