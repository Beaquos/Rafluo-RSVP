import React from 'react';
import { ColumnDefinition } from './ColumnConfigDropdown';
import { Checkbox } from './Checkbox';
import { RowActionDropdown, ActionItem } from './RowActionDropdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ConfigurableTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  visibleColumnIds: string[];
  keyExtractor: (item: T) => string;
  selectedIds?: string[];
  onToggleSelectAll?: (selected: boolean) => void;
  onToggleSelectRow?: (id: string, selected: boolean) => void;
  getRowActions?: (item: T) => ActionItem[];
  onRowClick?: (item: T) => void;
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
}

export const ConfigurableTable = <T,>({
  data,
  columns,
  visibleColumnIds,
  keyExtractor,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelectRow,
  getRowActions,
  onRowClick,
  emptyState,
  sortBy,
  sortOrder = 'asc',
  onSort,
}: ConfigurableTableProps<T>) => {
  const visibleCols = columns.filter((col) => visibleColumnIds.includes(col.id));

  const allSelected =
    data.length > 0 && data.every((item) => selectedIds.includes(keyExtractor(item)));
  const someSelected =
    data.length > 0 &&
    data.some((item) => selectedIds.includes(keyExtractor(item))) &&
    !allSelected;

  if (data.length === 0 && emptyState) {
    const EmptyIcon = emptyState.icon;
    return (
      <div className="bg-white rounded-[20px] border border-[#E9E3D8] shadow-xs p-12 text-center my-4">
        {EmptyIcon && (
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] text-[#1A1033] flex items-center justify-center mx-auto mb-3">
            <EmptyIcon className="w-6 h-6" />
          </div>
        )}
        <h3 className="text-base font-bold text-[#1A1033]">{emptyState.title}</h3>
        <p className="text-xs text-[#6B6B76] max-w-md mx-auto mt-1 mb-4">
          {emptyState.description}
        </p>
        {emptyState.action && (
          <button
            type="button"
            onClick={emptyState.action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1033] hover:bg-[#120919] text-white text-xs font-bold transition-all shadow-xs"
          >
            {emptyState.action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#E9E3D8] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E3D8] bg-[#FAF6F0]/60 text-[11px] font-bold uppercase tracking-wider text-[#6B6B76]">
              {onToggleSelectAll && (
                <th className="p-4 w-12 text-center">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(checked) => onToggleSelectAll(checked)}
                    />
                  </div>
                </th>
              )}

              {visibleCols.map((col) => {
                const isSorted = sortBy === col.id;
                return (
                  <th
                    key={col.id}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && onSort && onSort(col.id)}
                    className={`p-4 text-xs font-bold text-[#6B6B76] ${
                      col.sortable ? 'cursor-pointer hover:text-[#1A1033] select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && isSorted && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#1A1033]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-[#1A1033]" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}

              {getRowActions && (
                <th className="p-4 w-14 text-right pr-5">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E9E3D8]/60 text-xs text-[#24152F]">
            {data.map((item) => {
              const rowKey = keyExtractor(item);
              const isSelected = selectedIds.includes(rowKey);
              const rowActions = getRowActions ? getRowActions(item) : [];

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-[#E4FF4D]/10'
                      : 'hover:bg-[#FAF6F0]/50'
                  }`}
                >
                  {onToggleSelectRow && (
                    <td
                      className="p-4 w-12 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => onToggleSelectRow(rowKey, checked)}
                        />
                      </div>
                    </td>
                  )}

                  {visibleCols.map((col) => (
                    <td key={col.id} className="p-4 align-middle">
                      {col.render(item)}
                    </td>
                  ))}

                  {getRowActions && (
                    <td
                      className="p-4 text-right pr-5 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionDropdown actions={rowActions} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
