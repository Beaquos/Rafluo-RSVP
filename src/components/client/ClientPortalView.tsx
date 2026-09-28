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
} from 'lucide-react';
import { EventData, GuestData, ManagerData, FormQuestionData } from '../../data/mockData';
import { formatDateBR, formatDateTimeBR } from '../../utils/dateUtils';
import { copyToClipboard, getEventRsvpUrl } from '../../utils/linkUtils';
import { exportReportToXLSX, exportReportToPDF } from '../../utils/reportExportUtils';
import { ExportDataDropdown } from '../common/ExportDataDropdown';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { RafluoLogo } from '../common/RafluoLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Footer } from '../admin/Footer';

export interface ClientPortalViewProps {
  event: EventData;
  guests: GuestData[];
  managers?: ManagerData[];
  questions?: FormQuestionData[];
  onBackToHub?: () => void;
  onShowToast?: (message: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  event,
  guests,
  managers = [],
  questions = [],
  onBackToHub,
  onShowToast,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'declined'>('all');
  const [selectedGuestForDetail, setSelectedGuestForDetail] = useState<GuestData | null>(null);

  // Filter guests for this event
  const eventGuests = useMemo(() => {
    return guests.filter((g) => g.eventId === event.id);
  }, [guests, event.id]);

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

  // Filtered list based on search and status
  const displayedGuests = useMemo(() => {
    return eventGuests.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.phone && g.phone.includes(searchTerm)) ||
        (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return g.status === statusFilter;
    });
  }, [eventGuests, searchTerm, statusFilter]);

  // Handle Login Validation
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
              <p className="text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/70 font-medium uppercase tracking-wider">
                Acompanhamento Exclusivo do Evento
              </p>
              <h2 className="text-xl font-bold text-[#24152F] dark:text-[#F7F1E5]">{event.name}</h2>
              {event.clientName && (
                <p className="text-xs text-[#24152F]/80 dark:text-[#D2C4DC] font-semibold pt-0.5">
                  Responsável: {event.clientName}
                </p>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE]/40 dark:bg-[#2A1738] text-xs sm:text-sm text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-2 focus:ring-[#DFFF5F] focus:bg-white dark:focus:bg-[#24152F] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  Informe o e-mail cadastrado para ter acesso às confirmações de presença e métricas.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-submit-client-login"
                className="w-full py-3 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
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
                <span>{isCopiedRsvp ? 'Link Copiado!' : 'Copiar Link'}</span>
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
                <span>Ver Convite</span>
              </a>
            </div>
          </div>
        </div>

        {/* Metrics Overview Cards (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Convidados */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F]/70 dark:text-[#D2C4DC]/80">Total Convidados</span>
              <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 dark:bg-white/10 text-[#24152F] dark:text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#24152F] dark:text-[#F7F1E5]">{totalConvidados}</p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-0.5 font-medium">Cadastrados no evento</p>
            </div>
          </div>

          {/* Confirmados */}
          <div className="bg-white dark:bg-[#1E1128] p-4 sm:p-5 rounded-2xl border border-[#DFFF5F]/80 dark:border-[#DFFF5F]/40 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#DFFF5F]/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-[#24152F] dark:text-[#F7F1E5]">
              <span className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">Confirmados</span>
              <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center shadow-xs ring-1 ring-[#DFFF5F]/60 flex-shrink-0">
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
              <div className="w-8 h-8 rounded-xl bg-[#24152F]/10 dark:bg-white/10 text-[#24152F] dark:text-[#DFFF5F] flex items-center justify-center shadow-xs flex-shrink-0">
                <Users className="w-4 h-4" />
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

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#24152F]/40 dark:text-[#D2C4DC]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, telefone ou e-mail..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE]/50 dark:bg-[#2A1738] text-xs text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 dark:placeholder:text-[#D2C4DC]/40 focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: `Todos (${totalConvidados})` },
                { id: 'confirmed', label: `Confirmados (${confirmedCount})` },
                { id: 'declined', label: `Não Comparecem (${declinedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20]'
                      : 'bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC]/80 hover:bg-[#FAF6EE]/80 dark:hover:bg-[#321C42]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553]">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[620px]">
              <thead className="bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/80 dark:text-[#D2C4DC] font-bold border-b border-[#24152F]/10 dark:border-[#3F2553]">
                <tr>
                  <th className="py-3 px-4">Convidado</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Acompanhantes</th>
                  <th className="py-3 px-3">Data e Hora</th>
                  <th className="py-3 px-4 text-right">Ficha</th>
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
                  displayedGuests.map((g) => (
                    <tr key={g.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#2A1738]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#24152F] dark:text-[#F7F1E5] block">{g.displayName || g.name}</span>
                        {(g.phone || g.email) && (
                          <span className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 block mt-0.5">
                            {g.phone} {g.phone && g.email && '•'} {g.email}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {g.status === 'confirmed' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DFFF5F] text-[#180D20]">
                            Confirmado
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                            Não comparecerá
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {g.status === 'confirmed' && g.companionCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] border border-[#24152F]/10 dark:border-[#3F2553]">
                            +{g.companionCount}
                          </span>
                        ) : (
                          <span className="text-[#24152F]/40 dark:text-[#D2C4DC]/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#24152F]/70 dark:text-[#D2C4DC]/70 font-medium">
                        {g.respondedAt ? formatDateTimeBR(g.respondedAt) : 'Registrado'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedGuestForDetail(g)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] hover:bg-[#24152F] hover:text-[#F7F1E5] dark:hover:bg-[#DFFF5F] dark:hover:text-[#180D20] text-[#24152F] dark:text-[#F7F1E5] font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                      : 'Não Comparecerá'}
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

              {/* Answers to questions */}
              {selectedGuestForDetail.answers && Object.keys(selectedGuestForDetail.answers).length > 0 && (
                <div className="p-3.5 rounded-xl border border-[#24152F]/10 dark:border-[#3F2553] bg-white dark:bg-[#24152F]/40 space-y-2">
                  <p className="font-bold text-[#24152F] dark:text-[#F7F1E5]">Respostas do Formulário</p>
                  <div className="space-y-2">
                    {Object.entries(selectedGuestForDetail.answers).map(([key, val]) => {
                      const questionObj = questions.find((q) => q.id === key);
                      const title = questionObj ? questionObj.title : key;
                      return (
                        <div key={key} className="border-t border-[#24152F]/5 dark:border-[#3F2553]/50 pt-1.5">
                          <p className="text-[11px] font-semibold text-[#24152F]/60 dark:text-[#D2C4DC]/60">{title}</p>
                          <p className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mt-0.5">
                            {Array.isArray(val) ? val.join(', ') : String(val)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
    </div>
  );
};
