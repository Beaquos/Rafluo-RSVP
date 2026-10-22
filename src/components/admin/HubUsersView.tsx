import React, { useState, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Mail,
  Phone,
  X,
  Camera,
  Trash2,
  Upload,
  Clock,
  Check,
  CheckCircle2,
  Pen,
  Eye,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminUser, AdminUserStatus, AdminUserRole, normalizeAdminRole, normalizeAdminProfiles } from '../../types/user';
import { RowActionDropdown, ConfirmModal } from '../common/list-components';

interface HubUsersViewProps {
  adminUsers: AdminUser[];
  currentUser: AdminUser;
  onSaveUser: (user: AdminUser) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleStatus: (userId: string, newStatus?: AdminUserStatus) => void;
  onShowToast: (message: string) => void;
}

const ACCESS_PROFILES: {
  id: AdminUserRole;
  name: string;
  description: string;
  isDefault?: boolean;
}[] = [
  {
    id: 'Administrador',
    name: 'Administrador',
    description: 'Acesso completo e irrestrito a todas as áreas, relatórios, configurações e usuários do Rafluo.',
    isDefault: true,
  },
  {
    id: 'Operacional',
    name: 'Operacional',
    description: 'Criação, edição e gerenciamento operacional completo de eventos, convidados e relatórios.',
  },
  {
    id: 'Credenciamento',
    name: 'Credenciamento',
    description: 'Operação presencial do evento, realização de check-in e consulta da lista de convidados.',
  },
];

export const HubUsersView: React.FC<HubUsersViewProps> = ({
  adminUsers,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onToggleStatus,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSelectedStatuses, setFilterSelectedStatuses] = useState<AdminUserStatus[]>([]);
  const [draftSelectedStatuses, setDraftSelectedStatuses] = useState<AdminUserStatus[]>([]);
  const [filterSelectedProfiles, setFilterSelectedProfiles] = useState<AdminUserRole[]>([]);
  const [draftSelectedProfiles, setDraftSelectedProfiles] = useState<AdminUserRole[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const USER_STATUS_OPTIONS: { id: AdminUserStatus; label: string }[] = [
    { id: 'active', label: 'Ativo' },
    { id: 'temporary', label: 'Temporário' },
    { id: 'disabled', label: 'Desativado' },
  ];

  const USER_PROFILE_OPTIONS: { id: AdminUserRole; label: string }[] = [
    { id: 'Administrador', label: 'Administrador' },
    { id: 'Operacional', label: 'Operacional' },
    { id: 'Credenciamento', label: 'Credenciamento' },
  ];

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const fullName = `${user.name} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query);

      const matchesStatus =
        filterSelectedStatuses.length === 0 ||
        filterSelectedStatuses.includes(user.status);

      const userProfiles = normalizeAdminProfiles(
        user.accessProfiles && user.accessProfiles.length > 0
          ? user.accessProfiles
          : [user.role]
      );

      const matchesProfile =
        filterSelectedProfiles.length === 0 ||
        userProfiles.some((p) => filterSelectedProfiles.includes(normalizeAdminRole(p)));

      return matchesSearch && matchesStatus && matchesProfile;
    });
  }, [adminUsers, searchTerm, filterSelectedStatuses, filterSelectedProfiles]);

  const activeFiltersCount =
    filterSelectedStatuses.length + filterSelectedProfiles.length;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Modal de confirmação de exclusão
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    lastName: string;
    email: string;
    phone: string;
    role: AdminUserRole;
    accessProfiles: AdminUserRole[];
    status: AdminUserStatus;
    accessEnd: string;
    photoUrl: string | null;
  }>({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Operacional',
    accessProfiles: ['Operacional'],
    status: 'active',
    accessEnd: '',
    photoUrl: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setFormData({
      name: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Operacional',
      accessProfiles: ['Operacional'],
      status: 'active',
      accessEnd: '',
      photoUrl: null,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('edit');
    const profiles = normalizeAdminProfiles(
      user.accessProfiles && user.accessProfiles.length > 0
        ? user.accessProfiles
        : [user.role]
    );
    setFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: normalizeAdminRole(user.role),
      accessProfiles: profiles,
      status: user.status,
      accessEnd: user.accessEnd || '',
      photoUrl: user.photoUrl || null,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenView = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('view');
    const profiles = normalizeAdminProfiles(
      user.accessProfiles && user.accessProfiles.length > 0
        ? user.accessProfiles
        : [user.role]
    );
    setFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: normalizeAdminRole(user.role),
      accessProfiles: profiles,
      status: user.status,
      accessEnd: user.accessEnd || '',
      photoUrl: user.photoUrl || null,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setErrors({});
  };

  const toggleProfile = (profileId: AdminUserRole) => {
    if (modalMode === 'view') return;
    setFormData((prev) => {
      const isCurrentlySelected = prev.accessProfiles.includes(profileId);

      // Regra 1.3: Administrador
      // Ao selecionar, Operacional e Credenciamento são desmarcados automaticamente e ficam indisponíveis
      if (profileId === 'Administrador') {
        if (isCurrentlySelected) {
          // Desmarca Administrador -> libera os outros perfis
          return {
            ...prev,
            accessProfiles: [],
            role: 'Operacional',
          };
        } else {
          // Marca Administrador -> desmarca Operacional e Credenciamento automaticamente
          return {
            ...prev,
            accessProfiles: ['Administrador'],
            role: 'Administrador',
          };
        }
      }

      // Se Administrador estiver marcado, os outros perfis estão indisponíveis para seleção
      if (prev.accessProfiles.includes('Administrador')) {
        return prev;
      }

      // Regra 1.3: Operacional e Credenciamento podem ser selecionados individualmente ou simultaneamente (Operacional + Credenciamento)
      let updated: AdminUserRole[];
      if (isCurrentlySelected) {
        updated = prev.accessProfiles.filter((p) => p !== profileId);
      } else {
        updated = [...prev.accessProfiles, profileId];
      }

      return {
        ...prev,
        accessProfiles: updated,
        role: updated.includes('Operacional') ? 'Operacional' : updated[0] || 'Operacional',
      };
    });
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
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nome é obrigatório';
    if (!formData.lastName.trim()) errs.lastName = 'Sobrenome é obrigatório';
    if (!formData.email.trim()) {
      errs.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Insira um e-mail válido';
    }
    if (!formData.accessProfiles || formData.accessProfiles.length === 0) {
      errs.accessProfiles = 'Selecione ao menos um perfil de acesso';
    } else if (
      formData.accessProfiles.includes('Administrador') &&
      formData.accessProfiles.length > 1
    ) {
      errs.accessProfiles = 'O perfil Administrador não pode ser combinado com outros perfis';
    }
    if (formData.phone.trim() && formData.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Insira um telefone válido com DDD';
    }
    if (formData.status === 'temporary' && !formData.accessEnd) {
      errs.accessEnd = 'Data de fim do acesso é obrigatória para usuário temporário';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') {
      handleCloseModal();
      return;
    }
    if (!validate()) return;

    const userToSave: AdminUser = {
      id: selectedUser ? selectedUser.id : `usr-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      jobTitle: selectedUser?.jobTitle,
      photoUrl: formData.photoUrl,
      role: formData.accessProfiles.includes('Administrador')
        ? 'Administrador'
        : formData.accessProfiles.includes('Operacional')
        ? 'Operacional'
        : 'Credenciamento',
      accessProfiles: formData.accessProfiles,
      status: formData.status,
      accessEnd: formData.status === 'temporary' ? formData.accessEnd : undefined,
      createdAt: selectedUser
        ? selectedUser.createdAt
        : new Date().toISOString().split('T')[0],
    };

    onSaveUser(userToSave);
    handleCloseModal();
    onShowToast(
      modalMode === 'edit'
        ? `Usuário "${userToSave.name} ${userToSave.lastName}" atualizado com sucesso!`
        : `Usuário "${userToSave.name} ${userToSave.lastName}" cadastrado com sucesso!`
    );
  };

  return (
    <div id="hub-users-view" className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
            Usuários
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
            Gerencie a equipe e permissões de acesso administrativo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#24152F] hover:bg-[#180D20] text-[#F7F1E5] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer w-full sm:w-fit border border-[#3F2553]"
        >
          <div className="w-5 h-5 rounded-md bg-[#DFFF5F] text-[#180D20] flex items-center justify-center flex-shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Filter and Search Bar (Padronizado idêntico à tela de Clientes) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF6EE]/60 dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553]">
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F]"
            />
            <Search className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-2.5 sm:top-3" />
          </div>

          <button
            type="button"
            id="btn-open-user-filter-modal"
            onClick={() => {
              setDraftSelectedStatuses([...filterSelectedStatuses]);
              setDraftSelectedProfiles([...filterSelectedProfiles]);
              setIsFilterModalOpen(true);
            }}
            className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
              activeFiltersCount > 0
                ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                : 'bg-white dark:bg-[#1E1128] border-[#24152F]/20 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
            }`}
            title="Filtrar usuários"
          >
            <SlidersHorizontal className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-[#DFFF5F]' : 'text-[#24152F] dark:text-[#F7F1E5]'}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] text-[#180D20] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Resumo de usuários exibidos */}
        <div className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 font-medium flex items-center gap-2 justify-end">
          <span>Exibindo <strong>{filteredUsers.length}</strong> de {adminUsers.length}</span>
          {(activeFiltersCount > 0 || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setFilterSelectedStatuses([]);
                setFilterSelectedProfiles([]);
                setSearchTerm('');
              }}
              className="text-[11px] text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-800 cursor-pointer ml-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* 2. Card Usuários Cadastrados */}
      <div className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">
            Usuários Cadastrados
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#24152F]/5 dark:bg-white/10 text-[#24152F] dark:text-[#F7F1E5]">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        <div className="divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/40">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60">
              Nenhum usuário encontrado com os critérios pesquisados.
            </div>
          ) : (
            filteredUsers.map((user) => {
            const isSelf = user.id === currentUser.id;
            const profiles = normalizeAdminProfiles(
              user.accessProfiles && user.accessProfiles.length > 0
                ? user.accessProfiles
                : [user.role]
            );

            return (
              <div
                key={user.id}
                className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#FAF6EE]/40 dark:hover:bg-[#2A1738]/40 transition-colors"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#24152F] text-[#DFFF5F] font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                    {user.photoUrl ? (
                      <img
                        alt={`${user.name} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        src={user.photoUrl}
                      />
                    ) : (
                      <span>
                        {user.name.charAt(0).toUpperCase()}
                        {user.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm font-bold text-[#24152F] dark:text-[#F7F1E5] truncate">
                        {user.name} {user.lastName}
                      </h4>
                      {isSelf && (
                        <span className="text-[10px] font-bold bg-[#DFFF5F] text-[#180D20] px-1.5 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                      {profiles.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] sm:text-[11px] font-medium bg-[#24152F]/5 dark:bg-white/5 text-[#24152F] dark:text-[#F7F1E5] px-2 py-0.5 rounded-md border border-[#24152F]/10 dark:border-white/10"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[#24152F]/70 dark:text-[#E2D7EA]/70 truncate">
                      <Mail className="w-3 h-3 text-[#24152F]/40 dark:text-[#E2D7EA]/40 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status badge + Editar button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#24152F]/5 dark:border-[#3F2553]/30">
                  <div className="flex-shrink-0">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Ativo
                      </span>
                    ) : user.status === 'temporary' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Temporário
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        Desativado
                      </span>
                    )}
                  </div>

                  <RowActionDropdown
                    id={`action-dropdown-user-${user.id}`}
                    actions={[
                      {
                        id: 'view',
                        label: 'Visualizar',
                        icon: Eye,
                        onClick: () => handleOpenView(user),
                      },
                      {
                        id: 'edit',
                        label: 'Editar',
                        icon: Pen,
                        onClick: () => handleOpenEdit(user),
                      },
                      {
                        id: 'delete',
                        label: 'Excluir',
                        icon: Trash2,
                        variant: 'danger',
                        disabled: isSelf,
                        onClick: () => {
                          if (isSelf) {
                            onShowToast('Você não pode excluir sua própria conta.');
                            return;
                          }
                          setConfirmModal({
                            isOpen: true,
                            title: 'Excluir Usuário',
                            description: `Deseja realmente remover o usuário "${user.name} ${user.lastName}"? Esta ação revogará todos os acessos administrativos deste usuário.`,
                            onConfirm: () => {
                              if (onDeleteUser) {
                                onDeleteUser(user.id);
                              }
                              onShowToast(`Usuário "${user.name} ${user.lastName}" excluído.`);
                            },
                          });
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* 4. Modal de Criação / Edição de Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1128] rounded-2xl sm:rounded-3xl border border-[#24152F]/20 dark:border-[#3F2553] w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#1A1033] text-[#F7F1E5] p-5 sm:p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {modalMode === 'create'
                      ? 'Novo Usuário'
                      : modalMode === 'edit'
                      ? 'Editar Usuário'
                      : 'Detalhes do Usuário'}
                  </h3>
                  <p className="text-xs text-[#D2C4DC]">
                    {modalMode === 'view'
                      ? 'Consulta aos dados cadastrais e perfis de acesso'
                      : 'Preencha os dados cadastrais e perfis de acesso'}
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

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Foto de Perfil */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#FAF6EE]/70 dark:bg-[#120919]/60 border border-[#24152F]/10 dark:border-[#3F2553]">
                <div className="relative flex-shrink-0">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#1A1033]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#1A1033] text-[#DFFF5F] font-bold text-lg flex items-center justify-center shadow-2xs">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                      {formData.lastName ? formData.lastName.charAt(0).toUpperCase() : ''}
                    </div>
                  )}

                    {modalMode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1A1033] text-[#DFFF5F] border-2 border-white shadow-xs hover:bg-[#120919] cursor-pointer"
                        title="Carregar foto"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5]">
                      Foto de Perfil
                    </h4>
                    <p className="text-[11px] text-[#6B6B76] dark:text-[#E2D7EA]/60 mt-0.5">
                      Envie uma foto em PNG ou JPG (máx. 5MB)
                    </p>
                    {modalMode !== 'view' && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E1128] border border-[#24152F]/15 dark:border-[#3F2553] hover:bg-[#FAF6EE] text-[#1A1033] dark:text-[#F7F1E5] transition-colors cursor-pointer"
                        >
                          <Upload className="w-3 h-3 text-[#6B6B76]" />
                          <span>{formData.photoUrl ? 'Substituir' : 'Upload'}</span>
                        </button>
                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nome & Sobrenome */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Carlos"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                        errors.name ? 'border-rose-500' : 'border-[#E9E3D8] dark:border-[#3F2553]'
                      } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                    />
                    {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                      Sobrenome *
                    </label>
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Ex: Pereira"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                        errors.lastName ? 'border-rose-500' : 'border-[#E9E3D8] dark:border-[#3F2553]'
                      } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                    E-mail *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={modalMode === 'view'}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@rafluo.com"
                      className={`w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                        errors.email ? 'border-rose-500' : 'border-[#E9E3D8] dark:border-[#3F2553]'
                      } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                    />
                    <Mail className="w-4 h-4 text-[#6B6B76] absolute left-3 top-2.5" />
                  </div>
                  {errors.email && <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                    Telefone (WhatsApp)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={modalMode === 'view'}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: formatPhoneBR(e.target.value) })
                      }
                      placeholder="(11) 98765-4321"
                      className={`w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                        errors.phone ? 'border-rose-500' : 'border-[#E9E3D8] dark:border-[#3F2553]'
                      } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                    />
                    <Phone className="w-4 h-4 text-[#6B6B76] absolute left-3 top-2.5" />
                  </div>
                  {errors.phone && <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                {/* Perfis de Acesso */}
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5]">
                      Perfis de Acesso *
                    </label>
                    <p className="text-[11px] text-[#6B6B76] dark:text-[#E2D7EA]/65 leading-tight mt-0.5">
                      Selecione os perfis do usuário.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {ACCESS_PROFILES.map((profile) => {
                      const isSelected = formData.accessProfiles.includes(profile.id);
                      const isAdministradorActive = formData.accessProfiles.includes('Administrador');
                      const isDisabled = (profile.id !== 'Administrador' && isAdministradorActive) || modalMode === 'view';

                      return (
                        <div
                          key={profile.id}
                          onClick={() => {
                            if (!isDisabled) {
                              toggleProfile(profile.id);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 select-none ${
                            isDisabled
                              ? 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-[#180d22] border-[#E9E3D8] dark:border-[#3F2553]'
                              : isSelected
                              ? 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#1A1033] dark:border-[#DFFF5F] shadow-xs ring-1 ring-[#1A1033] cursor-pointer'
                              : 'bg-white dark:bg-[#120919] border-[#E9E3D8] dark:border-[#3F2553] hover:border-[#1A1033]/40 cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              isDisabled && !isSelected
                                ? 'bg-stone-200 dark:bg-stone-800 border-stone-300 text-transparent'
                                : isSelected
                                ? 'bg-[#1A1033] dark:bg-[#DFFF5F] border-[#1A1033] dark:border-[#DFFF5F] text-[#DFFF5F] dark:text-[#180D20]'
                                : 'bg-white dark:bg-[#1E1128] border-[#E9E3D8] text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5]">
                                {profile.name}
                              </span>
                              {profile.isDefault && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#DFFF5F] text-[#180D20]">
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B6B76] dark:text-[#E2D7EA]/60 leading-tight mt-0.5">
                              {profile.description}
                            </p>
                            {isDisabled && profile.id !== 'Administrador' && isAdministradorActive && (
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
                                Indisponível enquanto o perfil Administrador estiver selecionado.
                              </p>
                            )}
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
                <div className="pt-1">
                  <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1.5">
                    Status de Acesso
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={modalMode === 'view'}
                      onClick={() => setFormData({ ...formData, status: 'active' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                        formData.status === 'active'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-[#120919] border-[#E9E3D8] dark:border-[#3F2553] text-[#6B6B76] dark:text-[#E2D7EA]/70'
                      } ${modalMode === 'view' ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      disabled={modalMode === 'view'}
                      onClick={() => setFormData({ ...formData, status: 'temporary' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                        formData.status === 'temporary'
                          ? 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-[#120919] border-[#E9E3D8] dark:border-[#3F2553] text-[#6B6B76] dark:text-[#E2D7EA]/70'
                      } ${modalMode === 'view' ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Temporário
                    </button>
                    <button
                      type="button"
                      disabled={modalMode === 'view'}
                      onClick={() => setFormData({ ...formData, status: 'disabled' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                        formData.status === 'disabled'
                          ? 'bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-[#120919] border-[#E9E3D8] dark:border-[#3F2553] text-[#6B6B76] dark:text-[#E2D7EA]/70'
                      } ${modalMode === 'view' ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Desativado
                    </button>
                  </div>
                </div>

                {/* Data de Fim para Temporário */}
                {formData.status === 'temporary' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Janela de Acesso Temporário</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                        Data de Fim do Acesso *
                      </label>
                      <input
                        type="date"
                        disabled={modalMode === 'view'}
                        value={formData.accessEnd}
                        onChange={(e) => setFormData({ ...formData, accessEnd: e.target.value })}
                        className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          errors.accessEnd ? 'border-rose-500' : 'border-amber-300 dark:border-amber-700'
                        } ${modalMode === 'view' ? 'cursor-not-allowed opacity-80' : ''}`}
                      />
                      {errors.accessEnd && (
                        <p className="text-[10px] text-rose-600 mt-1">{errors.accessEnd}</p>
                      )}
                    </div>
                  </div>
                )}
              </form>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-[#E9E3D8] dark:border-[#3F2553] bg-[#FAF6EE]/40 dark:bg-[#1E1128] flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-[#6B6B76] dark:text-[#E2D7EA]/70 hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] transition-colors cursor-pointer"
                >
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A1033] hover:bg-[#120919] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#DFFF5F]" />
                    <span>{modalMode === 'edit' ? 'Salvar Alterações' : 'Salvar Usuário'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Modal Filtrar Usuários (Padronizado idêntico ao menu Clientes) */}
      {isFilterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24152F]/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/15 dark:border-[#3F2553] p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-100">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b border-[#24152F]/10 dark:border-[#3F2553]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#24152F] dark:text-[#DFFF5F]" />
                <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">Filtrar</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF6EE] dark:bg-[#2A1738] text-[#24152F]/70 dark:text-[#D2C4DC] hover:text-[#24152F] hover:bg-[#EDE4D3] flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar modal de filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status — Chips selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Status do Usuário
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {USER_STATUS_OPTIONS.map((status) => {
                    const isSelected = draftSelectedStatuses.includes(status.id);
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => {
                          setDraftSelectedStatuses((prev) =>
                            isSelected ? prev.filter((s) => s !== status.id) : [...prev, status.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Perfil de Acesso — Chips selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Perfil de Acesso
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {USER_PROFILE_OPTIONS.map((profile) => {
                    const isSelected = draftSelectedProfiles.includes(profile.id);
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setDraftSelectedProfiles((prev) =>
                            isSelected ? prev.filter((p) => p !== profile.id) : [...prev, profile.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {profile.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botões do modal: Limpar filtros & Aplicar filtros */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
              <button
                type="button"
                onClick={() => {
                  setDraftSelectedStatuses([]);
                  setDraftSelectedProfiles([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSelectedStatuses(draftSelectedStatuses);
                  setFilterSelectedProfiles(draftSelectedProfiles);
                  setIsFilterModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#24152F] text-[#F7F1E5] dark:bg-[#DFFF5F] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-xs border border-[#3F2553]"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
