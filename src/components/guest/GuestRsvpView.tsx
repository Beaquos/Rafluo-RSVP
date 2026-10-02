import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Edit3,
  User,
  Phone,
  Mail,
  Users,
  Check,
  Gift,
  ExternalLink,
  Timer,
  Baby,
} from 'lucide-react';
import { EventData, GuestData, FormQuestionData, InviteMember } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';
import { getInviteMembers } from '../../utils/inviteUtils';
import {
  getStoredEventByIdOrSlug,
  getStoredQuestionsForEvent,
  subscribeToCrossTabSync,
} from '../../utils/storageUtils';
import { RafluoLogo } from '../common/RafluoLogo';

interface GuestRsvpViewProps {
  event: EventData;
  guest?: GuestData | null;
  questions?: FormQuestionData[];
  onBackToAdmin?: () => void;
  onSubmitRsvp: (
    guestId: string,
    status: 'confirmed' | 'declined',
    companionCount: number,
    companionNames: string[],
    answers: Record<string, any>,
    guestInfo?: { name: string; phone: string; email: string },
    members?: InviteMember[]
  ) => void;
  isPublicMode?: boolean;
  isPublicEventInvite?: boolean;
}

export const GuestRsvpView: React.FC<GuestRsvpViewProps> = ({
  event: propEvent,
  guest,
  questions: _propQuestions = [],
  onBackToAdmin,
  onSubmitRsvp,
  isPublicMode = false,
  isPublicEventInvite = false,
}) => {
  // Always query the freshest persisted configuration for this event
  const [currentEvent, setCurrentEvent] = useState<EventData>(() => {
    return getStoredEventByIdOrSlug(propEvent.slug || propEvent.id) || propEvent;
  });

  const [currentQuestions, setCurrentQuestions] = useState<FormQuestionData[]>(() => {
    return getStoredQuestionsForEvent(currentEvent.id);
  });

  // Re-sync whenever incoming propEvent changes
  useEffect(() => {
    const fresh = getStoredEventByIdOrSlug(propEvent.slug || propEvent.id) || propEvent;
    setCurrentEvent(fresh);
    setCurrentQuestions(getStoredQuestionsForEvent(fresh.id));
  }, [propEvent]);

  // Subscribe to real-time sync across tabs or admin customization saves
  useEffect(() => {
    const handleSync = (type: string) => {
      if (type === 'events_updated') {
        const fresh = getStoredEventByIdOrSlug(propEvent.slug || propEvent.id);
        if (fresh) setCurrentEvent(fresh);
      } else if (type === 'questions_updated') {
        setCurrentQuestions(getStoredQuestionsForEvent(propEvent.id));
      }
    };

    const unsubscribe = subscribeToCrossTabSync(handleSync);
    return unsubscribe;
  }, [propEvent.id, propEvent.slug]);

  // Alias for backward-compatibility with rest of the component
  const event = currentEvent;
  const questions = currentQuestions;

  // If it's a public event invite, we start completely fresh without any prior guest data
  const isIndividual = !isPublicEventInvite && !!guest;

  // Members if grouped invite
  const initialMembers = isIndividual && guest ? getInviteMembers(guest) : [];
  const isGroupedInvite = isIndividual && initialMembers.length > 0;

  const [memberDecisions, setMemberDecisions] = useState<Record<string, 'confirmed' | 'declined' | null>>(() => {
    const map: Record<string, 'confirmed' | 'declined' | null> = {};
    initialMembers.forEach((m) => {
      map[m.id] = m.status === 'confirmed' ? 'confirmed' : m.status === 'declined' ? 'declined' : null;
    });
    return map;
  });

  const [submissionSummary, setSubmissionSummary] = useState<{
    confirmed: string[];
    declined: string[];
  } | null>(() => {
    if (isIndividual && guest && guest.status && guest.status !== 'pending') {
      const mems = getInviteMembers(guest);
      const conf = mems.filter((m) => m.status === 'confirmed').map((m) => m.name);
      const decl = mems.filter((m) => m.status === 'declined').map((m) => m.name);
      return { confirmed: conf, declined: decl };
    }
    return null;
  });

  // Guest identification fields (for public open link or individual prefill)
  const [guestName, setGuestName] = useState<string>(isIndividual ? guest?.name || '' : '');
  const [guestPhone, setGuestPhone] = useState<string>(isIndividual ? guest?.phone || '' : '');
  const [guestEmail, setGuestEmail] = useState<string>(isIndividual ? guest?.email || '' : '');

  // Form responses
  const [attending, setAttending] = useState<'sim' | 'nao' | null>(
    isIndividual
      ? guest?.status === 'confirmed'
        ? 'sim'
        : guest?.status === 'declined'
        ? 'nao'
        : null
      : null
  );

  const [hasCompanions, setHasCompanions] = useState<'sim' | 'nao'>(
    isIndividual && (guest?.companionCount || 0) > 0 ? 'sim' : 'nao'
  );

  const maxAllowedCompanions = isIndividual
    ? guest?.maxGuests || event.maxGuestsPerInvite || 1
    : event.allowGuests
    ? event.maxGuestsPerInvite || 2
    : 0;

  const [companionCount, setCompanionCount] = useState<number>(
    isIndividual && (guest?.companionCount || 0) > 0 ? guest.companionCount : 1
  );

  // Individual companion names (Item 5: Acompanhante 1 — Nome, Acompanhante 2 — Nome)
  const [companionNamesList, setCompanionNamesList] = useState<string[]>(() => {
    if (isIndividual && guest?.companionNames && guest.companionNames.length > 0) {
      return [...guest.companionNames];
    }
    return [''];
  });

  // Adjust companionNamesList when companionCount changes
  useEffect(() => {
    setCompanionNamesList((prev) => {
      const next = [...prev];
      while (next.length < companionCount) {
        next.push('');
      }
      return next.slice(0, companionCount);
    });
  }, [companionCount]);

  // Crianças (Item 6: quantidade, limite de idade e nomes individuais)
  const [hasChildren, setHasChildren] = useState<'sim' | 'nao'>('nao');
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [childrenNamesList, setChildrenNamesList] = useState<string[]>(['']);

  useEffect(() => {
    setChildrenNamesList((prev) => {
      const next = [...prev];
      while (next.length < childrenCount) {
        next.push('');
      }
      return next.slice(0, childrenCount);
    });
  }, [childrenCount]);

  const [dietary, setDietary] = useState<string[]>(
    isIndividual && guest?.answers?.q_dietary ? guest.answers.q_dietary : []
  );

  const [message, setMessage] = useState<string>(
    isIndividual && guest?.answers?.q_message ? guest.answers.q_message : ''
  );

  // Custom questions answers
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>(
    isIndividual && guest?.answers ? { ...guest.answers } : {}
  );

  // Submitted state
  const [submitted, setSubmitted] = useState<boolean>(
    isIndividual ? guest?.status !== 'pending' : false
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  // Live countdown state (Itens 3 e 4)
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

  const handleToggleDietary = (item: string) => {
    if (dietary.includes(item)) {
      setDietary(dietary.filter((d) => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  };

  const handleCustomAnswerChange = (questionId: string, value: any) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Grouped invite flow (single or multiple pre-registered members)
    if (isGroupedInvite) {
      const unanswered = initialMembers.find((m) => !memberDecisions[m.id]);
      if (unanswered) {
        setValidationError(`Por favor, selecione "Vou" ou "Não vou" para ${unanswered.name}.`);
        return;
      }

      let updatedMembers: InviteMember[] = initialMembers.map((m) => ({
        ...m,
        status: memberDecisions[m.id] || 'declined',
      }));

      // Se o anfitrião não cadastrou o nome de algum acompanhante, incluir os preenchidos
      if (hasCompanions === 'sim' && companionNamesList.length > 0) {
        companionNamesList.forEach((cName, idx) => {
          if (cName.trim()) {
            updatedMembers.push({
              id: `${guest!.id}-extra-comp-${idx}`,
              name: cName.trim(),
              category: 'Adulto',
              status: 'confirmed',
              isPrimary: false,
            });
          }
        });
      }

      const confirmedNames = updatedMembers.filter((m) => m.status === 'confirmed').map((m) => m.name);
      const declinedNames = updatedMembers.filter((m) => m.status === 'declined').map((m) => m.name);
      const overallStatus: 'confirmed' | 'declined' = confirmedNames.length > 0 ? 'confirmed' : 'declined';

      setSubmissionSummary({ confirmed: confirmedNames, declined: declinedNames });
      setAttending(overallStatus === 'confirmed' ? 'sim' : 'nao');

      const answers: Record<string, any> = {
        ...customAnswers,
        q_presence: overallStatus === 'confirmed' ? 'sim' : 'nao',
        q_dietary: dietary,
        q_message: message,
      };

      const guestInfo = {
        name: guest?.name || guestName,
        phone: guestPhone.trim() || guest?.phone || '',
        email: guestEmail.trim() || guest?.email || '',
      };

      onSubmitRsvp(
        guest!.id,
        overallStatus,
        Math.max(0, confirmedNames.length - 1),
        confirmedNames.slice(1),
        answers,
        guestInfo,
        updatedMembers
      );
      setSubmitted(true);
      return;
    }

    // Single guest or public link flow
    // Validate guest name in public mode
    if (isPublicEventInvite && !guestName.trim()) {
      setValidationError('Por favor, informe seu nome completo para confirmar presença.');
      return;
    }

    if (!attending) {
      setValidationError('Por favor, informe se você poderá ou não comparecer ao evento.');
      return;
    }

    const finalStatus: 'confirmed' | 'declined' = attending === 'sim' ? 'confirmed' : 'declined';
    const finalCompanionCount =
      attending === 'sim' && hasCompanions === 'sim' && maxAllowedCompanions > 0
        ? companionCount
        : 0;

    const validCompanionNames =
      attending === 'sim' && hasCompanions === 'sim' && maxAllowedCompanions > 0
        ? companionNamesList.map((n) => n.trim()).filter(Boolean)
        : [];

    const validChildNames =
      attending === 'sim' && hasChildren === 'sim'
        ? childrenNamesList.map((n) => n.trim()).filter(Boolean)
        : [];

    const primaryName = guestName.trim() || (guest?.name ?? 'Convidado');
    const targetGuestId = isIndividual && guest ? guest.id : `g-pub-${Date.now()}`;

    const confirmedNames =
      finalStatus === 'confirmed'
        ? [primaryName, ...validCompanionNames, ...validChildNames]
        : [];
    const declinedNames = finalStatus === 'declined' ? [primaryName] : [];

    setSubmissionSummary({ confirmed: confirmedNames, declined: declinedNames });

    // Construir os registros individuais dos membros vinculados ao convite (Itens 5, 6, 7 e 12)
    const members: InviteMember[] = [
      {
        id: `${targetGuestId}-primary`,
        name: primaryName,
        category: 'Adulto',
        status: finalStatus,
        isPrimary: true,
      },
      ...validCompanionNames.map((name, i) => ({
        id: `${targetGuestId}-comp-${i}`,
        name,
        category: 'Adulto' as const,
        status: finalStatus,
        isPrimary: false,
      })),
      ...validChildNames.map((name, i) => ({
        id: `${targetGuestId}-child-${i}`,
        name,
        category: 'Criança' as const,
        status: finalStatus,
        isPrimary: false,
      })),
    ];

    const answers: Record<string, any> = {
      ...customAnswers,
      q_presence: attending,
      q_has_companions: hasCompanions,
      q_companion_count: finalCompanionCount,
      q_companion_names: validCompanionNames.join(', '),
      q_has_children: hasChildren,
      q_children_count: validChildNames.length,
      q_children_names: validChildNames.join(', '),
      q_dietary: dietary,
      q_message: message,
    };

    const guestInfo = {
      name: primaryName,
      phone: guestPhone.trim(),
      email: guestEmail.trim(),
    };

    onSubmitRsvp(
      targetGuestId,
      finalStatus,
      finalCompanionCount + validChildNames.length,
      [...validCompanionNames, ...validChildNames],
      answers,
      guestInfo,
      members
    );
    setSubmitted(true);
  };

  const handleResetForAnotherResponse = () => {
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setAttending(null);
    setHasCompanions('nao');
    setCompanionCount(1);
    setCompanionNamesList(['']);
    setHasChildren('nao');
    setChildrenCount(1);
    setChildrenNamesList(['']);
    setDietary([]);
    setMessage('');
    setCustomAnswers({});
    setSubmitted(false);
    setValidationError(null);
  };

  const displayNameForCard = guestName.trim() || guest?.displayName || guest?.name || 'Convidado(a)';

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#24152F] font-sans pb-16 selection:bg-[#DFFF5F] selection:text-[#180D20]">
      {/* Top Simulation Bar (Admin preview banner only when NOT in public guest link mode) */}
      {!isPublicMode && onBackToAdmin && (
        <div className="bg-[#24152F] text-[#F7F1E5] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs sticky top-0 z-50 border-b border-[#3F2553]/60 shadow-md">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#DFFF5F] animate-pulse flex-shrink-0" />
            <span className="font-semibold text-[#DFFF5F] truncate">
              {isPublicEventInvite ? 'Simulação: Link Público do Convite' : 'Visualização do Convidado'}
            </span>
            {guest?.rsvpCode && !isPublicEventInvite && (
              <span className="hidden sm:inline text-[#D2C4DC]/70">| Código: {guest.rsvpCode}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-[#2E1B3C] hover:bg-[#3F2553] text-[#F7F1E5] font-semibold text-xs transition-colors border border-[#3F2553] cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voltar ao Painel</span>
            <span className="sm:hidden">Voltar</span>
          </button>
        </div>
      )}

      <div className="max-w-xl mx-auto px-3.5 sm:px-4 pt-4 sm:pt-8 space-y-5 sm:space-y-6">
        {/* Rafluo Header Badge */}
        <div className="flex items-center justify-center pt-2">
          <RafluoLogo variant="light" size="sm" showDescriptor={false} showOrigin={false} />
        </div>

        {/* 1. Imagem de Destaque / Banner do Convite */}
        {Boolean(event.showCoverImage) && Boolean(event.coverImage) && (
          <div className="w-full h-44 sm:h-64 rounded-3xl overflow-hidden border border-[#24152F]/15 shadow-md relative bg-[#24152F]/5">
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event Hero Card in Deep Purple with Neon Accents */}
        <div className="rounded-3xl bg-[#24152F] text-[#F7F1E5] p-5 sm:p-8 text-center space-y-4 relative overflow-hidden shadow-xl border border-[#3F2553]">
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#DFFF5F]/10 blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFFF5F]/15 text-[#DFFF5F] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-[#DFFF5F]/20">
            <Sparkles className="w-3.5 h-3.5" /> Convite Oficial • RSVP
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#F7F1E5] break-words">
            {event.name}
          </h1>

          {event.description && (
            <p className="text-xs sm:text-sm text-[#D2C4DC] max-w-md mx-auto leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="pt-1 sm:pt-2 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm text-[#D2C4DC]">
            <span className="flex items-center gap-1.5 font-medium text-[#F7F1E5]">
              <Calendar className="w-4 h-4 text-[#DFFF5F]" />
              <strong>{formatDateBR(event.date)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#DFFF5F]" />
              <span>{event.time}</span>
            </span>
            <span className="flex items-center gap-1.5 text-center break-words max-w-full">
              <MapPin className="w-3.5 h-3.5 text-[#DFFF5F] flex-shrink-0" />
              <span>{event.location}</span>
            </span>
          </div>

          <div className="pt-3 border-t border-[#3F2553]/80 text-[11px] text-[#D2C4DC]/80">
            Confirmação de presença até: <strong className="text-[#F7F1E5]">{formatDateBR(event.rsvpDeadline)}</strong>
          </div>
        </div>

        {/* 2. Mensagem Inicial de Abertura */}
        {Boolean(event.showWelcomeMessage) && Boolean(event.welcomeMessage) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#24152F]/10 shadow-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#DFFF5F]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-[#24152F] leading-relaxed italic">
                "{event.welcomeMessage}"
              </p>
            </div>
          </div>
        )}

        {/* 3. Contagem regressiva */}
        {Boolean(event.showCountdown) && timeLeft && !timeLeft.isPast && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#24152F]/10 shadow-xs space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#24152F] uppercase tracking-wider">
              <Timer className="w-3.5 h-3.5 text-[#24152F]" />
              <span>Contagem regressiva</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="block text-xl sm:text-2xl font-extrabold text-[#24152F]">{timeLeft.days}</span>
                <span className="block text-[10px] text-[#24152F]/60 font-semibold uppercase">Dias</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="block text-xl sm:text-2xl font-extrabold text-[#24152F]">{timeLeft.hours}</span>
                <span className="block text-[10px] text-[#24152F]/60 font-semibold uppercase">Horas</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="block text-xl sm:text-2xl font-extrabold text-[#24152F]">{timeLeft.minutes}</span>
                <span className="block text-[10px] text-[#24152F]/60 font-semibold uppercase">Min</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="block text-xl sm:text-2xl font-extrabold text-[#24152F]">{timeLeft.seconds}</span>
                <span className="block text-[10px] text-[#24152F]/60 font-semibold uppercase">Seg</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Lista de Presentes */}
        {Boolean(event.showGiftList) && event.giftListType === 'link' && Boolean(event.giftListUrl) && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#24152F]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F] flex-shrink-0 shadow-2xs">
                <Gift className="w-4 h-4 text-[#24152F]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#24152F]">Lista de Presentes</h4>
                <p className="text-[11px] text-[#24152F]/60">Acesse a nossa lista oficial de presentes online.</p>
              </div>
            </div>
            <a
              href={event.giftListUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Ver Lista</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#DFFF5F]" />
            </a>
          </div>
        )}

        {Boolean(event.showGiftList) && event.giftListType === 'items' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#24152F]/10 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FAF6EE] border border-[#24152F]/15 flex items-center justify-center text-[#24152F] flex-shrink-0 shadow-2xs">
                <Gift className="w-4 h-4 text-[#24152F]" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[#24152F]">Itens Desejados da Lista</h4>
            </div>
            {/* Cards destacados individuais para cada item da lista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(event.giftListItemsList && event.giftListItemsList.length > 0
                ? event.giftListItemsList
                : (event.giftListItems || '').split('\n').filter((item) => item.trim().length > 0)
              ).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/15 shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#24152F] flex items-center justify-center text-[#DFFF5F] flex-shrink-0">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#24152F] leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalized Welcome Card (only for individual response link) */}
        {isIndividual && guest && !submitted && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#24152F]/10 shadow-xs space-y-1">
            <p className="text-xs text-[#24152F]/60 font-medium">Você está convidado(a):</p>
            <h2 className="text-lg sm:text-xl font-bold text-[#24152F] break-words">
              {guest.inviteName || guest.displayName}
            </h2>
            {guest.maxGuests > 0 && (
              <p className="text-xs text-[#24152F]/70 pt-0.5">
                Autorizado: <strong>{guest.maxGuests} acompanhante(s)</strong>
              </p>
            )}
          </div>
        )}

        {/* Success Confirmation Card if submitted */}
        {submitted ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#24152F]/15 shadow-md text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
                attending === 'sim'
                  ? 'bg-[#DFFF5F] text-[#180D20] ring-4 ring-[#DFFF5F]/30'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {attending === 'sim' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-[#24152F]">
                {attending === 'sim' ? 'Presença Confirmada!' : 'Resposta Registrada'}
              </h3>
              <p className="text-xs sm:text-sm text-[#24152F]/70 max-w-sm mx-auto leading-relaxed">
                {attending === 'sim'
                  ? `Ficamos muito felizes, ${displayNameForCard}! Sua presença${
                      hasCompanions === 'sim' && companionCount > 0 ? ` e a de seus acompanhantes (+${companionCount})` : ''
                    } foi confirmada com sucesso.`
                  : `Agradecemos por nos avisar com antecedência, ${displayNameForCard}. Sua resposta foi salva!`}
              </p>
            </div>

            {/* Resumo de quem vai e quem não vai (Item do fluxo público) */}
            {submissionSummary && (
              <div className="pt-2 text-left max-w-sm mx-auto space-y-2">
                {submissionSummary.confirmed.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                      ✔ Presença confirmada ({submissionSummary.confirmed.length}):
                    </span>
                    <div className="space-y-1">
                      {submissionSummary.confirmed.map((name, i) => (
                        <div key={`conf-${i}`} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                          <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {submissionSummary.declined.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-800 block mb-1">
                      ✖ Não comparecerá ({submissionSummary.declined.length}):
                    </span>
                    <div className="space-y-1">
                      {submissionSummary.declined.map((name, i) => (
                        <div key={`decl-${i}`} className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                          <XCircle className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
              {event.allowResponseEdit !== false ? (
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#FAF6EE] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Alterar Minha Resposta
                </button>
              ) : (
                <span className="text-[11px] text-[#24152F]/60 italic">
                  Alterações de resposta desabilitadas para este evento.
                </span>
              )}

              {isPublicEventInvite && (
                <button
                  type="button"
                  onClick={handleResetForAnotherResponse}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#24152F] text-[#F7F1E5] hover:bg-[#180D20] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#DFFF5F]" /> Confirmar para Outra Pessoa
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Interactive RSVP Form */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 sm:p-7 border border-[#24152F]/10 shadow-sm space-y-6"
          >
            <div className="pb-3 border-b border-[#24152F]/10">
              <h3 className="text-base font-bold text-[#24152F]">
                Confirmação de Presença
              </h3>
              <p className="text-xs text-[#24152F]/60 mt-0.5">
                Por favor, preencha as informações abaixo até {formatDateBR(event.rsvpDeadline)}
              </p>
            </div>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Identification fields for Public Event Link */}
            {isPublicEventInvite && (
              <div className="space-y-3.5 pb-4 border-b border-[#24152F]/10">
                <label className="block text-xs font-bold text-[#24152F] uppercase tracking-wider text-[11px]">
                  Seus Dados
                </label>

                <div>
                  <label className="block text-xs font-semibold text-[#24152F] mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gabriel Alencar"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs sm:text-sm text-[#24152F] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24152F] mb-1">
                    WhatsApp / Telefone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="(DDD) 99999-9999"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs sm:text-sm text-[#24152F] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Choice: Individual selection for grouped invites (with 1 or more pre-registered members) */}
            {isGroupedInvite ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#24152F]">
                    Confirme a presença de cada convidado: <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-[#24152F]/65">
                    Selecione "Vou" ou "Não vou" individualmente para cada pessoa deste convite.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {initialMembers.map((m) => {
                    const decision = memberDecisions[m.id];
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl border border-[#24152F]/15 bg-[#FAF6EE]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white border border-[#24152F]/15 flex items-center justify-center text-[#24152F] flex-shrink-0 shadow-2xs">
                            {m.category === 'Criança' ? <Baby className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-[#24152F] block truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-[#24152F]/60 block font-medium">
                              {m.isPrimary ? 'Titular do convite' : `Categoria: ${m.category}`}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 flex-shrink-0 sm:w-52">
                          <button
                            type="button"
                            onClick={() => {
                              setMemberDecisions((prev) => ({ ...prev, [m.id]: 'confirmed' }));
                              setValidationError(null);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                              decision === 'confirmed'
                                ? 'bg-[#DFFF5F] text-[#180D20] border-[#b5db1e] ring-2 ring-[#DFFF5F]/50 shadow-xs'
                                : 'bg-white border-[#24152F]/20 text-[#24152F] hover:bg-white/80'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Vou</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMemberDecisions((prev) => ({ ...prev, [m.id]: 'declined' }));
                              setValidationError(null);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                              decision === 'declined'
                                ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-500/40 shadow-xs'
                                : 'bg-white border-[#24152F]/20 text-[#24152F] hover:bg-white/80'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Não vou</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Guest Attendance Choice */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#24152F]">
                  Você poderá comparecer ao evento? <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="btn-rsvp-attending-yes"
                    data-selected={attending === 'sim'}
                    onClick={() => {
                      setAttending('sim');
                      setValidationError(null);
                    }}
                    className={`p-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      attending === 'sim'
                        ? 'bg-[#DFFF5F] text-[#180D20] border-[#b5db1e] ring-2 ring-[#DFFF5F]/50 shadow-sm'
                        : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 transition-colors ${
                        attending === 'sim' ? 'text-[#180D20]' : 'text-emerald-600'
                      }`}
                    />
                    <span>Sim, estarei presente!</span>
                  </button>

                  <button
                    type="button"
                    id="btn-rsvp-attending-no"
                    data-selected={attending === 'nao'}
                    onClick={() => {
                      setAttending('nao');
                      setValidationError(null);
                    }}
                    className={`p-3.5 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      attending === 'nao'
                        ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-500/40 shadow-sm'
                        : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <XCircle
                      className={`w-4 h-4 transition-colors ${
                        attending === 'nao' ? 'text-white' : 'text-rose-600'
                      }`}
                    />
                    <span>Não poderei comparecer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Conditional Branch: If Attending (only if at least one guest confirms) */}
            {(isGroupedInvite ? Object.values(memberDecisions).some((d) => d === 'confirmed') : attending === 'sim') && (
              <div className="space-y-5 pt-4 border-t border-[#24152F]/10">
                {/* 5. Acompanhantes: preenchimento quando anfitrião permitiu cotas não preenchidas nominalmente */}
                {maxAllowedCompanions > 0 && (!isGroupedInvite || maxAllowedCompanions > (initialMembers.length - 1)) && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#24152F]">
                      Você levará acompanhante(s)? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setHasCompanions('sim')}
                        className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                          hasCompanions === 'sim'
                            ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                            : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        Sim, levarei acompanhante
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasCompanions('nao')}
                        className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                          hasCompanions === 'nao'
                            ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                            : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        Não, irei sozinho(a)
                      </button>
                    </div>

                    {hasCompanions === 'sim' && (
                      <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#24152F]">
                            Quantos acompanhantes? (Limite: {maxAllowedCompanions})
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={maxAllowedCompanions}
                            value={companionCount}
                            onChange={(e) =>
                              setCompanionCount(
                                Math.min(maxAllowedCompanions, Math.max(1, parseInt(e.target.value) || 1))
                              )
                            }
                            className="w-16 px-2 py-1 rounded-lg border border-[#24152F]/20 bg-white font-bold text-center text-xs text-[#24152F]"
                          />
                        </div>

                        {/* Campos individuais para o nome de cada acompanhante (Item 5) */}
                        <div className="space-y-2.5 pt-1">
                          {Array.from({ length: companionCount }).map((_, idx) => (
                            <div key={`comp-field-${idx}`}>
                              <label className="block text-[11px] font-bold text-[#24152F] mb-1">
                                Acompanhante {idx + 1} — Nome <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={companionNamesList[idx] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCompanionNamesList((prev) => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                }}
                                placeholder={`Nome completo do acompanhante ${idx + 1}`}
                                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Crianças (Item 6: Quantidade, limite de idade e nomes individuais) */}
                <div className="space-y-3 pt-2 border-t border-[#24152F]/10">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#24152F] flex items-center gap-1.5">
                      <Baby className="w-3.5 h-3.5 text-[#24152F]" />
                      <span>Levará crianças?</span>
                    </label>
                    <span className="text-[10px] text-[#24152F]/60">
                      Limite de idade: até {event.childAgeLimit || 10} anos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setHasChildren('sim')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                        hasChildren === 'sim'
                          ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                          : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                      }`}
                    >
                      Sim, levarei criança(s)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasChildren('nao')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                        hasChildren === 'nao'
                          ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                          : 'bg-white border-[#24152F]/25 text-[#24152F] hover:bg-[#FAF6EE]'
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {hasChildren === 'sim' && (
                    <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10 space-y-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-[#24152F] block">
                            Quantidade de crianças
                          </label>
                          <span className="text-[10px] text-[#24152F]/60">
                            Categoria Criança (até {event.childAgeLimit || 10} anos)
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={childrenCount}
                          onChange={(e) =>
                            setChildrenCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-[#24152F]/20 bg-white font-bold text-center text-xs text-[#24152F]"
                        />
                      </div>

                      {/* Campos individuais para o nome de cada criança (Item 6) */}
                      <div className="space-y-2.5 pt-1">
                        {Array.from({ length: childrenCount }).map((_, idx) => (
                          <div key={`child-field-${idx}`}>
                            <label className="block text-[11px] font-bold text-[#24152F] mb-1">
                              Criança {idx + 1} — Nome <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={childrenNamesList[idx] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setChildrenNamesList((prev) => {
                                  const next = [...prev];
                                  next[idx] = val;
                                  return next;
                                });
                              }}
                              placeholder={`Nome completo da criança ${idx + 1}`}
                              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-2 pt-2 border-t border-[#24152F]/10">
                  <label className="block text-xs font-bold text-[#24152F]">
                    Possui alguma restrição alimentar ou alergia?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['Nenhuma restrição', 'Vegetariano', 'Vegano', 'Sem Glúten', 'Sem Lactose'].map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleToggleDietary(item)}
                          className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors cursor-pointer flex items-center gap-2 ${
                            dietary.includes(item)
                              ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                              : 'bg-white border-[#24152F]/15 text-[#24152F] hover:bg-[#FAF6EE]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                              dietary.includes(item)
                                ? 'bg-[#DFFF5F] text-[#180D20] font-bold'
                                : 'border border-[#24152F]/30'
                            }`}
                          >
                            {dietary.includes(item) ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                          </span>
                          <span>{item}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Custom Form Questions (if any configured for this event) */}
                {questions && questions.length > 0 && (
                  <div className="space-y-4 pt-3 border-t border-[#24152F]/10">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#24152F]">
                          {q.title} {q.required && <span className="text-rose-500">*</span>}
                        </label>
                        {q.description && (
                          <p className="text-[11px] text-[#24152F]/60">{q.description}</p>
                        )}
                        {q.type === 'long_text' ? (
                          <textarea
                            rows={3}
                            required={q.required}
                            value={customAnswers[q.id] || ''}
                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                          />
                        ) : q.type === 'yes_no' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleCustomAnswerChange(q.id, 'sim')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                customAnswers[q.id] === 'sim'
                                  ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                                  : 'bg-white border-[#24152F]/20 text-[#24152F] hover:bg-[#FAF6EE]'
                              }`}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomAnswerChange(q.id, 'nao')}
                              className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                                customAnswers[q.id] === 'nao'
                                  ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                                  : 'bg-white border-[#24152F]/20 text-[#24152F] hover:bg-[#FAF6EE]'
                              }`}
                            >
                              Não
                            </button>
                          </div>
                        ) : q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleCustomAnswerChange(q.id, opt)}
                                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors cursor-pointer ${
                                  customAnswers[q.id] === opt
                                    ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                                    : 'bg-white border-[#24152F]/15 text-[#24152F] hover:bg-[#FAF6EE]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            required={q.required}
                            value={customAnswers[q.id] || ''}
                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message to hosts */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-[#24152F]">
                Mensagem para os anfitriões (opcional)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Deixe uma mensagem de carinho aos anfitriões..."
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              />
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              id="btn-submit-guest-rsvp"
              disabled={!attending}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 border-2 ${
                attending
                  ? 'bg-[#DFFF5F] hover:bg-[#CEF04A] text-[#180D20] border-[#b5db1e] cursor-pointer'
                  : 'bg-stone-200 text-stone-600 border-stone-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Send
                className={`w-4 h-4 transition-colors ${
                  attending ? 'text-[#180D20]' : 'text-stone-600'
                }`}
              />
              <span>Confirmar Resposta Agora</span>
            </button>
          </form>
        )}

        {/* Footer Identity */}
        <div className="pt-6 pb-2 text-center space-y-1">
          <p className="text-xs font-bold text-[#24152F]">
            Rafluo <span className="font-normal text-[#24152F]/70">• Gestão inteligente de confirmações.</span>
          </p>
          <p className="text-[11px] text-[#24152F]/60">
            Desenvolvido com carinho por{' '}
            <span className="font-semibold text-[#24152F]">Beaquos Estúdio Criativo</span>
          </p>
        </div>
      </div>
    </div>
  );
};
