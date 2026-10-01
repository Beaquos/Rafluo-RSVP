import React, { useState } from 'react';
import {
  Contact,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Eye,
  X,
  User,
  Tag,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { ClientData } from '../../data/mockData';
import { formatDateBR } from '../../utils/dateUtils';

interface HubClientsViewProps {
  clients: ClientData[];
  onSaveClient: (client: ClientData) => void;
  onShowToast: (message: string) => void;
}

const INVITATION_TYPES = [
  'Aniversário Infantil',
  'Aniversário Adulto',
  'Chá de Bebê',
  'Chá de Fraldas',
  'Outros',
] as const;

export const HubClientsView: React.FC<HubClientsViewProps> = ({
  clients,
  onSaveClient,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSelectedTypes, setFilterSelectedTypes] = useState<string[]>([]);
  const [draftSelectedTypes, setDraftSelectedTypes] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    invitationType: ClientData['invitationType'];
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    invitationType: 'Aniversário Adulto',
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

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    const matchesType =
      filterSelectedTypes.length === 0 || filterSelectedTypes.includes(c.invitationType);

    return matchesSearch && matchesType;
  });

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Aniversário Infantil':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Aniversário Adulto':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Chá de Bebê':
      case 'Chá de Fraldas':
      case 'Chá de Bebê ou Fraldas':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div id="hub-clients-view" className="space-y-6 pb-12">
      {/* 1. Page Title H1 + Contextual description (Item 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#24152F] dark:text-[#F7F1E5]">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#24152F]/70 dark:text-[#E2D7EA]/80 font-normal">
            Gerencie a base de clientes e seus tipos de convite.
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
              setIsFilterModalOpen(true);
            }}
            className={`relative flex items-center justify-center p-2.5 h-10 w-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex-shrink-0 shadow-2xs ${
              filterSelectedTypes.length > 0
                ? 'bg-[#24152F] text-[#F7F1E5] border-[#24152F]'
                : 'bg-white dark:bg-[#1E1128] border-[#24152F]/20 dark:border-[#3F2553] text-[#24152F] dark:text-[#F7F1E5] hover:bg-[#FAF6EE] dark:hover:bg-[#2A1738]'
            }`}
            title="Filtrar clientes"
          >
            <SlidersHorizontal className={`w-4 h-4 ${filterSelectedTypes.length > 0 ? 'text-[#DFFF5F]' : 'text-[#24152F] dark:text-[#F7F1E5]'}`} />
            {filterSelectedTypes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DFFF5F] text-[#180D20] text-[10px] font-black flex items-center justify-center">
                {filterSelectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Resumo de clientes exibidos */}
        <div className="text-xs text-[#24152F]/65 dark:text-[#D2C4DC]/70 font-medium flex items-center gap-2 justify-end">
          <span>Exibindo <strong>{filteredClients.length}</strong> de {clients.length}</span>
          {filterSelectedTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterSelectedTypes([])}
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
          <span className="text-xs text-[#24152F]/50 dark:text-[#D2C4DC]/60">
            {filteredClients.length} cliente(s)
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
            {filteredClients.map((client) => (
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

                {/* Actions: View and Edit */}
                <div className="flex items-center justify-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#24152F]/10 dark:border-[#3F2553]/50">
                  <button
                    type="button"
                    onClick={() => handleOpenView(client)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#24152F]/15 dark:border-[#3F2553] hover:border-[#24152F] hover:bg-[#FAF6EE] dark:hover:bg-[#2E1B3C] text-[#24152F] dark:text-[#F7F1E5] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    title="Visualizar detalhes do cliente"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#24152F] dark:text-[#DFFF5F]" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(client)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24152F] dark:bg-[#2E1B3C] text-[#F7F1E5] hover:bg-[#180D20] text-xs font-semibold transition-all cursor-pointer shadow-2xs border border-[#3F2553]"
                    title="Editar cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#DFFF5F]" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
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
                <p className="text-[11px] text-[#24152F]/55 dark:text-[#D2C4DC]/60 mt-1">
                  Opções padronizadas do sistema Rafluo.
                </p>
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
      {/* Modal Filtrar Clientes (Item 2 do User Request) */}
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
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#24152F]/70 dark:text-[#D2C4DC]/70 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
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
