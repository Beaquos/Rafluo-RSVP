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
  X,
  Plus,
  SlidersHorizontal,
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
  Mail,
  MoreVertical,
  ArrowDownAZ,
  ChevronUp,
  ChevronRight,
  Baby,
  User,
  Sparkles,
  Timer,
  Gift,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { NavSection } from '../../types/navigation';
import { EventData, GuestData, FormQuestionData, ManagerData } from '../../data/mockData';
import { copyToClipboard, getEventRsvpUrl, getGuestRsvpUrl, getClientPanelUrl } from '../../utils/linkUtils';
import { formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import { exportReportToXLSX, exportReportToPDF } from '../../utils/reportExportUtils';
import { getInviteMembers, getInviteGuestCountText, getInviteResponseCounts } from '../../utils/inviteUtils';
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
  onEditGuest?: (guest: GuestData) => void;
  onDeleteGuest?: (guestId: string) => void;
  onSaveEventCustomization?: (event: EventData) => void;
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
  onEditGuest,
  onDeleteGuest,
  onSaveEventCustomization,
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
  const [openInviteActionId, setOpenInviteActionId] = useState<string | null>(null);
  const inviteActionRef = useRef<HTMLDivElement>(null);
  const [expandedInviteIds, setExpandedInviteIds] = useState<string[]>([]);
  const [isSortAZ, setIsSortAZ] = useState<boolean>(false);
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

  // Subtab inside Dados do Evento
  const [eventDataSubTab, setEventDataSubTab] = useState<'info' | 'form'>('info');

  // Filter Modal States (Item 5)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [filterAgeCategory, setFilterAgeCategory] = useState<'ambos' | 'adulto' | 'crianca'>('ambos');
  const [filterSelectedGroups, setFilterSelectedGroups] = useState<string[]>([]);

  // Draft filters inside the modal
  const [draftFilterStatus, setDraftFilterStatus] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [draftFilterAgeCategory, setDraftFilterAgeCategory] = useState<'ambos' | 'adulto' | 'crianca'>('ambos');
  const [draftFilterSelectedGroups, setDraftFilterSelectedGroups] = useState<string[]>([]);

  // State for Página de Confirmação (Itens 6 a 9: Cards opcionais)
  const [inviteCustomization, setInviteCustomization] = useState({
    coverImage: event.coverImage || '',
    welcomeMessage: event.welcomeMessage || '',
    showCoverImage: event.showCoverImage === true,
    showWelcomeMessage: event.showWelcomeMessage ?? true,
    showCountdown: event.showCountdown ?? true,
    showGiftList: event.showGiftList ?? true,
    giftListType: (event.giftListType === 'none' ? 'items' : event.giftListType || 'items') as 'link' | 'items',
    giftListUrl: event.giftListUrl || '',
    giftListItems: event.giftListItems || '',
    giftListItemsList: event.giftListItemsList && event.giftListItemsList.length > 0
      ? [...event.giftListItemsList]
      : (event.giftListItems ? event.giftListItems.split('\n').filter((s) => s.trim().length > 0) : ['Jogo de Pratos de Porcelana', 'Fritadeira Elétrica Airfryer', 'Aparelho de Jantar 30 Peças']),
    childAgeLimit: event.childAgeLimit || 10,
  });

  useEffect(() => {
    setInviteCustomization({
      coverImage: event.coverImage || '',
      welcomeMessage: event.welcomeMessage || '',
      showCoverImage: event.showCoverImage === true,
      showWelcomeMessage: event.showWelcomeMessage ?? true,
      showCountdown: event.showCountdown ?? true,
      showGiftList: event.showGiftList ?? true,
      giftListType: (event.giftListType === 'none' ? 'items' : event.giftListType || 'items') as 'link' | 'items',
      giftListUrl: event.giftListUrl || '',
      giftListItems: event.giftListItems || '',
      giftListItemsList: event.giftListItemsList && event.giftListItemsList.length > 0
        ? [...event.giftListItemsList]
        : (event.giftListItems ? event.giftListItems.split('\n').filter((s) => s.trim().length > 0) : ['Jogo de Pratos de Porcelana', 'Fritadeira Elétrica Airfryer', 'Aparelho de Jantar 30 Peças']),
      childAgeLimit: event.childAgeLimit || 10,
    });
  }, [event]);

  const handleUpdateCustomization = (partial: Partial<typeof inviteCustomization>) => {
    const next = { ...inviteCustomization, ...partial };
    setInviteCustomization(next);
    const updated: EventData = {
      ...event,
      coverImage: next.coverImage,
      welcomeMessage: next.welcomeMessage,
      showCoverImage: next.showCoverImage,
      showWelcomeMessage: next.showWelcomeMessage,
      showCountdown: next.showCountdown,
      showGiftList: next.showGiftList,
      giftListType: next.showGiftList ? next.giftListType : 'none',
      giftListUrl: next.giftListUrl,
      giftListItems: next.giftListItemsList.join('\n'),
      giftListItemsList: next.giftListItemsList,
      childAgeLimit: next.childAgeLimit,
    };
    Object.assign(event, updated);
    if (onSaveEventCustomization) {
      onSaveEventCustomization(updated);
    }
  };

  const [newGiftItemText, setNewGiftItemText] = useState('');

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
      if (
        inviteActionRef.current &&
        !inviteActionRef.current.contains(e.target as Node)
      ) {
        setOpenInviteActionId(null);
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

  const toggleInviteExpand = (id: string) => {
    setExpandedInviteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Available groups for filter chips
  const availableGroups = React.useMemo(() => {
    const list = ['Amigos', 'Família'];
    guests.forEach((g) => {
      if (g.group && !list.includes(g.group)) {
        list.push(g.group);
      }
    });
    return list;
  }, [guests]);

  // Active filters count for filter button badge
  const activeFiltersCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterAgeCategory !== 'ambos' ? 1 : 0) +
    (filterSelectedGroups.length > 0 ? 1 : 0);
  const hasActiveFilters = activeFiltersCount > 0;

  // Filtered and sorted guests (lista de convidados)
  const filteredGuests = guests.filter((g) => {
    const personName = (g.name || '').toLowerCase();
    const group = (g.group || '').toLowerCase();
    const code = (g.rsvpCode || '').toLowerCase();
    const query = guestSearch.toLowerCase();
    const matchesSearch =
      personName.includes(query) ||
      group.includes(query) ||
      code.includes(query);

    if (!matchesSearch) return false;

    // Filter by status (Confirmado / Ausente)
    if (filterStatus === 'confirmed') {
      if (g.status !== 'confirmed') return false;
    } else if (filterStatus === 'declined') {
      if (g.status !== 'declined') return false;
    }

    // Filter by age category (Adulto / Criança)
    if (filterAgeCategory !== 'ambos') {
      const mems = getInviteMembers(g);
      if (filterAgeCategory === 'adulto' && !mems.some((m) => m.category === 'Adulto')) {
        return false;
      }
      if (filterAgeCategory === 'crianca' && !mems.some((m) => m.category === 'Criança')) {
        return false;
      }
    }

    // Filter by group (multiple selection chips)
    if (filterSelectedGroups.length > 0) {
      if (!filterSelectedGroups.includes(g.group)) {
        return false;
      }
    }

    return true;
  });

  const sortedGuests = [...filteredGuests].sort((a, b) => {
    if (!isSortAZ) return 0;
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
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
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1" title="Total Convidados">Total Convidados</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#DFFF5F]" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">
                  {totalConvidados}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 mt-0.5 font-medium">Cadastrados no evento</p>
              </div>
            </div>

            {/* Confirmados */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1">Confirmados</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#180D20]" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
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
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#24152F]/15 shadow-xs flex flex-col justify-between hover:border-[#24152F]/40 transition-all">
              <div className="flex items-center justify-between text-[#24152F] text-xs font-bold">
                <span className="truncate pr-1">Acompanhantes</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#DFFF5F]" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#24152F] tracking-tight">
                  +{totalCompanions}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#24152F]/60 font-medium mt-0.5">
                  Total presenças: {totalAttending}
                </p>
              </div>
            </div>

            {/* Ausentes */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between text-rose-900 text-xs font-bold">
                <span className="truncate pr-1">Ausentes</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 text-rose-900 flex items-center justify-center shadow-xs flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-900" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
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
                <h3 className="text-base sm:text-lg font-bold text-[#24152F]">Respostas Recentes</h3>
                <p className="text-xs text-[#24152F]/60 mt-0.5">
                  Acompanhe as últimas confirmações e ausências registradas pelos convidados
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

            <div className="overflow-hidden md:overflow-x-auto rounded-xl border border-[#24152F]/10 bg-white">
              <table className="w-full text-left text-xs md:whitespace-nowrap md:min-w-[560px]">
                <thead className="bg-[#F7F1E5] border-b border-[#24152F]/10 text-[#24152F]/80 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-full md:w-auto">Nome Convidado</th>
                    <th className="py-3 px-3 hidden md:table-cell">Tag (Grupo)</th>
                    <th className="py-3 px-3 hidden md:table-cell">Status</th>
                    <th className="py-3 px-3 hidden md:table-cell">Nº convidados</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24152F]/5 text-[#24152F]">
                  {guests.slice(0, 5).map((g) => {
                    const members = getInviteMembers(g);
                    const guestCountText = getInviteGuestCountText(members);
                    const isExpanded = expandedInviteIds.includes(g.id);

                    return (
                      <React.Fragment key={g.id}>
                        <tr
                          className={`transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-[#FAF6EE]/50' : 'hover:bg-[#FAF6EE]/30'
                          }`}
                          onClick={() => toggleInviteExpand(g.id)}
                        >
                          <td className="py-4 px-4 font-bold align-top w-full md:w-auto">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar circular com contorno cinza e ícone de envelope */}
                              <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F] flex-shrink-0 shadow-2xs">
                                <Mail className="w-4 h-4 text-[#24152F]" />
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-[#24152F] text-xs sm:text-sm">
                                  {g.displayName || g.name}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleInviteExpand(g.id);
                                  }}
                                  className="p-1 rounded-md text-[#24152F]/50 hover:text-[#24152F] hover:bg-black/5 transition-colors cursor-pointer"
                                  title={isExpanded ? 'Recolher convite' : 'Expandir convidados'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-[#24152F]" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-[#24152F]" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Linha Expandida empilhada abaixo do nome do convite (indentada) */}
                            {isExpanded && (
                              <div className="mt-3.5 pl-10 space-y-2.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1.5 flex flex-col items-start">
                                  {members.map((mem) => {
                                    const isConfirmed = mem.status === 'confirmed';
                                    const isDeclined = mem.status === 'declined';
                                    const hasResponse = isConfirmed || isDeclined;

                                    return (
                                      <div
                                        key={mem.id}
                                        className="w-fit max-w-full inline-flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-white border border-[#24152F]/10 shadow-2xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Avatar circular com ícone de pessoa */}
                                          <div className="relative flex-shrink-0">
                                            <div className="w-6 h-6 rounded-full bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F]">
                                              {mem.category === 'Criança' ? (
                                                <Baby className="w-3.5 h-3.5 text-[#24152F]" />
                                              ) : (
                                                <User className="w-3.5 h-3.5 text-[#24152F]" />
                                              )}
                                            </div>

                                            {/* Badge de status no canto SOMENTE se houver resposta */}
                                            {hasResponse && (
                                              <span
                                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border border-white ${
                                                  isConfirmed
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-rose-600 text-white'
                                                }`}
                                                title={isConfirmed ? 'Confirmado' : 'Ausente'}
                                              >
                                                {isConfirmed ? '✔' : '✖'}
                                              </span>
                                            )}
                                          </div>

                                          {/* Nome em negrito */}
                                          <span className="font-bold text-xs text-[#24152F] truncate">
                                            {mem.name}
                                          </span>
                                        </div>

                                        {/* Pill com contorno indicando Adulto ou Criança ajustado junto ao nome */}
                                        <div className="flex-shrink-0">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                              mem.category === 'Criança'
                                                ? 'border-amber-500/60 text-amber-900 bg-amber-50/50'
                                                : 'border-[#24152F]/25 text-[#24152F] bg-white'
                                            }`}
                                          >
                                            {mem.category}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 align-middle hidden md:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E]">
                              {g.group || 'Geral'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 align-middle hidden md:table-cell">
                            {g.status === 'confirmed' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E]">
                                Confirmado
                              </span>
                            ) : g.status === 'declined' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-300 text-rose-800">
                                Ausente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 border border-gray-300 text-[#24152F]/60">
                                Sem resposta
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 align-middle text-[#24152F]/80 font-medium hidden md:table-cell">
                            {guestCountText}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-right hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onOpenGuestDetails(g)}
                              className="px-3 py-1.5 rounded-xl border border-[#24152F]/20 hover:bg-[#24152F] hover:text-[#F7F1E5] text-[#24152F] font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Visualizar ficha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
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
            {/* SECTION: DADOS DO EVENTO (com abas Dados Gerais e Formulário) */}
            {(currentSection === 'events' || currentSection === 'form-builder') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => setEventDataSubTab('info')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                        eventDataSubTab === 'info' && currentSection !== 'form-builder'
                          ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-2xs'
                          : 'text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C]'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Dados Gerais</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventDataSubTab('form')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                        eventDataSubTab === 'form' || currentSection === 'form-builder'
                          ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-2xs'
                          : 'text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C]'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Formulário</span>
                    </button>
                  </div>

                  {(eventDataSubTab === 'info' && currentSection !== 'form-builder') ? (
                    <button
                      id="btn-edit-event-data"
                      type="button"
                      onClick={onEditEvent}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer border border-[#3F2553]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                      <span>Editar Dados</span>
                    </button>
                  ) : (
                    <button
                      id="btn-add-question-tab"
                      type="button"
                      onClick={onAddQuestion}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer border border-[#3F2553]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                      <span>Adicionar Pergunta</span>
                    </button>
                  )}
                </div>

                {/* Subaba 1: Informações Gerais do Evento */}
                {(eventDataSubTab === 'info' && currentSection !== 'form-builder') && (
                  <div className="space-y-4">

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

              {/* Subaba 2: Gerenciamento do Formulário (Item 11 do User Request) */}
              {(eventDataSubTab === 'form' || currentSection === 'form-builder') && (
                <div className="space-y-3">
                  <p className="text-xs text-[#24152F]/65 pb-1">
                    Adicione e remova campos personalizados para o RSVP deste evento. Todos os campos adicionais são opcionais e configuráveis.
                  </p>

                  {questions.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-[#24152F]/20 text-center space-y-2 bg-[#FAF6EE]/50">
                      <FileText className="w-8 h-8 text-[#24152F]/30 mx-auto" />
                      <p className="text-xs text-[#24152F]/70 font-medium">
                        Nenhum campo personalizado adicionado a este evento.
                      </p>
                    </div>
                  ) : (
                    questions.map((q, idx) => (
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
                                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-[#24152F]/80 font-medium"
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
                            <button
                              type="button"
                              onClick={() => onDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg text-[#24152F]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Excluir pergunta personalizada"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

            {/* SECTION: GUESTS (Itens 7 a 14: Nova estrutura de Convites agrupados) */}
            {currentSection === 'guests' && (
              <div className="space-y-4">
                {/* Cabeçalho da Lista de Convidados (Item 3 e 4) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-[#24152F]/10">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-[#24152F]">
                      Lista de Convidados
                    </h3>
                  </div>

                  {/* Ações da Lista de Convidados (Item 4: Exportar, Importar CSV e Cadastrar) */}
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <ExportDataDropdown
                      id="btn-export-guest-data"
                      onExportXLSX={() => {
                        try {
                          exportReportToXLSX({
                            reportTitle: `Lista_Convidados_${event.name}`,
                            eventName: event.name,
                            filterLabel: 'Lista de Convidados',
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
                      type="button"
                      onClick={onImportCsv}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#24152F]/20 bg-[#F7F1E5] text-[#24152F] text-xs font-semibold rounded-xl hover:bg-[#EDE4D3] cursor-pointer transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" /> <span>Importar CSV</span>
                    </button>
                    <button
                      id="btn-add-guest"
                      type="button"
                      onClick={onAddGuest}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer border border-[#3F2553]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                      <span>Cadastrar Convidado</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Ferramentas com Busca e Botão de Filtro (Item 5) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF6EE]/60 border border-[#24152F]/10">
                  <div className="flex items-center gap-2.5 flex-1 max-w-lg">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        placeholder="Buscar convite..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#24152F]/20 bg-white text-xs text-[#24152F] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                      />
                    </div>

                    {/* Botão de Filtro com apenas o ícone de Sliders, destacado e proporcional */}
                    <button
                      type="button"
                      id="btn-open-filter-modal"
                      onClick={() => {
                        setDraftFilterStatus(filterStatus);
                        setDraftFilterAgeCategory(filterAgeCategory);
                        setDraftFilterSelectedGroups([...filterSelectedGroups]);
                        setIsFilterModalOpen(true);
                      }}
                      className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
                        hasActiveFilters
                          ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                          : 'bg-white border-[#24152F]/20 text-[#24152F] hover:bg-[#FAF6EE]'
                      }`}
                      title="Filtrar convidados"
                    >
                      <SlidersHorizontal className={`w-4 h-4 ${hasActiveFilters ? 'text-[#DFFF5F]' : 'text-[#24152F]'}`} />
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] text-[#180D20] text-[10px] font-black flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Resumo de convidados exibidos */}
                  <div className="text-xs text-[#24152F]/65 font-medium flex items-center gap-2 justify-end">
                    <span>Exibindo <strong>{sortedGuests.length}</strong> de {guests.length}</span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterAgeCategory('ambos');
                          setFilterSelectedGroups([]);
                        }}
                        className="text-[11px] text-rose-700 underline font-semibold hover:text-rose-800 cursor-pointer ml-1"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>

                {/* 10. Tabela de Convites & 11. Expansão do Convite */}
                <div className="overflow-hidden md:overflow-x-auto rounded-2xl border border-[#24152F]/10 bg-white shadow-xs">
                  <table className="w-full text-left text-xs md:min-w-[700px]">
                    {/* Cabeçalho sem fundo colorido, apenas texto em negrito (Item 3) */}
                    <thead className="border-b border-[#24152F]/10 text-[#24152F] font-bold text-xs bg-white">
                      <tr>
                        <th className="py-3 px-4 w-full md:w-auto">Nome Convidado</th>
                        <th className="py-3 px-3 hidden md:table-cell">Tag (Grupo)</th>
                        <th className="py-3 px-3 hidden md:table-cell">Status</th>
                        <th className="py-3 px-3 hidden md:table-cell">Nº convidados</th>
                        <th className="py-3 px-3 hidden md:table-cell">Observações</th>
                        <th className="py-3 px-4 text-right hidden md:table-cell">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24152F]/5 text-[#24152F]">
                      {sortedGuests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#24152F]/50 text-xs">
                            Nenhum convite encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        sortedGuests.map((g) => {
                          const members = getInviteMembers(g);
                          const guestCountText = getInviteGuestCountText(members);
                          const isExpanded = expandedInviteIds.includes(g.id);
                          const isActionOpen = openInviteActionId === g.id;
                          // Exibir sempre o nome da pessoa que confirmou presença, e não o nome do convite (Item 3)
                          const personName = g.displayName || g.name;

                          return (
                            <React.Fragment key={g.id}>
                              {/* Linha Principal do Convite */}
                              <tr
                                className={`transition-colors cursor-pointer select-none ${
                                  isExpanded ? 'bg-[#FAF6EE]/50' : 'hover:bg-[#FAF6EE]/30'
                                }`}
                                onClick={() => toggleInviteExpand(g.id)}
                              >
                                {/* Nome Convidado com Avatar envelope e Chevron (Alinhado ao TOPO quando expandido) */}
                                <td className="py-4 px-4 font-bold align-top w-full md:w-auto">
                                  <div className="flex items-center gap-2.5">
                                    {/* Avatar circular com contorno cinza e ícone de envelope */}
                                    <div className="w-8 h-8 rounded-full bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F] flex-shrink-0 shadow-2xs">
                                      <Mail className="w-4 h-4 text-[#24152F]" />
                                    </div>

                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-bold text-[#24152F] text-xs sm:text-sm">
                                        {personName}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleInviteExpand(g.id);
                                        }}
                                        className="p-1 rounded-md text-[#24152F]/50 hover:text-[#24152F] hover:bg-black/5 transition-colors cursor-pointer"
                                        title={isExpanded ? 'Recolher convite' : 'Expandir convidados'}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="w-4 h-4 text-[#24152F]" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-[#24152F]" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* 11. Linha Expandida empilhada abaixo do nome do convite (indentada) */}
                                  {isExpanded && (
                                    <div className="mt-3.5 pl-10 space-y-2.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                                      {/* Convidados vinculados indentados */}
                                      <div className="space-y-1.5 flex flex-col items-start">
                                        {members.map((mem) => {
                                          const isConfirmed = mem.status === 'confirmed';
                                          const isDeclined = mem.status === 'declined';
                                          const hasResponse = isConfirmed || isDeclined;

                                          return (
                                            <div
                                              key={mem.id}
                                              className="w-fit max-w-full inline-flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-white border border-[#24152F]/10 shadow-2xs"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                {/* Avatar circular com ícone de pessoa */}
                                                <div className="relative flex-shrink-0">
                                                  <div className="w-6 h-6 rounded-full bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F]">
                                                    {mem.category === 'Criança' ? (
                                                      <Baby className="w-3.5 h-3.5 text-[#24152F]" />
                                                    ) : (
                                                      <User className="w-3.5 h-3.5 text-[#24152F]" />
                                                    )}
                                                  </div>

                                                  {/* Badge de status no canto SOMENTE se houver resposta */}
                                                  {hasResponse && (
                                                    <span
                                                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border border-white ${
                                                        isConfirmed
                                                          ? 'bg-emerald-600 text-white'
                                                          : 'bg-rose-600 text-white'
                                                      }`}
                                                      title={isConfirmed ? 'Confirmado' : 'Ausente'}
                                                    >
                                                      {isConfirmed ? '✔' : '✖'}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Nome em negrito */}
                                                <span className="font-bold text-xs text-[#24152F] truncate">
                                                  {mem.name}
                                                </span>
                                              </div>

                                              {/* Pill com contorno indicando Adulto ou Criança ajustado junto ao nome */}
                                              <div className="flex-shrink-0">
                                                <span
                                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    mem.category === 'Criança'
                                                      ? 'border-amber-500/60 text-amber-900 bg-amber-50/50'
                                                      : 'border-[#24152F]/25 text-[#24152F] bg-white'
                                                  }`}
                                                >
                                                  {mem.category}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Grupo: centralizado verticalmente */}
                                <td className="py-4 px-3 align-middle hidden md:table-cell">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E]">
                                    {g.group || 'Geral'}
                                  </span>
                                </td>

                                {/* Status: texto direto Confirmado ou Ausente (Item 3) */}
                                <td className="py-4 px-3 align-middle whitespace-nowrap hidden md:table-cell">
                                  {g.status === 'confirmed' ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E]">
                                      Confirmado
                                    </span>
                                  ) : g.status === 'declined' ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-300 text-rose-800">
                                      Ausente
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 border border-gray-300 text-[#24152F]/60">
                                      Sem resposta
                                    </span>
                                  )}
                                </td>

                                {/* Nº convidados: centralizado verticalmente */}
                                <td className="py-4 px-3 align-middle text-[#24152F]/80 font-medium whitespace-nowrap hidden md:table-cell">
                                  {guestCountText}
                                </td>

                                {/* Observações: centralizada verticalmente */}
                                <td className="py-4 px-3 align-middle text-[#24152F]/70 text-[11px] max-w-[180px] truncate hidden md:table-cell">
                                  {g.notes ? g.notes : <span className="text-[#24152F]/30">—</span>}
                                </td>

                                {/* Menu de Três Pontinhos (Item 3: com Visualizar Ficha e sem Copiar Link) */}
                                <td className="py-4 px-4 align-middle text-right hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                                  <div className="relative inline-block text-left" ref={isActionOpen ? inviteActionRef : undefined}>
                                    <button
                                      type="button"
                                      id={`btn-invite-menu-${g.id}`}
                                      onClick={() => setOpenInviteActionId(isActionOpen ? null : g.id)}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#24152F]/60 hover:text-[#24152F] hover:bg-[#FAF6EE] transition-colors cursor-pointer border border-transparent hover:border-[#24152F]/15"
                                      title="Opções do convite"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {isActionOpen && (
                                      <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl bg-white border border-[#24152F]/15 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                                        {/* 1. Visualizar ficha (Item 3: Adicionado) */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenInviteActionId(null);
                                            onOpenGuestDetails(g);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#24152F] hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-[#24152F]/70" />
                                          <span>Visualizar ficha</span>
                                        </button>

                                        {/* 2. Copiar código RSVP */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenInviteActionId(null);
                                            copyToClipboard(g.rsvpCode);
                                            if (onShowToast) onShowToast(`Código RSVP ${g.rsvpCode} copiado!`);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#24152F] hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors"
                                        >
                                          <Copy className="w-3.5 h-3.5 text-[#24152F]/70" />
                                          <span>Copiar código RSVP</span>
                                        </button>

                                        {/* 3. Enviar link por WhatsApp */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenInviteActionId(null);
                                            onOpenWhatsApp(g);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                                        >
                                          <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Enviar por WhatsApp</span>
                                        </button>

                                        {/* 4. Abrir página de confirmação */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenInviteActionId(null);
                                            onOpenGuestPreview(g.rsvpCode);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#24152F] hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5 text-[#24152F]/70" />
                                          <span>Abrir página de confirmação</span>
                                        </button>

                                        {/* 5. Editar convite */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenInviteActionId(null);
                                            onEditGuest && onEditGuest(g);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#24152F] hover:bg-[#FAF6EE] flex items-center gap-2.5 cursor-pointer transition-colors border-t border-[#24152F]/5"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-[#24152F]/70" />
                                          <span>Editar convite</span>
                                        </button>

                                        {/* 6. Excluir convite */}
                                        {onDeleteGuest && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenInviteActionId(null);
                                              onDeleteGuest(g.id);
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-[#24152F]/5"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                            <span>Excluir convite</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION: GUEST LINK (Página de Confirmação - Itens 6 a 9: Cards opcionais com toggle) */}
            {currentSection === 'guest-link' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#24152F]">
                      Página de Confirmação
                    </h3>
                    <p className="text-xs text-[#24152F]/65 mt-0.5">
                      Personalize os cards opcionais da página de confirmação de presença (RSVP) que seus convidados acessarão.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenGuestPreview(guests[0]?.rsvpCode || 'DEMO')}
                      className="px-3.5 py-2 rounded-xl bg-[#24152F] text-[#F7F1E5] text-xs font-semibold hover:bg-[#180D20] transition-colors cursor-pointer border border-[#3F2553] flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#DFFF5F]" />
                      <span>Testar Tela</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Form: Customization Controls */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* 1. Imagem de Destaque / Banner (Opcional com Toggle) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-bold text-xs sm:text-sm text-[#24152F] flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#24152F]" />
                          <span>Imagem de Destaque / Banner</span>
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={inviteCustomization.showCoverImage}
                            onChange={(e) => handleUpdateCustomization({ showCoverImage: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#24152F]"></div>
                        </label>
                      </div>
                      <p className="text-xs text-[#24152F]/70">
                        Adicione uma foto do casal, aniversariante ou identidade visual do evento no topo do convite.
                      </p>

                      {inviteCustomization.showCoverImage && (
                        <div className="space-y-2.5 pt-1">
                          <input
                            type="url"
                            value={inviteCustomization.coverImage}
                            onChange={(e) => handleUpdateCustomization({ coverImage: e.target.value })}
                            placeholder="https://exemplo.com/foto-do-evento.jpg"
                            className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                          />

                          {/* Quick preset banners */}
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-[#24152F]/60 font-semibold">Exemplos rápidos:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomization({ coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' })}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] text-[10px] font-semibold border border-[#24152F]/10 hover:bg-[#EDE4D3] cursor-pointer"
                            >
                              Casamento Floral
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomization({ coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' })}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] text-[10px] font-semibold border border-[#24152F]/10 hover:bg-[#EDE4D3] cursor-pointer"
                            >
                              Casamento Clássico
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomization({ coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80' })}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6EE] text-[10px] font-semibold border border-[#24152F]/10 hover:bg-[#EDE4D3] cursor-pointer"
                            >
                              Festa / Balões
                            </button>
                            {inviteCustomization.coverImage && (
                              <button
                                type="button"
                                onClick={() => handleUpdateCustomization({ coverImage: '' })}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-200 hover:bg-rose-100 cursor-pointer ml-auto"
                              >
                                Remover Imagem
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Mensagem Inicial de Abertura (Opcional com Toggle) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-bold text-xs sm:text-sm text-[#24152F] flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#24152F]" />
                          <span>Mensagem Inicial de Abertura</span>
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={inviteCustomization.showWelcomeMessage}
                            onChange={(e) => handleUpdateCustomization({ showWelcomeMessage: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#24152F]"></div>
                        </label>
                      </div>
                      <p className="text-xs text-[#24152F]/70">
                        Texto carinhoso de abertura que os convidados lerão com destaque antes de responder o RSVP.
                      </p>

                      {inviteCustomization.showWelcomeMessage && (
                        <div className="pt-1">
                          <textarea
                            rows={3}
                            value={inviteCustomization.welcomeMessage}
                            onChange={(e) => handleUpdateCustomization({ welcomeMessage: e.target.value })}
                            placeholder="Ex: É com muita alegria que convidamos você para celebrar conosco este momento tão importante e inesquecível!"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. Contagem regressiva (Item 8: Nomenclatura atualizada + Toggle Switch) */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <label className="font-bold text-xs sm:text-sm text-[#24152F] flex items-center gap-2">
                            <Timer className="w-4 h-4 text-[#24152F]" />
                            <span>Contagem regressiva</span>
                          </label>
                          <p className="text-xs text-[#24152F]/70">
                            Exibe um cronômetro regressivo com dias, horas e minutos até {formatDateBR(event.date)} às {event.time}.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            id="toggle-countdown-link"
                            type="checkbox"
                            checked={inviteCustomization.showCountdown}
                            onChange={(e) => handleUpdateCustomization({ showCountdown: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#24152F]"></div>
                        </label>
                      </div>
                      {inviteCustomization.showCountdown && (
                        <div className="p-2.5 rounded-xl bg-[#FAF6EE] text-[11px] text-[#24152F]/70 border border-[#24152F]/10">
                          Utiliza automaticamente a data <strong>{formatDateBR(event.date)}</strong> e horário <strong>{event.time}</strong> do evento, sem duplicação de informações.
                        </div>
                      )}
                    </div>

                    {/* 4. Lista de Presentes (Item 9: Toggle Switch + Itens individuais sem "Sem lista") */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-bold text-xs sm:text-sm text-[#24152F] flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#24152F]" />
                          <span>Lista de Presentes</span>
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={inviteCustomization.showGiftList}
                            onChange={(e) => handleUpdateCustomization({ showGiftList: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#24152F]"></div>
                        </label>
                      </div>
                      <p className="text-xs text-[#24152F]/70">
                        Permita que os convidados acessem um link externo ou veja os itens desejados cadastrados.
                      </p>

                      {inviteCustomization.showGiftList && (
                        <div className="space-y-3 pt-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomization({ giftListType: 'items' })}
                              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                                inviteCustomization.giftListType === 'items'
                                  ? 'bg-[#24152F] text-[#F7F1E5]'
                                  : 'bg-white border border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                              }`}
                            >
                              Itens Desejados
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCustomization({ giftListType: 'link' })}
                              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                                inviteCustomization.giftListType === 'link'
                                  ? 'bg-[#24152F] text-[#F7F1E5]'
                                  : 'bg-white border border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                              }`}
                            >
                              Link Externo
                            </button>
                          </div>

                          {inviteCustomization.giftListType === 'link' && (
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-[#24152F]">Link da Lista Externa:</label>
                              <input
                                type="url"
                                value={inviteCustomization.giftListUrl}
                                onChange={(e) => handleUpdateCustomization({ giftListUrl: e.target.value })}
                                placeholder="https://listadepresentes.com/meu-evento"
                                className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                              />
                            </div>
                          )}

                          {inviteCustomization.giftListType === 'items' && (
                            <div className="space-y-2.5">
                              <label className="block text-xs font-semibold text-[#24152F]">
                                Itens Desejados Cadastrados ({inviteCustomization.giftListItemsList.length}):
                              </label>

                              {/* List of individual items with gift icon & highlighted background */}
                              <div className="space-y-2">
                                {inviteCustomization.giftListItemsList.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF6EE] border border-[#24152F]/15 shadow-2xs"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-[#24152F] flex items-center justify-center text-[#DFFF5F] flex-shrink-0">
                                      <Gift className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => {
                                        const updated = [...inviteCustomization.giftListItemsList];
                                        updated[idx] = e.target.value;
                                        handleUpdateCustomization({ giftListItemsList: updated });
                                      }}
                                      className="flex-1 bg-transparent text-xs font-semibold text-[#24152F] focus:outline-none"
                                      placeholder="Nome do item desejado"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = inviteCustomization.giftListItemsList.filter((_, i) => i !== idx);
                                        handleUpdateCustomization({ giftListItemsList: updated });
                                      }}
                                      className="p-1 rounded-lg text-[#24152F]/40 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Remover item da lista"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Add new item */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newGiftItemText}
                                  onChange={(e) => setNewGiftItemText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newGiftItemText.trim()) {
                                        handleUpdateCustomization({
                                          giftListItemsList: [...inviteCustomization.giftListItemsList, newGiftItemText.trim()],
                                        });
                                        setNewGiftItemText('');
                                      }
                                    }
                                  }}
                                  placeholder="Digite um novo presente para adicionar..."
                                  className="flex-1 px-3 py-2 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newGiftItemText.trim()) {
                                      handleUpdateCustomization({
                                        giftListItemsList: [...inviteCustomization.giftListItemsList, newGiftItemText.trim()],
                                      });
                                      setNewGiftItemText('');
                                    }
                                  }}
                                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer border border-[#3F2553] flex-shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                                  <span>Adicionar Item</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Mobile Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#24152F]/70">
                        Prévia em Tempo Real
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                        Visual Rafluo
                      </span>
                    </div>

                    {/* Smartphone-like preview container */}
                    <div className="rounded-3xl border border-[#24152F]/15 bg-[#FAF6EE] p-4 shadow-sm space-y-4">
                      {inviteCustomization.showCoverImage && inviteCustomization.coverImage ? (
                        <div className="w-full h-36 rounded-2xl overflow-hidden border border-[#24152F]/15 relative bg-black/5">
                          <img
                            src={inviteCustomization.coverImage}
                            alt="Banner"
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        </div>
                      ) : null}

                      {/* Event Banner */}
                      <div className="p-4 rounded-2xl bg-[#24152F] text-[#F7F1E5] text-center space-y-2 relative overflow-hidden shadow-xs">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DFFF5F]/20 text-[#DFFF5F] text-[10px] font-bold uppercase">
                          <Sparkles className="w-3 h-3" /> Convite Oficial
                        </div>
                        <h4 className="font-bold text-sm text-[#F7F1E5]" style={{ color: '#F7F1E5' }}>{event.name}</h4>
                        <div className="text-[11px] text-[#F7F1E5] flex items-center justify-center gap-2" style={{ color: '#F7F1E5' }}>
                          <span style={{ color: '#F7F1E5' }}>{formatDateBR(event.date)}</span>
                          <span>•</span>
                          <span style={{ color: '#F7F1E5' }}>{event.time}</span>
                        </div>
                      </div>

                      {/* Welcome message preview (without client name) */}
                      {inviteCustomization.showWelcomeMessage && inviteCustomization.welcomeMessage && (
                        <div className="p-3 rounded-xl bg-white border border-[#24152F]/10 text-xs italic text-[#24152F]/90 shadow-2xs flex items-start gap-2">
                          <div className="w-5 h-5 rounded-md bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MessageSquare className="w-3 h-3 text-[#DFFF5F]" />
                          </div>
                          <span className="text-[#24152F]">"{inviteCustomization.welcomeMessage}"</span>
                        </div>
                      )}

                      {/* Countdown preview */}
                      {inviteCustomization.showCountdown && (
                        <div className="p-3 rounded-xl bg-white border border-[#24152F]/10 text-center space-y-1.5 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/60 flex items-center justify-center gap-1">
                            <Timer className="w-3 h-3 text-[#24152F]" /> Contagem regressiva
                          </span>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            <div className="p-1 rounded-lg bg-[#FAF6EE] text-xs font-bold text-[#24152F]">12d</div>
                            <div className="p-1 rounded-lg bg-[#FAF6EE] text-xs font-bold text-[#24152F]">08h</div>
                            <div className="p-1 rounded-lg bg-[#FAF6EE] text-xs font-bold text-[#24152F]">30m</div>
                            <div className="p-1 rounded-lg bg-[#FAF6EE] text-xs font-bold text-[#24152F]">15s</div>
                          </div>
                        </div>
                      )}

                      {/* Gift list preview */}
                      {inviteCustomization.showGiftList && (
                        <div className="p-3 rounded-xl bg-white border border-[#24152F]/10 text-xs shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="w-3.5 h-3.5 text-[#24152F]" />
                              <span className="font-bold text-[11px] text-[#24152F]">Lista de Presentes</span>
                            </div>
                            {inviteCustomization.giftListType === 'link' ? (
                              <span className="text-[10px] font-semibold text-emerald-700 underline">Acessar</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-[#24152F]/60">{inviteCustomization.giftListItemsList.length} itens</span>
                            )}
                          </div>
                          {inviteCustomization.giftListType === 'items' && inviteCustomization.giftListItemsList.length > 0 && (
                            <div className="grid grid-cols-1 gap-1">
                              {inviteCustomization.giftListItemsList.slice(0, 3).map((it, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FAF6EE] text-[10px] font-medium text-[#24152F] truncate">
                                  <Gift className="w-2.5 h-2.5 text-[#24152F]/70 flex-shrink-0" />
                                  <span className="truncate">{it}</span>
                                </div>
                              ))}
                              {inviteCustomization.giftListItemsList.length > 3 && (
                                <span className="text-[9px] text-[#24152F]/50 text-center block">+ mais {inviteCustomization.giftListItemsList.length - 3} itens</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-white border border-[#24152F]/10 text-center space-y-2 shadow-2xs">
                        <span className="text-[11px] font-bold text-[#24152F] block">Confirmar presença no evento?</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="py-1.5 rounded-lg bg-[#DFFF5F] text-[#180D20] text-[10px] font-bold text-center">
                            Confirmado
                          </div>
                          <div className="py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold text-center">
                            Ausente
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    type="button"
                    onClick={onAddManager}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer border border-[#3F2553] w-full sm:w-fit"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
                    <span>Adicionar Responsável</span>
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
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#24152F]/10">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-[#24152F]">
                        Paleta Institucional do Evento
                      </h4>
                      <p className="text-xs text-[#24152F]/70 mt-0.5">
                        Essa paleta será aplicada ao formulário de confirmação de presença e ao painel do responsável pelo evento.
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 text-[#24152F] flex items-center justify-center flex-shrink-0 mt-0.5">
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
                        Visual do Convite
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

      {/* Modal Filtrar (Item 5 do User Request) */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#24152F]/15 p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-100">
            {/* Cabeçalho com título "Filtrar" e botão X */}
            <div className="flex items-center justify-between pb-3 border-b border-[#24152F]/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#24152F]" />
                <h3 className="text-base font-bold text-[#24152F]">Filtrar</h3>
              </div>
              <button
                type="button"
                id="btn-close-filter-modal"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6EE] text-[#24152F]/70 hover:text-[#24152F] hover:bg-[#EDE4D3] flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar modal de filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Status — Dropdown */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F]">Status</label>
                <select
                  value={draftFilterStatus}
                  onChange={(e) => setDraftFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs font-semibold text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                >
                  <option value="all">Todos</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Ausente</option>
                </select>
              </div>

              {/* 2. Faixa etária — Radio buttons */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F]">Faixa etária</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ambos', label: 'Ambos' },
                    { id: 'adulto', label: 'Adulto' },
                    { id: 'crianca', label: 'Criança' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-center gap-2 p-2 rounded-xl border cursor-pointer font-semibold transition-colors ${
                        draftFilterAgeCategory === option.id
                          ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E]'
                          : 'bg-white border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="draftFilterAgeCategory"
                        value={option.id}
                        checked={draftFilterAgeCategory === option.id}
                        onChange={() => setDraftFilterAgeCategory(option.id as any)}
                        className="accent-[#24152F]"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Grupo — Chips selecionáveis (múltipla seleção) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F]">Grupo</label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {availableGroups.map((group) => {
                    const isSelected = draftFilterSelectedGroups.includes(group);
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setDraftFilterSelectedGroups((prev) =>
                            isSelected
                              ? prev.filter((g) => g !== group)
                              : [...prev, group]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {group}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botões do modal: Limpar filtros & Aplicar filtros */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#24152F]/10">
              <button
                type="button"
                onClick={() => {
                  setDraftFilterStatus('all');
                  setDraftFilterAgeCategory('ambos');
                  setDraftFilterSelectedGroups([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 hover:text-rose-700 hover:bg-rose-50 border border-transparent transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus(draftFilterStatus);
                  setFilterAgeCategory(draftFilterAgeCategory);
                  setFilterSelectedGroups(draftFilterSelectedGroups);
                  setIsFilterModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#24152F] text-[#F7F1E5] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-xs border border-[#3F2553]"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
