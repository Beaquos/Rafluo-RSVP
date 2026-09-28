import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Calendar,
  MapPin,
  FileText,
  Copy,
  ExternalLink,
  Download,
  Upload,
  ShieldCheck,
  Search,
  Trash2,
  Eye,
  Check,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Globe,
  Edit3,
  FileSpreadsheet,
  Share2,
  ChevronDown,
  Palette,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import { NavSection } from '../../types/navigation';
import { EventData, GuestData, FormQuestionData, ManagerData } from '../../data/mockData';
import { copyToClipboard, getEventRsvpUrl, getGuestRsvpUrl, getClientPanelUrl } from '../../utils/linkUtils';
import { formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import { exportReportToXLSX, exportReportToPDF } from '../../utils/reportExportUtils';
import { ExportDataDropdown } from '../common/ExportDataDropdown';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { WhatsAppModal } from '../modals/WhatsAppModal';

interface DashboardSkeletonProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  event: EventData;
  onEditEvent: () => void;
  questions: FormQuestionData[];
  onAddQuestion: () => void;
  onEditQuestion?: (question: FormQuestionData) => void;
  onDeleteQuestion: (id: string) => void;
  guests: GuestData[];
  onAddGuest: () => void;
  onImportCsv: () => void;
  onOpenWhatsApp: (guest: GuestData) => void;
  onOpenGuestDetails: (guest: GuestData) => void;
  onOpenGuestPreview: (guestCode: string) => void;
  managers: ManagerData[];
  onAddManager: () => void;
  onEditManager?: (manager: ManagerData) => void;
  onDeleteManager?: (managerId: string) => void;
  onExportCsv: () => void;
  onExitToMaster?: () => void;
  onShowToast?: (message: string) => void;
  onCopyEventLink?: () => void;
  hasCopiedLink?: boolean;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  currentSection,
  onNavigate,
  event,
  onEditEvent,
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  guests,
  onAddGuest,
  onImportCsv,
  onOpenWhatsApp,
  onOpenGuestDetails,
  onOpenGuestPreview,
  managers,
  onAddManager,
  onEditManager,
  onDeleteManager,
  onExportCsv,
  onExitToMaster,
  onShowToast,
  onCopyEventLink,
  hasCopiedLink = false,
}) => {
  const [guestSearch, setGuestSearch] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [localEventCopied, setLocalEventCopied] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ManagerData | null>(null);
  const [selectedManagerForWhatsApp, setSelectedManagerForWhatsApp] = useState<ManagerData | null>(null);
  const [openManagerActionId, setOpenManagerActionId] = useState<string | null>(null);
  const managerActionRef = useRef<HTMLDivElement>(null);
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  const [eventPalette, setEventPalette] = useState(() => {
    return (
      event.colors || {
        primary: '#24152F',
        background: '#FAF6EE',
        accent: '#DFFF5F',
        secondary: '#D25B34',
      }
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(e.target as Node)
      ) {
        setIsShareDropdownOpen(false);
      }
      if (
        managerActionRef.current &&
        !managerActionRef.current.contains(e.target as Node)
      ) {
        setOpenManagerActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyEvent = async () => {
    if (onCopyEventLink) {
      onCopyEventLink();
    } else {
      const url = getEventRsvpUrl(event.id, event.slug);
      const ok = await copyToClipboard(url);
      if (ok) {
        setLocalEventCopied(true);
        if (onShowToast) onShowToast(`Link do evento "${event.name}" copiado com sucesso!`);
        setTimeout(() => setLocalEventCopied(false), 2500);
      }
    }
  };

  const handleCopyGuestLink = async (g: GuestData) => {
    const url = getGuestRsvpUrl(g.rsvpCode);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedGuestId(g.id);
      if (onShowToast) onShowToast(`Link exclusivo de "${g.displayName}" copiado!`);
      setTimeout(() => setCopiedGuestId(null), 2500);
    }
  };

  // Calculate real metrics from guests
  // Total Convidados: soma de Confirmados (titulares) + Acompanhantes + Não Comparecem
  const confirmedGuests = guests.filter((g) => g.status === 'confirmed');
  const declinedGuests = guests.filter((g) => g.status === 'declined');
  const totalCompanions = confirmedGuests.reduce((acc, g) => acc + (g.companionCount || 0), 0);
  const totalAttending = confirmedGuests.length + totalCompanions;
  const totalConvidados = confirmedGuests.length + totalCompanions + declinedGuests.length;
  const confirmedRate = totalConvidados > 0 ? Math.round((totalAttending / totalConvidados) * 100) : 0;

  // Filtered guests
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      g.group.toLowerCase().includes(guestSearch.toLowerCase()) ||
      g.rsvpCode.toLowerCase().includes(guestSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (guestStatusFilter === 'all') return true;
    return g.status === guestStatusFilter;
  });

  return (
    <div id="admin-dashboard-skeleton" className="space-y-6 pb-12">
      {/* SECTION: OVERVIEW ONLY (Home data: Banner, KPIs, Quick Actions, Recent Responses) */}
      {currentSection === 'overview' && (
        <div className="space-y-6">
          {/* Event Header Banner with Rafluo Deep Purple & Neon Style */}
          <div className="bg-[#24152F] text-[#F7F1E5] rounded-2xl p-5 sm:p-7 shadow-lg border border-[#3F2553] relative">
            {/* Background ambient blur strictly contained */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[#DFFF5F]/10 blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                    {event.type}
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F7F1E5]/15 text-[#F7F1E5]">
                    Status: {event.status === 'active' ? 'RSVP Aberto' : 'Fechado'}
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F7F1E5]/15 text-[#F7F1E5] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#DFFF5F]" /> Confirmação até: <strong className="font-semibold text-[#F7F1E5]">{formatDateBR(event.rsvpDeadline)}</strong>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F1E5]">
                  {event.name}
                </h2>

                {/* Date, Time and Location */}
                <div className="flex flex-col gap-1.5 text-xs text-[#D2C4DC] pt-0.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                    <span className="font-semibold text-[#F7F1E5]">{formatDateBR(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                    <span className="font-medium text-[#F7F1E5]">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Banner Action: Compartilhar (Item 7) */}
              <div className="relative w-full sm:w-48 flex-shrink-0" ref={shareDropdownRef}>
                <button
                  type="button"
                  id="btn-share-event-banner"
                  onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                  className="w-full justify-center px-4 py-2.5 rounded-xl bg-[#DFFF5F] hover:bg-[#CEF04A] text-[#180D20] text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-[#DFFF5F]"
                  title="Compartilhar link de confirmação do evento"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#180D20]" />
                  <span>Compartilhar</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#180D20]/70" />
                </button>

                {isShareDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-full rounded-xl bg-white text-[#24152F] border border-[#24152F]/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsShareDropdownOpen(false);
                        handleCopyEvent();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-lg hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#24152F]/70" />
                      <span>Copiar Link</span>
                    </button>

                    <a
                      href={getEventRsvpUrl(event.id, event.slug)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsShareDropdownOpen(false)}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-lg hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#24152F]/70" />
                      <span>Abrir Link</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Row (4 Cards) with highlighted icon badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* Total Convidados */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/30 transition-all">
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1">Total Convidados</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#24152F]/10 text-[#24152F] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#24152F]" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">
                  {totalConvidados}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Cadastrados no evento</p>
              </div>
            </div>

            {/* Confirmados */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#DFFF5F]/80 shadow-xs flex flex-col justify-between relative overflow-hidden hover:border-[#DFFF5F] transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#DFFF5F]/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1">Confirmados</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs ring-1 ring-[#DFFF5F]/60 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#180D20]" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">
                    {confirmedGuests.length}
                  </p>
                  <span className="text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20] shadow-2xs">
                    {confirmedRate}%
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#24152F]/70 mt-0.5 font-medium">Titulares confirmados</p>
              </div>
            </div>

            {/* Acompanhantes */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/30 transition-all">
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1">Acompanhantes</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#24152F]/10 text-[#24152F] flex items-center justify-center shadow-xs flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#24152F]" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">
                  +{totalCompanions}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 font-medium mt-0.5">
                  Total presenças: {totalAttending}
                </p>
              </div>
            </div>

            {/* Não Comparecem */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between text-rose-900 text-xs font-bold">
                <span className="truncate pr-1">Não Comparecem</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center shadow-xs flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-900" />
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-900 tracking-tight">
                  {declinedGuests.length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-rose-800/80 mt-0.5 font-medium">Ausência informada</p>
              </div>
            </div>
          </div>

          {/* Dynamic Content Panel for Overview */}
          <div className="bg-white rounded-2xl border border-[#24152F]/10 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#24152F]">Respostas Recentemente</h3>
                <p className="text-xs text-[#24152F]/60 mt-0.5">
                  Acompanhe as últimas confirmações e recusas registradas pelos convidados
                </p>
              </div>
              <button
                id="btn-quick-guests"
                onClick={() => onNavigate('guests')}
                className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#24152F]/20 hover:bg-[#F7F1E5] text-[#24152F] transition-colors cursor-pointer"
              >
                Ver Todos ({guests.length})
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#24152F]/10 bg-white">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[560px]">
                <thead className="bg-[#F7F1E5] border-b border-[#24152F]/10 text-[#24152F]/70 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Convidado</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Acompanhantes</th>
                    <th className="py-2.5 px-3">Data e Hora</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24152F]/5 text-[#24152F]">
                  {guests.slice(0, 5).map((g) => (
                    <tr key={g.id} className="hover:bg-[#F7F1E5]/50 transition-colors">
                      <td className="py-3 px-3 font-medium">
                        <span className="font-semibold text-[#24152F]">{g.name}</span>
                        <span className="block text-[10px] text-[#24152F]/50 font-mono">
                          Código: {g.rsvpCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {g.status === 'confirmed' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DFFF5F] text-[#180D20]">
                            Confirmado
                          </span>
                        ) : g.status === 'declined' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#24152F]/10 text-[#24152F]/70">
                            Recusado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {g.status === 'confirmed' ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs bg-[#FAF6EE] text-[#24152F] border border-[#24152F]/10">
                            {g.companionCount || 0}
                          </span>
                        ) : (
                          <span className="text-[#24152F]/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#24152F]/75 font-medium">
                        {g.respondedAt ? formatDateTimeBR(g.respondedAt) : 'Pendente'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => onOpenGuestDetails(g)}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-[#24152F] text-[#24152F] hover:text-[#F7F1E5] border border-[#24152F]/20 flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Ver Ficha de Resposta"
                            aria-label="Ver Ficha de Resposta"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(g)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            title="WhatsApp"
                            aria-label="WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NON-OVERVIEW MENU SECTIONS */}
      {currentSection !== 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                id="btn-back-to-overview"
                onClick={() => onNavigate('overview')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#24152F]/15 bg-white hover:bg-[#F7F1E5] text-[#24152F] text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-98"
                title="Voltar ao Dashboard do Evento"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Dashboard</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#24152F]/10 p-5 sm:p-6 shadow-xs">
            {/* SECTION: DADOS DO EVENTO (Itens 16 e 17) */}
            {currentSection === 'events' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#24152F]/10">
                  <div>
                    <h3 className="text-base font-bold text-[#24152F]">Dados do Evento</h3>
                  </div>
                  <button
                    id="btn-edit-event-data"
                    onClick={onEditEvent}
                    className="px-3.5 py-2 bg-[#24152F] text-[#F7F1E5] text-xs font-semibold rounded-lg hover:bg-[#180D20] transition-colors shadow-sm border border-[#3F2553] cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#DFFF5F]" />
                    <span>Editar Dados</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl border border-[#24152F]/15 bg-[#FAF6EE] space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#180D20] bg-[#DFFF5F] px-2 py-0.5 rounded">
                        {event.type}
                      </span>
                      <span className="text-xs font-bold text-[#24152F]">
                        {event.status === 'active' ? 'Ativo (Recebendo RSVP)' : event.status === 'draft' ? 'Rascunho' : 'Fechado'}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-[#24152F] mt-1.5">{event.name}</h4>
                    {event.clientName && (
                      <p className="text-xs text-[#5C416E] font-medium mt-0.5">
                        Cliente: <strong>{event.clientName}</strong>
                      </p>
                    )}
                    {event.description && (
                      <p className="text-xs text-[#24152F]/75 mt-2 leading-relaxed max-w-2xl">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#24152F]/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs text-[#24152F]/80">
                    <div>
                      <span className="font-semibold text-[#24152F] block">Data e Horário:</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#24152F]" />
                          <strong className="text-[#24152F]">{formatDateBR(event.date)}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#24152F]" />
                          <span className="font-semibold text-[#24152F]">{event.time}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-[#24152F] block">Prazo de Confirmação:</span>
                      <span>Até {formatDateBR(event.rsvpDeadline)}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="font-semibold text-[#24152F] block">Local e Endereço:</span>
                      <span>{event.location} • {event.address}</span>
                    </div>

                    {event.mapsUrl && (
                      <div>
                        <span className="font-semibold text-[#24152F] block">Google Maps:</span>
                        <a
                          href={event.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#24152F] underline font-medium hover:text-[#5C416E]"
                        >
                          Abrir Localização
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOCO 2 SEPARADO: Regras de Resposta do Evento */}
                <div className="p-5 rounded-2xl border border-[#24152F]/15 bg-[#FAF6EE] dark:bg-[#2A1738]/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
                        <span>Regras de Resposta do Evento</span>
                      </h4>
                      <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/80 mt-0.5">
                        Políticas e restrições aplicadas diretamente às respostas dos convidados no RSVP.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onEditEvent}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-[#24152F]/15 bg-white dark:bg-[#1E1128] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#24152F] cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                      <span>Configurar Regras</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Permitir alteração de resposta */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] block">Permitir alteração de resposta</span>
                        <span className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed block">
                          Quando habilitada, o convidado poderá alterar sua resposta enviada no formulário.
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                          (event.allowResponseEdit ?? true)
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {(event.allowResponseEdit ?? true) ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </div>

                    {/* Impedir duplicidade de respostas */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] block">Impedir duplicidade de respostas</span>
                        <span className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed block">
                          Evita que o mesmo convidado registre múltiplos envios e confirmações para o evento.
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                          (event.preventDuplicateResponses ?? true)
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {(event.preventDuplicateResponses ?? true) ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Permitir acompanhantes */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] block">Permitir acompanhantes</span>
                        <span className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed block">
                          Define se o convidado pode levar acompanhantes de acordo com o limite configurado.
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                          event.allowGuests
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-[#24152F]/10 text-[#24152F]/70 dark:bg-white/10 dark:text-[#D2C4DC]'
                        }`}
                      >
                        {event.allowGuests ? 'Permitido' : 'Não permitido'}
                      </span>
                    </div>

                    {/* Limite de acompanhantes por convite */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] block">Limite por convite</span>
                        <span className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed block">
                          Número máximo de acompanhantes permitidos por convite titular.
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] flex-shrink-0">
                        {event.allowGuests ? `Até ${event.maxGuestsPerInvite || 1} pessoas` : 'Sem acompanhantes'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: FORM BUILDER */}
            {currentSection === 'form-builder' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                  <div>
                    <h3 className="text-base font-bold text-[#24152F]">Formulários</h3>
                  </div>
                  <button
                    id="btn-add-question-tab"
                    onClick={onAddQuestion}
                    className="w-full sm:w-auto justify-center px-3.5 py-2 bg-[#24152F] text-[#F7F1E5] text-xs font-semibold rounded-xl sm:rounded-lg hover:bg-[#180D20] transition-colors shadow-sm flex items-center gap-1.5 border border-[#3F2553]"
                  >
                    + Adicionar Pergunta
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border transition-all ${
                        q.condition
                          ? 'border-[#24152F]/15 bg-white ml-0 sm:ml-5'
                          : 'border-[#24152F]/20 bg-[#FAF6EE]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#24152F] text-[#F7F1E5]">
                              #{idx + 1}
                            </span>

                            {q.condition && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DFFF5F] text-[#180D20]">
                                Condicional
                              </span>
                            )}

                            <span className="text-xs font-bold text-[#24152F]">{q.title}</span>

                            {q.required && (
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Obrigatória
                              </span>
                            )}
                          </div>

                          {q.description && (
                            <p className="text-[11px] text-[#24152F]/60">{q.description}</p>
                          )}

                          {q.condition && (
                            <p className="text-[11px] text-[#24152F] font-medium pt-1">
                              ↳ Regra: Exibir somente quando pergunta anterior atender à condição.
                            </p>
                          )}

                          {q.options && q.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {q.options.map((opt, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-[#24152F]/80"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditQuestion && onEditQuestion(q)}
                            className="p-1.5 rounded-lg text-[#24152F]/70 hover:text-[#24152F] hover:bg-white transition-colors cursor-pointer border border-[#24152F]/10"
                            title="Editar pergunta"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {idx > 0 && (
                            <button
                              onClick={() => onDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg text-[#24152F]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir pergunta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: GUESTS */}
            {currentSection === 'guests' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                  <div>
                    <h3 className="text-base font-bold text-[#24152F]">
                      Convidados ({guests.length})
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <ExportDataDropdown
                      id="btn-export-guest-data"
                      onExportXLSX={() => {
                        try {
                          exportReportToXLSX({
                            reportTitle: `Lista_Convidados_${event.name}`,
                            eventName: event.name,
                            filterLabel: 'Lista Completa do Evento',
                            guests,
                            events: [event],
                          });
                          if (onShowToast) onShowToast('Planilha Excel (XLSX) exportada com sucesso!');
                        } catch (err) {
                          console.error(err);
                          if (onShowToast) onShowToast('Erro ao exportar planilha XLSX.');
                        }
                      }}
                      onExportPDF={() => {
                        try {
                          exportReportToPDF({
                            reportTitle: `Lista de Convidados - ${event.name}`,
                            eventName: event.name,
                            filterLabel: 'Documento Oficial do Evento',
                            guests,
                            events: [event],
                          });
                          if (onShowToast) onShowToast('Documento PDF oficial gerado com sucesso!');
                        } catch (err) {
                          console.error(err);
                          if (onShowToast) onShowToast('Erro ao exportar documento PDF.');
                        }
                      }}
                    />
                    <button
                      id="btn-import-csv"
                      onClick={onImportCsv}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 border border-[#24152F]/20 bg-[#F7F1E5] text-[#24152F] text-xs font-semibold rounded-xl sm:rounded-lg hover:bg-[#EDE4D3] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> <span className="truncate">Importar CSV</span>
                    </button>
                    <button
                      id="btn-add-guest"
                      onClick={onAddGuest}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl sm:rounded-lg cursor-pointer border border-[#3F2553]"
                    >
                      + Cadastrar Convidado
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Buscar por nome, grupo ou código..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#24152F]/20 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                    {(['all', 'confirmed', 'declined'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setGuestStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                          guestStatusFilter === status
                            ? 'bg-[#24152F] text-[#F7F1E5]'
                            : 'bg-white border border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#F7F1E5]'
                        }`}
                      >
                        {status === 'all'
                          ? `Todos (${guests.length})`
                          : status === 'confirmed'
                          ? `Confirmados (${confirmedGuests.length})`
                          : `Não Comparecem (${declinedGuests.length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guests Table */}
                <div className="overflow-x-auto rounded-xl border border-[#24152F]/10 bg-white shadow-xs">
                  <table className="w-full text-left text-xs min-w-[660px] whitespace-nowrap">
                    <thead className="bg-[#F7F1E5] border-b border-[#24152F]/10 text-[#24152F]/70 font-bold">
                      <tr>
                        <th className="py-3 px-3.5">Convidado / Exibição</th>
                        <th className="py-3 px-3">Código RSVP</th>
                        <th className="py-3 px-3">Grupo</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Acompanhantes</th>
                        <th className="py-3 px-3.5 text-right">Ações Rápidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24152F]/5 text-[#24152F]">
                      {filteredGuests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#24152F]/50 text-xs">
                            Nenhum convidado encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        filteredGuests.map((g) => (
                          <tr key={g.id} className="hover:bg-[#F7F1E5]/60 transition-colors">
                            <td className="py-3 px-3.5 font-semibold">
                              {g.name}
                              {g.displayName !== g.name && (
                                <span className="block text-[11px] font-normal text-[#24152F]/60">
                                  "{g.displayName}"
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#24152F]">
                              {g.rsvpCode}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium">
                                {g.group}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {g.status === 'confirmed' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DFFF5F] text-[#180D20]">
                                  Confirmado
                                </span>
                              ) : g.status === 'declined' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#24152F]/10 text-[#24152F]/70">
                                  Recusado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {g.status === 'confirmed' && g.companionCount > 0 ? (
                                <span className="font-bold text-[#24152F]">
                                  +{g.companionCount}
                                </span>
                              ) : (
                                <span className="text-[#24152F]/40">{g.maxGuests}</span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleCopyGuestLink(g)}
                                  title="Copiar link exclusivo do convidado"
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                                    copiedGuestId === g.id
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                      : 'bg-[#F7F1E5] hover:bg-[#EDE4D3] border-[#24152F]/15 text-[#24152F]'
                                  }`}
                                >
                                  {copiedGuestId === g.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onOpenWhatsApp(g)}
                                  title="WhatsApp"
                                  aria-label="WhatsApp"
                                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenGuestDetails(g)}
                                  title="Ver Ficha"
                                  aria-label="Ver Ficha"
                                  className="w-7 h-7 rounded-lg bg-white hover:bg-[#24152F] text-[#24152F] hover:text-[#F7F1E5] border border-[#24152F]/20 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenGuestPreview(g.rsvpCode)}
                                  title="Testar tela deste convidado"
                                  className="w-7 h-7 rounded-lg bg-[#24152F]/10 hover:bg-[#24152F]/20 border border-[#24152F]/15 text-[#24152F] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION: MANAGERS */}
            {currentSection === 'managers' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]">
                  <div>
                    <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">
                      Responsáveis pelo Evento
                    </h3>
                    <p className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 mt-0.5">
                      Gerencie as pessoas autorizadas a acessar o painel exclusivo do evento.
                    </p>
                  </div>
                  <button
                    id="btn-add-manager"
                    onClick={onAddManager}
                    className="w-full sm:w-auto text-center justify-center px-3.5 py-2 bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold rounded-xl sm:rounded-lg transition-colors shadow-sm border border-[#3F2553] cursor-pointer"
                  >
                    + Adicionar Responsável
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {managers.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 p-8 text-center text-xs text-[#24152F]/60 bg-[#FAF6EE] dark:bg-[#1E1128] rounded-xl border border-[#24152F]/10 dark:border-[#3F2553]">
                      Nenhum responsável cadastrado neste evento ainda.
                    </div>
                  ) : (
                    managers.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#24152F] dark:text-[#F7F1E5]">{m.name}</h4>
                            <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/70 mt-0.5">{m.email}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.status === 'active'
                                ? 'bg-[#DFFF5F] text-[#180D20]'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {m.status === 'active' ? 'Acesso Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {/* Informação de Acesso: Disponível até (data) dinâmica */}
                        <div className="p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738]/50 border border-[#24152F]/10 dark:border-[#3F2553] flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
                              Disponível até {formatDateBR(m.accessEnd)}
                            </p>
                            <p className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 italic mt-0.5">
                              O acesso inicia no cadastro e encerra na data definida.
                            </p>
                          </div>
                        </div>

                        {/* Ações de Gestão do Responsável: WhatsApp e Menu Ações */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553]">
                          {/* Botão WhatsApp com o nome 'WhatsApp' */}
                          <button
                            type="button"
                            id={`btn-manager-whatsapp-${m.id}`}
                            onClick={() => setSelectedManagerForWhatsApp(m)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-700 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            title="Enviar mensagem WhatsApp"
                            aria-label="WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Botão Ações com Ícone e Menu Centralizado */}
                          <div className="relative" ref={openManagerActionId === m.id ? managerActionRef : undefined}>
                            <button
                              type="button"
                              id={`btn-manager-actions-${m.id}`}
                              onClick={() => setOpenManagerActionId(openManagerActionId === m.id ? null : m.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#24152F] border border-[#24152F]/15 dark:border-[#3F2553] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] text-[#24152F] dark:text-[#F7F1E5] transition-colors cursor-pointer shadow-2xs active:scale-98 ${
                                openManagerActionId === m.id ? 'ring-2 ring-[#24152F]/20 dark:ring-[#DFFF5F]/30 bg-[#FAF6EE] dark:bg-[#2E1B3C]' : ''
                              }`}
                              title="Opções do responsável"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                              <span>Ações</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${openManagerActionId === m.id ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown com Editar e Remover */}
                            {openManagerActionId === m.id && (
                              <div className="absolute right-0 bottom-full mb-1.5 w-36 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  id={`btn-manager-edit-${m.id}`}
                                  onClick={() => {
                                    setOpenManagerActionId(null);
                                    onEditManager && onEditManager(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  id={`btn-manager-delete-${m.id}`}
                                  onClick={() => {
                                    setOpenManagerActionId(null);
                                    setManagerToDelete(m);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors border-t border-[#24152F]/5 dark:border-[#3F2553]/50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>Remover</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SECTION: ANALYTICS & EXPORT */}
            {currentSection === 'analytics' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                  <div>
                    <h3 className="text-base font-bold text-[#24152F]">Relatórios</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <ExportDataDropdown
                      id="btn-event-export-data"
                      onExportXLSX={() => {
                        try {
                          exportReportToXLSX({
                            reportTitle: `Relatorio_${event.name}`,
                            eventName: event.name,
                            filterLabel: 'Dados Consolidados do Evento',
                            guests,
                            events: [event],
                          });
                          if (onShowToast) onShowToast('Planilha Excel (XLSX) exportada com sucesso!');
                        } catch (err) {
                          console.error(err);
                          if (onShowToast) onShowToast('Erro ao exportar XLSX.');
                        }
                      }}
                      onExportPDF={() => {
                        try {
                          exportReportToPDF({
                            reportTitle: `Relatório de Confirmações - ${event.name}`,
                            eventName: event.name,
                            filterLabel: 'Documento Oficial do Evento',
                            guests,
                            events: [event],
                          });
                          if (onShowToast) onShowToast('Documento PDF oficial gerado com sucesso!');
                        } catch (err) {
                          console.error(err);
                          if (onShowToast) onShowToast('Erro ao exportar PDF.');
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#24152F]/10 bg-white space-y-2">
                    <p className="font-bold text-xs text-[#24152F]">Resumo para Cerimonial / Buffet</p>
                    <ul className="text-xs space-y-1.5 text-[#24152F]/80">
                      <li>• Total de Convidados: <strong>{totalConvidados}</strong></li>
                      <li>• Titulares Confirmados: <strong>{confirmedGuests.length}</strong></li>
                      <li>• Acompanhantes Adicionais: <strong>+{totalCompanions}</strong></li>
                      <li className="text-[#24152F] font-bold">• Total Geral de Presentes: <strong>{totalAttending} pessoas</strong></li>
                      <li>• Não Comparecem (Ausências): <strong>{declinedGuests.length}</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[#24152F]/10 bg-white space-y-2">
                    <p className="font-bold text-xs text-[#24152F]">Exportação de Dados</p>
                    <p className="text-xs text-[#24152F]/70">
                      Disponível em <strong>XLSX (Excel)</strong> para cálculos analíticos ou em <strong>PDF Oficial</strong> com cabeçalho institucional, dados da empresa, resumo executivo e rodapé formal para impressão e cerimonial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: SETTINGS (Itens 3, 4 e 8) */}
            {currentSection === 'settings' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-[#24152F]/10">
                  <h3 className="text-base font-bold text-[#24152F]">
                    Configurações
                  </h3>
                  <p className="text-xs text-[#24152F]/60 mt-0.5">
                    Paleta institucional e identidade visual aplicada neste evento.
                  </p>
                </div>

                {/* Paleta Institucional do Evento (Itens 3 e 4) - Realmente editável */}
                <div className="p-5 sm:p-6 rounded-2xl border border-[#24152F]/10 bg-white space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-[#24152F]">
                        Paleta Institucional do Evento
                      </h4>
                      <p className="text-xs text-[#24152F]/70">
                        Essa paleta será aplicada ao formulário de confirmação de presença e ao painel do responsável pelo evento.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 text-[#24152F] flex items-center justify-center flex-shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Card Preview em tempo real */}
                  <div
                    className="p-5 rounded-2xl border border-[#24152F]/15 space-y-3 transition-colors"
                    style={{ backgroundColor: eventPalette.background }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-bold text-xs sm:text-sm"
                        style={{ color: eventPalette.primary }}
                      >
                        Visual do Convite — {event.name}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: eventPalette.accent,
                          color: eventPalette.primary,
                        }}
                      >
                        Paleta Ativa
                      </span>
                    </div>

                    <p
                      className="text-xs"
                      style={{ color: `${eventPalette.primary}CC` }}
                    >
                      Cores personalizadas que seus convidados verão ao abrir o link do RSVP.
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <div
                        className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
                        style={{
                          backgroundColor: eventPalette.primary,
                          color: eventPalette.background,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: eventPalette.accent }}
                        />
                        Confirmar Presença
                      </div>

                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                        style={{
                          borderColor: `${eventPalette.secondary}60`,
                          color: eventPalette.secondary,
                          backgroundColor: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Secundária
                      </div>
                    </div>
                  </div>

                  {/* 4 Inputs de Edição das Cores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. Primária */}
                    <div className="p-3.5 rounded-xl bg-[#FAF6EE]/50 border border-[#24152F]/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50">
                          Primária
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                          style={{ backgroundColor: eventPalette.primary }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={eventPalette.primary}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, primary: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                          title="Escolher cor"
                        />
                        <input
                          type="text"
                          value={eventPalette.primary}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, primary: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 bg-white text-[#24152F] uppercase"
                        />
                      </div>
                    </div>

                    {/* 2. Fundo */}
                    <div className="p-3.5 rounded-xl bg-[#FAF6EE]/50 border border-[#24152F]/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50">
                          Fundo
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                          style={{ backgroundColor: eventPalette.background }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={eventPalette.background}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, background: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                          title="Escolher cor"
                        />
                        <input
                          type="text"
                          value={eventPalette.background}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, background: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 bg-white text-[#24152F] uppercase"
                        />
                      </div>
                    </div>

                    {/* 3. Destaque */}
                    <div className="p-3.5 rounded-xl bg-[#FAF6EE]/50 border border-[#24152F]/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50">
                          Destaque
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                          style={{ backgroundColor: eventPalette.accent }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={eventPalette.accent}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, accent: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                          title="Escolher cor"
                        />
                        <input
                          type="text"
                          value={eventPalette.accent}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, accent: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 bg-white text-[#24152F] uppercase"
                        />
                      </div>
                    </div>

                    {/* 4. Secundária */}
                    <div className="p-3.5 rounded-xl bg-[#FAF6EE]/50 border border-[#24152F]/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50">
                          Secundária
                        </span>
                        <span
                          className="w-6 h-6 rounded-lg border border-black/10 shadow-xs inline-block"
                          style={{ backgroundColor: eventPalette.secondary }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={eventPalette.secondary}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, secondary: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                          title="Escolher cor"
                        />
                        <input
                          type="text"
                          value={eventPalette.secondary}
                          onChange={(e) =>
                            setEventPalette({ ...eventPalette, secondary: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-[#24152F]/15 bg-white text-[#24152F] uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações da Paleta: Restaurar e Salvar (Item 4: strictly "Salvar") */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#24152F]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setEventPalette({
                          primary: '#24152F',
                          background: '#FAF6EE',
                          accent: '#DFFF5F',
                          secondary: '#D25B34',
                        });
                        if (onShowToast) onShowToast('Paleta restaurada para os padrões oficiais.');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24152F]/15 text-[#24152F]/70 text-xs font-semibold hover:bg-[#FAF6EE] cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Padrão</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        event.colors = eventPalette;
                        if (onShowToast) onShowToast('Paleta do evento salva com sucesso!');
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#24152F] text-[#F7F1E5] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] space-y-1">
                  <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">Rafluo</p>
                  <p className="text-[#24152F]/70 dark:text-[#D2C4DC]/80 text-xs">Gestão inteligente de confirmações.</p>
                  <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC] pt-2 font-medium">
                    Desenvolvido com carinho por{' '}
                    <span className="text-[#24152F] dark:text-[#D2C4DC] font-bold">Beaquos Estúdio Criativo</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Remover Responsável */}
      {managerToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">Remover responsável?</h3>
                <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/70 mt-0.5 font-medium">
                  {managerToDelete.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#24152F]/80 dark:text-[#D2C4DC] leading-relaxed">
              Tem certeza de que deseja remover este responsável? Essa ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setManagerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#24152F] border border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteManager) {
                    onDeleteManager(managerToDelete.id);
                  }
                  setManagerToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal WhatsApp para Responsável - Reutilização do componente oficial */}
      {selectedManagerForWhatsApp && (
        <WhatsAppModal
          isOpen={!!selectedManagerForWhatsApp}
          onClose={() => setSelectedManagerForWhatsApp(null)}
          manager={selectedManagerForWhatsApp}
          event={event}
        />
      )}
    </div>
  );
};
