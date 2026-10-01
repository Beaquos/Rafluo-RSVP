import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, Plus, Trash2, Users, User, Baby, Tag } from 'lucide-react';
import { GuestData, InviteMember } from '../../data/mockData';
import { getInviteMembers } from '../../utils/inviteUtils';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedGuest: GuestData) => void;
  defaultMaxGuests?: number;
  guest?: GuestData | null;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultMaxGuests = 2,
  guest = null,
}) => {
  const isEditing = Boolean(guest);

  const [inviteName, setInviteName] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('Família');
  const [notes, setNotes] = useState('');

  // Acompanhantes (Item 5: quantidade e nomes individuais)
  const [companionCount, setCompanionCount] = useState<number>(0);
  const [companionNamesList, setCompanionNamesList] = useState<string[]>([]);

  // Crianças (Item 6: quantidade, limite de idade e nomes individuais)
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenNamesList, setChildrenNamesList] = useState<string[]>([]);
  const [childAgeLimit, setChildAgeLimit] = useState<number>(10);

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (guest) {
        setInviteName(guest.inviteName || guest.displayName || guest.name);
        setPrimaryName(guest.name);
        setPhone(guest.phone || '');
        setEmail(guest.email || '');
        setGroup(guest.group || 'Geral');
        setNotes(guest.notes || '');

        const allMembers = getInviteMembers(guest);
        const secondariesAdults = allMembers.filter((m) => !m.isPrimary && m.category === 'Adulto');
        const secondariesChildren = allMembers.filter((m) => m.category === 'Criança');

        setCompanionCount(secondariesAdults.length);
        setCompanionNamesList(secondariesAdults.map((m) => m.name));

        setChildrenCount(secondariesChildren.length);
        setChildrenNamesList(secondariesChildren.map((m) => m.name));
      } else {
        setInviteName('');
        setPrimaryName('');
        setPhone('');
        setEmail('');
        setGroup('Família');
        setNotes('');
        setCompanionCount(0);
        setCompanionNamesList([]);
        setChildrenCount(0);
        setChildrenNamesList([]);
      }
    }
  }, [isOpen, guest]);

  // Adjust companionNamesList when companionCount changes
  const handleCompanionCountChange = (count: number) => {
    const validCount = Math.max(0, count);
    setCompanionCount(validCount);
    setCompanionNamesList((prev) => {
      const next = [...prev];
      while (next.length < validCount) {
        next.push('');
      }
      return next.slice(0, validCount);
    });
  };

  // Adjust childrenNamesList when childrenCount changes
  const handleChildrenCountChange = (count: number) => {
    const validCount = Math.max(0, count);
    setChildrenCount(validCount);
    setChildrenNamesList((prev) => {
      const next = [...prev];
      while (next.length < validCount) {
        next.push('');
      }
      return next.slice(0, validCount);
    });
  };

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
    const guestId = guest ? guest.id : 'g-' + Date.now();
    const randomCode =
      guest?.rsvpCode || 'RAF-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const finalPrimaryName = primaryName.trim();
    const finalInviteName = inviteName.trim() || finalPrimaryName;

    // Filter valid companion names
    const validCompanions = companionNamesList
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    // Filter valid children names
    const validChildren = childrenNamesList
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    // Build the full members array (Itens 5, 6, 7 e 12: registros individuais com status e categoria)
    const members: InviteMember[] = [
      {
        id: `${guestId}-primary`,
        name: finalPrimaryName,
        category: 'Adulto',
        status: guest?.status || 'pending',
        isPrimary: true,
      },
      ...validCompanions.map((compName, idx) => ({
        id: `${guestId}-comp-${idx}`,
        name: compName,
        category: 'Adulto' as const,
        status: guest?.status || 'pending',
        isPrimary: false,
      })),
      ...validChildren.map((childName, idx) => ({
        id: `${guestId}-child-${idx}`,
        name: childName,
        category: 'Criança' as const,
        status: guest?.status || 'pending',
        isPrimary: false,
      })),
    ];

    const savedGuest: GuestData = {
      id: guestId,
      eventId: guest?.eventId || 'ev-01',
      name: finalPrimaryName,
      displayName: finalInviteName,
      inviteName: finalInviteName,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      group: group.trim() || 'Geral',
      maxGuests: Math.max(validCompanions.length + validChildren.length, defaultMaxGuests),
      rsvpCode: randomCode,
      notes: notes.trim(),
      status: guest?.status || 'pending',
      respondedAt: guest?.respondedAt || null,
      companionCount: validCompanions.length,
      companionNames: validCompanions,
      answers: guest?.answers || {},
      members,
    };

    onSave(savedGuest);
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
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1E1128] rounded-3xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553] flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <UserPlus className="w-4 h-4 text-[#180D20]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-[#F7F1E5] truncate">
                {isEditing ? 'Editar Convite' : 'Cadastrar Novo Convite'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#D2C4DC] truncate">
                Convite agrupado com convidados titulares, acompanhantes e crianças
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs text-[#24152F] dark:text-[#F7F1E5]">
          {/* Nome do Convite / Família */}
          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              Nome do Convite / Família *
            </label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ex: Família Duarte / Carlos e Juliana Mendes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#24152F] font-bold"
            />
            <p className="text-[10px] text-[#24152F]/60 dark:text-[#D2C4DC]/60 mt-1">
              Nome exibido no título do convite na listagem e na saudação do convidado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Convidado Titular */}
            <div>
              <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
                Convidado Titular (Adulto) *
              </label>
              <input
                type="text"
                required
                value={primaryName}
                onChange={(e) => {
                  setPrimaryName(e.target.value);
                  if (!inviteName) setInviteName(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="Nome do titular do convite"
              />
            </div>

            {/* Tag / Grupo */}
            <div>
              <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#24152F]/60 dark:text-[#DFFF5F]" />
                <span>Tag (Grupo)</span>
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F] font-medium"
              >
                <option value="Família">Família</option>
                <option value="Família Noivo">Família Noivo</option>
                <option value="Família Noiva">Família Noiva</option>
                <option value="Padrinhos">Padrinhos</option>
                <option value="Amigos">Amigos</option>
                <option value="Trabalho">Trabalho</option>
                <option value="VIP">VIP</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
                WhatsApp / Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="(61) 98765-4321"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* 5. Acompanhantes — quantidade e nomes individuais */}
          <div className="pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <span>Quantos acompanhantes?</span>
                </label>
                <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  Respeite o limite definido (Máximo: {defaultMaxGuests}). Categoria: Adulto.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCompanionCountChange(companionCount - 1)}
                  className="w-7 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] font-bold text-xs flex items-center justify-center hover:bg-[#EDE4D3] cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={Math.max(10, defaultMaxGuests)}
                  value={companionCount}
                  onChange={(e) => handleCompanionCountChange(parseInt(e.target.value) || 0)}
                  className="w-12 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-center text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]"
                />
                <button
                  type="button"
                  onClick={() => handleCompanionCountChange(companionCount + 1)}
                  className="w-7 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] font-bold text-xs flex items-center justify-center hover:bg-[#EDE4D3] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Campos individuais para o nome de cada acompanhante */}
            {companionCount > 0 && (
              <div className="space-y-2 pt-1 pl-2 border-l-2 border-[#24152F]/15 dark:border-[#3F2553]">
                {Array.from({ length: companionCount }).map((_, idx) => (
                  <div key={`comp-input-${idx}`} className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#24152F] dark:text-[#F7F1E5]">
                      Acompanhante {idx + 1} — Nome *
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
                      className="w-full px-3 py-1.5 rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-xs text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Crianças — quantidade, limite de idade e nomes individuais */}
          <div className="pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                  <span>Quantidade de crianças</span>
                </label>
                <p className="text-[11px] text-[#24152F]/60 dark:text-[#D2C4DC]/60">
                  Defina a quantidade e o limite de idade. Categoria: Criança.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                  <span>Até</span>
                  <input
                    type="number"
                    min={1}
                    max={17}
                    value={childAgeLimit}
                    onChange={(e) => setChildAgeLimit(parseInt(e.target.value) || 10)}
                    className="w-10 px-1 py-0.5 rounded border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-center text-xs font-bold"
                  />
                  <span>anos</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleChildrenCountChange(childrenCount - 1)}
                    className="w-7 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] font-bold text-xs flex items-center justify-center hover:bg-[#EDE4D3] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={childrenCount}
                    onChange={(e) => handleChildrenCountChange(parseInt(e.target.value) || 0)}
                    className="w-12 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-center text-xs font-bold text-[#24152F] dark:text-[#F7F1E5]"
                  />
                  <button
                    type="button"
                    onClick={() => handleChildrenCountChange(childrenCount + 1)}
                    className="w-7 h-7 rounded-lg border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] font-bold text-xs flex items-center justify-center hover:bg-[#EDE4D3] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Campos individuais para o nome de cada criança */}
            {childrenCount > 0 && (
              <div className="space-y-2 pt-1 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                {Array.from({ length: childrenCount }).map((_, idx) => (
                  <div key={`child-input-${idx}`} className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#24152F] dark:text-[#F7F1E5]">
                      Criança {idx + 1} — Nome *
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
                      className="w-full px-3 py-1.5 rounded-lg border border-[#24152F]/15 dark:border-[#3F2553] bg-white dark:bg-[#1E1128] text-xs text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#24152F] dark:text-[#F7F1E5]">
              Observações Internas (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-1 focus:ring-[#24152F]"
              placeholder="Ex: Mesa dos padrinhos, restrição alimentar..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
            <button
              type="button"
              id="btn-cancel-guest-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#24152F]/20 dark:border-[#3F2553] text-xs font-semibold text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-submit-guest-modal"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs font-semibold shadow-sm cursor-pointer border border-[#3F2553] text-center"
            >
              <Check className="w-3.5 h-3.5 text-[#DFFF5F]" /> {isEditing ? 'Salvar Convite' : 'Cadastrar Convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
