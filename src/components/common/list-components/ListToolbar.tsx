import React from 'react';
import { ColumnConfigDropdown, ColumnDefinition } from './ColumnConfigDropdown';
import { Checkbox } from './Checkbox';

interface ListToolbarProps<T> {
  totalCount: number;
  filteredCount: number;
  selectedCount?: number;
  columns: ColumnDefinition<T>[];
  visibleColumnIds: string[];
  onChangeVisibleColumns: (ids: string[]) => void;
  onResetColumns?: () => void;
  // Bulk actions
  bulkActions?: {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }[];
  // Filter tabs or pills
  filterPills?: {
    id: string;
    label: string;
    count?: number;
    isActive: boolean;
    onClick: () => void;
  }[];
}

export const ListToolbar = <T,>({
  totalCount,
  filteredCount,
  selectedCount = 0,
  columns,
  visibleColumnIds,
  onChangeVisibleColumns,
  onResetColumns,
  bulkActions = [],
  filterPills = [],
}: ListToolbarProps<T>) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
      {/* Esquerda: Filtros rápidos / status pills ou contador */}
      <div className="flex flex-wrap items-center gap-2">
        {filterPills.length > 0 ? (
          filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={pill.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                pill.isActive
                  ? 'bg-[#1A1033] text-white shadow-xs'
                  : 'bg-white border border-[#E9E3D8] text-[#6B6B76] hover:text-[#1A1033] hover:bg-[#FAF6F0]'
              }`}
            >
              <span>{pill.label}</span>
              {pill.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    pill.isActive
                      ? 'bg-[#E4FF4D] text-[#1A1033]'
                      : 'bg-[#FAF6F0] text-[#6B6B76]'
                  }`}
                >
                  {pill.count}
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="text-xs text-[#6B6B76]">
            Total de <strong className="text-[#1A1033] font-bold">{totalCount}</strong>{' '}
            registros
            {filteredCount !== totalCount && (
              <span> ({filteredCount} filtrados)</span>
            )}
          </div>
        )}

        {/* Selected count indicator */}
        {selectedCount > 0 && (
          <span className="text-xs font-bold bg-[#E4FF4D] text-[#1A1033] px-2.5 py-1 rounded-full">
            {selectedCount} selecionado(s)
          </span>
        )}
      </div>

      {/* Direita: Ações em lote e Botão de Colunas */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {selectedCount > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-1.5 mr-1">
            {bulkActions.map((action) => {
              const ActionIcon = action.icon;
              const isDanger = action.variant === 'danger';
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isDanger
                      ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                      : 'bg-white border border-[#E9E3D8] text-[#1A1033] hover:bg-[#FAF6F0]'
                  }`}
                >
                  {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <ColumnConfigDropdown
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onChangeVisible={onChangeVisibleColumns}
          onResetDefaults={onResetColumns}
        />
      </div>
    </div>
  );
};
