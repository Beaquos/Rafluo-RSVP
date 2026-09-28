import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { GuestData } from '../../data/mockData';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newGuest: GuestData) => void;
  defaultMaxGuests?: number;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultMaxGuests = 2,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    phone: '',
    email: '',
    group: 'Amigos',
    maxGuests: defaultMaxGuests,
    notes: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        displayName: '',
        phone: '',
        email: '',
        group: 'Amigos',
        maxGuests: defaultMaxGuests,
        notes: '',
      });
    }
  }, [isOpen, defaultMaxGuests]);

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
    const randomCode = 'RAF-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const newGuest: GuestData = {
      id: 'g-' + Date.now(),
      eventId: 'ev-01',
      name: formData.name,
      displayName: formData.displayName || formData.name,
      phone: formData.phone,
      email: formData.email,
      group: formData.group,
      maxGuests: formData.maxGuests,
      rsvpCode: randomCode,
      notes: formData.notes,
      status: 'pending',
      respondedAt: null,
      companionCount: 0,
      companionNames: [],
      answers: {},
    };

    onSave(newGuest);
    onClose();
  };

  return (
    <div
      id="modal-backdrop-guest"
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
            <div className="w-8 h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">Cadastrar Novo Convidado</h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">Gera link individual exclusivo para RSVP</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-guest-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] cursor-pointer transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-[#24152F]">
          <div>
            <label className="block font-semibold mb-1 text-[#24152F]">Nome Completo *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  displayName: formData.displayName ? formData.displayName : e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Carlos Eduardo de Oliveira"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F]">Nome de Exibição / Tratamento</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Carlos e Família / Dudu"
            />
            <p className="text-[10px] text-[#24152F]/60 mt-0.5">
              Como aparecerá na saudação da página de confirmação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">WhatsApp / Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="(61) 98765-4321"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">E-mail (opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="carlos@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Grupo / Categoria</label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              >
                <option value="Família Noivo">Família Noivo</option>
                <option value="Família Noiva">Família Noiva</option>
                <option value="Padrinhos">Padrinhos</option>
                <option value="Amigos">Amigos</option>
                <option value="Trabalho">Trabalho</option>
                <option value="VIP">VIP</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Acompanhantes Permitidos</label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.maxGuests}
                onChange={(e) =>
                  setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] text-center font-bold focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F]">Observações Internas (opcional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Mesa dos padrinhos, restrição alimentar..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10">
            <button
              type="button"
              id="btn-cancel-guest-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#F7F1E5] cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-guest-modal"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm cursor-pointer border border-[#3F2553] text-center"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" /> Salvar Convidado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
