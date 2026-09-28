import React, { useState } from 'react';
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
} from 'lucide-react';
import { EventData, GuestData, FormQuestionData } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';
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
    guestInfo?: { name: string; phone: string; email: string }
  ) => void;
  isPublicMode?: boolean;
  isPublicEventInvite?: boolean;
}

export const GuestRsvpView: React.FC<GuestRsvpViewProps> = ({
  event,
  guest,
  questions = [],
  onBackToAdmin,
  onSubmitRsvp,
  isPublicMode = false,
  isPublicEventInvite = false,
}) => {
  // If it's a public event invite, we start completely fresh without any prior guest data
  const isIndividual = !isPublicEventInvite && !!guest;

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

  const [companionNames, setCompanionNames] = useState<string>(
    isIndividual && guest?.companionNames ? guest.companionNames.join(', ') : ''
  );

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

    // Validate guest name in public mode
    if (isPublicEventInvite && !guestName.trim()) {
      setValidationError('Por favor, informe seu nome completo para confirmar presença.');
      return;
    }

    if (!attending) {
      setValidationError('Por favor, informe se você poderá ou não comparecer ao evento.');
      return;
    }

    const finalStatus = attending === 'sim' ? 'confirmed' : 'declined';
    const finalCompanionCount =
      attending === 'sim' && hasCompanions === 'sim' && maxAllowedCompanions > 0
        ? companionCount
        : 0;

    const finalCompanionNames =
      attending === 'sim' && hasCompanions === 'sim' && maxAllowedCompanions > 0
        ? companionNames
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
        : [];

    const answers: Record<string, any> = {
      ...customAnswers,
      q_presence: attending,
      q_has_companions: hasCompanions,
      q_companion_count: finalCompanionCount,
      q_companion_names: companionNames,
      q_dietary: dietary,
      q_message: message,
    };

    const targetGuestId = isIndividual && guest ? guest.id : `g-pub-${Date.now()}`;
    const guestInfo = {
      name: guestName.trim() || (guest?.name ?? 'Convidado'),
      phone: guestPhone.trim(),
      email: guestEmail.trim(),
    };

    onSubmitRsvp(targetGuestId, finalStatus, finalCompanionCount, finalCompanionNames, answers, guestInfo);
    setSubmitted(true);
  };

  const handleResetForAnotherResponse = () => {
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setAttending(null);
    setHasCompanions('nao');
    setCompanionCount(1);
    setCompanionNames('');
    setDietary([]);
    setMessage('');
    setCustomAnswers({});
    setSubmitted(false);
    setValidationError(null);
  };

  const displayNameForCard = guestName.trim() || guest?.displayName || guest?.name || 'Convidado(a)';

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#24152F] font-sans pb-16 selection:bg-[#DFFF5F] selection:text-[#180D20]">
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

        {/* Personalized Welcome Card (only for individual response link) */}
        {isIndividual && guest && !submitted && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#24152F]/10 shadow-xs space-y-1">
            <p className="text-xs text-[#24152F]/60 font-medium">Você está convidado(a):</p>
            <h2 className="text-lg sm:text-xl font-bold text-[#24152F] break-words">{guest.displayName}</h2>
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

            <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5">
              {event.allowResponseEdit !== false ? (
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#F7F1E5] transition-colors cursor-pointer"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-xs font-semibold text-[#24152F] mb-1">
                      E-mail (opcional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE]/50 text-xs sm:text-sm text-[#24152F] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question 1: Attending? Large Buttons */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
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
                      : 'bg-white dark:bg-[#2B1838] border-[#24152F]/25 dark:border-[#5C3B75] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#381E48]'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 transition-colors ${
                      attending === 'sim'
                        ? 'text-[#180D20]'
                        : 'text-emerald-600 dark:text-[#DFFF5F]'
                    }`}
                  />
                  <span>Confirmar Presença</span>
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
                      ? 'bg-rose-600 dark:bg-rose-700 text-white border-rose-700 dark:border-rose-500 ring-2 ring-rose-500/40 shadow-sm'
                      : 'bg-white dark:bg-[#2B1838] border-[#24152F]/25 dark:border-[#5C3B75] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#381E48]'
                  }`}
                >
                  <XCircle
                    className={`w-4 h-4 transition-colors ${
                      attending === 'nao'
                        ? 'text-white'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                  <span>Não poderei comparecer</span>
                </button>
              </div>
            </div>

            {/* Conditional Branch: If Attending */}
            {attending === 'sim' && (
              <div className="space-y-5 pt-4 border-t border-[#24152F]/10 dark:border-[#3F2553]">
                {/* Companions section */}
                {maxAllowedCompanions > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
                      Você irá acompanhado(a)? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setHasCompanions('sim')}
                        className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                          hasCompanions === 'sim'
                            ? 'bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] border-[#24152F] dark:border-[#DFFF5F]'
                            : 'bg-white dark:bg-[#2B1838] border-[#24152F]/25 dark:border-[#5C3B75] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#381E48]'
                        }`}
                      >
                        Sim, levarei acompanhante
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasCompanions('nao')}
                        className={`p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-colors text-center ${
                          hasCompanions === 'nao'
                            ? 'bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] border-[#24152F] dark:border-[#DFFF5F]'
                            : 'bg-white dark:bg-[#2B1838] border-[#24152F]/25 dark:border-[#5C3B75] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#381E48]'
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

                        <div>
                          <label className="block text-xs font-bold text-[#24152F] mb-1">
                            Nome completo dos acompanhantes <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={companionNames}
                            onChange={(e) => setCompanionNames(e.target.value)}
                            placeholder="Ex: Mariana Silva, Pedro Santos"
                            className="w-full px-3 py-2.5 rounded-lg border border-[#24152F]/20 bg-white text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dietary Restrictions */}
                <div className="space-y-2">
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
                              : 'bg-white border-[#24152F]/15 text-[#24152F] hover:bg-[#F7F1E5]'
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
                  ? 'bg-[#DFFF5F] hover:bg-[#CEF04A] text-[#180D20] border-[#b5db1e] dark:border-[#DFFF5F] cursor-pointer'
                  : 'bg-stone-200 dark:bg-[#2B1838] text-stone-600 dark:text-stone-300 border-stone-300 dark:border-[#3F2553] cursor-not-allowed opacity-60'
              }`}
            >
              <Send
                className={`w-4 h-4 transition-colors ${
                  attending ? 'text-[#180D20]' : 'text-stone-600 dark:text-stone-300'
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
