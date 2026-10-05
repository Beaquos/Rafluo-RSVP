import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Copy,
  Check,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit3,
  ShieldCheck,
  ChevronDown,
  Link,
  UserCheck,
  User,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { EventData, GuestData } from '../../data/mockData';
import { copyToClipboard, getClientPanelUrl, getEventRsvpUrl } from '../../utils/linkUtils';
import { formatDateBR } from '../../utils/dateUtils';
import { getTypeBadgeColor } from '../../utils/badgeUtils';
import { AdminUser } from '../../types/user';

interface MasterEventsHubProps {
  events: EventData[];
  guests: GuestData[];
  onSelectEvent: (event: EventData) => void;
  onNewEvent: () => void;
  onEditEvent: (event: EventData) => void;
  onDeleteEvent?: (eventId: string) => void;
  onShowToast: (message: string) => void;
  onOpenPreview: (guestCode?: string) => void;
  currentUser?: AdminUser;
}

export const MasterEventsHub: React.FC<MasterEventsHubProps> = ({
  events,
  guests,
  onSelectEvent,
  onNewEvent,
  onEditEvent,
  onDeleteEvent,
  onShowToast,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventData | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close actions menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global metrics across all events
  const totalEvents = events.length;
  const activeEventsCount = events.filter((e) => e.status === 'active').length;
  const totalGuestsManaged = guests.length;
  const totalConfirmed = guests.filter((g) => g.status === 'confirmed').length;

  const handleCopyLink = async (e: React.MouseEvent, event: EventData) => {
    e.stopPropagation();
    const url = getClientPanelUrl(event.id, event.slug);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedEventId(event.id);
      onShowToast(`Link de acesso do responsável para "${event.name}" copiado com sucesso!`);
      setTimeout(() => setCopiedEventId(null), 2500);
    }
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.clientName && ev.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ev.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return ev.status === statusFilter;
  });

  return (
    <div id="master-events-hub" className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F]">
            Eventos
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 font-normal">
            Gerencie todos os eventos e celebrações cadastradas.
          </p>
        </div>

        <button
          id="btn-master-create-event"
          onClick={onNewEvent}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer group w-full sm:w-fit border border-[#3F2553]"
        >
          <div className="w-5 h-5 rounded-md bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Novo evento</span>
        </button>
      </div>

      {/* Global Master KPI Metrics with highlighted icon badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total de Eventos */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
          <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
            <span className="truncate pr-1">Total Eventos</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#DFFF5F]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">{totalEvents}</p>
            <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Cadastrados no sistema</p>
          </div>
        </div>

        {/* RSVP Ativo */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
          <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
            <span className="truncate pr-1">RSVP Ativo</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs ring-1 ring-[#DFFF5F]/50 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#180D20]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">{activeEventsCount}</p>
            <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Recebendo respostas</p>
          </div>
        </div>

        {/* Total de Convidados */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
          <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
            <span className="truncate pr-1">Total Convidados</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#DFFF5F]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">{totalGuestsManaged}</p>
            <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Cadastrados na base</p>
          </div>
        </div>

        {/* Confirmações Gerais */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
          <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
            <span className="truncate pr-1">Confirmados</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#180D20]" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">{totalConfirmed}</p>
            <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Presenças confirmadas</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#24152F]/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-master-events"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, evento, tipo ou local..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#24152F]/20 bg-[#F7F1E5]/40 text-xs text-[#24152F] placeholder-[#24152F]/40 focus:outline-none focus:ring-1 focus:ring-[#24152F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-[#24152F]/50 mr-1 hidden sm:inline">Status:</span>
          {(['all', 'active', 'draft', 'closed'] as const).map((filterKey) => {
            const config = {
              all: {
                label: 'Todos',
                dotClass: 'bg-zinc-400',
                activeClass: 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]',
                activeDot: 'bg-zinc-300',
              },
              active: {
                label: 'Ativos',
                dotClass: 'bg-emerald-500',
                activeClass: 'bg-[#DFFF5F] text-[#180D20] border-[#DFFF5F]',
                activeDot: 'bg-[#180D20]',
              },
              draft: {
                label: 'Rascunhos',
                dotClass: 'bg-amber-500',
                activeClass: 'bg-amber-100 text-amber-900 border-amber-300',
                activeDot: 'bg-amber-600',
              },
              closed: {
                label: 'Encerrados',
                dotClass: 'bg-zinc-400',
                activeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
                activeDot: 'bg-zinc-500',
              },
            }[filterKey];

            const isSelected = statusFilter === filterKey;
            return (
              <button
                key={filterKey}
                onClick={() => setStatusFilter(filterKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  isSelected
                    ? `${config.activeClass} shadow-xs font-bold`
                    : 'bg-white border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#F7F1E5]/70 hover:text-[#24152F]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? config.activeDot : config.dotClass}`} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Client Events Catalog */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#24152F]/70">
            Eventos dos Clientes
          </h3>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#24152F]/20 p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-[#24152F]/30 mx-auto" />
            <p className="text-sm font-semibold text-[#24152F]">Nenhum evento encontrado</p>
            <p className="text-xs text-[#24152F]/50">
              Tente redefinir os filtros ou clique em "Novo evento".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((ev) => {
              const isActionMenuOpen = openActionMenuId === ev.id;

              const handleCopyGuestLink = async (e: React.MouseEvent) => {
                e.stopPropagation();
                setOpenActionMenuId(null);
                const url = getEventRsvpUrl(ev.id, ev.slug);
                const ok = await copyToClipboard(url);
                if (ok) {
                  setCopiedEventId(ev.id);
                  onShowToast(`Link do convidado para "${ev.name}" copiado com sucesso!`);
                  setTimeout(() => setCopiedEventId(null), 2500);
                }
              };

              const handleCopyResponsible = async (e: React.MouseEvent) => {
                e.stopPropagation();
                setOpenActionMenuId(null);
                const url = getClientPanelUrl(ev.id, ev.slug);
                const ok = await copyToClipboard(url);
                if (ok) {
                  setCopiedEventId(ev.id);
                  onShowToast(`Link do responsável para "${ev.name}" copiado com sucesso!`);
                  setTimeout(() => setCopiedEventId(null), 2500);
                }
              };

              return (
                <div
                  key={ev.id}
                  id={`card-event-${ev.id}`}
                  className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] hover:border-[#24152F]/40 dark:hover:border-[#DFFF5F]/50 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between group relative"
                >
                  <div className="space-y-3">
                    {/* Top Row: Tag do Tipo de Evento (esquerda) e Badge de Status com ponto verde pulsante (direita) */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(
                          ev.type
                        )}`}
                      >
                        {ev.type}
                      </span>

                      <div className="flex-shrink-0">
                        {ev.status === 'active' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20] flex items-center gap-1.5 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#180D20] animate-pulse" />
                            RSVP Aberto
                          </span>
                        ) : ev.status === 'draft' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Rascunho
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#24152F]/10 dark:bg-white/10 text-[#24152F]/60 dark:text-[#D2C4DC]/60 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#24152F]/40" />
                            Encerrado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Título do Evento e Descrição */}
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5] group-hover:text-[#3F2553] dark:group-hover:text-[#DFFF5F] transition-colors leading-snug">
                        {ev.name}
                      </h4>
                      {ev.description && (
                        <p className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 line-clamp-2 mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Detalhes do Evento: Apenas Ícones com Fundo Padronizado + Valores */}
                    <div className="space-y-2 text-xs text-[#24152F]/80 dark:text-[#D2C4DC] pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553]/60">
                      {/* Cliente */}
                      {ev.clientName && (
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <User className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                          </div>
                          <span className="font-semibold text-[#24152F] dark:text-[#F7F1E5] truncate" title={ev.clientName}>
                            {ev.clientName}
                          </span>
                        </div>
                      )}

                      {/* Data */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                        </div>
                        <span className="font-medium text-[#24152F] dark:text-[#F7F1E5]">
                          {formatDateBR(ev.date)}
                        </span>
                      </div>

                      {/* Horário */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                        </div>
                        <span className="font-medium text-[#24152F] dark:text-[#F7F1E5]">
                          {ev.time}
                        </span>
                      </div>

                      {/* Local */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <MapPin className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                        </div>
                        <span className="font-medium text-[#24152F] dark:text-[#F7F1E5] truncate" title={ev.location}>
                          {ev.location}
                        </span>
                      </div>
                    </div>

                    {/* Prazo de Confirmação: Inner Box de largura total com cantos arredondados e borda sutil */}
                    <div className="rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738]/50 p-2.5 sm:p-3 flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                        </div>
                        <div className="text-xs">
                          <span className="text-[#24152F]/70 dark:text-[#D2C4DC]/80 font-medium">Confirmação até: </span>
                          <strong className="font-bold text-[#24152F] dark:text-[#F7F1E5]">{formatDateBR(ev.rsvpDeadline)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Botões padronizados em altura, tamanho e proporção */}
                  <div className="pt-3 mt-3 border-t border-[#24152F]/10 dark:border-[#3F2553] flex items-center gap-2">
                    {/* Botão Ações com Ícone e Dropdown Centralizado */}
                    <div className="relative flex-1" ref={isActionMenuOpen ? actionMenuRef : undefined}>
                      <button
                        type="button"
                        id={`btn-actions-${ev.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(isActionMenuOpen ? null : ev.id);
                        }}
                        className={`w-full h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] hover:border-[#24152F] bg-white dark:bg-[#1E1128] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-between active:scale-98 ${
                          isActionMenuOpen ? 'ring-2 ring-[#24152F]/20 dark:ring-[#DFFF5F]/30 bg-[#FAF6EE] dark:bg-[#2A1738]' : ''
                        }`}
                        title="Opções do evento"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] text-[#24152F] dark:text-[#DFFF5F] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">Ações</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#24152F]/60 dark:text-[#D2C4DC]/60 flex-shrink-0 transition-transform duration-200 ${
                            isActionMenuOpen ? 'rotate-180 text-[#24152F] dark:text-[#DFFF5F]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown com as opções centralizadas: Editar dados, Link do responsável, Link do convidado */}
                      {isActionMenuOpen && (
                        <div className="absolute left-0 bottom-full mb-1.5 w-52 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            id={`btn-action-edit-${ev.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(null);
                              onEditEvent(ev);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#24152F]/70 dark:text-[#DFFF5F]" />
                            <span>Editar dados</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-action-responsible-${ev.id}`}
                            onClick={handleCopyResponsible}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-[#24152F]/70 dark:text-[#DFFF5F]" />
                            <span>Link do responsável</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-action-guest-${ev.id}`}
                            onClick={handleCopyGuestLink}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Link className="w-3.5 h-3.5 text-[#24152F]/70 dark:text-[#DFFF5F]" />
                            <span>Link do convidado</span>
                          </button>

                          <div className="my-1 border-t border-[#24152F]/10 dark:border-[#3F2553]" />

                          <button
                            type="button"
                            id={`btn-action-delete-${ev.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(null);
                              const canDelete =
                                !currentUser ||
                                currentUser.role === 'Super Administrador' ||
                                currentUser.accessProfiles?.includes('Super Administrador') ||
                                currentUser.role === 'Gestor de Eventos' ||
                                currentUser.accessProfiles?.includes('Gestor de Eventos');

                              if (canDelete) {
                                setEventToDelete(ev);
                              } else {
                                onShowToast('Permissão insuficiente: apenas administradores e gestores podem excluir eventos.');
                              }
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Excluir evento</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Botão "Acessar evento" com exatamente a mesma altura e proporção */}
                    <button
                      type="button"
                      id={`btn-access-event-${ev.id}`}
                      onClick={() => onSelectEvent(ev)}
                      className="flex-1 h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold font-heading transition-all cursor-pointer shadow-xs border border-[#3F2553] flex items-center justify-between group active:scale-98"
                      title="Acessar evento"
                    >
                      <span className="truncate font-semibold font-heading text-xs text-[#F7F1E5]">Acessar evento</span>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 transition-transform shadow-2xs">
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Excluir Evento */}
      {eventToDelete && (
        <div
          id="modal-backdrop-delete-event"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEventToDelete(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Excluir evento
                </h3>
                <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/80 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o evento <strong className="text-[#24152F] dark:text-[#F7F1E5]">"{eventToDelete.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
              Esta ação removerá permanentemente o evento e seus dados específicos vinculados (convidados, perguntas e responsáveis deste evento). Os cadastros de clientes e outros eventos não serão afetados.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
              <button
                type="button"
                id="btn-cancel-delete-event"
                onClick={() => setEventToDelete(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#2A1738] hover:bg-[#FAF6EE] dark:hover:bg-[#351C46] text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="btn-confirm-delete-event"
                onClick={() => {
                  if (eventToDelete && onDeleteEvent) {
                    onDeleteEvent(eventToDelete.id);
                  }
                  setEventToDelete(null);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Evento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
