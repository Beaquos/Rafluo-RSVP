import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Baby,
  Users,
  Undo2,
  Check,
  X,
  History,
} from 'lucide-react';
import { GuestData, InviteMember } from '../../data/mockData';
import { formatDateTimeBR } from '../../utils/dateUtils';
import { getInviteMembers } from '../../utils/inviteUtils';

interface ReceptionGuestModalProps {
  guest: GuestData | null;
  operatorName?: string;
  onClose: () => void;
  onRecordCheckIn: (
    guestId: string,
    memberIds: string[],
    action: 'checkin' | 'undo',
    operator?: string
  ) => Promise<void>;
}

export const ReceptionGuestModal: React.FC<ReceptionGuestModalProps> = ({
  guest,
  operatorName,
  onClose,
  onRecordCheckIn,
}) => {
  if (!guest) return null;

  const members = getInviteMembers(guest);
  const confirmedMembers = members.filter((m) => m.status === 'confirmed');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    // Por padrão seleciona os que ainda não entraram
    const pendingEntrance = confirmedMembers.filter((m) => !m.checkedIn).map((m) => m.id);
    return pendingEntrance.length > 0 ? pendingEntrance : confirmedMembers.map((m) => m.id);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const adultCount = confirmedMembers.filter((m) => m.category === 'Adulto').length;
  const childCount = confirmedMembers.filter((m) => m.category === 'Criança').length;

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedMemberIds(confirmedMembers.map((m) => m.id));
  };

  const selectNone = () => {
    setSelectedMemberIds([]);
  };

  const handleAction = async (action: 'checkin' | 'undo') => {
    if (selectedMemberIds.length === 0) {
      setFeedbackMessage({
        type: 'warning',
        text: 'Selecione ao menos uma pessoa para registrar ou desfazer a entrada.',
      });
      return;
    }

    // Cenário 11: Tentar registrar novamente uma entrada já realizada e verificar o aviso
    if (action === 'checkin') {
      const alreadyIn = confirmedMembers.filter(
        (m) => selectedMemberIds.includes(m.id) && m.checkedIn
      );
      if (alreadyIn.length === selectedMemberIds.length) {
        setFeedbackMessage({
          type: 'warning',
          text: `Aviso: ${alreadyIn.map((m) => m.name).join(', ')} já possui entrada registrada${
            alreadyIn[0]?.checkedInAt ? ` em ${formatDateTimeBR(alreadyIn[0].checkedInAt)}` : ''
          }.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      await onRecordCheckIn(guest.id, selectedMemberIds, action, operatorName);
      if (action === 'checkin') {
        setFeedbackMessage({
          type: 'success',
          text: `Entrada registrada com sucesso para ${selectedMemberIds.length} pessoa(s)!`,
        });
      } else {
        setFeedbackMessage({
          type: 'warning',
          text: `Entrada desfeita com sucesso para ${selectedMemberIds.length} pessoa(s).`,
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erro ao atualizar credenciamento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCheckedIn = confirmedMembers.length > 0 && confirmedMembers.every((m) => m.checkedIn);
  const partiallyCheckedIn = confirmedMembers.some((m) => m.checkedIn) && !allCheckedIn;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/75 dark:bg-black/85 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#1E1128] rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl space-y-4 my-auto relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#24152F]/10 dark:border-[#3F2553]/60 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                Ficha de Recepção
              </span>
              {guest.checkInCode && (
                <span className="text-[10px] font-mono text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  {guest.checkInCode}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#24152F] dark:text-[#F7F1E5] mt-1">
              {guest.displayName || guest.name}
            </h3>
            <p className="text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/70">
              Telefone: <strong className="text-[#24152F] dark:text-[#F7F1E5]">{guest.phone || 'Não informado'}</strong> • Tag: <strong className="text-[#24152F] dark:text-[#F7F1E5]">{guest.group || 'Geral'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] flex items-center justify-center hover:bg-[#24152F] hover:text-[#F7F1E5] dark:hover:bg-[#DFFF5F] dark:hover:text-[#180D20] transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        {allCheckedIn ? (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Todos os integrantes já entraram no evento!</p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">Entrada completa registrada.</p>
            </div>
          </div>
        ) : partiallyCheckedIn ? (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-2.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Entrada Parcial Registrada</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">Alguns integrantes da reserva já entraram e outros ainda não.</p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex items-center gap-2.5 text-xs text-[#24152F] dark:text-[#F7F1E5]">
            <Clock className="w-5 h-5 text-[#24152F]/50 dark:text-[#D2C4DC]/50 flex-shrink-0" />
            <div>
              <p className="font-bold">Aguardando Entrada</p>
              <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">Nenhuma entrada registrada para esta reserva até o momento.</p>
            </div>
          </div>
        )}

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                : feedbackMessage.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 text-amber-900 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-900 dark:text-rose-200'
            }`}
          >
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Resumo do total previsto (Item 8 do Prompt) */}
        <div className="p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/10 dark:border-[#3F2553] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-extrabold text-[#24152F] dark:text-[#F7F1E5]">
            Total previsto: {confirmedMembers.length} {confirmedMembers.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
          <span className="text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/80">
            {adultCount} {adultCount === 1 ? 'adulto' : 'adultos'}
            {childCount > 0 ? ` e ${childCount} ${childCount === 1 ? 'criança' : 'crianças'}` : ''}
          </span>
        </div>

        {/* Lista de Pessoas / Membros da Reserva */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]">
              Participantes ({confirmedMembers.length} confirmados)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:underline cursor-pointer"
              >
                Selecionar todos
              </button>
              <span className="text-[#24152F]/30 dark:text-[#D2C4DC]/30">•</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-[11px] font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:underline cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {confirmedMembers.map((m) => {
              const isSelected = selectedMemberIds.includes(m.id);
              const isEntered = m.checkedIn;
              const displayName = m.name?.trim()
                ? m.name
                : m.isPrimary
                ? 'Titular (Nome não informado)'
                : 'Acompanhante (Nome não informado)';

              return (
                <div
                  key={m.id}
                  onClick={() => toggleSelectMember(m.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F] dark:border-[#DFFF5F] shadow-2xs'
                      : 'bg-white dark:bg-[#1E1128] border-[#24152F]/15 dark:border-[#3F2553] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectMember(m.id)}
                      className="w-4 h-4 accent-[#24152F] dark:accent-[#DFFF5F] cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] flex items-center justify-center text-[#24152F] dark:text-[#F7F1E5] flex-shrink-0">
                      {m.category === 'Criança' ? <Baby className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#24152F] dark:text-[#F7F1E5] truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                        {m.isPrimary ? 'Titular da reserva' : 'Acompanhante'} • Categoria: {m.category || 'Não informada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {isEntered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        <Check className="w-3 h-3" /> Já Entrou
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#24152F]/60 dark:bg-gray-800 dark:text-[#D2C4DC]/60 border border-gray-300">
                        Pendente
                      </span>
                    )}
                    {m.checkedInAt && (
                      <p className="text-[9px] text-[#24152F]/50 dark:text-[#D2C4DC]/50 mt-0.5">
                        {formatDateTimeBR(m.checkedInAt)}
                        {m.checkedInBy && ` • ${m.checkedInBy}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            id="btn-confirm-checkin"
            disabled={isSubmitting || selectedMemberIds.length === 0}
            onClick={() => handleAction('checkin')}
            className="py-3 px-4 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] hover:bg-[#180D20] dark:hover:bg-[#CEF04A] text-[#F7F1E5] dark:text-[#180D20] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-[#DFFF5F] dark:text-[#180D20]" />
            <span>Registrar Entrada ({selectedMemberIds.length})</span>
          </button>

          <button
            type="button"
            id="btn-undo-checkin"
            disabled={isSubmitting || selectedMemberIds.length === 0}
            onClick={() => handleAction('undo')}
            className="py-3 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            <span>Desfazer Entrada ({selectedMemberIds.length})</span>
          </button>
        </div>

        {/* Check-in History */}
        {guest.checkInHistory && guest.checkInHistory.length > 0 && (
          <div className="pt-2 border-t border-[#24152F]/10 dark:border-[#3F2553]/60 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#24152F]/60 dark:text-[#D2C4DC]/60 flex items-center gap-1">
              <History className="w-3 h-3" /> Histórico de Ações
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {guest.checkInHistory.slice(-3).reverse().map((h, idx) => (
                <div key={idx} className="text-[10px] text-[#24152F]/70 dark:text-[#D2C4DC]/70 flex items-center justify-between">
                  <span>{h.summary}</span>
                  <span className="font-mono text-[9px] text-[#24152F]/50 dark:text-[#D2C4DC]/50">
                    {formatDateTimeBR(h.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
