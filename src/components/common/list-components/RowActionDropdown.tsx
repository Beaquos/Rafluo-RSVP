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
  className?: string;
  iconClassName?: string;
  dividerAbove?: boolean;
}

interface RowActionDropdownProps {
  actions: ActionItem[];
  id?: string;
  width?: number;
  align?: 'right' | 'left';
  buttonClassName?: string;
  title?: string;
}

interface MenuCoords {
  top: number;
  left: number;
  placement: 'bottom' | 'top';
  menuWidth: number;
}

export const RowActionDropdown: React.FC<RowActionDropdownProps> = ({
  actions,
  id,
  width = 224,
  align = 'right',
  buttonClassName,
  title = 'Opções',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback((): MenuCoords | null => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();

    // Em telas muito estreitas, garante que a largura não ultrapasse a tela
    const maxAvailableWidth = window.innerWidth - 16;
    const menuWidth = Math.min(width, maxAvailableWidth);

    // Medir altura real do menu se já montado no DOM, senão estimar com segurança
    const menuEl = menuRef.current;
    const estimatedHeight = menuEl
      ? menuEl.offsetHeight
      : Math.max(120, actions.length * 42 + 20);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'bottom' | 'top' = 'bottom';
    let top = rect.bottom + 6;

    // Se o espaço abaixo for insuficiente e houver mais espaço acima, abre para cima
    if (spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow) {
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

    // Alinhamento horizontal: respeita align (padrão right) e os limites da tela
    let left: number;
    if (align === 'left') {
      left = rect.left;
    } else {
      left = rect.right - menuWidth;
    }

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    return { top, left, placement, menuWidth };
  }, [actions.length, width, align]);

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

  // Re-calcula posição com precisão assim que o menu for renderizado no portal
  useEffect(() => {
    if (isOpen) {
      const pos = calculatePosition();
      if (pos) {
        setCoords(pos);
      }
      // Foca automaticamente o primeiro item interativo para acessibilidade por teclado
      requestAnimationFrame(() => {
        const firstBtn = menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])');
        if (firstBtn) {
          firstBtn.focus();
        }
      });
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: Event) => {
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
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const buttons = Array.from(
          menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') || []
        );
        if (buttons.length > 0) {
          const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const nextIndex = currentIndex === -1 || currentIndex === buttons.length - 1 ? 0 : currentIndex + 1;
          buttons[nextIndex]?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const buttons = Array.from(
          menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') || []
        );
        if (buttons.length > 0) {
          const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const prevIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
          buttons[prevIndex]?.focus();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        buttons?.[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        if (buttons && buttons.length > 0) {
          buttons[buttons.length - 1]?.focus();
        }
      } else if (e.key === 'Tab') {
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
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, calculatePosition]);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={title}
        title={title}
        className={
          buttonClassName ||
          'w-8 h-8 rounded-lg flex items-center justify-center text-[#24152F]/60 dark:text-[#E2D7EA]/70 hover:text-[#24152F] dark:hover:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] transition-colors cursor-pointer border border-transparent hover:border-[#24152F]/15'
        }
      >
        <MoreVertical className="w-4 h-4" />
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
              width: `${coords.menuWidth}px`,
              maxHeight: 'calc(100vh - 16px)',
              overflowY: 'auto',
              zIndex: 99999,
            }}
            className={`rounded-2xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl py-1.5 duration-100 space-y-0.5 ${
              coords.placement === 'top'
                ? 'animate-in fade-in slide-in-from-bottom-2'
                : 'animate-in fade-in slide-in-from-top-2'
            }`}
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              const isDanger = action.variant === 'danger';
              const showDivider =
                action.dividerAbove ||
                (idx > 0 && isDanger && actions[idx - 1]?.variant !== 'danger');

              return (
                <React.Fragment key={action.id}>
                  {showDivider && (
                    <div className="border-t border-[#24152F]/10 dark:border-[#3F2553]/60 my-1" />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={action.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      action.onClick();
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus:bg-[#FAF6EE] dark:focus:bg-[#2A1738] ${
                      action.className
                        ? action.className
                        : action.disabled
                        ? 'opacity-40 cursor-not-allowed text-[#24152F]/40 dark:text-[#E2D7EA]/40'
                        : isDanger
                        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus:text-rose-700'
                        : 'text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          action.iconClassName
                            ? action.iconClassName
                            : isDanger
                            ? 'text-rose-600'
                            : 'text-[#24152F]/70 dark:text-[#E2D7EA]/60'
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
