export type AdminUserStatus = 'active' | 'disabled' | 'temporary';
export type AdminUserRole = 'Super Administrador' | 'Gestor de Eventos' | 'Cerimonialista';

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
