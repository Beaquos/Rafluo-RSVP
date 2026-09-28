import React, { useState, useEffect } from 'react';
import { X, UserCheck, Check, Clock, Phone } from 'lucide-react';
import { ManagerData } from '../../data/mockData';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedManager: ManagerData) => void;
  eventName: string;
  manager?: ManagerData | null;
}

// Phone mask: (99) 99999-9999
const formatPhoneBR = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  manager,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accessEnd, setAccessEnd] = useState('2026-10-30');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Populate or reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      if (manager) {
        setName(manager.name);
        setEmail(manager.email);
        setPhone(manager.phone || '');
        setAccessEnd(manager.accessEnd || '2026-10-30');
        setStatus(manager.status || 'active');
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setAccessEnd('2026-10-30');
        setStatus('active');
      }
    }
  }, [isOpen, manager]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const savedManager: ManagerData = {
      id: manager ? manager.id : 'm-' + Date.now(),
      eventId: manager ? manager.eventId : 'ev-01',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      accessStart: manager?.accessStart || today,
      accessEnd,
      status,
    };
    onSave(savedManager);
    onClose();
  };

  const isEditing = Boolean(manager);

  return (
    <div
      id="modal-backdrop-manager"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">
                {isEditing ? 'Editar Responsável pelo Evento' : 'Cadastrar Responsável pelo Evento'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">
                Permissão de consulta de convidados e respostas
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-manager-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-[#24152F] dark:text-[#F7F1E5] overflow-y-auto flex-1">
          <div className="p-3.5 rounded-xl bg-[#FAF6EE] dark:bg-[#2A1738] border border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs text-[#24152F] dark:text-[#DFFF5F]">
              <Clock className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" /> Acesso Sem Senha por E-mail
            </p>
            <p className="text-[#24152F]/70 dark:text-[#D2C4DC]/80">
              O responsável se identificará pelo e-mail cadastrado e terá acesso de visualização a partir do
              cadastro até a data de término configurada abaixo.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              Nome do Responsável *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
              placeholder="Ex: Cerimonialista Roberta / Noivo Marcos"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              E-mail de Identificação *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
              placeholder="roberta@cerimonial.com"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              Celular / WhatsApp
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
                placeholder="(61) 99999-9999"
              />
            </div>
            <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-1">
              Facilita o envio direto da mensagem e do link de acesso via WhatsApp.
            </p>
          </div>

          {/* Janela Temporal nos Dados de Cadastro (Item 15) */}
          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              Disponível até *
            </label>
            <input
              type="date"
              required
              value={accessEnd}
              onChange={(e) => setAccessEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
            />
            <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-1">
              O acesso inicia no cadastro e encerra na data definida.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">Status do Acesso</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#24152F] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#DFFF5F]"
            >
              <option value="active">Ativo (Pode acessar)</option>
              <option value="inactive">Inativo (Acesso bloqueado)</option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
            <button
              type="button"
              id="btn-cancel-manager-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] cursor-pointer text-center transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-manager-modal"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm cursor-pointer border border-[#3F2553] text-center transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" />{' '}
              {isEditing ? 'Salvar Alterações' : 'Salvar Responsável'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
