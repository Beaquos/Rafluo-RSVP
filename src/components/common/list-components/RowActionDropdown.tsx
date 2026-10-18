import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuCoords {
  top: number;
  left: number;
  placement: 'bottom' | 'top';
}

export const RowActionDropdown: React.FC<RowActionDropdownProps> = ({
  actions,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback((): MenuCoords | null => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();

    const menuWidth = 192; // w-48 = 12rem = 192px
    // Medir altura real do menu se já montado no DOM, senão estimar
    const menuEl = menuRef.current;
    const estimatedHeight = menuEl ? menuEl.offsetHeight : Math.max(100, actions.length * 42 + 16);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'bottom' | 'top' = 'bottom';
    let top = rect.bottom + 6;

    // Se o espaço abaixo for insuficiente e houver mais espaço acima, abre para cima
    if (spaceBelow < estimatedHeight + 10 && spaceAbove > spaceBelow) {
      placement = 'top';
      top = rect.top - estimatedHeight - 6;
    }

    // Clamping vertical para nunca cortar nos limites superior ou inferior da tela
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - estimatedHeight - 8);
    }
    if (top < 8) {
      top = 8;
    }

    // Alinhamento horizontal: alinha à direita do botão, mas respeita as bordas da tela
    let left = rect.right - menuWidth;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    return { top, left, placement };
  }, [actions.length]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      const pos = calculatePosition();
      setCoords(pos);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Re-calcula posição assim que o menu for renderizado no portal com a altura real
  useEffect(() => {
    if (isOpen) {
      const pos = calculatePosition();
      if (pos) {
        setCoords(pos);
      }
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      const newPos = calculatePosition();
      if (newPos) {
        setCoords(newPos);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, calculatePosition]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label="Ações"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B76] dark:text-[#E2D7EA]/70 hover:text-[#1A1033] dark:hover:text-[#F7F1E5] hover:bg-[#FAF6F0] dark:hover:bg-[#2A1738] transition-colors cursor-pointer"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className={`w-48 rounded-xl bg-white dark:bg-[#1E1128] border border-[#E9E3D8] dark:border-[#3F2553] shadow-2xl py-1 duration-100 ${
              coords.placement === 'top'
                ? 'animate-in fade-in slide-in-from-bottom-2'
                : 'animate-in fade-in slide-in-from-top-2'
            }`}
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              const isDanger = action.variant === 'danger';
              return (
                <React.Fragment key={action.id}>
                  {idx > 0 && (
                    <div className="border-t border-[#E9E3D8]/60 dark:border-[#3F2553]/60 my-0.5" />
                  )}
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
          </div>,
          document.body
        )}
    </div>
  );
};
