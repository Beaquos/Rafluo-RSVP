import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { GuestData, EventData } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';

interface NotificationsDropdownProps {
  guests: GuestData[];
  events: EventData[];
  onSelectEvent?: (event: EventData) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  guests,
  events,
  onSelectEvent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive notifications exclusively from REAL guest responses that have respondedAt
  const respondedGuests = guests
    .filter((g) => g.status !== 'pending' && g.respondedAt)
    .slice(0, 10);

  const unreadCount = respondedGuests.filter((g) => !readIds.has(g.id)).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const allIds = new Set(respondedGuests.map((g) => g.id));
    setReadIds(allIds);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button - PADRONIZADO IGUAL AO ALTERNAR TEMA (w-9 h-9, rounded-full, bg-white dark:bg-[#24152F], border) */}
      <button
        type="button"
        id="btn-notifications-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir notificações"
        title="Notificações de confirmações"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#24152F] dark:text-[#F7F1E5] bg-white dark:bg-[#24152F] border border-[#24152F]/15 dark:border-[#3F2553] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] focus:outline-none focus:ring-2 focus:ring-[#DFFF5F] shadow-2xs transition-all duration-200 cursor-pointer group"
      >
        <Bell className="w-4 h-4 text-[#24152F] dark:text-[#D2C4DC] group-hover:text-[#24152F] dark:group-hover:text-[#F7F1E5] transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#180D20] text-[#DFFF5F] border border-[#DFFF5F] text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Responsivo para mobile e desktop */}
      {isOpen && (
        <div className="fixed inset-x-3.5 top-[62px] sm:top-full sm:inset-x-auto sm:left-auto sm:right-0 sm:absolute mt-0 sm:mt-2 w-auto sm:w-96 max-w-md sm:max-w-none mx-auto sm:mx-0 rounded-2xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-none">
          <div className="p-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#DFFF5F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#DFFF5F] text-[#180D20] font-bold px-2 py-0.2 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#DFFF5F] hover:underline font-semibold cursor-pointer"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/50">
            {respondedGuests.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F]/40 dark:text-[#D2C4DC]/50 mx-auto flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-[#24152F]/70 dark:text-[#D2C4DC]">
                  Nenhuma notificação no momento.
                </p>
                <p className="text-[11px] text-[#24152F]/50 dark:text-[#D2C4DC]/60 mt-0.5">
                  Novas confirmações de convidados serão exibidas aqui.
                </p>
              </div>
            ) : (
              respondedGuests.map((g) => {
                const isRead = readIds.has(g.id);
                const ev = events.find((e) => e.id === g.eventId);
                const isConfirmed = g.status === 'confirmed';

                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      setReadIds((prev) => new Set([...prev, g.id]));
                      if (ev && onSelectEvent) {
                        onSelectEvent(ev);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isRead
                        ? 'bg-white dark:bg-[#1E1128] hover:bg-[#FAF6EE]/50 dark:hover:bg-[#24152F]/50'
                        : 'bg-[#FAF6EE]/70 dark:bg-[#2A1738] hover:bg-[#FAF6EE] dark:hover:bg-[#321C42]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isConfirmed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {isConfirmed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#24152F] dark:text-[#F7F1E5] leading-snug">
                        <strong className="font-bold">{g.name}</strong>{' '}
                        {isConfirmed ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">confirmou presença</span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 font-semibold">informou ausência</span>
                        )}
                        {ev ? ` em "${ev.name}"` : ''}.
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#24152F]/50 dark:text-[#D2C4DC]/70">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateBR(g.respondedAt)}
                        </span>
                        {g.companionCount > 0 && (
                          <span>• +{g.companionCount} acompanhante(s)</span>
                        )}
                      </div>
                    </div>

                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#24152F] dark:bg-[#DFFF5F] flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
