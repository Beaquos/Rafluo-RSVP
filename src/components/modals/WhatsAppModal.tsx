import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { GuestData, EventData, ManagerData } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';
import { getClientPanelUrl } from '../../utils/linkUtils';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: GuestData | null;
  manager?: ManagerData | null;
  event: EventData;
  onOpenGuestPreview?: (guestCode: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  guest,
  manager,
  event,
  onOpenGuestPreview,
}) => {
  const [copied, setCopied] = useState(false);

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

  if (!isOpen || (!guest && !manager)) return null;

  const isManager = !!manager;
  const portalUrl = manager ? getClientPanelUrl(event.id, event.slug) : '';
  const rsvpLink = guest ? `${window.location.origin}/rsvp/${guest.rsvpCode}` : '';

  const messageText = isManager
    ? `Olá, ${manager?.name}!\n\nAqui está o seu acesso exclusivo para gerenciar e acompanhar as confirmações de presença do evento *${event.name}*.\n\n🔗 *Link do Painel do Responsável:*\n${portalUrl}\n\nPara acessar, utilize o seu e-mail cadastrado (${manager?.email}). Por lá você poderá acompanhar a lista de convidados em tempo real e exportar relatórios! ✨`
    : `Olá, ${guest?.displayName}!\n\nVocê é nosso convidado especial para o *${event.name}* no dia *${formatDateBR(event.date)}*!\n\nPor favor, confirme sua presença através do seu link exclusivo do RSVP:\n👉 ${rsvpLink}\n\nContamos com sua presença! ✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const targetPhone = (isManager ? manager?.phone : guest?.phone) || '';
    const phoneClean = targetPhone.replace(/\D/g, '');
    const url = phoneClean
      ? `https://api.whatsapp.com/send?phone=55${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="modal-backdrop-whatsapp"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#24152F]/15 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <WhatsAppIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">Mensagem para WhatsApp</h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">
                {isManager
                  ? 'Acesso ao painel do responsável com link exclusivo'
                  : 'Convite personalizado com link individual'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-whatsapp-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs text-[#24152F] overflow-y-auto flex-1">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 text-[11px] text-[#24152F]/70">
              <div className="min-w-0 break-words">
                {isManager ? (
                  <span>
                    Destinatário: <strong className="text-[#24152F]">{manager?.name}</strong> {manager?.phone ? `(${manager.phone})` : `(${manager?.email})`}
                  </span>
                ) : (
                  <span>
                    Destinatário: <strong className="text-[#24152F]">{guest?.name}</strong> ({guest?.phone || 'Sem telefone'})
                  </span>
                )}
              </div>
              <span className="self-start sm:self-auto font-mono text-[#24152F] font-bold bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#24152F]/10 text-[10px] sm:text-[11px] shrink-0">
                {isManager ? 'Painel do Responsável' : `Código: ${guest?.rsvpCode}`}
              </span>
            </div>

            <textarea
              readOnly
              rows={8}
              value={messageText}
              className="w-full p-3 rounded-xl border border-[#24152F]/20 bg-[#FAF6EE] font-sans text-xs focus:outline-none text-[#24152F] resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-[#24152F]/10">
            {isManager ? (
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-open-responsible-portal-preview"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#24152F]/20 text-[#24152F] font-semibold hover:bg-[#F7F1E5] text-xs cursor-pointer w-full sm:w-auto transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#24152F] shrink-0" />
                <span>Acessar Painel</span>
              </a>
            ) : onOpenGuestPreview && guest ? (
              <button
                type="button"
                id="btn-test-invite-whatsapp"
                onClick={() => {
                  onClose();
                  onOpenGuestPreview(guest.rsvpCode);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#24152F]/20 text-[#24152F] font-semibold hover:bg-[#F7F1E5] text-xs cursor-pointer w-full sm:w-auto transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#24152F] shrink-0" />
                <span>Testar este Convite</span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <button
                type="button"
                id="btn-copy-whatsapp-text"
                onClick={handleCopy}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#24152F]/20 font-semibold text-xs text-[#24152F] hover:bg-[#F7F1E5] transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#24152F] shrink-0" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-open-whatsapp-link"
                onClick={handleOpenWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm active:scale-98 whitespace-nowrap"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
