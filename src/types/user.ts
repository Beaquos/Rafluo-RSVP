export type AdminUserRole =
  | 'Administrador'
  | 'Operacional'
  | 'Credenciamento';

export type AdminUserStatus = 'active' | 'temporary' | 'disabled';

export const normalizeAdminRole = (role: string): AdminUserRole => {
  if (role === 'Super Administrador' || role === 'Administrador' || role === 'Administrador (Padrão)') {
    return 'Administrador';
  }
  if (role === 'Gestor de Eventos' || role === 'Operacional') {
    return 'Operacional';
  }
  if (role === 'Cerimonialista' || role === 'Credenciamento') {
    return 'Credenciamento';
  }
  return 'Operacional';
};

export const normalizeAdminProfiles = (profiles?: string[]): AdminUserRole[] => {
  if (!profiles || profiles.length === 0) return ['Administrador'];
  const mapped = profiles.map(normalizeAdminRole);
  return Array.from(new Set(mapped));
};

export interface AdminUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  jobTitle?: string; // Função do usuário na organização
  role: AdminUserRole; // Perfil principal (para retrocompatibilidade)
  accessProfiles?: AdminUserRole[]; // Perfis de Acesso com múltipla seleção
  status: AdminUserStatus;
  accessStart?: string; // Data de início para usuário temporário (ex: 2026-10-01 ou 01/10/26)
  accessEnd?: string;   // Data de fim para usuário temporário (ex: 2026-10-31 ou 31/10/26)
  createdAt: string;    // Data de cadastro (ex: 2026-09-21)
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'rsvp' | 'system' | 'event';
  eventId?: string;
}
