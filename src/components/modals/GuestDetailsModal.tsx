import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Users,
  Mail,
  Phone,
  Tag,
  KeyRound,
  FileQuestion,
  CalendarCheck,
} from 'lucide-react';
import { GuestData, FormQuestionData } from '../../data/mockData';
import { formatDateTimeBR } from '../../utils/dateUtils';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GuestData | null;
  questions: FormQuestionData[];
}

export const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({
  isOpen,
  onClose,
  guest,
  questions,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !guest) return null;

  const formattedRespondedAt = guest.respondedAt
    ? formatDateTimeBR(guest.respondedAt)
    : null;

  return (
    <div
      id="modal-backdrop-guest-details"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#24152F]/15 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
              <User className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">Ficha de Resposta do Convidado</h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">Dados cadastrais e detalhes da confirmação</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-guest-details-modal"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1 text-xs text-[#24152F]">
          {/* Section 8: Destaque Visual "Confirmado em / Resposta" */}
          {guest.status === 'confirmed' ? (
            <div className="p-4 rounded-2xl bg-[#DFFF5F]/20 border border-[#DFFF5F] flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <CalendarCheck className="w-5 h-5 text-[#DFFF5F]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#24152F]/70 block">
                  Presença Confirmada
                </span>
                <p className="text-sm sm:text-base font-extrabold text-[#180D20] truncate">
                  {formattedRespondedAt
                    ? `Confirmado em ${formattedRespondedAt}`
                    : 'Confirmado pelo convidado'}
                </p>
              </div>
            </div>
          ) : guest.status === 'declined' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800/80 block">
                  Ausência Registrada
                </span>
                <p className="text-sm font-bold text-rose-900 truncate">
                  {formattedRespondedAt
                    ? `Registrado em ${formattedRespondedAt}`
                    : 'Não comparecerá ao evento'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Aguardando Resposta
                </span>
                <p className="text-xs text-amber-900 font-semibold">
                  O convidado ainda não respondeu ao convite RSVP.
                </p>
              </div>
            </div>
          )}

          {/* Section 9: Dados do convidado */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/60 flex items-center gap-1.5 pb-1 border-b border-[#24152F]/10">
              <User className="w-3.5 h-3.5 text-[#24152F]" />
              <span>Dados do Convidado</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-0.5">Nome:</span>
                <p className="text-xs sm:text-sm font-bold text-[#24152F] break-words">
                  {guest.name}
                </p>
                {guest.displayName && guest.displayName !== guest.name && (
                  <p className="text-[11px] text-[#24152F]/60 mt-0.5">
                    Exibição: "{guest.displayName}"
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-0.5">E-mail:</span>
                <p className="text-xs sm:text-sm font-medium text-[#24152F] break-words">
                  {guest.email || 'Não informado'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-0.5">Telefone:</span>
                <p className="text-xs sm:text-sm font-medium text-[#24152F]">
                  {guest.phone || 'Não informado'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-0.5">Grupo:</span>
                <p className="text-xs sm:text-sm font-semibold text-[#24152F]">
                  {guest.group || 'Geral'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-[#24152F]/10 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#24152F]/70 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#24152F]/50" />
                Código de Acesso RSVP:
              </span>
              <span className="font-mono font-bold text-xs text-[#24152F] px-2.5 py-0.5 rounded-md bg-[#FAF6EE] border border-[#24152F]/10">
                {guest.rsvpCode}
              </span>
            </div>
          </div>

          {/* Section 9: Resposta */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/60 flex items-center gap-1.5 pb-1 border-b border-[#24152F]/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#24152F]" />
              <span>Resposta</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-1">Status:</span>
                <div>
                  {guest.status === 'confirmed' ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#DFFF5F] text-[#180D20]">
                      Confirmado
                    </span>
                  ) : guest.status === 'declined' ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#24152F]/10 text-[#24152F]">
                      Recusado
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10 sm:col-span-2">
                <span className="text-[11px] font-bold text-[#24152F]/60 block mb-1">
                  Confirmado em:
                </span>
                <p className="text-xs sm:text-sm font-semibold text-[#24152F]">
                  {formattedRespondedAt ? formattedRespondedAt : 'Ainda não respondeu'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#24152F]/10 col-span-1 sm:col-span-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-[#24152F]/60 block">Acompanhantes:</span>
                  <p className="text-xs text-[#24152F]/70">
                    Máximo do convite: {guest.maxGuests} pessoa{guest.maxGuests > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-base sm:text-lg font-extrabold text-[#24152F] px-3 py-1 rounded-lg bg-white border border-[#24152F]/15">
                  {guest.companionCount}
                </span>
              </div>
            </div>
          </div>

          {/* Section 9: Acompanhantes (somente quando existirem e com nomes) */}
          {guest.companionCount > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/60 flex items-center gap-1.5 pb-1 border-b border-[#24152F]/10">
                <Users className="w-3.5 h-3.5 text-[#24152F]" />
                <span>Acompanhantes</span>
              </h4>

              <div className="p-4 rounded-xl border border-[#24152F]/10 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#24152F]">
                    Total de acompanhantes registrados:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6EE] border border-[#24152F]/15 font-bold text-xs text-[#24152F]">
                    {guest.companionCount}
                  </span>
                </div>

                {guest.companionNames && guest.companionNames.length > 0 ? (
                  <div className="pt-2 border-t border-[#24152F]/10 space-y-1.5">
                    <p className="text-[11px] font-bold text-[#24152F]/70">Nomes registrados:</p>
                    <div className="space-y-1">
                      {guest.companionNames.map((name, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 rounded-lg bg-[#FAF6EE] text-xs font-medium text-[#24152F] flex items-center gap-2 border border-[#24152F]/5"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#24152F] text-[#DFFF5F] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="break-words">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#24152F]/60 pt-1">
                    Nenhum nome específico registrado para os acompanhantes.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section 9: Respostas do formulário */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/60 flex items-center gap-1.5 pb-1 border-b border-[#24152F]/10">
              <FileQuestion className="w-3.5 h-3.5 text-[#24152F]" />
              <span>Respostas do Formulário</span>
            </h4>

            {questions.length === 0 || Object.keys(guest.answers || {}).length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#24152F]/20 bg-[#FAF6EE]/50 text-center text-[#24152F]/60">
                Nenhuma resposta adicional enviada pelo convidado.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => {
                  const ans = guest.answers ? guest.answers[q.id] : undefined;
                  if (ans === undefined || ans === null) return null;

                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-[#24152F]/10 bg-white space-y-1.5 shadow-2xs"
                    >
                      {/* Pergunta */}
                      <p className="font-bold text-xs text-[#24152F] leading-snug">
                        {q.title}
                      </p>
                      {/* Resposta separada visualmente */}
                      <div className="p-2.5 rounded-lg bg-[#FAF6EE] border border-[#24152F]/10 text-xs font-medium text-[#24152F] break-words">
                        {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF6EE] border-t border-[#24152F]/10 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            id="btn-close-guest-details-bottom"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#24152F] text-[#F7F1E5] font-bold text-xs hover:bg-[#180D20] cursor-pointer transition-colors shadow-xs border border-[#3F2553] text-center"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
