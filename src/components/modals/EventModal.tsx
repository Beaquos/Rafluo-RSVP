import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Loader2, Clock, MapPin, Image as ImageIcon, MessageSquare, Timer, Gift, Sparkles } from 'lucide-react';
import { EventData } from '../../data/mockData';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  onSave: (updatedEvent: EventData) => void;
}

// Helpers for masks
const formatDateMask = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const formatTimeMask = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const formatCepMask = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
};

// Convert ISO date YYYY-MM-DD or existing date to DD/MM/AA
const toDateMaskVal = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const yearShort = parts[0].slice(-2);
    return `${parts[2]}/${parts[1]}/${yearShort}`;
  }
  return dateStr;
};

// Convert DD/MM/AA back to YYYY-MM-DD for storage compatibility
const fromDateMaskVal = (maskVal: string): string => {
  const parts = maskVal.split('/');
  if (parts.length === 3 && parts[2].length === 2) {
    return `20${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return maskVal;
};

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
}) => {
  const [formData, setFormData] = useState<EventData>(event);

  // Data e hora: campos iniciam em branco (Item 9)
  const [dateMask, setDateMask] = useState('');
  const [timeMask, setTimeMask] = useState('');
  const [deadlineMask, setDeadlineMask] = useState('');

  // Endereço campos individuais (Item 9)
  const [addressFields, setAddressFields] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);

  useEffect(() => {
    setFormData(event);

    // Item 9: Os campos de data e hora iniciam estritamente em branco. Não deixar data ou horário pré-carregados.
    setDateMask('');
    setTimeMask('');
    setDeadlineMask('');

    setAddressFields({
      cep: event.cep || '',
      logradouro: event.street || '',
      numero: event.number || '',
      complemento: event.complement || '',
      bairro: event.neighborhood || '',
      cidade: event.city || '',
      estado: event.state || '',
    });
  }, [event, isOpen]);

  // Handle CEP change and ViaCEP lookup
  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCepMask(rawVal);
    setAddressFields((prev) => ({ ...prev, cep: formatted }));

    const clean = rawVal.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddressFields((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
            complemento: data.complemento || prev.complemento,
          }));
        }
      } catch (err) {
        console.error('Erro ao consultar CEP:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Assemble address string
    const fullAddress = [
      addressFields.logradouro,
      addressFields.numero ? `nº ${addressFields.numero}` : '',
      addressFields.complemento,
      addressFields.bairro,
      addressFields.cidade && addressFields.estado
        ? `${addressFields.cidade} - ${addressFields.estado}`
        : addressFields.cidade,
      addressFields.cep ? `CEP: ${addressFields.cep}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const updated: EventData = {
      ...formData,
      date: dateMask ? fromDateMaskVal(dateMask) : formData.date,
      time: timeMask ? timeMask : formData.time,
      rsvpDeadline: deadlineMask ? fromDateMaskVal(deadlineMask) : formData.rsvpDeadline,
      address: fullAddress || formData.address,
      cep: addressFields.cep,
      street: addressFields.logradouro,
      number: addressFields.numero,
      complement: addressFields.complemento,
      neighborhood: addressFields.bairro,
      city: addressFields.cidade,
      state: addressFields.estado,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="modal-backdrop-event"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#24152F]/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#24152F]/15 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">Configurar Evento</h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">Dados gerais, datas e regras de confirmação</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-event-modal"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F7F1E5] transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-[#24152F]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-[#24152F]">Nome do Evento *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const autoSlug = newName
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  setFormData((prev) => ({
                    ...prev,
                    name: newName,
                    slug: prev.slug ? prev.slug : autoSlug,
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="Ex: Casamento Marina & Lucas"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-[#24152F]">
                Slug da URL Pública (Link RSVP)
              </label>
              <div className="flex items-center rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] px-3 py-2 focus-within:ring-1 focus-within:ring-[#24152F]">
                <span className="text-[11px] text-[#24152F]/50 select-none mr-1">/rsvp/evento/</span>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => {
                    const cleanSlug = e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9-]/g, '')
                      .replace(/--+/g, '-');
                    setFormData({ ...formData, slug: cleanSlug });
                  }}
                  placeholder="ex: marina-e-lucas"
                  className="w-full bg-transparent text-xs text-[#24152F] font-semibold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-[#24152F]/60 mt-1">
                Identificador exclusivo do evento para o link público de confirmação.
              </p>
            </div>

            {/* Tipo de Evento (Item 2: Chá de Bebê e Chá de Fraldas separados) */}
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Tipo de Evento</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              >
                <option value="Aniversário Infantil">Aniversário Infantil</option>
                <option value="Aniversário Adulto">Aniversário Adulto</option>
                <option value="Chá de Bebê">Chá de Bebê</option>
                <option value="Chá de Fraldas">Chá de Fraldas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              >
                <option value="active">Ativo (Recebendo Respostas)</option>
                <option value="closed">Fechado</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>

            {/* Data do Evento - Formato DD/MM/AA (Item 9: Inicia em branco) */}
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Data do Evento</label>
              <input
                type="text"
                required={!formData.date}
                value={dateMask}
                onChange={(e) => setDateMask(formatDateMask(e.target.value))}
                placeholder="DD/MM/AA"
                maxLength={8}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F] font-medium"
              />
              <span className="text-[10px] text-[#24152F]/50 mt-0.5 block">
                Formato DD/MM/AA
              </span>
            </div>

            {/* Horário de Início - Formato 00:00 (Item 9: Inicia em branco) */}
            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Horário de Início</label>
              <input
                type="text"
                value={timeMask}
                onChange={(e) => setTimeMask(formatTimeMask(e.target.value))}
                placeholder="00:00"
                maxLength={5}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F] font-medium"
              />
              <span className="text-[10px] text-[#24152F]/50 mt-0.5 block">
                Formato 00:00
              </span>
            </div>

            {/* Confirmação até (Item 10: Nomenclatura simplificada) */}
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1 text-[#24152F]">
                Confirmação até *
              </label>
              <input
                type="text"
                required={!formData.rsvpDeadline}
                value={deadlineMask}
                onChange={(e) => setDeadlineMask(formatDateMask(e.target.value))}
                placeholder="DD/MM/AA"
                maxLength={8}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/30 bg-[#DFFF5F]/15 font-semibold focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              />
              <p className="text-[10px] text-[#24152F]/60 mt-0.5">
                Após esta data, os convidados não poderão mais enviar ou alterar respostas.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Local / Espaço</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="Ex: Villa Giardini Espaço de Eventos"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F]">Link do Google Maps</label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="https://maps.google.com/..."
              />
            </div>

            {/* Endereço com campos individuais (Item 9) */}
            <div className="sm:col-span-2 pt-2 border-t border-[#24152F]/10 space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#24152F]" />
                <span className="font-semibold text-xs text-[#24152F]">Endereço do Evento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CEP */}
                <div>
                  <label className="block font-semibold mb-1 text-[#24152F]">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addressFields.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                    />
                    {isLoadingCep && (
                      <Loader2 className="w-3.5 h-3.5 text-[#24152F] animate-spin absolute right-2.5 top-2.5" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#24152F]/50 mt-0.5 block">
                    Busca automática por CEP
                  </span>
                </div>

                {/* Logradouro */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-[#24152F]">Logradouro</label>
                  <input
                    type="text"
                    value={addressFields.logradouro}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, logradouro: e.target.value })
                    }
                    placeholder="Rua, Avenida, Estrada..."
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>

                {/* Número */}
                <div>
                  <label className="block font-semibold mb-1 text-[#24152F]">Número</label>
                  <input
                    type="text"
                    value={addressFields.numero}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, numero: e.target.value })
                    }
                    placeholder="123 ou S/N"
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>

                {/* Complemento */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-[#24152F]">Complemento</label>
                  <input
                    type="text"
                    value={addressFields.complemento}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, complemento: e.target.value })
                    }
                    placeholder="Bloco, Salão, Lote..."
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>

                {/* Bairro */}
                <div>
                  <label className="block font-semibold mb-1 text-[#24152F]">Bairro</label>
                  <input
                    type="text"
                    value={addressFields.bairro}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, bairro: e.target.value })
                    }
                    placeholder="Bairro / Região"
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block font-semibold mb-1 text-[#24152F]">Cidade</label>
                  <input
                    type="text"
                    value={addressFields.cidade}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, cidade: e.target.value })
                    }
                    placeholder="Cidade"
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block font-semibold mb-1 text-[#24152F]">Estado</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={addressFields.estado}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, estado: e.target.value.toUpperCase() })
                    }
                    placeholder="UF"
                    className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-[#FAF6EE] uppercase focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                </div>
              </div>
            </div>

            {/* Regras de Resposta do Evento */}
            <div className="sm:col-span-2 pt-3 border-t border-[#24152F]/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/70">
                Regras de Resposta do Evento
              </h4>
              <p className="text-[11px] text-[#24152F]/50 mt-0.5">
                Defina as permissões e restrições para as confirmações dos convidados no RSVP.
              </p>
            </div>

            {/* Permitir Acompanhantes? (Item 11: proporções equivalentes aos outros controles) */}
            <div className="sm:col-span-2 p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-[#24152F]">Permitir Acompanhantes?</span>
                  <span className="text-[11px] text-[#24152F]/60">
                    Habilita o campo condicional de acompanhantes no formulário.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowGuests}
                  onChange={(e) => setFormData({ ...formData, allowGuests: e.target.checked })}
                  className="w-4 h-4 accent-[#24152F] cursor-pointer"
                />
              </div>

              {formData.allowGuests && (
                <div className="mt-3 pt-3 border-t border-[#24152F]/10 flex items-center justify-between gap-3">
                  <label className="font-semibold text-xs text-[#24152F]">Limite Padrão por Convite:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, maxGuestsPerInvite: Math.max(1, (formData.maxGuestsPerInvite || 1) - 1) })}
                      className="w-7 h-7 rounded-lg border border-[#24152F]/20 bg-white hover:bg-[#FAF6EE] text-[#24152F] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      title="Diminuir"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.maxGuestsPerInvite}
                      onChange={(e) => setFormData({ ...formData, maxGuestsPerInvite: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)) })}
                      className="w-10 h-7 rounded-lg border border-[#24152F]/20 text-center text-xs font-bold bg-white text-[#24152F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-[#24152F] flex items-center justify-center"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, maxGuestsPerInvite: Math.min(10, (formData.maxGuestsPerInvite || 1) + 1) })}
                      className="w-7 h-7 rounded-lg border border-[#24152F]/20 bg-white hover:bg-[#FAF6EE] text-[#24152F] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      title="Aumentar"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações de resposta (Item 11) - Lado a lado com proporções visuais equivalentes */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Permitir alteração de resposta */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] flex items-start justify-between gap-3">
                <div className="flex-1">
                  <label className="font-semibold text-xs text-[#24152F] block cursor-pointer" htmlFor="modal-allow-edit">
                    Permitir alteração de resposta
                  </label>
                  <span className="text-[11px] text-[#24152F]/60 block mt-0.5 leading-relaxed">
                    Quando habilitada, o convidado poderá alterar sua resposta enviada.
                  </span>
                </div>
                <input
                  id="modal-allow-edit"
                  type="checkbox"
                  checked={formData.allowResponseEdit ?? true}
                  onChange={(e) => setFormData({ ...formData, allowResponseEdit: e.target.checked })}
                  className="w-4 h-4 mt-0.5 accent-[#24152F] cursor-pointer flex-shrink-0"
                />
              </div>

              {/* Impedir duplicidade de respostas */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] flex items-start justify-between gap-3">
                <div className="flex-1">
                  <label className="font-semibold text-xs text-[#24152F] block cursor-pointer" htmlFor="modal-prevent-duplicates">
                    Impedir duplicidade de respostas
                  </label>
                  <span className="text-[11px] text-[#24152F]/60 block mt-0.5 leading-relaxed">
                    Evita que o mesmo convidado registre múltiplos envios no evento.
                  </span>
                </div>
                <input
                  id="modal-prevent-duplicates"
                  type="checkbox"
                  checked={formData.preventDuplicateResponses ?? true}
                  onChange={(e) => setFormData({ ...formData, preventDuplicateResponses: e.target.checked })}
                  className="w-4 h-4 mt-0.5 accent-[#24152F] cursor-pointer flex-shrink-0"
                />
              </div>
            </div>

            {/* SEÇÃO: Personalização do Link do Convidado (Item 3 do User Request) */}
            <div className="sm:col-span-2 pt-3 border-t border-[#24152F]/10 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#24152F]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/80">
                  Personalização do Convite (Link do Convidado)
                </h4>
              </div>
              <p className="text-[11px] text-[#24152F]/60 leading-relaxed">
                Configure a imagem, mensagem de abertura, contagem regressiva e lista de presentes que serão apresentadas ao convidado no convite digital.
              </p>

              {/* 1. Imagem de Capa do Convite */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] space-y-2">
                <label className="block font-semibold text-xs text-[#24152F] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#24152F]" />
                  <span>Imagem de Destaque / Banner do Convite</span>
                </label>
                <input
                  type="url"
                  value={formData.coverImage || ''}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://exemplo.com/imagem-do-evento.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-[#24152F] text-xs focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                />
                {formData.coverImage && (
                  <div className="mt-2 relative w-full h-28 rounded-lg overflow-hidden border border-[#24152F]/15 bg-black/5">
                    <img
                      src={formData.coverImage}
                      alt="Prévia do convite"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <span className="text-[10px] text-[#24152F]/50 block">
                  Insira o link direto de uma foto ou banner comemorativo.
                </span>
              </div>

              {/* 2. Mensagem Inicial de Abertura */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] space-y-2">
                <label className="block font-semibold text-xs text-[#24152F] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#24152F]" />
                  <span>Mensagem Inicial de Abertura</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.welcomeMessage || ''}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="Ex: É com muita alegria que convidamos você para comemorar conosco este momento especial!"
                  className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-[#24152F] text-xs focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                />
                <span className="text-[10px] text-[#24152F]/50 block">
                  Texto de abertura apresentado no topo da página do convidado.
                </span>
              </div>

              {/* 3. Contagem regressiva */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="font-semibold text-xs text-[#24152F] flex items-center gap-1.5 cursor-pointer" htmlFor="modal-countdown-toggle">
                    <Timer className="w-3.5 h-3.5 text-[#24152F]" />
                    <span>Contagem regressiva</span>
                  </label>
                  <span className="text-[11px] text-[#24152F]/60 block mt-0.5 leading-relaxed">
                    Exibe um cronômetro regressivo com dias, horas e minutos até o início do evento.
                  </span>
                </div>
                <input
                  id="modal-countdown-toggle"
                  type="checkbox"
                  checked={formData.showCountdown ?? true}
                  onChange={(e) => setFormData({ ...formData, showCountdown: e.target.checked })}
                  className="w-4 h-4 accent-[#24152F] cursor-pointer flex-shrink-0"
                />
              </div>

              {/* 4. Lista de Presentes */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="block font-semibold text-xs text-[#24152F] flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#24152F]" />
                    <span>Lista de Presentes</span>
                  </label>
                  <input
                    id="modal-giftlist-toggle"
                    type="checkbox"
                    checked={formData.showGiftList ?? true}
                    onChange={(e) => setFormData({ ...formData, showGiftList: e.target.checked })}
                    className="w-4 h-4 accent-[#24152F] cursor-pointer flex-shrink-0"
                  />
                </div>

                {(formData.showGiftList ?? true) && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, giftListType: 'items' })}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          (formData.giftListType || 'items') === 'items'
                            ? 'bg-[#24152F] text-[#F7F1E5]'
                            : 'bg-white border border-[#24152F]/15 text-[#24152F]/70'
                        }`}
                      >
                        Itens Desejados
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, giftListType: 'link' })}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                          formData.giftListType === 'link'
                            ? 'bg-[#24152F] text-[#F7F1E5]'
                            : 'bg-white border border-[#24152F]/15 text-[#24152F]/70'
                        }`}
                      >
                        Link Externo
                      </button>
                    </div>

                    {formData.giftListType === 'link' && (
                      <div className="pt-2">
                        <label className="block font-semibold text-[11px] mb-1 text-[#24152F]">Link da Lista de Presentes:</label>
                        <input
                          type="url"
                          value={formData.giftListUrl || ''}
                          onChange={(e) => setFormData({ ...formData, giftListUrl: e.target.value })}
                          placeholder="https://listadepresentes.com/seu-evento"
                          className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-[#24152F] text-xs focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                        />
                      </div>
                    )}

                    {(formData.giftListType || 'items') === 'items' && (
                      <div className="pt-2">
                        <label className="block font-semibold text-[11px] mb-1 text-[#24152F]">Itens e Sugestões Desejadas:</label>
                        <textarea
                          rows={3}
                          value={formData.giftListItems || ''}
                          onChange={(e) => setFormData({ ...formData, giftListItems: e.target.value })}
                          placeholder="Ex: Fraldas tamanho M e G, lenços umedecidos, jogos educativos..."
                          className="w-full px-3 py-2 rounded-lg border border-[#24152F]/20 bg-white text-[#24152F] text-xs focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Limite de Idade para Crianças (Item 6) */}
              <div className="p-3.5 rounded-xl border border-[#24152F]/15 bg-[#FAF6EE] flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="font-semibold text-xs text-[#24152F] block">
                    Limite de Idade para Crianças
                  </label>
                  <span className="text-[11px] text-[#24152F]/60 block mt-0.5 leading-relaxed">
                    Idade máxima considerada na categoria Criança nas confirmações (ex: até 10 anos).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={18}
                    value={formData.childAgeLimit || 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        childAgeLimit: Math.max(1, parseInt(e.target.value) || 10),
                      })
                    }
                    className="w-14 px-2 py-1.5 rounded-lg border border-[#24152F]/20 bg-white text-center font-bold text-xs text-[#24152F] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                  />
                  <span className="text-xs text-[#24152F]/70 font-semibold">anos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-[#24152F]/10">
            <button
              type="button"
              id="btn-cancel-event-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 text-xs font-semibold text-[#24152F] hover:bg-[#F7F1E5] cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-event-modal"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm cursor-pointer border border-[#3F2553] text-center"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" /> Salvar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
