export interface PermissionItem {
  id: string;
  label: string;
  description?: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionItem[];
}

export interface AccessProfile {
  id: string;
  name: string;
  description: string;
  isSystemDefault?: boolean;
  userCount?: number;
  permissions: string[]; // List of permission IDs granted
  status: 'active' | 'inactive';
  createdAt: string;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'events',
    name: 'Eventos',
    description: 'Criação, gestão e personalização de eventos',
    permissions: [
      { id: 'events.view', label: 'Visualizar eventos' },
      { id: 'events.create', label: 'Criar novos eventos' },
      { id: 'events.edit', label: 'Editar dados e configurações' },
      { id: 'events.delete', label: 'Excluir eventos' },
    ],
  },
  {
    id: 'guests',
    name: 'Convidados e RSVP',
    description: 'Gestão da lista de convidados e confirmações de presença',
    permissions: [
      { id: 'guests.view', label: 'Visualizar convidados' },
      { id: 'guests.create', label: 'Cadastrar convidados' },
      { id: 'guests.edit', label: 'Editar respostas e dados' },
      { id: 'guests.delete', label: 'Excluir convidados' },
      { id: 'guests.import_export', label: 'Importar e exportar dados' },
      { id: 'guests.checkin', label: 'Realizar check-in presencial' },
    ],
  },
  {
    id: 'reports',
    name: 'Relatórios e Métricas',
    description: 'Acesso a métricas gerais e exportação de relatórios analíticos',
    permissions: [
      { id: 'reports.view', label: 'Visualizar relatórios gerais' },
      { id: 'reports.export', label: 'Exportar dados analíticos' },
    ],
  },
  {
    id: 'users',
    name: 'Usuários e Perfis',
    description: 'Gestão de usuários administrativos e perfis de permissão',
    permissions: [
      { id: 'users.view', label: 'Visualizar usuários' },
      { id: 'users.manage', label: 'Cadastrar e editar usuários' },
      { id: 'profiles.manage', label: 'Gerenciar perfis de acesso' },
    ],
  },
  {
    id: 'settings',
    name: 'Configurações Globais',
    description: 'Configurações de identidade visual, dados da empresa e sistema',
    permissions: [
      { id: 'settings.view', label: 'Visualizar configurações' },
      { id: 'settings.edit', label: 'Editar configurações do sistema' },
    ],
  },
];

export const normalizeAccessProfileName = (name: string): string => {
  if (name === 'Super Administrador' || name === 'Administrador' || name === 'Administrador (Padrão)') {
    return 'Administrador';
  }
  if (name === 'Gestor de Eventos' || name === 'Operacional') {
    return 'Operacional';
  }
  if (name === 'Cerimonialista' || name === 'Credenciamento') {
    return 'Credenciamento';
  }
  return name;
};

export const INITIAL_ACCESS_PROFILES: AccessProfile[] = [
  {
    id: 'super-admin',
    name: 'Administrador',
    description: 'Acesso completo e irrestrito a todas as áreas, relatórios, configurações e usuários do Rafluo.',
    isSystemDefault: true,
    userCount: 1,
    status: 'active',
    createdAt: '2026-01-01',
    permissions: [
      'events.view',
      'events.create',
      'events.edit',
      'events.delete',
      'guests.view',
      'guests.create',
      'guests.edit',
      'guests.delete',
      'guests.import_export',
      'guests.checkin',
      'reports.view',
      'reports.export',
      'users.view',
      'users.manage',
      'profiles.manage',
      'settings.view',
      'settings.edit',
    ],
  },
  {
    id: 'event-manager',
    name: 'Operacional',
    description: 'Criação, edição e gerenciamento operacional completo de eventos, convidados e relatórios.',
    isSystemDefault: false,
    userCount: 2,
    status: 'active',
    createdAt: '2026-01-10',
    permissions: [
      'events.view',
      'events.create',
      'events.edit',
      'guests.view',
      'guests.create',
      'guests.edit',
      'guests.delete',
      'guests.import_export',
      'guests.checkin',
      'reports.view',
      'reports.export',
    ],
  },
  {
    id: 'cerimonialista',
    name: 'Credenciamento',
    description: 'Operação presencial do evento, realização de check-in e consulta da lista de convidados.',
    isSystemDefault: false,
    userCount: 2,
    status: 'active',
    createdAt: '2026-02-01',
    permissions: [
      'events.view',
      'guests.view',
      'guests.checkin',
    ],
  },
];
