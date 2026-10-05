import {
  EventData,
  GuestData,
  FormQuestionData,
  ManagerData,
  ClientData,
  INITIAL_EVENTS,
  INITIAL_GUESTS,
  INITIAL_QUESTIONS,
  INITIAL_MANAGERS,
  INITIAL_CLIENTS,
} from '../data/mockData';

const STORAGE_KEYS = {
  EVENTS: 'rafluo_events_v2',
  QUESTIONS: 'rafluo_questions_v2',
  GUESTS: 'rafluo_guests_v2',
  MANAGERS: 'rafluo_managers_v2',
  CLIENTS: 'rafluo_clients_v2',
  COMPANY: 'rafluo_company_data_v2',
  LOGO: 'rafluo_company_logo_v2',
};

// In-memory cache to guarantee instant reads and consistency within the same session/runtime
const memoryStore: Record<string, any> = {};

// BroadcastChannel for instant real-time sync across multiple tabs/windows
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('rafluo_cross_tab_sync');
  } catch {
    // Ignore unsupported environments
  }
}

export function subscribeToCrossTabSync(callback: (type: string, data: any) => void): () => void {
  const cleanups: (() => void)[] = [];

  // 1. BroadcastChannel for cross-tab sync
  if (syncChannel) {
    const channelHandler = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        if (event.data.type === 'events_updated' && event.data.payload) {
          memoryStore[STORAGE_KEYS.EVENTS] = event.data.payload;
        } else if (event.data.type === 'questions_updated' && event.data.payload) {
          memoryStore[STORAGE_KEYS.QUESTIONS] = event.data.payload;
        } else if (event.data.type === 'guests_updated' && event.data.payload) {
          memoryStore[STORAGE_KEYS.GUESTS] = event.data.payload;
        } else if (event.data.type === 'company_data_updated' && event.data.payload) {
          memoryStore[STORAGE_KEYS.COMPANY] = event.data.payload;
          if (event.data.payload.logo !== undefined) {
            memoryStore[STORAGE_KEYS.LOGO] = event.data.payload.logo;
          }
        }
        callback(event.data.type, event.data.payload);
      }
    };
    syncChannel.addEventListener('message', channelHandler);
    cleanups.push(() => syncChannel?.removeEventListener('message', channelHandler));
  }

  // 2. CustomEvent for instant same-window / same-tab updates
  if (typeof window !== 'undefined') {
    const customHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.type) {
        if (customEvent.detail.type === 'events_updated' && customEvent.detail.payload) {
          memoryStore[STORAGE_KEYS.EVENTS] = customEvent.detail.payload;
        } else if (customEvent.detail.type === 'questions_updated' && customEvent.detail.payload) {
          memoryStore[STORAGE_KEYS.QUESTIONS] = customEvent.detail.payload;
        } else if (customEvent.detail.type === 'guests_updated' && customEvent.detail.payload) {
          memoryStore[STORAGE_KEYS.GUESTS] = customEvent.detail.payload;
        } else if (customEvent.detail.type === 'company_data_updated' && customEvent.detail.payload) {
          memoryStore[STORAGE_KEYS.COMPANY] = customEvent.detail.payload;
          if (customEvent.detail.payload.logo !== undefined) {
            memoryStore[STORAGE_KEYS.LOGO] = customEvent.detail.payload.logo;
          }
        }
        callback(customEvent.detail.type, customEvent.detail.payload);
      }
    };
    window.addEventListener('rafluo_data_updated', customHandler);
    cleanups.push(() => window.removeEventListener('rafluo_data_updated', customHandler));
  }

  // 3. StorageEvent for cross-tab storage changes
  if (typeof window !== 'undefined') {
    const storageHandler = (e: StorageEvent) => {
      if (e.key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          memoryStore[e.key] = parsed;
          if (e.key === STORAGE_KEYS.EVENTS) callback('events_updated', parsed);
          if (e.key === STORAGE_KEYS.QUESTIONS) callback('questions_updated', parsed);
          if (e.key === STORAGE_KEYS.GUESTS) callback('guests_updated', parsed);
          if (e.key === STORAGE_KEYS.MANAGERS) callback('managers_updated', parsed);
          if (e.key === STORAGE_KEYS.CLIENTS) callback('clients_updated', parsed);
          if (e.key === STORAGE_KEYS.COMPANY || e.key === STORAGE_KEYS.LOGO) callback('company_data_updated', parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);
    cleanups.push(() => window.removeEventListener('storage', storageHandler));
  }

  return () => {
    cleanups.forEach((c) => c());
  };
}

function broadcastUpdate(type: string, payload: any) {
  // 1. BroadcastChannel
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (err) {
      console.warn('Error broadcasting update:', err);
    }
  }

  // 2. Same-window custom event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('rafluo_data_updated', {
          detail: { type, payload, timestamp: Date.now() },
        })
      );
    } catch {
      // Ignore
    }
  }
}

// Multi-tier storage: localStorage -> sessionStorage -> memoryStore -> legacy keys -> fallback
function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window !== 'undefined') {
    // 1. Check localStorage first to guarantee the absolute freshest persisted state
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        memoryStore[key] = parsed;
        return parsed ?? fallback;
      }
    } catch (err) {
      console.warn(`localStorage getItem error for "${key}":`, err);
    }

    // 2. Check sessionStorage backup
    try {
      const rawSession = sessionStorage.getItem(key);
      if (rawSession !== null && rawSession !== undefined) {
        const parsed = JSON.parse(rawSession);
        memoryStore[key] = parsed;
        return parsed ?? fallback;
      }
    } catch {
      // Ignore
    }

    // 3. Check legacy key without '_v2'
    const legacyKey = key.replace('_v2', '');
    if (legacyKey !== key) {
      try {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw !== null && legacyRaw !== undefined) {
          const parsed = JSON.parse(legacyRaw);
          setStoredItem(key, parsed);
          return parsed ?? fallback;
        }
      } catch {}
    }
  }

  // 4. Memory cache fallback
  if (memoryStore[key] !== undefined && memoryStore[key] !== null) {
    return memoryStore[key] as T;
  }

  // 5. Store fallback in memory and persist
  memoryStore[key] = fallback;
  return fallback;
}

// Multi-tier storage setItem with memory, localStorage, and sessionStorage persistence
function setStoredItem<T>(key: string, value: T): void {
  memoryStore[key] = value;
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`localStorage setItem error for "${key}":`, err);
  }

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore
  }
}

// Events
export function getStoredEvents(): EventData[] {
  const stored = getStoredItem<EventData[] | null>(STORAGE_KEYS.EVENTS, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  // Try legacy key
  const legacy = getStoredItem<EventData[] | null>('rafluo_events', null);
  if (legacy && Array.isArray(legacy) && legacy.length > 0) {
    setStoredItem(STORAGE_KEYS.EVENTS, legacy);
    return legacy;
  }
  setStoredItem(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  return INITIAL_EVENTS;
}

export function getStoredEventByIdOrSlug(slugOrId: string): EventData | undefined {
  if (!slugOrId) return undefined;
  const events = getStoredEvents();
  const clean = slugOrId.toLowerCase().trim();
  return events.find(
    (e) => (e.slug && e.slug.toLowerCase().trim() === clean) || e.id.toLowerCase().trim() === clean
  );
}

export function saveStoredEvents(events: EventData[]): void {
  setStoredItem(STORAGE_KEYS.EVENTS, events);
  broadcastUpdate('events_updated', events);
  // Persist to server in background
  if (typeof window !== 'undefined') {
    fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    }).catch(() => {
      // Dev mode or offline
    });
  }
}

// Save single updated event
export function saveStoredEventSingle(updated: EventData): EventData[] {
  const current = getStoredEvents();
  const exists = current.some((e) => e.id === updated.id);
  const next = exists
    ? current.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    : [...current, updated];
  saveStoredEvents(next);
  if (typeof window !== 'undefined') {
    fetch(`/api/events/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }
  return next;
}

// Questions (Formulário Personalizado)
export function getStoredQuestions(): FormQuestionData[] {
  const stored = getStoredItem<FormQuestionData[] | null>(STORAGE_KEYS.QUESTIONS, null);
  if (stored && Array.isArray(stored)) {
    // Purge any legacy questions that were auto-seeded in older builds
    const cleaned = stored.filter((q) => q.id !== 'q_custom_01' && q.id !== 'q_custom_02');
    if (cleaned.length !== stored.length) {
      setStoredItem(STORAGE_KEYS.QUESTIONS, cleaned);
    }
    return cleaned;
  }
  const legacy = getStoredItem<FormQuestionData[] | null>('rafluo_questions', null);
  if (legacy && Array.isArray(legacy)) {
    const cleaned = legacy.filter((q) => q.id !== 'q_custom_01' && q.id !== 'q_custom_02');
    setStoredItem(STORAGE_KEYS.QUESTIONS, cleaned);
    return cleaned;
  }
  setStoredItem(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  return INITIAL_QUESTIONS;
}

export function getStoredQuestionsForEvent(eventId: string): FormQuestionData[] {
  const questions = getStoredQuestions();
  return questions.filter((q) => q.eventId === eventId);
}

export function saveStoredQuestions(questions: FormQuestionData[]): void {
  setStoredItem(STORAGE_KEYS.QUESTIONS, questions);
  broadcastUpdate('questions_updated', questions);
  // Persist to server in background
  if (typeof window !== 'undefined') {
    fetch('/api/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions),
    }).catch(() => {
      // Offline fallback
    });
  }
}

export function deleteStoredQuestion(questionId: string): FormQuestionData[] {
  const current = getStoredQuestions();
  const next = current.filter((q) => q.id !== questionId);
  saveStoredQuestions(next);
  if (typeof window !== 'undefined') {
    fetch(`/api/questions/${questionId}`, {
      method: 'DELETE',
    }).catch(() => {
      // Offline fallback
    });
  }
  return next;
}

// Guests
export function getStoredGuests(): GuestData[] {
  return getStoredItem<GuestData[]>(STORAGE_KEYS.GUESTS, INITIAL_GUESTS);
}

export function saveStoredGuests(guests: GuestData[]): void {
  setStoredItem(STORAGE_KEYS.GUESTS, guests);
  broadcastUpdate('guests_updated', guests);
  if (typeof window !== 'undefined') {
    fetch('/api/guests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guests),
    }).catch(() => {});
  }
}

// Managers
export function getStoredManagers(): ManagerData[] {
  return getStoredItem<ManagerData[]>(STORAGE_KEYS.MANAGERS, INITIAL_MANAGERS);
}

export function saveStoredManagers(managers: ManagerData[]): void {
  setStoredItem(STORAGE_KEYS.MANAGERS, managers);
  broadcastUpdate('managers_updated', managers);
}

// Clients
export function getStoredClients(): ClientData[] {
  return getStoredItem<ClientData[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
}

export function saveStoredClients(clients: ClientData[]): void {
  setStoredItem(STORAGE_KEYS.CLIENTS, clients);
  broadcastUpdate('clients_updated', clients);
}

export interface CompanyData {
  logo: string;
  companyName: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  facebook: string;
  whatsapp: string;
}

const DEFAULT_COMPANY_DATA: CompanyData = {
  logo: '',
  companyName: 'Rafluo Soluções para Eventos Ltda.',
  cpfCnpj: '45.892.104/0001-38',
  phone: '(11) 98765-4321',
  email: 'contato@rafluo.com.br',
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Andar 14',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  instagram: '@rafluo.eventos',
  twitter: '@rafluo',
  linkedin: 'https://linkedin.com/company/rafluo',
  facebook: 'https://facebook.com/rafluo.oficial',
  whatsapp: '(11) 98765-4321',
};

// Company Data & Logo persistence
export function getStoredCompanyData(): CompanyData {
  const stored = getStoredItem<CompanyData>(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY_DATA);
  const directLogo = getStoredItem<string | null>(STORAGE_KEYS.LOGO, null);
  if (directLogo && !stored.logo) {
    return { ...stored, logo: directLogo };
  }
  return stored;
}

export function saveStoredCompanyData(data: CompanyData): void {
  setStoredItem(STORAGE_KEYS.COMPANY, data);
  if (data.logo !== undefined) {
    setStoredItem(STORAGE_KEYS.LOGO, data.logo || '');
  }
  broadcastUpdate('company_data_updated', data);
  if (typeof window !== 'undefined') {
    fetch('/api/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }
}

export function getStoredCompanyLogo(): string {
  const direct = getStoredItem<string | null>(STORAGE_KEYS.LOGO, null);
  if (direct && direct.trim().length > 0) return direct;
  const company = getStoredCompanyData();
  return company?.logo || '';
}

// Fetch all from backend server to reconcile with disk storage
export async function syncFromBackend(): Promise<{
  events?: EventData[];
  questions?: FormQuestionData[];
  guests?: GuestData[];
  managers?: ManagerData[];
  clients?: ClientData[];
  companyData?: CompanyData;
} | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.events) && Array.isArray(data.questions)) {
      setStoredItem(STORAGE_KEYS.EVENTS, data.events);
      setStoredItem(STORAGE_KEYS.QUESTIONS, data.questions);
      if (Array.isArray(data.guests)) setStoredItem(STORAGE_KEYS.GUESTS, data.guests);
      if (Array.isArray(data.managers)) setStoredItem(STORAGE_KEYS.MANAGERS, data.managers);
      if (Array.isArray(data.clients)) setStoredItem(STORAGE_KEYS.CLIENTS, data.clients);
      if (data.companyData) {
        setStoredItem(STORAGE_KEYS.COMPANY, data.companyData);
        if (data.companyData.logo) {
          setStoredItem(STORAGE_KEYS.LOGO, data.companyData.logo);
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend sync unavailable, using local store:', err);
  }
  return null;
}

export { STORAGE_KEYS };
