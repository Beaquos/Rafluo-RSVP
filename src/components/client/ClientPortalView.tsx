import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Copy,
  Check,
  Share2,
  Calendar,
  MapPin,
  Search,
  Eye,
  LogOut,
  ExternalLink,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Baby,
  User,
  SlidersHorizontal,
  X,
  QrCode,
  Phone,
  Camera,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  EventData,
  GuestData,
  ManagerData,
  FormQuestionData,
  GUEST_GROUP_OPTIONS,
  normalizeGuestGroup,
} from '../../data/mockData';
import { formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import { getInviteMembers, getInviteGuestCountText } from '../../utils/inviteUtils';
import { copyToClipboard, getEventRsvpUrl } from '../../utils/linkUtils';
import { exportReportToXLSX, exportReportToPDF } from '../../utils/reportExportUtils';
import { ExportDataDropdown } from '../common/ExportDataDropdown';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { RafluoLogo } from '../common/RafluoLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Footer } from '../admin/Footer';
import { ReceptionScannerModal } from './ReceptionScannerModal';
import { ReceptionGuestModal } from './ReceptionGuestModal';
import { PWAInstallBanner } from '../pwa/PWAInstallBanner';

export interface ClientPortalViewProps {
  event: EventData;
  guests: GuestData[];
  managers?: ManagerData[];
  questions?: FormQuestionData[];
  onBackToHub?: () => void;
  onShowToast?: (message: string) => void;
  onUpdateGuest?: (updatedGuest: GuestData) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  event,
  guests,
  managers = [],
  questions = [],
  onBackToHub,
  onShowToast,
  onUpdateGuest,
}) => {
  // Authentication state for the client portal
  const storageKey = `rafluo_client_auth_${event.id}`;
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCopiedRsvp, setIsCopiedRsvp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o Modal Filtrar (Item 3 do User Request)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [filterAgeCategory, setFilterAgeCategory] = useState<'ambos' | 'adulto' | 'crianca'>('ambos');
  const [filterSelectedGroups, setFilterSelectedGroups] = useState<string[]>([]);

  // Estados de rascunho enquanto o modal estiver aberto
  const [draftFilterStatus, setDraftFilterStatus] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [draftFilterAgeCategory, setDraftFilterAgeCategory] = useState<'ambos' | 'adulto' | 'crianca'>('ambos');
  const [draftFilterSelectedGroups, setDraftFilterSelectedGroups] = useState<string[]>([]);

  const [selectedGuestForDetail, setSelectedGuestForDetail] = useState<GuestData | null>(null);
  const [expandedInviteIds, setExpandedInviteIds] = useState<string[]>([]);

  const toggleInviteExpand = (id: string) => {
    setExpandedInviteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filter guests for this event
  const eventGuests = useMemo(() => {
    return guests.filter((g) => g.eventId === event.id);
  }, [guests, event.id]);

  // Grupos padronizados do Rafluo (Item 3 do Prompt)
  const availableGroups = useMemo(() => {
    return Array.from(GUEST_GROUP_OPTIONS);
  }, []);

  const hasActiveFilters =
    filterStatus !== 'all' ||
    filterAgeCategory !== 'ambos' ||
    filterSelectedGroups.length > 0;

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterAgeCategory !== 'ambos' ? 1 : 0) +
    filterSelectedGroups.length;

  // Registered managers for this event
  const eventManagers = useMemo(() => {
    return managers.filter((m) => m.eventId === event.id);
  }, [managers, event.id]);

  // Dynamically find current authenticated manager or first manager
  const currentManager = useMemo(() => {
    if (authenticatedUser) {
      return eventManagers.find(
        (m) => m.email.toLowerCase().trim() === authenticatedUser.toLowerCase().trim()
      );
    }
    return eventManagers[0] || null;
  }, [eventManagers, authenticatedUser]);

  const accessEndDate = currentManager?.accessEnd || eventManagers[0]?.accessEnd || event.rsvpDeadline;

  // Calculate metrics (titulares confirmados + acompanhantes + não comparecem)
  const confirmedGuests = eventGuests.filter((g) => g.status === 'confirmed');
  const confirmedCount = confirmedGuests.length;
  const declinedGuests = eventGuests.filter((g) => g.status === 'declined');
  const declinedCount = declinedGuests.length;
  const totalCompanions = confirmedGuests.reduce((acc, g) => acc + (g.companionCount || 0), 0);
  const totalAttending = confirmedCount + totalCompanions;
  // Total Convidados = soma de Confirmados (titulares) + Acompanhantes + Não Comparecem
  const totalConvidados = confirmedCount + totalCompanions + declinedCount;
  const confirmationRate = totalConvidados > 0 ? Math.round((totalAttending / totalConvidados) * 100) : 0;

  // Filtered list based on search and modal filters
  const displayedGuests = useMemo(() => {
    return eventGuests.filter((g) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        g.name.toLowerCase().includes(q) ||
        g.displayName.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Filtro de Status
      if (filterStatus !== 'all' && g.status !== filterStatus) {
        return false;
      }

      // Filtro de Grupo (Tag) padronizado
      if (filterSelectedGroups.length > 0) {
        const guestGroupNorm = normalizeGuestGroup(g.group);
        if (!filterSelectedGroups.includes(guestGroupNorm) && !filterSelectedGroups.includes(g.group)) {
          return false;
        }
      }

      // Filtro de Faixa Etária (Adulto / Criança)
      if (filterAgeCategory !== 'ambos') {
        const mems = getInviteMembers(g);
        if (filterAgeCategory === 'adulto' && !mems.some((m) => m.category === 'Adulto')) {
          return false;
        }
        if (filterAgeCategory === 'crianca' && !mems.some((m) => m.category === 'Criança')) {
          return false;
        }
      }

      return true;
    });
  }, [eventGuests, searchTerm, filterStatus, filterAgeCategory, filterSelectedGroups]);

  // Handle Login Validation
  // Live countdown for Client Portal (utilizes same event date/time)
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    if (!event.date) return;
    const calculateTime = () => {
      const targetTime = event.time || '12:00';
      const target = new Date(`${event.date}T${targetTime}:00`);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (isNaN(diff)) {
        setTimeLeft(null);
        return;
      }

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [event.date, event.time]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Check if email matches a registered manager OR client name or allow if no managers are configured yet
    const matchingManager = eventManagers.find(
      (m) => m.email.toLowerCase().trim() === cleanEmail
    );

    if (eventManagers.length > 0 && !matchingManager) {
      setAuthError(
        'E-mail não encontrado na lista de responsáveis deste evento. Verifique com a organização.'
      );
      return;
    }

    // Authenticate
    setAuthenticatedUser(cleanEmail);
    try {
      localStorage.setItem(storageKey, cleanEmail);
    } catch {
      // ignore
    }
    setAuthError(null);
    if (onShowToast) {
      onShowToast(`Bem-vindo(a) ao painel do evento "${event.name}"!`);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setAuthenticatedUser(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    if (onShowToast) {
      onShowToast('Sessão do painel do responsável encerrada.');
    }
  };

  // Handle Copy Public RSVP Link
  const publicRsvpUrl = getEventRsvpUrl(event.id, event.slug);
  const handleCopyPublicRsvp = async () => {
    const ok = await copyToClipboard(publicRsvpUrl);
    if (ok) {
      setIsCopiedRsvp(true);
      if (onShowToast) {
        onShowToast('Link de confirmação dos convidados copiado!');
      }
      setTimeout(() => setIsCopiedRsvp(false), 2500);
    }
  };

  // Handle Share WhatsApp
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Você é nosso convidado especial para o *${event.name}*!\n\n` +
      `📅 Data: ${formatDateBR(event.date)} às ${event.time}\n` +
      `📍 Local: ${event.location}\n\n` +
      `Por favor, confirme sua presença pelo link abaixo:\n👉 ${publicRsvpUrl}\n\n` +
      `Contamos com sua presença! ✨`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  // Export handlers
  const handleExportXLSX = () => {
    try {
      exportReportToXLSX({
        reportTitle: `RSVP_${event.name}`,
        eventName: event.name,
        filterLabel: 'Painel do Responsável',
        guests: eventGuests,
        events: [event],
      });
      if (onShowToast) onShowToast('Planilha Excel (XLSX) exportada com sucesso!');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Erro ao exportar planilha XLSX.');
    }
  };

  const handleExportPDF = () => {
    try {
      exportReportToPDF({
        reportTitle: `Relatório de Confirmações - ${event.name}`,
        eventName: event.name,
        filterLabel: 'Documento do Responsável',
        guests: eventGuests,
        events: [event],
      });
      if (onShowToast) onShowToast('Documento PDF oficial gerado com sucesso!');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Erro ao exportar documento PDF.');
    }
  };

  // ==========================================
  // CREDENCIAMENTO E RECEPÇÃO (Itens 6 a 10 do Prompt)
  // ==========================================
  const [activeTab, setActiveTab] = useState<'rsvp' | 'credenciamento'>('rsvp');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [phoneSearchInput, setPhoneSearchInput] = useState('');
  const [phoneSearchResults, setPhoneSearchResults] = useState<GuestData[] | null>(null);
  const [selectedGuestForReception, setSelectedGuestForReception] = useState<GuestData | null>(null);
  const [receptionSearchTerm, setReceptionSearchTerm] = useState('');
  const [receptionFilter, setReceptionFilter] = useState<'all' | 'pending' | 'entered' | 'partial'>('all');
  const [isValidatingQr, setIsValidatingQr] = useState(false);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Convidados confirmados do evento
  const confirmedReceptionGuests = useMemo(() => {
    return eventGuests.filter((g) => g.status === 'confirmed');
  }, [eventGuests]);

  // Indicadores do credenciamento calculados a partir dos dados reais do sistema
  const {
    totalConfirmedPersons,
    totalEnteredPersons,
    totalPendingPersons,
    attendanceRate,
    confirmedAdults,
    enteredAdults,
    confirmedChildren,
    enteredChildren,
  } = useMemo(() => {
    let totalConf = 0;
    let totalEnt = 0;
    let confAdults = 0;
    let entAdults = 0;
    let confKids = 0;
    let entKids = 0;

    confirmedReceptionGuests.forEach((guest) => {
      const members = getInviteMembers(guest);
      const confMembers = members.filter((m) => m.status === 'confirmed');
      confMembers.forEach((m) => {
        totalConf++;
        const isChild = m.category === 'Criança';
        if (isChild) {
          confKids++;
          if (m.checkedIn) entKids++;
        } else {
          confAdults++;
          if (m.checkedIn) entAdults++;
        }
        if (m.checkedIn) totalEnt++;
      });
    });

    const pending = Math.max(0, totalConf - totalEnt);
    const rate = totalConf > 0 ? Math.round((totalEnt / totalConf) * 100) : 0;

    return {
      totalConfirmedPersons: totalConf,
      totalEnteredPersons: totalEnt,
      totalPendingPersons: pending,
      attendanceRate: rate,
      confirmedAdults: confAdults,
      enteredAdults: entAdults,
      confirmedChildren: confKids,
      enteredChildren: entKids,
    };
  }, [confirmedReceptionGuests]);

  // Validação do QR Code no backend (Item 7 do Prompt)
  const handleValidateQrCode = async (code: string) => {
    if (!code) return;
    setIsValidatingQr(true);
    try {
      const res = await fetch('/api/checkin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ eventId: event.id, code }),
      });
      const text = await res.text();
      let data: any = null;
      try {
        if (text && text.trim()) data = JSON.parse(text);
      } catch (e) {
        console.warn('Falha ao decodificar JSON:', e);
      }
      if (!res.ok || !data || !data.valid || !data.guest) {
        if (onShowToast) onShowToast(data?.error || 'QR Code inválido ou não pertencente a este evento.');
        return;
      }
      setSelectedGuestForReception(data.guest);
      setIsScannerOpen(false);
      if (onShowToast) onShowToast(`Reserva de "${data.guest.name}" localizada com sucesso!`);
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Erro ao validar código no servidor.');
    } finally {
      setIsValidatingQr(false);
    }
  };

  // Busca manual por telefone (Item 7 do Prompt)
  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = phoneSearchInput.trim();
    if (!query) {
      setPhoneSearchResults(null);
      return;
    }
    const cleanDigits = query.replace(/\D/g, '');
    if (cleanDigits.length < 3) {
      if (onShowToast) onShowToast('Informe ao menos 3 dígitos do telefone.');
      return;
    }

    try {
      const res = await fetch('/api/checkin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ eventId: event.id, phone: cleanDigits }),
      });
      const text = await res.text();
      let data: any = null;
      try {
        if (text && text.trim()) data = JSON.parse(text);
      } catch (e) {
        console.warn('Falha ao decodificar JSON:', e);
      }
      if (!res.ok || !data) {
        if (onShowToast) onShowToast(data?.error || 'Erro ao buscar convidado por telefone.');
        return;
      }
      const matches: GuestData[] = data.guests || [];
      setPhoneSearchResults(matches);
      if (matches.length === 0) {
        if (onShowToast) onShowToast('Nenhum convidado encontrado com este telefone.');
      } else if (matches.length === 1) {
        setSelectedGuestForReception(matches[0]);
        if (onShowToast) onShowToast(`Reserva de "${matches[0].name}" localizada!`);
      }
    } catch (err) {
      console.error(err);
      const localMatches = eventGuests.filter((g) => {
        const digits = (g.phone || '').replace(/\D/g, '');
        return digits.includes(cleanDigits);
      });
      setPhoneSearchResults(localMatches);
    }
  };

  // Registro de check-in / desfazimento (Item 9 e 11 do Prompt)
  const handleRecordCheckIn = async (
    guestId: string,
    memberIds: string[],
    action: 'checkin' | 'undo',
    operator?: string
  ) => {
    if (isSubmittingCheckIn) return;
    setIsSubmittingCheckIn(true);

    try {
      const op = operator || authenticatedUser || event.clientName || 'Recepção';
      const targetGuest =
        selectedGuestForReception?.id === guestId
          ? selectedGuestForReception
          : eventGuests.find((g) => g.id === guestId);

      const res = await fetch('/api/checkin/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          guestId,
          memberIds,
          action,
          operator: op,
          guest: targetGuest,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      let data: any = null;
      if (text && (contentType.includes('application/json') || text.trim().startsWith('{'))) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn('Resposta não pôde ser convertida para JSON:', text);
        }
      }

      if (!res.ok || !data || !data.success || !data.guest) {
        const errorMsg =
          data?.error ||
          (text && text.length < 180 ? text : null) ||
          `Falha de comunicação (${res.status}). Não foi possível registrar a entrada.`;
        throw new Error(errorMsg);
      }

      const updatedGuest: GuestData = data.guest;
      if (onUpdateGuest) {
        onUpdateGuest(updatedGuest);
      }
      if (selectedGuestForReception?.id === updatedGuest.id) {
        setSelectedGuestForReception(updatedGuest);
      }
      if (phoneSearchResults) {
        setPhoneSearchResults((prev) =>
          prev ? prev.map((g) => (g.id === updatedGuest.id ? updatedGuest : g)) : null
        );
      }
      if (onShowToast) {
        onShowToast(
          action === 'checkin'
            ? `Entrada registrada para ${memberIds.length} pessoa(s)!`
            : `Entrada desfeita para ${memberIds.length} pessoa(s).`
        );
      }
    } catch (err: any) {
      console.error('Erro ao registrar credenciamento:', err);
      if (onShowToast) {
        onShowToast(err?.message || 'Erro ao registrar credenciamento. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Exportar relatório de credenciamento (Item 10 do Prompt)
  const handleExportReceptionXLSX = () => {
    try {
      exportReportToXLSX({
        reportTitle: `Credenciamento_${event.name}`,
        eventName: event.name,
        filterLabel: 'Relatório de Credenciamento e Recepção',
        guests: confirmedReceptionGuests,
        events: [event],
      });
      if (onShowToast) onShowToast('Relatório de Credenciamento exportado com sucesso!');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Erro ao exportar relatório.');
    }
  };

  const handleExportReceptionPDF = () => {
    try {
      exportReportToPDF({
        reportTitle: `Relatório de Credenciamento - ${event.name}`,
        eventName: event.name,
        filterLabel: `Recepção: ${totalEnteredPersons} de ${totalConfirmedPersons} presentes (${attendanceRate}%)`,
        guests: confirmedReceptionGuests,
        events: [event],
      });
      if (onShowToast) onShowToast('Documento PDF de Credenciamento gerado com sucesso!');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Erro ao exportar PDF.');
    }
  };

  // Lista de reservas confirmadas filtradas na tela de credenciamento
  const displayedReceptionGuests = useMemo(() => {
    return confirmedReceptionGuests.filter((g) => {
      const q = receptionSearchTerm.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        g.name.toLowerCase().includes(q) ||
        g.displayName.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.checkInCode && g.checkInCode.toLowerCase().includes(q)) ||
        (g.companionNames && g.companionNames.some((c) => c.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      const members = getInviteMembers(g).filter((m) => m.status === 'confirmed');
      const enteredCount = members.filter((m) => m.checkedIn).length;
      const totalCount = members.length;

      if (receptionFilter === 'entered') {
        return enteredCount === totalCount && totalCount > 0;
      }
      if (receptionFilter === 'pending') {
        return enteredCount === 0;
      }
      if (receptionFilter === 'partial') {
        return enteredCount > 0 && enteredCount < totalCount;
      }
      return true;
    });
  }, [confirmedReceptionGuests, receptionSearchTerm, receptionFilter]);

  // ==========================================
  // VIEW 1: AUTHENTICATION / ACCESS GATEWAY
  // ==========================================
  if (!authenticatedUser) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] flex flex-col justify-between p-4 sm:p-8 relative selection:bg-[#DFFF5F] selection:text-[#180D20] transition-colors duration-200">
        {/* Top right ThemeToggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-6 pt-8 sm:pt-0">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-block">
              <RafluoLogo variant="light" size="lg" showDescriptor />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#24152F]/10 dark:bg-white/10 text-[#24152F] dark:text-[#F7F1E5] text-xs font-bold mt-2">
              <ShieldCheck className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
              <span>Painel do Responsável • Acesso Autenticado</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-6 sm:p-8 border border-[#24152F]/15 dark:border-[#3F2553] shadow-xl space-y-6">
            <div className="space-y-1 text-center border-b border-[#24152F]/10 dark:border-[#3F2553]/60 pb-4">
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/70 font-semibold font-inter uppercase tracking-wider">
                Acompanhamento Exclusivo do Evento
              </p>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#24152F] dark:text-[#F7F1E5] tracking-tight">{event.name}</h2>
              {event.clientName && (
                <p className="text-xs text-[#24152F]/80 dark:text-[#D2C4DC] font-medium font-inter pt-0.5">
                  Responsável: <strong className="font-semibold">{event.clientName}</strong>
                </p>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium font-inter text-[#24152F] dark:text-[#F7F1E5]">
                  E-mail do Responsável
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE]/40 dark:bg-[#2A1738] text-xs sm:text-sm font-inter text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-2 focus:ring-[#DFFF5F] focus:bg-white dark:focus:bg-[#24152F] transition-all"
                  />
                </div>
                <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/70 font-inter font-normal leading-relaxed">
                  Informe o e-mail cadastrado para ter acesso às confirmações de presença e métricas.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-inter text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-client-login"
                className="w-full py-3 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-semibold font-heading text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4 text-[#DFFF5F]" />
              </button>
            </form>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC] font-medium tracking-wide">
              Desenvolvido com carinho por{' '}
              <span className="font-semibold text-[#24152F] dark:text-[#D2C4DC]">Beaquos Estúdio Criativo</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED CLIENT DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] selection:bg-[#DFFF5F] selection:text-[#180D20] flex flex-col justify-between transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#24152F] text-[#F7F1E5] border-b border-[#3F2553] shadow-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RafluoLogo variant="dark" size="sm" symbolOnly={false} />
            <div className="h-5 w-px bg-white/20 hidden sm:block" />
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
              Painel do Cliente
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#F7F1E5] truncate max-w-[200px]">
                {event.clientName || 'Responsável'}
              </p>
              <p className="text-[10px] text-[#D2C4DC]/70 truncate max-w-[200px]">
                {authenticatedUser}
              </p>
            </div>

            {/* Alternar Tema (Claro / Escuro / Automático) */}
            <ThemeToggle />

            <button
              type="button"
              id="btn-logout-client"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-xs font-semibold text-[#F7F1E5] transition-colors cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DFFF5F]" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8 flex-1 pb-12">
        {/* PWA Install Banner (Item 4 do Prompt) */}
        <PWAInstallBanner targetRole="client" className="mb-2" />

        {/* Event Welcome Banner */}
        <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-6 sm:p-8 border border-[#24152F]/15 dark:border-[#3F2553] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                  {event.type}
                </span>
                <span className="text-xs font-medium text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                  Status: <strong className="text-[#24152F] dark:text-[#F7F1E5]">{event.status === 'active' ? 'RSVP Ativo' : 'Encerrado'}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5] tracking-tight mt-1.5">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#24152F]/80 dark:text-[#D2C4DC] pt-1">
                {/* Data */}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <strong className="text-[#24152F] dark:text-[#F7F1E5]">{formatDateBR(event.date)}</strong>
                </span>

                {/* Horário com ícone próprio padronizado */}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <span className="font-semibold text-[#24152F] dark:text-[#F7F1E5]">{event.time}</span>
                </span>

                {/* Local */}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <span>{event.location}</span>
                </span>

                {/* Prazo de Confirmação */}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <span>Prazo de Confirmação: <strong className="text-[#24152F] dark:text-[#F7F1E5]">{formatDateBR(event.rsvpDeadline)}</strong></span>
                </span>
              </div>
            </div>

            {/* Export data dropdown - Layout responsivo para celular sem cortes */}
            <div className="w-full md:w-auto flex-shrink-0 pt-2 md:pt-0">
              <ExportDataDropdown
                onExportXLSX={handleExportXLSX}
                onExportPDF={handleExportPDF}
                buttonLabel="Exportar Relatório"
                className="w-full md:w-auto"
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher - Exibido apenas quando o evento possuir recepção / credenciamento ativado (Item 1 & 6 do Prompt) */}
        {event.hasReception && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="tab-btn-rsvp"
                onClick={() => setActiveTab('rsvp')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'rsvp'
                    ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-xs'
                    : 'text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmações</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-black/20 font-black">
                  {confirmedCount}
                </span>
              </button>

              <button
                type="button"
                id="tab-btn-credenciamento"
                onClick={() => setActiveTab('credenciamento')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'credenciamento'
                    ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] shadow-xs'
                    : 'text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#DFFF5F] dark:text-[#180D20]" />
                <span>Credenciamento</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#DFFF5F] text-[#180D20] font-black">
                  {attendanceRate}%
                </span>
              </button>
            </div>

            {activeTab === 'credenciamento' && (
              <div className="flex items-center gap-2 px-2 pb-1 sm:pb-0">
                <button
                  type="button"
                  id="btn-scan-qr-shortcut"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#DFFF5F] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-[#DFFF5F]" />
                  <span>Ler QR Code</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO RSVP: Mantido integralmente para eventos sem credenciamento ou na aba RSVP */}
        {activeTab === 'rsvp' && (
          <>
            {/* Shareable RSVP Link Card (Primary Action for the Client) */}
            <div className="bg-[#24152F] text-[#F7F1E5] rounded-3xl p-6 sm:p-7 border border-[#3F2553] shadow-lg space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#F7F1E5]">
                  Link do Convite
                </h3>
              </div>
              <p className="text-xs text-[#D2C4DC] mt-1">
                Envie este link para seus amigos e familiares confirmarem presença no evento.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 pt-1">
            <div className="flex-1 bg-[#180D20] border border-[#3F2553] rounded-xl px-3.5 py-2.5 font-mono text-xs text-[#DFFF5F] truncate select-all">
              {publicRsvpUrl}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-copy-public-rsvp"
                onClick={handleCopyPublicRsvp}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#DFFF5F] hover:bg-[#CEF04A] text-[#180D20] text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isCopiedRsvp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedRsvp ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                id="btn-share-whatsapp-rsvp"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <a
                href={publicRsvpUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-[#F7F1E5] text-xs font-semibold transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-[#DFFF5F]" />
                <span>Ver</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Countdown in Client Portal (uses same event date and time) */}
        {timeLeft && !timeLeft.isPast && (
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 sm:p-6 border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#24152F] dark:text-[#DFFF5F] uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
              <span>Contagem regressiva</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{timeLeft.days}</span>
                <span className="block text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold uppercase">Dias</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{timeLeft.hours}</span>
                <span className="block text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold uppercase">Horas</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{timeLeft.minutes}</span>
                <span className="block text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold uppercase">Min</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553]">
                <span className="block text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{timeLeft.seconds}</span>
                <span className="block text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold uppercase">Seg</span>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Overview Cards (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Convidados */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">Total Convidados</span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <Users className="w-4 h-4 text-[#DFFF5F]" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{totalConvidados}</p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5 font-medium">Cadastrados no evento</p>
            </div>
          </div>

          {/* Confirmados */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">Confirmados</span>
              <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#180D20]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{confirmedCount}</p>
                <span className="text-[11px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20] shadow-2xs">
                  {confirmationRate}%
                </span>
              </div>
              <p className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 mt-0.5 font-medium">
                Titulares confirmados
              </p>
            </div>
          </div>

          {/* Acompanhantes */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">Acompanhantes</span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <Users className="w-4 h-4 text-[#DFFF5F]" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">+{totalCompanions}</p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5 font-medium">
                Total presenças: {totalAttending}
              </p>
            </div>
          </div>

          {/* Não Comparecem */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-900 dark:text-rose-300">
              <span className="text-xs font-bold">Não Comparecem</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 flex items-center justify-center shadow-xs flex-shrink-0">
                <XCircle className="w-4 h-4 text-rose-900 dark:text-rose-300" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-rose-200">{declinedCount}</p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70 mt-0.5 font-medium">Ausência informada</p>
            </div>
          </div>
        </div>

        {/* Confirmações de Presença (RSVP) Table & Filters */}
        <div className="bg-white dark:bg-[#1E1128] rounded-3xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]/60">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Lista de Confirmações
              </h3>
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5">
                Acompanhe em tempo real quem já confirmou ou recusou presença no evento
              </p>
            </div>
          </div>

          {/* Barra de Ferramentas com Busca e Botão de Filtro (Item 3 do User Request) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF6EE]/60 dark:bg-[#2A1738]/50 border border-[#24152F]/10 dark:border-[#3F2553]">
            <div className="flex items-center gap-2.5 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-xs text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
                />
              </div>

              {/* Botão de Filtro com apenas o ícone de Sliders, destacado e proporcional */}
              <button
                type="button"
                id="btn-open-filter-modal-client"
                onClick={() => {
                  setDraftFilterStatus(filterStatus);
                  setDraftFilterAgeCategory(filterAgeCategory);
                  setDraftFilterSelectedGroups([...filterSelectedGroups]);
                  setIsFilterModalOpen(true);
                }}
                className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
                  hasActiveFilters
                    ? 'bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] border-[#24152F] dark:border-[#DFFF5F]'
                    : 'bg-white dark:bg-[#1E1128] border-[#24152F]/20 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
                }`}
                title="Filtrar confirmações"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] dark:bg-[#24152F] text-[#24152F] dark:text-[#DFFF5F] text-[9px] font-black flex items-center justify-center border border-[#24152F] dark:border-[#DFFF5F]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  {displayedGuests.length} de {eventGuests.length} convite(s) filtrado(s)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterAgeCategory('ambos');
                    setFilterSelectedGroups([]);
                  }}
                  className="text-[11px] text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-800 cursor-pointer ml-1"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>

          {/* Guest Table — Exato mesmo layout visual de Respostas Recentes / Convidados */}
          <div className="overflow-hidden md:overflow-x-auto rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#1E1128]">
            <table className="w-full text-left text-xs md:whitespace-nowrap md:min-w-[560px]">
              <thead className="bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/80 dark:text-[#D2C4DC] font-bold border-b border-[#24152F]/10 dark:border-[#3F2553]">
                <tr>
                  <th className="py-3 px-4 w-full md:w-auto">Nome Convidado</th>
                  <th className="py-3 px-3 hidden md:table-cell">Tag (Grupo)</th>
                  <th className="py-3 px-3 hidden md:table-cell">Status</th>
                  <th className="py-3 px-3 hidden md:table-cell">Nº convidados</th>
                  <th className="py-3 px-4 text-right hidden md:table-cell">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/50 text-[#24152F] dark:text-[#F7F1E5]">
                {displayedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                      Nenhum convidado encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  displayedGuests.map((g) => {
                    const members = getInviteMembers(g);
                    const guestCountText = getInviteGuestCountText(members);
                    const isExpanded = expandedInviteIds.includes(g.id);
                    const personName = g.displayName || g.name;

                    return (
                      <React.Fragment key={g.id}>
                        <tr
                          className={`transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-[#FAF6EE]/50 dark:bg-[#2A1738]/50' : 'hover:bg-[#FAF6EE]/30 dark:hover:bg-[#2A1738]/30'
                          }`}
                          onClick={() => toggleInviteExpand(g.id)}
                        >
                          <td className="py-4 px-4 font-bold align-top w-full md:w-auto">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar circular com contorno cinza e ícone de envelope */}
                              <div className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/15 dark:border-[#3F2553] flex items-center justify-center text-[#24152F] dark:text-[#F7F1E5] flex-shrink-0 shadow-2xs">
                                <Mail className="w-4 h-4 text-[#24152F] dark:text-[#F7F1E5]" />
                              </div>

                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] text-xs sm:text-sm">
                                  {personName}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleInviteExpand(g.id);
                                  }}
                                  className="p-1 rounded-md text-[#24152F]/50 dark:text-[#D2C4DC]/50 hover:text-[#24152F] dark:hover:text-[#F7F1E5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                  title={isExpanded ? 'Recolher convite' : 'Expandir convidados'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
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
                                        className="w-fit max-w-full inline-flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553] shadow-2xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Avatar circular com ícone de pessoa */}
                                          <div className="relative flex-shrink-0">
                                            <div className="w-6 h-6 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/15 dark:border-[#3F2553] flex items-center justify-center text-[#24152F] dark:text-[#F7F1E5]">
                                              {mem.category === 'Criança' ? (
                                                <Baby className="w-3.5 h-3.5" />
                                              ) : (
                                                <User className="w-3.5 h-3.5" />
                                              )}
                                            </div>

                                            {/* Badge de status no canto SOMENTE se houver resposta */}
                                            {hasResponse && (
                                              <span
                                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border border-white dark:border-[#1E1128] ${
                                                  isConfirmed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                                }`}
                                                title={isConfirmed ? 'Confirmado' : 'Ausente'}
                                              >
                                                {isConfirmed ? '✔' : '✖'}
                                              </span>
                                            )}
                                          </div>

                                          {/* Nome em negrito */}
                                          <span className="font-bold text-xs text-[#24152F] dark:text-[#F7F1E5] truncate">
                                            {mem.name}
                                          </span>
                                        </div>

                                        {/* Pill com contorno indicando Adulto ou Criança ajustado junto ao nome */}
                                        <div className="flex-shrink-0">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                              mem.category === 'Criança'
                                                ? 'border-amber-500/60 text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30'
                                                : 'border-[#24152F]/25 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] bg-white dark:bg-[#1E1128]'
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E] leading-tight">
                              {normalizeGuestGroup(g.group)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 align-middle hidden md:table-cell">
                            {g.status === 'confirmed' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0E4] border border-[#A3C79E] text-[#1E3B1E] leading-tight">
                                Confirmado
                              </span>
                            ) : g.status === 'declined' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 border border-rose-300 text-rose-800 leading-tight">
                                Ausente
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 border border-gray-300 text-[#24152F]/70 leading-tight">
                                Sem resposta
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 align-middle text-[#24152F]/80 dark:text-[#D2C4DC]/80 font-medium hidden md:table-cell">
                            {guestCountText}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-right hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedGuestForDetail(g)}
                              className="px-3 py-1.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] hover:bg-[#24152F] hover:text-[#F7F1E5] dark:hover:bg-[#DFFF5F] dark:hover:text-[#180D20] text-[#24152F] dark:text-[#F7F1E5] font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Visualizar ficha"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
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
      </>
    )}

    {/* CONTEÚDO CREDENCIAMENTO: Exibido exclusivamente na aba Credenciamento de eventos com hasReception = true */}
    {activeTab === 'credenciamento' && event.hasReception && (
      <div className="space-y-6">
        {/* 1. Indicadores de Credenciamento (Item 6 do Prompt) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total de Pessoas Confirmadas */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                Total de Pessoas Confirmadas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <Users className="w-4 h-4 text-[#DFFF5F]" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">
                {totalConfirmedPersons}
              </p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5 font-medium">
                {confirmedAdults} adultos • {confirmedChildren} crianças
              </p>
            </div>
          </div>

          {/* Total de Entradas Efetivamente Registradas */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Entradas Registradas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#180D20]" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">
                  {totalEnteredPersons}
                </p>
                <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20] shadow-2xs">
                  {attendanceRate}%
                </span>
              </div>
              <p className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 mt-0.5 font-medium">
                {enteredAdults} adultos • {enteredChildren} crianças presentes
              </p>
            </div>
          </div>

          {/* Total de Pessoas que Ainda Não Entraram */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                Ainda Não Entraram
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 dark:bg-white/10 text-[#24152F] dark:text-[#F7F1E5] flex items-center justify-center shadow-xs flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">
                {totalPendingPersons}
              </p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5 font-medium">
                Aguardados na recepção
              </p>
            </div>
          </div>

          {/* Percentual de Comparecimento */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                Comparecimento
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <QrCode className="w-4 h-4 text-[#DFFF5F]" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">
                {attendanceRate}%
              </p>
              <div className="w-full bg-[#FAF6EE] dark:bg-[#2A1738] rounded-full h-1.5 mt-2 overflow-hidden border border-[#24152F]/10">
                <div
                  className="bg-[#24152F] dark:bg-[#DFFF5F] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, attendanceRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Recepção Action Hub: Leitor QR Code e Busca Manual por Telefone (Item 7 do Prompt) */}
        <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 sm:p-7 border border-[#24152F]/15 dark:border-[#3F2553] shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#24152F] dark:text-[#DFFF5F]" />
                <span>Identificação e Entrada na Recepção</span>
              </h3>
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5">
                Utilize a câmera para ler o QR Code ou faça a busca pelo telefone cadastrado do titular.
              </p>
            </div>

            {/* Exportar relatório de credenciamento (Item 10) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportReceptionXLSX}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] hover:bg-[#FAF6EE]/80 text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold transition-colors cursor-pointer"
                title="Exportar planilha XLSX de credenciamento"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>XLSX</span>
              </button>
              <button
                type="button"
                onClick={handleExportReceptionPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] hover:bg-[#FAF6EE]/80 text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold transition-colors cursor-pointer"
                title="Exportar documento PDF oficial de credenciamento"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Dois métodos de identificação lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Método 1: Leitura de QR Code */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE]/60 dark:bg-[#2A1738]/50 border border-[#24152F]/15 dark:border-[#3F2553] flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center">
                    <Camera className="w-4 h-4 text-[#DFFF5F]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#24152F] dark:text-[#F7F1E5]">
                    Leitura de QR Code
                  </h4>
                </div>
                <p className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed">
                  Utilize a câmera do celular, tablet ou computador para ler o QR Code da reserva. A validação é realizada pelo servidor antes de registrar a entrada.
                </p>
              </div>

              <button
                type="button"
                id="btn-open-scanner-modal"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#DFFF5F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Camera className="w-4 h-4 text-[#DFFF5F]" />
                <span>Abrir Leitor de QR Code</span>
              </button>
            </div>

            {/* Método 2: Busca por Telefone */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE]/60 dark:bg-[#2A1738]/50 border border-[#24152F]/15 dark:border-[#3F2553] flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#DFFF5F]" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#24152F] dark:text-[#F7F1E5]">
                    Busca por Telefone
                  </h4>
                </div>
                <p className="text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 leading-relaxed">
                  Alternativa rápida caso o convidado não consiga apresentar o QR Code. Localiza a ficha completa da reserva.
                </p>
              </div>

              <form onSubmit={handlePhoneSearch} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneSearchInput}
                      onChange={(e) => setPhoneSearchInput(e.target.value)}
                      placeholder="Digite o telefone cadastrado..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-xs text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
                    />
                  </div>
                  <button
                    type="submit"
                    id="btn-search-phone-checkin"
                    className="px-4 py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] dark:hover:bg-[#CEF04A] transition-colors cursor-pointer shadow-2xs"
                  >
                    Buscar
                  </button>
                </div>

                {phoneSearchResults !== null && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#24152F]/70 dark:text-[#D2C4DC]/70">
                      {phoneSearchResults.length} reserva(s) encontrada(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneSearchResults(null);
                        setPhoneSearchInput('');
                      }}
                      className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                    >
                      Limpar busca
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Resultados da busca por telefone (Item 7 do Prompt) */}
          {phoneSearchResults !== null && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1128] border-2 border-[#24152F]/20 dark:border-[#3F2553] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Resultados da Busca por Telefone</span>
                </span>
              </div>

              {phoneSearchResults.length === 0 ? (
                <p className="text-xs text-rose-700 dark:text-rose-400 py-2">
                  Nenhum convidado confirmado encontrado com esse telefone para este evento.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {phoneSearchResults.map((matchedGuest) => {
                    const members = getInviteMembers(matchedGuest).filter((m) => m.status === 'confirmed');
                    return (
                      <div
                        key={matchedGuest.id}
                        className="p-3.5 rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#2A1738] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-[#24152F] dark:text-[#F7F1E5] truncate">
                            {matchedGuest.displayName || matchedGuest.name}
                          </p>
                          <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5">
                            Tel: {matchedGuest.phone || 'Não informado'} • {members.length} pessoa(s)
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-mono text-[#24152F]/70 dark:text-[#D2C4DC]/70">
                            {matchedGuest.rsvpCode || matchedGuest.checkInCode || 'Sem código'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedGuestForReception(matchedGuest)}
                          className="px-3.5 py-2 rounded-xl bg-[#24152F] text-[#DFFF5F] hover:bg-[#180D20] text-xs font-bold transition-all cursor-pointer shadow-xs flex-shrink-0"
                        >
                          Abrir Ficha
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Tabela / Lista de Credenciamento */}
        <div className="bg-white dark:bg-[#1E1128] rounded-3xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]/60">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#24152F] dark:text-[#F7F1E5]">
                Lista de Credenciamento
              </h3>
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5">
                Acompanhe quem já entrou e registre a entrada nominal individual de cada pessoa
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setReceptionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  receptionFilter === 'all'
                    ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20]'
                    : 'bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC]/70'
                }`}
              >
                Todos ({confirmedReceptionGuests.length})
              </button>
              <button
                type="button"
                onClick={() => setReceptionFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  receptionFilter === 'pending'
                    ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20]'
                    : 'bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC]/70'
                }`}
              >
                Pendentes ({confirmedReceptionGuests.filter((g) => (g.checkedInCount || 0) === 0).length})
              </button>
              <button
                type="button"
                onClick={() => setReceptionFilter('entered')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  receptionFilter === 'entered'
                    ? 'bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20]'
                    : 'bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC]/70'
                }`}
              >
                Completos ({confirmedReceptionGuests.filter((g) => g.checkInStatus === 'complete').length})
              </button>
            </div>
          </div>

          {/* Barra de pesquisa na tabela */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={receptionSearchTerm}
              onChange={(e) => setReceptionSearchTerm(e.target.value)}
              placeholder="Pesquisar por titular, acompanhante, telefone ou código QR..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-xs text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
            />
          </div>

          {/* Tabela de credenciamento */}
          <div className="overflow-hidden md:overflow-x-auto rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#1E1128]">
            <table className="w-full text-left text-xs md:whitespace-nowrap md:min-w-[700px]">
              <thead className="bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/80 dark:text-[#D2C4DC] font-bold border-b border-[#24152F]/10 dark:border-[#3F2553]">
                <tr>
                  <th className="hidden md:table-cell py-3 px-4">Titular & Reserva</th>
                  <th className="py-3 px-3">Participantes Nominais</th>
                  <th className="py-3 px-3">Código QR</th>
                  <th className="py-3 px-3">Status Entrada</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/50 text-[#24152F] dark:text-[#F7F1E5]">
                {displayedReceptionGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                      Nenhuma reserva confirmada localizada.
                    </td>
                  </tr>
                ) : (
                  displayedReceptionGuests.map((g) => {
                    const members = getInviteMembers(g).filter((m) => m.status === 'confirmed');
                    const enteredCount = members.filter((m) => m.checkedIn).length;
                    const totalCount = members.length;
                    const isAllEntered = totalCount > 0 && enteredCount === totalCount;
                    const isPartiallyEntered = enteredCount > 0 && !isAllEntered;

                    return (
                      <tr key={g.id} className="hover:bg-[#FAF6EE]/30 dark:hover:bg-[#2A1738]/30 transition-colors">
                        {/* Titular (oculto no mobile conforme Requisito 7) */}
                        <td className="hidden md:table-cell py-3.5 px-4 font-bold align-top">
                          <p className="text-xs sm:text-sm font-bold text-[#24152F] dark:text-[#F7F1E5]">
                            {g.displayName || g.name}
                          </p>
                          <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-normal">
                            Tel: {g.phone || 'Não informado'} • Tag: {normalizeGuestGroup(g.group)}
                          </p>
                        </td>

                        {/* Participantes Nominais (Item 8 do Prompt) */}
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1">
                            {members.map((m) => (
                              <div key={m.id} className="flex items-center gap-1.5 text-[11px]">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    m.checkedIn ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                />
                                <span className="font-semibold text-[#24152F] dark:text-[#F7F1E5]">
                                  {m.name}
                                </span>
                                <span className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                                  ({m.isPrimary ? 'Titular' : 'Acomp.'} • {m.category})
                                </span>
                                {m.checkedIn && (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                    ✓ Entrou
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Código QR / Reserva Unificado */}
                        <td className="py-3.5 px-3 align-top font-mono text-[11px] text-[#24152F]/80 dark:text-[#D2C4DC]">
                          {g.rsvpCode || g.checkInCode || '—'}
                        </td>

                        {/* Status de Entrada */}
                        <td className="py-3.5 px-3 align-top">
                          {isAllEntered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 leading-tight">
                              <Check className="w-3 h-3" /> Completo ({enteredCount}/{totalCount})
                            </span>
                          ) : isPartiallyEntered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 leading-tight">
                              Parcial ({enteredCount}/{totalCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 leading-tight">
                              Pendente (0/{totalCount})
                            </span>
                          )}
                        </td>

                        {/* Ação: Abrir Ficha */}
                        <td className="py-3.5 px-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedGuestForReception(g)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#DFFF5F] font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Credenciar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Relatórios e Histórico de Entradas (Item 10 do Prompt) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Discriminação Adultos vs Crianças */}
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
              <span>Distribuição por Faixa Etária</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/70 block">Adultos</span>
                <p className="text-lg font-extrabold text-[#24152F] dark:text-[#F7F1E5] mt-1">
                  {enteredAdults} <span className="text-xs font-normal text-[#24152F]/60">de {confirmedAdults}</span>
                </p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                  {confirmedAdults > 0 ? Math.round((enteredAdults / confirmedAdults) * 100) : 0}% presentes
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/70 block">Crianças</span>
                <p className="text-lg font-extrabold text-[#24152F] dark:text-[#F7F1E5] mt-1">
                  {enteredChildren} <span className="text-xs font-normal text-[#24152F]/60">de {confirmedChildren}</span>
                </p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                  {confirmedChildren > 0 ? Math.round((enteredChildren / confirmedChildren) * 100) : 0}% presentes
                </span>
              </div>
            </div>
          </div>

          {/* Histórico recente de entradas com operador */}
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
              <span>Últimas Entradas Registradas</span>
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {confirmedReceptionGuests
                .flatMap((g) =>
                  (g.members || [])
                    .filter((m) => m.checkedIn && m.checkedInAt)
                    .map((m) => ({
                      member: m,
                      guest: g,
                    }))
                )
                .sort((a, b) => new Date(b.member.checkedInAt!).getTime() - new Date(a.member.checkedInAt!).getTime())
                .slice(0, 5)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FAF6EE]/60 dark:bg-[#2A1738]/50 border border-[#24152F]/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">
                        {item.member.name}
                      </p>
                      <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                        Reserva: {item.guest.displayName || item.guest.name}
                        {item.member.checkedInBy && ` • Operador: ${item.member.checkedInBy}`}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#24152F]/70 dark:text-[#D2C4DC]/70">
                      {formatDateTimeBR(item.member.checkedInAt!)}
                    </span>
                  </div>
                ))}

              {totalEnteredPersons === 0 && (
                <p className="text-xs text-[#24152F]/50 dark:text-[#D2C4DC]/50 py-3 text-center">
                  Nenhuma entrada registrada até o momento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
      </main>
      
      {/* Rodapé Padronizado com o Sistema Administrativo */}
      <Footer />

      {/* Guest Details Modal for Client */}
      {selectedGuestForDetail && (
        <div className="fixed inset-0 z-50 bg-[#180D20]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/50 dark:text-[#D2C4DC]/60">
                  Ficha de Resposta
                </span>
                <h3 className="text-lg font-bold text-[#24152F] dark:text-[#F7F1E5]">{selectedGuestForDetail.displayName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuestForDetail(null)}
                className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] flex items-center justify-center hover:bg-[#24152F] hover:text-[#F7F1E5] dark:hover:bg-[#DFFF5F] dark:hover:text-[#180D20] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738]">
                  <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold">Status de Presença</p>
                  <p className="font-bold text-[#24152F] dark:text-[#F7F1E5] mt-0.5">
                    {selectedGuestForDetail.status === 'confirmed'
                      ? 'Confirmado'
                      : 'Ausente'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738]">
                  <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 font-semibold">Data da Resposta</p>
                  <p className="font-bold text-[#24152F] dark:text-[#F7F1E5] mt-0.5">
                    {selectedGuestForDetail.respondedAt
                      ? formatDateTimeBR(selectedGuestForDetail.respondedAt)
                      : 'Registrado'}
                  </p>
                </div>
              </div>

              {selectedGuestForDetail.companionCount > 0 && (
                <div className="p-3.5 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#24152F]/40 space-y-1.5">
                  <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">
                    Acompanhantes ({selectedGuestForDetail.companionCount})
                  </p>
                  {selectedGuestForDetail.companionNames && selectedGuestForDetail.companionNames.length > 0 ? (
                    <ul className="list-disc list-inside text-[#24152F]/80 dark:text-[#D2C4DC] space-y-0.5">
                      {selectedGuestForDetail.companionNames.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#24152F]/60 dark:text-[#D2C4DC]/60">Nenhum nome adicional informado.</p>
                  )}
                </div>
              )}

              {/* Answers to questions — Exibir SOMENTE quando o formulário do evento possuir perguntas personalizadas */}
              {(() => {
                const eventCustomQuestions = (questions || []).filter((q) => {
                  const matchesEvent = !q.eventId || q.eventId === (event?.id || selectedGuestForDetail.eventId);
                  const isStandardField = [
                    'q_group',
                    'group',
                    'q_message',
                    'message',
                    'presence',
                    'status',
                    'companionCount',
                    'companionNames',
                    'phone',
                    'email',
                    'name',
                    'rsvpCode',
                  ].includes(q.id);
                  return matchesEvent && !isStandardField;
                });

                if (eventCustomQuestions.length === 0) return null;

                return (
                  <div className="p-3.5 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#24152F]/40 space-y-2">
                    <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">Respostas do Formulário</p>
                    <div className="space-y-2">
                      {eventCustomQuestions.map((questionObj) => {
                        const rawAns = selectedGuestForDetail.answers ? selectedGuestForDetail.answers[questionObj.id] : undefined;
                        const hasAnswer =
                          rawAns !== undefined &&
                          rawAns !== null &&
                          rawAns !== '' &&
                          !(Array.isArray(rawAns) && rawAns.length === 0);

                        return (
                          <div key={questionObj.id} className="border-t border-[#24152F]/5 dark:border-[#3F2553]/50 pt-1.5">
                            <p className="text-[11px] font-semibold text-[#24152F]/60 dark:text-[#D2C4DC]/60">{questionObj.title}</p>
                            <p className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mt-0.5">
                              {hasAnswer ? (Array.isArray(rawAns) ? rawAns.join(', ') : String(rawAns)) : 'Não respondida'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {selectedGuestForDetail.notes && (
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-[#2E1B3C]/50 border border-purple-200/50 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5]">
                  <p className="text-[10px] text-purple-900 dark:text-[#DFFF5F] font-bold">Mensagem aos Anfitriões</p>
                  <p className="mt-1 italic">{selectedGuestForDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedGuestForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] font-semibold text-xs cursor-pointer hover:bg-[#180D20] dark:hover:bg-[#CEF04A] transition-colors"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Filtrar (Item 3 do User Request) */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/70 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-100">
            {/* Cabeçalho com título "Filtrar" e botão X */}
            <div className="flex items-center justify-between pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#24152F] dark:text-[#F7F1E5]" />
                <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">Filtrar</h3>
              </div>
              <button
                type="button"
                id="btn-close-filter-modal-client"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:text-[#24152F] dark:hover:text-[#F7F1E5] hover:bg-[#EDE4D3] dark:hover:bg-[#321C42] flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar modal de filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Status — Dropdown */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">Status</label>
                <select
                  value={draftFilterStatus}
                  onChange={(e) => setDraftFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#2A1738] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
                >
                  <option value="all">Todos</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="declined">Ausente</option>
                </select>
              </div>

              {/* 2. Faixa etária — Radio buttons */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">Faixa etária</label>
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
                          ? 'bg-[#E8F0E4] dark:bg-emerald-950/40 border-[#A3C79E] dark:border-emerald-600 text-[#1E3B1E] dark:text-emerald-300'
                          : 'bg-white dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:bg-[#FAF6EE] dark:hover:bg-[#321C42]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="draftFilterAgeCategoryClient"
                        value={option.id}
                        checked={draftFilterAgeCategory === option.id}
                        onChange={() => setDraftFilterAgeCategory(option.id as any)}
                        className="accent-[#24152F] dark:accent-[#DFFF5F]"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Grupo — Chips selecionáveis (múltipla seleção) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">Grupo</label>
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
                            ? 'bg-[#E8F0E4] dark:bg-emerald-950/40 border-[#A3C79E] dark:border-emerald-600 text-[#1E3B1E] dark:text-emerald-300 shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:bg-[#FAF6EE]/80 dark:hover:bg-[#321C42]'
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
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
              <button
                type="button"
                onClick={() => {
                  setDraftFilterStatus('all');
                  setDraftFilterAgeCategory('ambos');
                  setDraftFilterSelectedGroups([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent transition-colors cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] dark:hover:bg-[#CEF04A] transition-colors cursor-pointer shadow-xs border border-[#3F2553] dark:border-[#DFFF5F]"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Credenciamento e Recepção */}
      <ReceptionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleValidateQrCode}
      />

      <ReceptionGuestModal
        guest={selectedGuestForReception}
        operatorName={authenticatedUser || event.clientName || 'Recepção'}
        onClose={() => setSelectedGuestForReception(null)}
        onRecordCheckIn={handleRecordCheckIn}
      />
    </div>
  );
};
