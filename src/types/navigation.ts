export type HubSection = 'dashboard' | 'events' | 'clients' | 'reports' | 'users' | 'settings';

export type NavSection =
  | 'overview'
  | 'events'
  | 'form-builder'
  | 'guest-link'
  | 'guests'
  | 'managers'
  | 'analytics'
  | 'settings';

export interface NavItem {
  id: NavSection;
  label: string;
  iconName: 'LayoutDashboard' | 'Calendar' | 'FileText' | 'Link' | 'Users' | 'UserCheck' | 'BarChart3' | 'Settings';
  badge?: string;
  description?: string;
}

export interface ActiveEventSummary {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  address: string;
  rsvpDeadline: string;
  daysRemaining: number;
  status: 'active' | 'closed' | 'draft';
  totalGuests: number;
  confirmed: number;
  pending: number;
  declined: number;
  companionsCount: number;
}
