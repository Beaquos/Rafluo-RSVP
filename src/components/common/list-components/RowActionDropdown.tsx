import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface RowActionDropdownProps {
  actions: ActionItem[];
  id?: string;
}

export const RowActionDropdown: React.FC<RowActionDropdownProps> = ({
  actions,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-label="Ações"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B76] dark:text-[#E2D7EA]/70 hover:text-[#1A1033] dark:hover:text-[#F7F1E5] hover:bg-[#FAF6F0] dark:hover:bg-[#2A1738] transition-colors cursor-pointer"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-48 z-40 rounded-xl bg-white dark:bg-[#1E1128] border border-[#E9E3D8] dark:border-[#3F2553] shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <React.Fragment key={action.id}>
                {idx > 0 && <div className="border-t border-[#E9E3D8]/60 dark:border-[#3F2553]/60 my-0.5" />}
                <button
                  type="button"
                  disabled={action.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    action.onClick();
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    action.disabled
                      ? 'opacity-40 cursor-not-allowed text-[#6B6B76]'
                      : isDanger
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6F0] dark:hover:bg-[#2A1738]'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isDanger ? 'text-rose-600' : 'text-[#6B6B76] dark:text-[#E2D7EA]/60'
                      }`}
                    />
                  )}
                  <span className="truncate">{action.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
