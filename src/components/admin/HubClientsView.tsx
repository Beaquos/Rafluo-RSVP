import React, { useState } from 'react';
import {
  Contact,
  Plus,
  Search,
  Mail,
  Phone,
  Eye,
  Pen,
  Trash2,
  X,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { ClientData } from '../../data/mockData';
import { getTypeBadgeColor } from '../../utils/badgeUtils';
import { RowActionDropdown, ConfirmModal } from '../common/list-components';

interface HubClientsViewProps {
  clients: ClientData[];
  onSaveClient: (client: ClientData) => void;
  onDeleteClient?: (clientId: string) => void;
  onShowToast: (message: string) => void;
}

const INVITATION_TYPES = [
  'Aniversário Infantil',
  'Aniversário Adulto',
  'Chá de Bebê',
  'Chá de Fraldas',
  'Outros',
] as const;

const CLIENT_STATUS_OPTIONS: { id: 'active' | 'inactive'; label: string }[] = [
  { id: 'active', label: 'Ativo' },
  { id: 'inactive', label: 'Desativado' },
];

export const HubClientsView: React.FC<HubClientsViewProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSelectedTypes, setFilterSelectedTypes] = useState<string[]>([]);
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<string[]>([]);
  const [filterSelectedStatuses, setFilterSelectedStatuses] = useState<('active' | 'inactive')[]>([]);
  const [draftSelectedStatuses, setDraftSelectedStatuses] = useState<('active' | 'inactive')[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

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

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    invitationType: ClientData['invitationType'];
    status: 'active' | 'inactive';
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    invitationType: 'Aniversário Adulto',
    status: 'active',
    notes: '',
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
    setSelectedClient(null);
    setModalMode('create');
    setFormData({
      name: '',
      email: '',
      phone: '',
      invitationType: 'Aniversário Adulto',
      status: 'active',
      notes: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: ClientData) => {
    setSelectedClient(client);
    setModalMode('edit');
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      invitationType: client.invitationType,
      status: client.status === 'inactive' ? 'inactive' : 'active',
      notes: client.notes || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenView = (client: ClientData) => {
    setSelectedClient(client);
    setModalMode('view');
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      invitationType: client.invitationType,
      status: client.status === 'inactive' ? 'inactive' : 'active',
      notes: client.notes || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nome é obrigatório';
    if (!formData.email.trim()) {
      errs.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Insira um e-mail válido';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Telefone incompleto com DDD';
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

    const toSave: ClientData = {
      id: selectedClient ? selectedClient.id : `cli-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      invitationType: formData.invitationType,
      status: formData.status,
      createdAt: selectedClient ? selectedClient.createdAt : new Date().toISOString().split('T')[0],
      notes: formData.notes.trim() || undefined,
    };

    onSaveClient(toSave);
    handleCloseModal();
    onShowToast(
      modalMode === 'edit'
        ? `Cliente "${toSave.name}" atualizado com sucesso!`
        : `Cliente "${toSave.name}" cadastrado com sucesso!`
    );
  };

  // Filter clients by search, type, and status
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchesType =
      filterSelectedTypes.length === 0 || filterSelectedTypes.includes(c.invitationType);

    const clientStatus = c.status === 'inactive' ? 'inactive' : 'active';
    const matchesStatus =
      filterSelectedStatuses.length === 0 || filterSelectedStatuses.includes(clientStatus);

    return matchesSearch && matchesType && matchesStatus;
  });

  const activeFiltersCount = filterSelectedTypes.length + filterSelectedStatuses.length;

  return (
    <div id="hub-clients-view" className="space-y-6 pb-12">
      {/* 1. Page Title H1 + Contextual description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
            Gerencie a base de clientes, status e tipos de convite.
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
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
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
            id="btn-open-client-filter-modal"
            onClick={() => {
              setDraftSelectedTypes([...filterSelectedTypes]);
              setDraftSelectedStatuses([...filterSelectedStatuses]);
              setIsFilterModalOpen(true);
            }}
            className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
              activeFiltersCount > 0
                ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                : 'bg-white dark:bg-[#1E1128] border-[#24152F]/20 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
            }`}
            title="Filtrar clientes"
          >
            <SlidersHorizontal className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-[#DFFF5F]' : 'text-[#24152F] dark:text-[#F7F1E5]'}`} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] text-[#180D20] text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Resumo de clientes exibidos */}
        <div className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 font-medium flex items-center gap-2 justify-end">
          <span>Exibindo <strong>{filteredClients.length}</strong> de {clients.length}</span>
          {(activeFiltersCount > 0 || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setFilterSelectedTypes([]);
                setFilterSelectedStatuses([]);
                setSearchTerm('');
              }}
              className="text-[11px] text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-800 cursor-pointer ml-1"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Clients Listing */}
      <div className="bg-white dark:bg-[#1E1128] rounded-2xl border border-[#24152F]/10 dark:border-[#3F2553] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#24152F]/10 dark:border-[#3F2553] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">
            Clientes Cadastrados
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#24152F]/5 dark:bg-white/10 text-[#24152F] dark:text-[#F7F1E5]">
            {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Contact className="w-8 h-8 text-[#24152F]/30 dark:text-[#D2C4DC]/30 mx-auto" />
            <p className="text-sm font-semibold text-[#24152F] dark:text-[#F7F1E5]">Nenhum cliente encontrado</p>
            <p className="text-xs text-[#24152F]/50 dark:text-[#D2C4DC]/50">
              Tente redefinir os filtros ou cadastre um novo cliente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#24152F]/5 dark:divide-[#3F2553]/50">
            {filteredClients.map((client) => {
              const isInactive = client.status === 'inactive';
              return (
                <div
                  key={client.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF6EE]/40 dark:hover:bg-[#2E1B3C]/30 transition-colors"
                >
                  {/* Client Basic Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#24152F] dark:bg-[#2E1B3C] text-[#DFFF5F] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-[#24152F] dark:text-[#F7F1E5] truncate">
                          {client.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(
                            client.invitationType
                          )}`}
                        >
                          {client.invitationType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#24152F]/70 dark:text-[#D2C4DC]/80">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-[#24152F]/40 dark:text-[#D2C4DC]/50 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-[#24152F]/40 dark:text-[#D2C4DC]/50 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge + Menu de Três Pontos (⋮) — Visualizar, Editar, Excluir */}
                  <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#24152F]/10 dark:border-[#3F2553]/50">
                    <div className="flex-shrink-0">
                      {!isInactive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 leading-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Desativado
                        </span>
                      )}
                    </div>

                    <RowActionDropdown
                      id={`action-dropdown-client-${client.id}`}
                      actions={[
                        {
                          id: 'view',
                          label: 'Visualizar',
                          icon: Eye,
                          onClick: () => handleOpenView(client),
                        },
                        {
                          id: 'edit',
                          label: 'Editar',
                          icon: Pen,
                          onClick: () => handleOpenEdit(client),
                        },
                        {
                          id: 'delete',
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Excluir Cliente',
                              description: `Deseja realmente remover o cadastro de "${client.name}"? Esta ação excluirá os dados deste cliente da base.`,
                              onConfirm: () => {
                                if (onDeleteClient) {
                                  onDeleteClient(client.id);
                                }
                                onShowToast(`Cliente "${client.name}" excluído.`);
                              },
                            });
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Criar / Editar / Visualizar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#24152F]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1128] rounded-3xl border border-[#24152F]/15 dark:border-[#3F2553] shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#24152F] text-[#F7F1E5] flex items-center justify-between border-b border-[#3F2553]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DFFF5F] text-[#180D20] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {modalMode === 'create'
                      ? 'Novo Cliente'
                      : modalMode === 'edit'
                      ? 'Editar Cliente'
                      : 'Detalhes do Cliente'}
                  </h3>
                  <p className="text-xs text-[#D2C4DC]">
                    {modalMode === 'view'
                      ? 'Consulta aos dados cadastrais'
                      : 'Preencha os dados do cliente e tipo de convite'}
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
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  disabled={modalMode === 'view'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Marina Silva ou Casal Marina & Lucas"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] ${
                    errors.name ? 'border-rose-500' : 'border-[#24152F]/20 dark:border-[#3F2553]'
                  } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  disabled={modalMode === 'view'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ex: marina.silva@email.com"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] ${
                    errors.email ? 'border-rose-500' : 'border-[#24152F]/20 dark:border-[#3F2553]'
                  } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                />
                {errors.email && <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  disabled={modalMode === 'view'}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: formatPhoneBR(e.target.value) })
                  }
                  placeholder="(11) 98765-4321"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] ${
                    errors.phone ? 'border-rose-500' : 'border-[#24152F]/20 dark:border-[#3F2553]'
                  } ${modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''}`}
                />
                {errors.phone && <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>}
              </div>

              {/* Tipo de Convite e Status lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tipo de Convite */}
                <div>
                  <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                    Tipo de Convite *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.invitationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invitationType: e.target.value as ClientData['invitationType'],
                      })
                    }
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] border-[#24152F]/20 dark:border-[#3F2553] ${
                      modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''
                    }`}
                  >
                    {INVITATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Ativo / Desativado (Requisito 4) */}
                <div>
                  <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                    Status do Cliente *
                  </label>
                  <select
                    disabled={modalMode === 'view'}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] border-[#24152F]/20 dark:border-[#3F2553] ${
                      modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Desativado</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-[#24152F] dark:text-[#F7F1E5] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  disabled={modalMode === 'view'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais do cliente ou do evento..."
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-[#120919] text-[#24152F] dark:text-[#F7F1E5] focus:outline-none focus:ring-2 focus:ring-[#24152F] border-[#24152F]/20 dark:border-[#3F2553] ${
                    modalMode === 'view' ? 'opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#24152F]/10 dark:border-[#3F2553]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] cursor-pointer"
                >
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>

                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#24152F] dark:bg-[#DFFF5F] text-[#F7F1E5] dark:text-[#180D20] text-xs font-bold hover:bg-[#180D20] transition-colors cursor-pointer shadow-sm"
                  >
                    {modalMode === 'edit' ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Filtrar Clientes (Tipo de Convite e Status) */}
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
                <h3 className="text-base font-bold text-[#24152F] dark:text-[#F7F1E5]">Filtrar Clientes</h3>
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
              {/* Status do Cliente — Chips selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Status do Cadastro
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {CLIENT_STATUS_OPTIONS.map((statusOpt) => {
                    const isSelected = draftSelectedStatuses.includes(statusOpt.id);
                    return (
                      <button
                        key={statusOpt.id}
                        type="button"
                        onClick={() => {
                          setDraftSelectedStatuses((prev) =>
                            isSelected
                              ? prev.filter((s) => s !== statusOpt.id)
                              : [...prev, statusOpt.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {statusOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipo de Convite — Chips selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-[#24152F] dark:text-[#F7F1E5]">
                  Tipo de Convite
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {INVITATION_TYPES.map((type) => {
                    const isSelected = draftSelectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setDraftSelectedTypes((prev) =>
                            isSelected ? prev.filter((t) => t !== type) : [...prev, type]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F0E4] border-[#A3C79E] text-[#1E3B1E] shadow-2xs font-bold'
                            : 'bg-[#FAF6EE] dark:bg-[#2A1738] border-[#24152F]/15 dark:border-[#3F2553] text-[#24152F]/70 dark:text-[#D2C4DC] hover:bg-[#FAF6EE]/80'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {type}
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
                  setDraftSelectedTypes([]);
                  setDraftSelectedStatuses([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterSelectedTypes(draftSelectedTypes);
                  setFilterSelectedStatuses(draftSelectedStatuses);
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
