import { HubSection, NavSection } from '../types/navigation';
import { EventData, GuestData } from '../data/mockData';

/**
 * Navigation Routes and URL helpers for Rafluo
 */

export const HUB_ROUTES: Record<HubSection, string> = {
  dashboard: '/dashboard',
  events: '/eventos',
  clients: '/clientes',
  reports: '/relatorios',
  users: '/usuarios',
  settings: '/configuracoes',
};

export const getHubPath = (section: HubSection): string => {
  return HUB_ROUTES[section] || '/dashboard';
};

export const parseHubPath = (pathname: string): HubSection | null => {
  const clean = pathname.replace(/\/+$/, '').toLowerCase();
  if (clean === '' || clean === '/' || clean === '/dashboard') return 'dashboard';
  if (clean === '/eventos') return 'events';
  if (clean === '/clientes') return 'clients';
  if (clean === '/relatorios') return 'reports';
  if (clean === '/usuarios') return 'users';
  if (clean === '/configuracoes' || clean === '/configuracao') return 'settings';
  return null;
};

export const getEventTabSlug = (section: NavSection): string => {
  switch (section) {
    case 'overview':
      return '';
    case 'events':
      return 'dados';
    case 'guests':
      return 'convidados';
    case 'form-builder':
      return 'formulario';
    case 'guest-link':
      return 'link-convite';
    case 'managers':
      return 'responsaveis';
    case 'analytics':
      return 'relatorios';
    case 'settings':
      return 'configuracoes';
    default:
      return '';
  }
};

export const parseEventTabSlug = (tabSlug?: string): NavSection => {
  if (!tabSlug) return 'overview';
  const clean = tabSlug.toLowerCase().trim();
  switch (clean) {
    case 'dados':
    case 'detalhes':
    case 'evento':
    case 'eventos':
      return 'events';
    case 'convidados':
    case 'respostas':
    case 'guests':
      return 'guests';
    case 'formulario':
    case 'form-builder':
    case 'perguntas':
      return 'form-builder';
    case 'link-convite':
    case 'guest-link':
    case 'convite-link':
      return 'guest-link';
    case 'responsaveis':
    case 'managers':
      return 'managers';
    case 'relatorios':
    case 'analytics':
    case 'analise':
      return 'analytics';
    case 'configuracoes':
    case 'settings':
      return 'settings';
    case 'visao-geral':
    case 'overview':
    case 'dashboard':
    default:
      return 'overview';
  }
};

export const getEventPath = (
  event: Pick<EventData, 'id' | 'slug'>,
  section: NavSection = 'overview'
): string => {
  const identifier = event.slug || event.id;
  const tabSlug = getEventTabSlug(section);
  return tabSlug ? `/eventos/${identifier}/${tabSlug}` : `/eventos/${identifier}`;
};

export const getClientPanelPath = (
  event: Pick<EventData, 'id' | 'slug'>
): string => {
  const identifier = event.slug || event.id;
  return `/responsavel/${identifier}`;
};

export interface ParsedRoute {
  type: 'hub' | 'event' | 'rsvp-event' | 'rsvp-guest' | 'client-portal' | 'not-found';
  hubSection?: HubSection;
  eventIdOrSlug?: string;
  matchedEvent?: EventData;
  eventSection?: NavSection;
  guestCode?: string;
  matchedGuest?: GuestData;
}

export const parseCurrentUrl = (
  pathname: string,
  events: EventData[],
  guests: GuestData[]
): ParsedRoute => {
  const clean = pathname.replace(/\/+$/, '') || '/';

  // 1. Check Client/Responsible Portal: /responsavel/:slugOrId or /cliente/:slugOrId
  const clientPortalMatch = clean.match(/^\/(?:responsavel|cliente|painel-cliente)\/([^/]+)$/i);
  if (clientPortalMatch) {
    const rawIdentifier = decodeURIComponent(clientPortalMatch[1]).toLowerCase().trim();
    const matched = events.find(
      (e) =>
        (e.slug && e.slug.toLowerCase().trim() === rawIdentifier) ||
        e.id.toLowerCase().trim() === rawIdentifier
    );
    if (matched) {
      return {
        type: 'client-portal',
        eventIdOrSlug: rawIdentifier,
        matchedEvent: matched,
      };
    }
    return {
      type: 'not-found',
      eventIdOrSlug: rawIdentifier,
    };
  }

  // 2. Check Public Event RSVP: /rsvp/evento/:slugOrId
  const rsvpEventMatch = clean.match(/^\/rsvp\/evento\/([^/]+)$/i);
  if (rsvpEventMatch) {
    const rawIdentifier = decodeURIComponent(rsvpEventMatch[1]).toLowerCase().trim();
    const matched = events.find(
      (e) =>
        (e.slug && e.slug.toLowerCase().trim() === rawIdentifier) ||
        e.id.toLowerCase().trim() === rawIdentifier
    );
    if (matched) {
      return {
        type: 'rsvp-event',
        eventIdOrSlug: rawIdentifier,
        matchedEvent: matched,
      };
    }
    return {
      type: 'not-found',
      eventIdOrSlug: rawIdentifier,
    };
  }

  // 2. Check Individual Guest RSVP: /rsvp/:code (where code is not 'evento')
  const rsvpGuestMatch = clean.match(/^\/rsvp\/([^/]+)$/i);
  if (rsvpGuestMatch && rsvpGuestMatch[1].toLowerCase() !== 'evento') {
    const rawCode = decodeURIComponent(rsvpGuestMatch[1]).toLowerCase().trim();
    const matchedGuest = guests.find(
      (g) => g.rsvpCode.toLowerCase().trim() === rawCode
    );

    if (matchedGuest) {
      const parentEvent = events.find((e) => e.id === matchedGuest.eventId);
      return {
        type: 'rsvp-guest',
        guestCode: rawCode,
        matchedGuest,
        matchedEvent: parentEvent || events[0],
      };
    }

    // Also check if someone accessed /rsvp/:eventSlug directly
    const matchedEvent = events.find(
      (e) =>
        (e.slug && e.slug.toLowerCase().trim() === rawCode) ||
        e.id.toLowerCase().trim() === rawCode
    );
    if (matchedEvent) {
      return {
        type: 'rsvp-event',
        eventIdOrSlug: rawCode,
        matchedEvent,
      };
    }

    return {
      type: 'not-found',
      guestCode: rawCode,
    };
  }

  // 3. Check Inside Client Event: /eventos/:eventIdOrSlug or /eventos/:eventIdOrSlug/:tab
  const eventMatch = clean.match(/^\/eventos\/([^/]+)(?:\/([^/]+))?$/i);
  if (eventMatch) {
    const rawEventSlug = decodeURIComponent(eventMatch[1]).toLowerCase().trim();
    const tabSlug = eventMatch[2] ? decodeURIComponent(eventMatch[2]).toLowerCase().trim() : undefined;

    const matched = events.find(
      (e) =>
        (e.slug && e.slug.toLowerCase().trim() === rawEventSlug) ||
        e.id.toLowerCase().trim() === rawEventSlug
    );

    if (matched) {
      return {
        type: 'event',
        eventIdOrSlug: rawEventSlug,
        matchedEvent: matched,
        eventSection: parseEventTabSlug(tabSlug),
      };
    }
    return {
      type: 'not-found',
      eventIdOrSlug: rawEventSlug,
    };
  }

  // 4. Check Hub General Routes: /, /dashboard, /eventos, /relatorios, /usuarios
  const hubSection = parseHubPath(clean);
  if (hubSection) {
    return {
      type: 'hub',
      hubSection,
    };
  }

  return {
    type: 'not-found',
  };
};
