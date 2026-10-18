import React, { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Eye,
  Users,
  X,
  Search,
  Pen,
  Check,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AccessProfile,
  PERMISSION_MODULES,
  INITIAL_ACCESS_PROFILES,
  normalizeAccessProfileName,
} from '../../types/accessProfile';
import { formatDateBR } from '../../utils/dateUtils';
import {
  ConfirmModal,
  PermissionTree,
  Switch,
  RowActionDropdown,
} from '../common/list-components';

interface HubAccessProfilesViewProps {
  profiles: AccessProfile[];
  onSaveProfile: (profile: AccessProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onShowToast: (message: string) => void;
}

export const HubAccessProfilesView: React.FC<HubAccessProfilesViewProps> = ({
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onShowToast,
}) => {
  // Modal states: Centered modal pattern identical to HubUsersView
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<AccessProfile | null>(null);

  // Search & Filter (Pattern identical to HubClientsView)
  const [searchValue, setSearchValue] = useState('');
  const [filterSelectedStatuses, setFilterSelectedStatuses] = useState<('active' | 'inactive')[]>([]);
  const [draftSelectedStatuses, setDraftSelectedStatuses] = useState<('active' | 'inactive')[]>([]);
  const [filterSelectedTypes, setFilterSelectedTypes] = useState<('system' | 'custom')[]>([]);
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<('system' | 'custom')[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const PROFILE_STATUS_OPTIONS: { id: 'active' | 'inactive'; label: string }[] = [
    { id: 'active', label: 'Ativo' },
    { id: 'inactive', label: 'Inativo' },
  ];

  const PROFILE_TYPE_OPTIONS: { id: 'system' | 'custom'; label: string }[] = [
    { id: 'system', label: 'Padrão do Sistema' },
    { id: 'custom', label: 'Personalizado' },
  ];

  // Confirmation modal
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

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    status: 'active' as 'active' | 'inactive',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      description: '',
      permissions: ['events.view', 'guests.view'],
      status: 'active',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (profile: AccessProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: normalizeAccessProfileName(profile.name),
      description: profile.description,
      permissions: profile.permissions || [],
      status: profile.status,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (profile: AccessProfile) => {
    setViewingProfile({
      ...profile,
      name: normalizeAccessProfileName(profile.name),
    });
    setIsDetailsModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProfile(null);
    setFormErrors({});
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingProfile(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nome do perfil é obrigatório';
    if (!formData.description.trim())
      errs.description = 'Descrição do perfil é obrigatória';
    if (!formData.permissions || formData.permissions.length === 0) {
      errs.permissions = 'Selecione ao menos uma permissão para o perfil';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const profileToSave: AccessProfile = {
      id: editingProfile
        ? editingProfile.id
        : `prof-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      description: formData.description.trim(),
      isSystemDefault: editingProfile ? editingProfile.isSystemDefault : false,
      userCount: editingProfile ? editingProfile.userCount : 0,
      permissions: formData.permissions,
      status: formData.status,
      createdAt: editingProfile
        ? editingProfile.createdAt
        : new Date().toISOString().split('T')[0],
    };

    onSaveProfile(profileToSave);
    handleCloseFormModal();
    onShowToast(
      editingProfile
        ? `Perfil "${profileToSave.name}" atualizado com sucesso!`
        : `Perfil "${profileToSave.name}" criado com sucesso!`
    );
  };

  // Filter & Search (Padronizado idêntico ao menu Clientes)
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const normalizedName = normalizeAccessProfileName(p.name);
      const matchSearch =
        !searchValue ||
        normalizedName.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.description.toLowerCase().includes(searchValue.toLowerCase());

      const matchStatus =
        filterSelectedStatuses.length === 0 ||
        filterSelectedStatuses.includes(p.status);

      const matchType =
        filterSelectedTypes.length === 0 ||
        (filterSelectedTypes.includes('system') && p.isSystemDefault) ||
        (filterSelectedTypes.includes('custom') && !p.isSystemDefault);

      return matchSearch && matchStatus && matchType;
    });
  }, [profiles, searchValue, filterSelectedStatuses, filterSelectedTypes]);

  const activeFiltersCount =
    filterSelectedStatuses.length + filterSelectedTypes.length;

  const totalPossiblePermissions = PERMISSION_MODULES.reduce(
    (acc, mod) => acc + mod.permissions.length,
    0
  );

  return (
    <div id="hub-access-profiles-view" className="space-y-6 pb-12">
      {/* 1. Page Header (Padronizado igual a Usuários e Clientes) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
            Perfil de Acesso
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
            Gerencie os perfis e as permissões de acesso ao sistema.
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
          <span>Novo Perfil</span>
        </button>
      </div>

      {/* 2. Campo de Filtro (Padronizado idêntico ao menu Clientes) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF6EE]/60 dark:bg-[#1E1128] border border-[#24152F]/10 dark:border-[#3F2553]">
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] placeholder:text-[#24152F]/40 focus:outline-none focus:ring-2 focus:ring-[#24152F]"
            />
            <Search className="w-4 h-4 text-[#24152F]/40 absolute left-3 top-2.5 sm:top-3" />
          </div>

          <button
            type="button"
            id="btn-open-profile-filter-modal"
            onClick={() => {
              setDraftSelectedStatuses([...filterSelectedStatuses]);
              setDraftSelectedTypes([...filterSelectedTypes]);
              setIsFilterModalOpen(true);
            }}
            className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
              activeFiltersCount > 0
                ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                : 'bg-white dark:bg-[#1E1128] border-[#24152F]/20 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
            }`}
            title="Filtrar perfis de acesso"
          >
            <SlidersHorizontal className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-[#DFFF5F]' : 'text-[#24152F] dark:text-[#F7F1E5]'}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] text-[#180D20] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Resumo exibido (igual a Clientes) */}
        <div className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 font-medium flex items-center gap-2 justify-end">
          <span>
            Exibindo <strong>{filteredProfiles.length}</strong> de {profiles.length}
          </span>
          {(activeFiltersCount > 0 || searchValue) && (
            <button
              type="button"
              onClick={() => {
                setFilterSelectedStatuses([]);
                setFilterSelectedTypes([]);
                setSearchValue('');
              }}
              className="text-[11px] text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-800 cursor-pointer ml-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* 3. Card Perfis Cadastrados (Mesmo padrão visual do menu Usuários) */}
      <div className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#24152F]/10 dark:border-[#3F2553]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#24152F] text-[#DFFF5F] flex items-center justify-center shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5] leading-none">
                Perfis Cadastrados
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#24152F]/5 dark:bg-white/10 text-[#24152F] dark:text-[#F7F1E5]">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'perfil' : 'perfis'}
          </span>
        </div>

        <div className="divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/40">
          {filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#24152F]/60 dark:text-[#D2C4DC]/60">
              Nenhum perfil de acesso encontrado com os critérios pesquisados.
            </div>
          ) : (
            filteredProfiles.map((profile) => {
              const displayName = normalizeAccessProfileName(profile.name);

              return (
                <div
                  key={profile.id}
                  className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#FAF6EE]/40 dark:hover:bg-[#2A1738]/40 transition-colors"
                >
                  {/* Left: Ícone + Detalhes do Perfil */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#24152F] text-[#DFFF5F] font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Shield className="w-5 h-5 text-[#DFFF5F]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-sm font-bold text-[#24152F] dark:text-[#F7F1E5] truncate">
                          {displayName}
                        </h4>
                        {profile.isSystemDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                            Padrão do Sistema
                          </span>
                        )}
                        <span className="text-[10px] sm:text-[11px] font-medium bg-[#24152F]/5 dark:bg-white/5 text-[#24152F] dark:text-[#F7F1E5] px-2 py-0.5 rounded-md border border-[#24152F]/10 dark:border-white/10">
                          {profile.permissions.length} de {totalPossiblePermissions} permissões
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#24152F]/70 dark:text-[#E2D7EA]/70 flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#24152F]/50" />
                          <span>{profile.userCount || 0} usuário(s)</span>
                        </span>
                      </div>

                      <p className="text-xs text-[#24152F]/70 dark:text-[#E2D7EA]/70 truncate mt-0.5 max-w-xl">
                        {profile.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status badge + Botões de Ação padronizados (Visualizar Detalhes & Editar Perfil) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#24152F]/5 dark:border-[#3F2553]/30">
                    <div className="flex-shrink-0">
                      {profile.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Menu de Ações com Três Pontos (⋮) — Visualizar, Editar, Excluir */}
                    <RowActionDropdown
                      id={`action-dropdown-${profile.id}`}
                      actions={[
                        {
                          id: 'view',
                          label: 'Visualizar',
                          icon: Eye,
                          onClick: () => handleOpenDetails(profile),
                        },
                        {
                          id: 'edit',
                          label: 'Editar',
                          icon: Pen,
                          onClick: () => handleOpenEdit(profile),
                        },
                        {
                          id: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Excluir Perfil de Acesso',
                              description: profile.isSystemDefault
                                ? `O perfil "${displayName}" é um perfil padrão do sistema. Tem certeza que deseja removê-lo? Usuários associados perderão as permissões vinculadas a este perfil.`
                                : `Deseja realmente remover o perfil "${displayName}"? Usuários associados perderão as permissões vinculadas a este perfil.`,
                              onConfirm: () => {
                                onDeleteProfile(profile.id);
                                onShowToast(`Perfil "${displayName}" excluído.`);
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

      {/* 4. Modal de Criação / Edição de Perfil (Centralizado com backdrop escuro igual ao menu Usuários) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1128] rounded-2xl sm:rounded-3xl border border-[#24152F]/20 dark:border-[#3F2553] w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#1A1033] text-[#F7F1E5] p-5 sm:p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingProfile ? 'Editar Perfil' : 'Novo Perfil'}
                  </h3>
                  <p className="text-xs text-[#D2C4DC]">
                    Preencha as informações e configure a matriz de permissões
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseFormModal}
                className="text-[#D2C4DC] hover:text-[#F7F1E5] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Nome do Perfil */}
              <div>
                <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                  Nome do Perfil *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Operacional"
                  disabled={editingProfile?.isSystemDefault}
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                    formErrors.name ? 'border-rose-500' : 'border-[#E9E3D8] dark:border-[#3F2553]'
                  } ${editingProfile?.isSystemDefault ? 'bg-gray-100 opacity-70 cursor-not-allowed' : ''}`}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-rose-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5] mb-1">
                  Descrição do Perfil *
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva as responsabilidades e escopo de atuação deste perfil..."
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#1A1033] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#1A1033] ${
                    formErrors.description
                      ? 'border-rose-500'
                      : 'border-[#E9E3D8] dark:border-[#3F2553]'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-[10px] text-rose-600 mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Status Ativo / Inativo via Switch */}
              <div className="p-3.5 rounded-xl bg-[#FAF6EE] dark:bg-[#120919]/60 border border-[#24152F]/10 dark:border-[#3F2553]">
                <Switch
                  checked={formData.status === 'active'}
                  onChange={(checked) =>
                    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                  }
                  label="Perfil Ativo"
                  description="Quando inativo, usuários vinculados não conseguirão realizar ações protegidas."
                />
              </div>

              {/* Matriz de Permissões */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1A1033] dark:text-[#F7F1E5]">
                    Matriz de Permissões *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allPermIds = PERMISSION_MODULES.flatMap((m) =>
                        m.permissions.map((p) => p.id)
                      );
                      setFormData({
                        ...formData,
                        permissions:
                          formData.permissions.length === allPermIds.length
                            ? []
                            : allPermIds,
                      });
                    }}
                    className="text-[11px] font-semibold text-[#1A1033] dark:text-[#DFFF5F] hover:underline cursor-pointer"
                  >
                    {formData.permissions.length ===
                    PERMISSION_MODULES.flatMap((m) => m.permissions).length
                      ? 'Desmarcar todas'
                      : 'Marcar todas'}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B6B76] dark:text-[#E2D7EA]/60 leading-tight">
                  Selecione os módulos e as ações autorizadas para os operadores deste perfil.
                </p>

                <div className="border border-[#24152F]/10 dark:border-[#3F2553] rounded-xl p-3 bg-[#FAF6EE]/40 dark:bg-[#120919]/40 max-h-64 overflow-y-auto">
                  <PermissionTree
                    modules={PERMISSION_MODULES}
                    selectedPermissions={formData.permissions}
                    onChange={(perms) => setFormData({ ...formData, permissions: perms })}
                  />
                </div>

                {formErrors.permissions && (
                  <p className="text-[10px] text-rose-600 mt-1">
                    {formErrors.permissions}
                  </p>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B6B76] dark:text-[#D2C4DC] hover:text-[#1A1033] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1A1033] hover:bg-[#120919] text-[#F7F1E5] transition-all cursor-pointer shadow-xs border border-[#3F2553] active:scale-98"
                >
                  {editingProfile ? 'Salvar Alterações' : 'Salvar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal de Visualização de Detalhes (Centralizado com backdrop escuro igual ao menu Usuários) */}
      {isDetailsModalOpen && viewingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1128] rounded-2xl sm:rounded-3xl border border-[#24152F]/20 dark:border-[#3F2553] w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#1A1033] text-[#F7F1E5] p-5 sm:p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold flex-shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Detalhes do Perfil
                  </h3>
                  <p className="text-xs text-[#D2C4DC]">
                    {viewingProfile.name} • Permissões e escopo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDetailsModal}
                className="text-[#D2C4DC] hover:text-[#F7F1E5] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#120919]/60 border border-[#24152F]/10 dark:border-[#3F2553]">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1A1033] dark:text-[#F7F1E5]">
                    {viewingProfile.name}
                  </h4>
                  {viewingProfile.isSystemDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFFF5F] text-[#180D20]">
                      Padrão do Sistema
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#24152F]/70 dark:text-[#E2D7EA]/70 mt-1">
                  {viewingProfile.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-tight ${
                      viewingProfile.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        viewingProfile.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    ></span>
                    {viewingProfile.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="text-xs text-[#24152F]/70 dark:text-[#E2D7EA]/70">
                    • {viewingProfile.userCount || 0} usuário(s) associado(s)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#24152F]/60 dark:text-[#E2D7EA]/60">
                  Permissões Concedidas ({viewingProfile.permissions.length} de {totalPossiblePermissions})
                </h5>
                <div className="border border-[#24152F]/10 dark:border-[#3F2553] rounded-xl p-3 bg-[#FAF6EE]/40 dark:bg-[#120919]/40 max-h-64 overflow-y-auto">
                  <PermissionTree
                    modules={PERMISSION_MODULES}
                    selectedPermissions={viewingProfile.permissions}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
                <button
                  type="button"
                  onClick={() => {
                    const prof = viewingProfile;
                    handleCloseDetailsModal();
                    handleOpenEdit(prof);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1033] hover:bg-[#120919] text-[#F7F1E5] text-xs font-semibold cursor-pointer transition-all"
                >
                  <Pen className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseDetailsModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B6B76] dark:text-[#D2C4DC] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738] transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant="danger"
      />

      {/* Modal Filtrar Perfis de Acesso (Padronizado idêntico ao menu Clientes) */}
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
                  Status do Perfil
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {PROFILE_STATUS_OPTIONS.map((status) => {
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

              {/* Tipo de Perfil — Chips selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Tipo de Perfil
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {PROFILE_TYPE_OPTIONS.map((type) => {
                    const isSelected = draftSelectedTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setDraftSelectedTypes((prev) =>
                            isSelected ? prev.filter((t) => t !== type.id) : [...prev, type.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {type.label}
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
                  setDraftSelectedTypes([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSelectedStatuses(draftSelectedStatuses);
                  setFilterSelectedTypes(draftSelectedTypes);
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
    </div>
  );
};
