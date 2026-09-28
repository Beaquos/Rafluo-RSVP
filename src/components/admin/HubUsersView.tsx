import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Plus,
  Mail,
  Calendar,
  Phone,
  Check,
  X,
  Edit2,
  CalendarRange,
  User,
  Shield,
  Camera,
  Trash2,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { AdminUser, AdminUserStatus, AdminUserRole } from '../../types/user';
import { formatDateBR, checkTemporaryUserAccess } from '../../utils/dateUtils';

interface HubUsersViewProps {
  adminUsers: AdminUser[];
  currentUser: AdminUser;
  onSaveUser: (user: AdminUser) => void;
  onToggleStatus: (userId: string, newStatus?: AdminUserStatus) => void;
  onShowToast: (message: string) => void;
}

const ACCESS_PROFILES: { id: AdminUserRole; name: string; description: string; isDefault?: boolean }[] = [
  {
    id: 'Super Administrador',
    name: 'Super Administrador',
    description: 'Acesso completo e irrestrito a todas as áreas, relatórios, configurações e usuários do Rafluo.',
    isDefault: true,
  },
  {
    id: 'Gestor de Eventos',
    name: 'Gestor de Eventos',
    description: 'Criação, edição e gerenciamento operacional completo de eventos, convidados e relatórios.',
  },
  {
    id: 'Cerimonialista',
    name: 'Cerimonialista',
    description: 'Operação presencial do evento, realização de check-in e consulta da lista de convidados.',
  },
];

export const HubUsersView: React.FC<HubUsersViewProps> = ({
  adminUsers,
  currentUser,
  onSaveUser,
  onToggleStatus,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Gestor de Eventos' as AdminUserRole,
    accessProfiles: ['Gestor de Eventos'] as AdminUserRole[],
    status: 'active' as AdminUserStatus,
    accessEnd: '',
    photoUrl: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Phone mask helper: (99) 99999-9999
  const formatPhoneBR = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const toggleProfile = (profileId: AdminUserRole) => {
    setFormData((prev) => {
      const exists = prev.accessProfiles.includes(profileId);
      let updated: AdminUserRole[];
      if (exists) {
        // Prevent deselecting all profiles
        if (prev.accessProfiles.length === 1) {
          onShowToast('O usuário deve possuir ao menos um perfil de acesso.');
          return prev;
        }
        updated = prev.accessProfiles.filter((p) => p !== profileId);
      } else {
        updated = [...prev.accessProfiles, profileId];
      }
      return {
        ...prev,
        accessProfiles: updated,
        role: updated.includes('Super Administrador') ? 'Super Administrador' : (updated[0] || 'Gestor de Eventos'),
      };
    });
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Gestor de Eventos',
      accessProfiles: ['Gestor de Eventos'],
      status: 'active',
      accessEnd: '',
      photoUrl: null,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    const userProfiles = user.accessProfiles && user.accessProfiles.length > 0 ? user.accessProfiles : [user.role];
    setFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      accessProfiles: userProfiles,
      status: user.status,
      accessEnd: user.accessEnd || '',
      photoUrl: user.photoUrl || null,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setErrors({});
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          photoUrl: event.target?.result as string,
        }));
        onShowToast('Foto carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photoUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    onShowToast('Foto removida.');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.lastName.trim()) newErrors.lastName = 'Sobrenome é obrigatório';
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Insira um e-mail válido';
    }
    if (!formData.accessProfiles || formData.accessProfiles.length === 0) {
      newErrors.accessProfiles = 'Selecione ao menos um perfil de acesso';
    }
    if (formData.phone.trim() && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Insira um telefone válido com DDD';
    }
    if (formData.status === 'temporary') {
      if (!formData.accessEnd) {
        newErrors.accessEnd = 'Data de fim do acesso é obrigatória para usuário temporário';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const userToSave: AdminUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      photoUrl: formData.photoUrl,
      role: formData.accessProfiles.includes('Super Administrador')
        ? 'Super Administrador'
        : (formData.accessProfiles[0] || 'Gestor de Eventos'),
      accessProfiles: formData.accessProfiles,
      status: formData.status,
      accessEnd: formData.status === 'temporary' ? formData.accessEnd : undefined,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveUser(userToSave);
    handleCloseModal();
    onShowToast(
      editingUser
        ? `Usuário "${userToSave.name} ${userToSave.lastName}" atualizado com sucesso!`
        : `Usuário "${userToSave.name} ${userToSave.lastName}" cadastrado com sucesso!`
    );
  };

  const renderStatusBadge = (user: AdminUser) => {
    if (user.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Ativo
        </span>
      );
    }

    if (user.status === 'disabled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Desativado
        </span>
      );
    }

    // Status Temporário: mesmo padrão visual em laranja, sem ícone de calendário (Item 10)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Temporário
      </span>
    );
  };

  return (
    <div id="hub-users-view" className="space-y-6 pb-12">
      {/* Top Header com H1 e descrição contextual (Item 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F]">
            Usuários
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 font-normal">
            Gerencie a equipe e permissões de acesso administrativo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer w-full sm:w-fit border border-[#3F2553]"
        >
          <div className="w-5 h-5 rounded-md bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Governance Note: Perfeitamente alinhada com ícone e texto no mesmo container (Item 9) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF6EE] border border-[#24152F]/15 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#24152F] text-[#DFFF5F] flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#24152F]/80 leading-normal flex-1">
          <strong className="text-[#24152F] font-bold">Controle de Acessos:</strong> Usuários com status{' '}
          <span className="font-semibold text-emerald-800">Ativo</span> acessam normalmente o sistema; os{' '}
          <span className="font-semibold text-rose-800">Desativados</span> não podem realizar login; e os{' '}
          <span className="font-semibold text-orange-800">Temporários</span> possuem prazo limite de acesso.
        </div>
      </div>

      {/* Users List com Título sem contador (Item 11) */}
      <div className="bg-white rounded-2xl border border-[#24152F]/10 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#24152F]/10">
          <h3 className="text-base font-bold text-[#24152F]">
            Usuários Cadastrados
          </h3>
        </div>

        <div className="divide-y divide-[#24152F]/5">
          {adminUsers.map((user) => {
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#FAF6EE]/40 transition-colors"
              >
                {/* 1. Nome, Foto & E-mail */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#24152F] text-[#DFFF5F] font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={`${user.name} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>
                        {user.name.charAt(0)}
                        {user.lastName.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm font-bold text-[#24152F] truncate">
                        {user.name} {user.lastName}
                      </h4>
                      {isSelf && (
                        <span className="text-[10px] font-bold bg-[#DFFF5F] text-[#180D20] px-1.5 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                      {(user.accessProfiles && user.accessProfiles.length > 0 ? user.accessProfiles : [user.role]).map((prof) => (
                        <span
                          key={prof}
                          className="text-[10px] sm:text-[11px] font-medium bg-[#24152F]/5 text-[#24152F] px-2 py-0.5 rounded-md border border-[#24152F]/10"
                        >
                          {prof}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[#24152F]/70 truncate">
                      <Mail className="w-3 h-3 text-[#24152F]/40 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Status Badge & Ações */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#24152F]/5">
                  <div className="flex-shrink-0">
                    {renderStatusBadge(user)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#24152F]/15 hover:border-[#24152F] hover:bg-[#FAF6EE] text-[#24152F] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    title="Editar dados e status do usuário"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#24152F]" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Criar / Editar Usuário - Restored to original Rafluo Identity */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#24152F]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#24152F]/15 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Dark Plum banner with Lime Icon */}
            <div className="p-4 sm:p-5 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <p className="text-xs text-[#D2C4DC]">
                    {editingUser
                      ? 'Atualize os dados e permissões de acesso'
                      : 'Cadastre um novo usuário administrativo no Rafluo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#D2C4DC] hover:text-[#F7F1E5] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Foto de Perfil */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-[#FAF6EE] border border-[#24152F]/10">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-[#24152F] text-[#DFFF5F] font-bold text-lg flex items-center justify-center overflow-hidden border-2 border-white shadow-xs">
                    {formData.photoUrl ? (
                      <img
                        src={formData.photoUrl}
                        alt="Preview do usuário"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        {formData.lastName ? formData.lastName.charAt(0).toUpperCase() : ''}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#24152F] hover:bg-[#180D20] text-[#DFFF5F] border border-white shadow-xs transition-colors cursor-pointer"
                    title="Carregar foto"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-[#24152F]">Foto de Perfil</h4>
                  <p className="text-[11px] text-[#24152F]/60 mt-0.5">
                    Envie uma foto em PNG ou JPG (máx. 5MB)
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#24152F]/15 hover:bg-[#FAF6EE] text-[#24152F] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-[#24152F]/60" />
                      <span>{formData.photoUrl ? 'Substituir' : 'Upload'}</span>
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nome & Sobrenome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#24152F] mb-1.5">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carlos"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#24152F] placeholder:text-[#24152F]/30 focus:outline-none focus:ring-2 focus:ring-[#24152F] transition-all ${
                      errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#24152F]/20'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24152F] mb-1.5">
                    Sobrenome *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Pereira"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#24152F] placeholder:text-[#24152F]/30 focus:outline-none focus:ring-2 focus:ring-[#24152F] transition-all ${
                      errors.lastName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#24152F]/20'
                    }`}
                  />
                  {errors.lastName && <p className="text-[10px] text-rose-600 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] mb-1.5">
                  E-mail *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@rafluo.com"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#24152F] placeholder:text-[#24152F]/30 focus:outline-none focus:ring-2 focus:ring-[#24152F] transition-all ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#24152F]/20'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3.5" />
                </div>
                {errors.email && <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              {/* Telefone (WhatsApp) */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] mb-1.5">
                  Telefone (WhatsApp)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneBR(e.target.value) })}
                    placeholder="(11) 98765-4321"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#24152F] placeholder:text-[#24152F]/30 focus:outline-none focus:ring-2 focus:ring-[#24152F] transition-all ${
                      errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#24152F]/20'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-3.5" />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              {/* Perfil de Acesso (Múltipla Seleção) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#24152F]">
                    Perfil de Acesso *
                  </label>
                  <span className="text-[11px] text-[#24152F]/60 font-medium">
                    (Múltipla seleção)
                  </span>
                </div>
                <p className="text-[11px] text-[#24152F]/70 leading-tight">
                  Selecione os perfis de acesso deste usuário. O <strong>Super Administrador</strong> é o perfil padrão do sistema com acesso irrestrito a todas as áreas do Rafluo.
                </p>

                <div className="space-y-2 pt-1">
                  {ACCESS_PROFILES.map((profile) => {
                    const isSelected = formData.accessProfiles.includes(profile.id);
                    return (
                      <div
                        key={profile.id}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => toggleProfile(profile.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleProfile(profile.id);
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-[#FAF6EE] border-[#24152F] ring-1 ring-[#24152F] shadow-xs'
                            : 'bg-white border-[#24152F]/15 hover:border-[#24152F]/40 hover:bg-[#FAF6EE]/30'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#24152F] border-[#24152F] text-[#DFFF5F]'
                              : 'bg-white border-[#24152F]/30 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#24152F]">
                              {profile.name}
                            </span>
                            {profile.isDefault && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#DFFF5F] text-[#180D20]">
                                Padrão do Sistema
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#24152F]/70 leading-tight mt-0.5">
                            {profile.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.accessProfiles && (
                  <p className="text-[10px] text-rose-600 mt-1">{errors.accessProfiles}</p>
                )}
              </div>

              {/* Status de Acesso */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] mb-1.5">
                  Status de Acesso
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Ativo */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      formData.status === 'active'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-white border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                    }`}
                  >
                    Ativo
                  </button>

                  {/* Temporário */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'temporary' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      formData.status === 'temporary'
                        ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-xs ring-1 ring-orange-300'
                        : 'bg-white border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                    }`}
                  >
                    Temporário
                  </button>

                  {/* Desativado */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'disabled' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                      formData.status === 'disabled'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs ring-1 ring-rose-300'
                        : 'bg-white border-[#24152F]/15 text-[#24152F]/70 hover:bg-[#FAF6EE]'
                    }`}
                  >
                    Desativado
                  </button>
                </div>
              </div>

              {/* Período de Acesso (para Usuário Temporário - Item 10) */}
              {formData.status === 'temporary' && (
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                    <Clock className="w-4 h-4 text-orange-700" />
                    <span>Janela de Acesso Temporário</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-orange-900 mb-1">
                      Data de Fim do Acesso *
                    </label>
                    <input
                      type="date"
                      value={formData.accessEnd}
                      onChange={(e) => setFormData({ ...formData, accessEnd: e.target.value })}
                      className={`w-full px-3 py-2 text-xs rounded-xl border bg-white text-[#24152F] focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer ${
                        errors.accessEnd ? 'border-rose-500' : 'border-orange-300'
                      }`}
                    />
                    {errors.accessEnd && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.accessEnd}</p>
                    )}
                  </div>

                  <p className="text-[11px] text-orange-800/80 leading-tight pt-1">
                    O acesso ao painel estará liberado a partir da criação até o fim desta data.
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#24152F]/10 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl text-[#24152F]/70 hover:text-[#24152F] hover:bg-[#FAF6EE] transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] transition-all cursor-pointer shadow-xs border border-[#3F2553] active:scale-98"
                >
                  <Check className="w-3.5 h-3.5 text-[#DFFF5F]" />
                  <span>{editingUser ? 'Salvar Alterações' : 'Salvar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
