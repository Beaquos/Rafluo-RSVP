/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './components/admin/AdminLayout';
import { HubDashboardView } from './components/admin/HubDashboardView';
import { HubReportsView } from './components/admin/HubReportsView';
import { HubUsersView } from './components/admin/HubUsersView';
import { HubClientsView } from './components/admin/HubClientsView';
import { HubSettingsView } from './components/admin/HubSettingsView';
import { UserProfileModal } from './components/admin/UserProfileModal';
import { LoginView } from './components/auth/LoginView';
import { DashboardSkeleton } from './components/admin/DashboardSkeleton';
import { MasterEventsHub } from './components/admin/MasterEventsHub';
import { GuestRsvpView } from './components/guest/GuestRsvpView';
import { ClientPortalView } from './components/client/ClientPortalView';
import { EventModal } from './components/modals/EventModal';
import { GuestModal } from './components/modals/GuestModal';
import { ImportCsvModal } from './components/modals/ImportCsvModal';
import { QuestionModal } from './components/modals/QuestionModal';
import { ManagerModal } from './components/modals/ManagerModal';
import { WhatsAppModal } from './components/modals/WhatsAppModal';
import { GuestDetailsModal } from './components/modals/GuestDetailsModal';
import { NotFoundView } from './components/common/NotFoundView';
import { Toast } from './components/common/Toast';
import {
  INITIAL_EVENTS,
  INITIAL_GUESTS,
  INITIAL_QUESTIONS,
  INITIAL_MANAGERS,
  INITIAL_CLIENTS,
  EventData,
  GuestData,
  InviteMember,
  ClientData,
  FormQuestionData,
  ManagerData,
} from './data/mockData';
import { HubSection, NavSection } from './types/navigation';
import { AdminUser, AdminUserStatus } from './types/user';
import { copyToClipboard, getEventRsvpUrl, getGuestRsvpUrl } from './utils/linkUtils';
import {
  parseCurrentUrl,
  getHubPath,
  getEventPath,
} from './utils/navigationRoutes';
import {
  getStoredEvents,
  saveStoredEvents,
  saveStoredEventSingle,
  getStoredQuestions,
  saveStoredQuestions,
  deleteStoredQuestion,
  getStoredEventByIdOrSlug,
  getStoredQuestionsForEvent,
  subscribeToCrossTabSync,
  getStoredGuests,
  saveStoredGuests,
  getStoredManagers,
  saveStoredManagers,
  getStoredClients,
  saveStoredClients,
  syncFromBackend,
  STORAGE_KEYS,
} from './utils/storageUtils';

// Initial Registered Administrator User
const INITIAL_ADMIN_USER: AdminUser = {
  id: 'usr-01',
  name: 'Beatriz',
  lastName: 'Alencar',
  email: 'beaquos@gmail.com',
  phone: '(61) 98765-4321',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  jobTitle: 'Diretora Geral & Assessora Chefe',
  role: 'Super Administrador',
  accessProfiles: ['Super Administrador'],
  status: 'active',
  createdAt: '2026-01-15',
};

const INITIAL_ADMIN_USERS_LIST: AdminUser[] = [
  INITIAL_ADMIN_USER,
  {
    id: 'usr-02',
    name: 'Lucas',
    lastName: 'Ferreira',
    email: 'lucas@beaquos.com',
    phone: '(61) 99123-4567',
    photoUrl: null,
    jobTitle: 'Gestor Operacional de Eventos',
    role: 'Gestor de Eventos',
    accessProfiles: ['Gestor de Eventos'],
    status: 'active',
    createdAt: '2026-02-10',
  },
  {
    id: 'usr-03',
    name: 'Helena',
    lastName: 'Vasconcelos',
    email: 'helena.eventos@gmail.com',
    phone: '(61) 98234-5678',
    photoUrl: null,
    jobTitle: 'Cerimonialista & Assessora',
    role: 'Cerimonialista',
    accessProfiles: ['Cerimonialista', 'Gestor de Eventos'],
    status: 'active',
    createdAt: '2026-03-01',
  },
  {
    id: 'usr-04',
    name: 'Mariana',
    lastName: 'Ribeiro',
    email: 'mariana.apoio@beaquos.com',
    phone: '(61) 98345-6789',
    photoUrl: null,
    jobTitle: 'Assistente de Cerimonial',
    role: 'Cerimonialista',
    accessProfiles: ['Cerimonialista'],
    status: 'temporary',
    accessStart: '2026-10-01',
    accessEnd: '2026-10-31',
    createdAt: '2026-09-21',
  },
];

export default function App() {
  // Real browser URL is the single source of truth for routing
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
  });

  // Core Data States with localStorage persistence
  const [events, setEvents] = useState<EventData[]>(getStoredEvents);
  const [activeEventId, setActiveEventId] = useState<string>(() => {
    const loaded = getStoredEvents();
    return loaded[0]?.id || INITIAL_EVENTS[0].id;
  });
  const [guests, setGuests] = useState<GuestData[]>(getStoredGuests);
  const [questions, setQuestions] = useState<FormQuestionData[]>(getStoredQuestions);
  const [managers, setManagers] = useState<ManagerData[]>(getStoredManagers);
  const [clients, setClients] = useState<ClientData[]>(getStoredClients);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser>(INITIAL_ADMIN_USER);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS_LIST);

  // Modals Visibility
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestData | null>(null);
  const [isImportCsvModalOpen, setIsImportCsvModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestionData | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerData | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isGuestDetailsModalOpen, setIsGuestDetailsModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Selected entities for modals
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null);

  // Simulation / Guest Mode
  const [isGuestPreviewMode, setIsGuestPreviewMode] = useState(false);
  const [previewGuestCode, setPreviewGuestCode] = useState<string>(INITIAL_GUESTS[0]?.rsvpCode || '');

  // Notifications / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasCopiedHeaderLink, setHasCopiedHeaderLink] = useState(false);

  // Navigation controller ensuring URL push/replace and state update
  const navigateTo = useCallback((newPath: string, replace = false) => {
    if (typeof window === 'undefined') return;
    if (newPath === window.location.pathname) {
      setCurrentPath(newPath);
      return;
    }
    if (replace) {
      window.history.replaceState({}, '', newPath);
    } else {
      window.history.pushState({}, '', newPath);
    }
    setCurrentPath(newPath);
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync from backend server on initial load to ensure freshest database state
  useEffect(() => {
    syncFromBackend().then((data) => {
      if (data) {
        if (Array.isArray(data.events)) setEvents(data.events);
        if (Array.isArray(data.questions)) setQuestions(data.questions);
        if (Array.isArray(data.guests)) setGuests(data.guests);
        if (Array.isArray(data.managers)) setManagers(data.managers);
        if (Array.isArray(data.clients)) setClients(data.clients);
      }
    });
  }, []);

  // Listen to cross-tab storage changes (e.g. changes made in Admin tab reflected in RSVP tab)
  useEffect(() => {
    const unsubscribe = subscribeToCrossTabSync((type, payload) => {
      if (type === 'events_updated' && Array.isArray(payload)) {
        setEvents(payload);
      } else if (type === 'questions_updated' && Array.isArray(payload)) {
        setQuestions(payload);
      } else if (type === 'guests_updated' && Array.isArray(payload)) {
        setGuests(payload);
      } else if (type === 'managers_updated' && Array.isArray(payload)) {
        setManagers(payload);
      } else if (type === 'clients_updated' && Array.isArray(payload)) {
        setClients(payload);
      }
    });

    return unsubscribe;
  }, []);

  // Whenever navigating to public RSVP, make sure events and questions are freshly loaded from storage
  useEffect(() => {
    if (currentPath.startsWith('/rsvp/')) {
      const freshEvents = getStoredEvents();
      const freshQuestions = getStoredQuestions();
      setEvents(freshEvents);
      setQuestions(freshQuestions);
    }
  }, [currentPath]);

  // Redirect root "/" to "/dashboard"
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      navigateTo('/dashboard', true);
    }
  }, [navigateTo]);

  // Parse current route based on URL and database state
  const route = parseCurrentUrl(currentPath, events, guests);

  // Keep activeEventId synchronized when navigating inside an event
  useEffect(() => {
    if (route.type === 'event' && route.matchedEvent) {
      setActiveEventId(route.matchedEvent.id);
    }
  }, [route]);

  // Active event resolution
  const activeEvent: EventData =
    (route.type === 'event' && route.matchedEvent) ||
    events.find((e) => e.id === activeEventId) ||
    events[0] ||
    INITIAL_EVENTS[0];

  // Guests for active event
  const activeEventGuests = guests.filter((g) => g.eventId === activeEvent.id);

  // Managers for active event
  const activeEventManagers = managers.filter((m) => m.eventId === activeEvent.id);

  // Navigation handlers
  const handleSelectEvent = (selected: EventData) => {
    setActiveEventId(selected.id);
    navigateTo(getEventPath(selected, 'overview'));
    setToastMessage(`Acessando a gestão de "${selected.name}"`);
  };

  const handleExitToMaster = () => {
    navigateTo('/eventos');
    setToastMessage('Você está no Hub Geral de Eventos.');
  };

  const handleSelectHubSection = (hubSec: HubSection) => {
    navigateTo(getHubPath(hubSec));
  };

  const handleSelectEventSection = (sec: NavSection) => {
    navigateTo(getEventPath(activeEvent, sec));
  };

  // Copying event RSVP link
  const handleCopyEventLink = async (targetEvent?: EventData) => {
    const ev = targetEvent || activeEvent;
    const url = getEventRsvpUrl(ev.id, ev.slug);
    const ok = await copyToClipboard(url);
    if (ok) {
      setHasCopiedHeaderLink(true);
      setToastMessage(`Link público do convite "${ev.name}" copiado com sucesso!`);
      setTimeout(() => setHasCopiedHeaderLink(false), 2500);
    }
  };

  // Event modal handlers (new or edit)
  const handleOpenNewEventModal = () => {
    const newDraft: EventData = {
      id: `ev-${Date.now().toString().slice(-4)}`,
      name: '',
      clientName: '',
      slug: '',
      type: 'Casamento',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      location: '',
      address: '',
      mapsUrl: 'https://maps.google.com',
      description: '',
      rsvpDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      allowGuests: true,
      maxGuestsPerInvite: 2,
      status: 'active',
    };
    setEditingEvent(newDraft);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEventModal = (eventToEdit?: EventData) => {
    setEditingEvent(eventToEdit || activeEvent);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (updated: EventData) => {
    const isNew = !events.some((e) => e.id === updated.id);

    setEvents((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      const next = exists
        ? prev.map((e) => (e.id === updated.id ? updated : e))
        : [updated, ...prev];
      saveStoredEvents(next);
      return next;
    });

    // Se for novo evento, vincular um responsável específico para este evento conforme cadastro
    if (isNew && updated.clientName) {
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase() === updated.clientName?.toLowerCase()
      );
      const newManager: ManagerData = {
        id: `m-${Date.now()}`,
        eventId: updated.id,
        name: updated.clientName,
        email: matchedClient?.email || `${updated.slug || 'contato'}@exemplo.com`,
        phone: matchedClient?.phone || '(61) 98888-0000',
        accessStart: new Date().toISOString().split('T')[0],
        accessEnd:
          updated.rsvpDeadline ||
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      };
      setManagers((prev) => {
        const next = [...prev, newManager];
        saveStoredManagers(next);
        return next;
      });
    }

    setActiveEventId(updated.id);
    setToastMessage(`Evento "${updated.name || 'Novo Evento'}" salvo com sucesso!`);
    if (isNew) {
      navigateTo(getEventPath(updated, 'overview'));
    }
  };

  const handleSaveEventCustomization = (updated: EventData) => {
    const next = saveStoredEventSingle(updated);
    setEvents(next);
    setToastMessage('Personalização da página salva com sucesso!');
    // Mantém o usuário exatamente na seção em que estava realizando a configuração, sem alterar rota ou redirecionar
  };

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find((e) => e.id === eventId);
    if (!eventToDelete) return;

    // Remover somente o evento selecionado e seus dados relacionados
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== eventId);
      saveStoredEvents(next);
      return next;
    });
    setGuests((prev) => {
      const next = prev.filter((g) => g.eventId !== eventId);
      saveStoredGuests(next);
      return next;
    });
    setQuestions((prev) => {
      const next = prev.filter((q) => q.eventId !== eventId);
      saveStoredQuestions(next);
      return next;
    });
    setManagers((prev) => {
      const next = prev.filter((m) => m.eventId !== eventId);
      saveStoredManagers(next);
      return next;
    });

    // Se o evento ativo for o excluído, selecionar outro evento
    if (activeEventId === eventId) {
      const remaining = events.filter((e) => e.id !== eventId);
      if (remaining.length > 0) {
        setActiveEventId(remaining[0].id);
      }
    }

    setToastMessage(`Evento "${eventToDelete.name}" e dados vinculados excluídos com sucesso.`);
  };

  const handleSaveGuest = (savedGuest: GuestData) => {
    const guestWithEvent = {
      ...savedGuest,
      eventId: activeEvent.id,
    };
    setGuests((prev) => {
      const exists = prev.some((g) => g.id === savedGuest.id);
      const next = exists
        ? prev.map((g) => (g.id === savedGuest.id ? guestWithEvent : g))
        : [guestWithEvent, ...prev];
      saveStoredGuests(next);
      return next;
    });
    setToastMessage(`Convite "${savedGuest.inviteName || savedGuest.name}" salvo com sucesso!`);
    setEditingGuest(null);
  };

  const handleDeleteGuest = (guestId: string) => {
    const target = guests.find((g) => g.id === guestId);
    setGuests((prev) => {
      const next = prev.filter((g) => g.id !== guestId);
      saveStoredGuests(next);
      return next;
    });
    setToastMessage(`Convite "${target?.inviteName || target?.name || ''}" excluído com sucesso.`);
  };

  const handleImportGuests = (newGuests: GuestData[]) => {
    const guestsWithEvent = newGuests.map((g) => ({
      ...g,
      eventId: activeEvent.id,
    }));
    setGuests((prev) => {
      const next = [...guestsWithEvent, ...prev];
      saveStoredGuests(next);
      return next;
    });
    setToastMessage(`${newGuests.length} convidados importados com sucesso!`);
  };

  const handleAddQuestion = (savedQuestion: FormQuestionData) => {
    const questionWithEvent = {
      ...savedQuestion,
      eventId: activeEvent.id,
    };
    const current = getStoredQuestions();
    const exists = current.some((q) => q.id === savedQuestion.id);
    const next = exists
      ? current.map((q) => (q.id === savedQuestion.id ? questionWithEvent : q))
      : [...current, questionWithEvent];
    saveStoredQuestions(next);
    setQuestions(next);
    setToastMessage(
      editingQuestion
        ? 'Pergunta atualizada com sucesso!'
        : 'Pergunta adicionada ao formulário RSVP!'
    );
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const next = deleteStoredQuestion(questionId);
    setQuestions(next);
    setToastMessage('Pergunta removida do formulário com sucesso!');
  };

  const handleSaveManager = (managerData: ManagerData) => {
    const managerWithEvent = {
      ...managerData,
      eventId: activeEvent.id,
    };
    setManagers((prev) => {
      const exists = prev.some((m) => m.id === managerData.id);
      const next = exists
        ? prev.map((m) => (m.id === managerData.id ? managerWithEvent : m))
        : [...prev, managerWithEvent];
      saveStoredManagers(next);
      return next;
    });
    setToastMessage(
      editingManager
        ? `Responsável "${managerData.name}" atualizado com sucesso.`
        : `Responsável "${managerData.name}" adicionado com sucesso.`
    );
    setEditingManager(null);
  };

  const handleDeleteManager = (managerId: string) => {
    const target = managers.find((m) => m.id === managerId);
    setManagers((prev) => {
      const next = prev.filter((m) => m.id !== managerId);
      saveStoredManagers(next);
      return next;
    });
    setToastMessage(`Responsável "${target?.name || ''}" removido com sucesso.`);
  };

  const handleOpenWhatsApp = (guest: GuestData) => {
    setSelectedGuest(guest);
    setIsWhatsAppModalOpen(true);
  };

  const handleOpenGuestDetails = (guest: GuestData) => {
    setSelectedGuest(guest);
    setIsGuestDetailsModalOpen(true);
  };

  const handleOpenGuestPreview = (guestCode?: string) => {
    if (guestCode) {
      setPreviewGuestCode(guestCode);
    } else if (activeEventGuests.length > 0) {
      setPreviewGuestCode(activeEventGuests[0].rsvpCode);
    }
    setIsGuestPreviewMode(true);
  };

  // Submit RSVP from individual guest perspective (/rsvp/:code or preview)
  const handleSubmitGuestRsvp = (
    guestId: string,
    status: 'confirmed' | 'declined',
    companionCount: number,
    companionNames: string[],
    answers: Record<string, any>,
    guestInfo?: { name: string; phone: string; email: string },
    members?: InviteMember[]
  ) => {
    const updatedTimestamp = new Date().toISOString().split('T')[0];

    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId
          ? {
              ...g,
              name: guestInfo?.name || g.name,
              displayName: guestInfo?.name || g.displayName,
              phone: guestInfo?.phone || g.phone,
              email: guestInfo?.email || g.email,
              status,
              companionCount,
              companionNames,
              respondedAt: updatedTimestamp,
              answers: { ...g.answers, ...answers },
              members: members || g.members,
            }
          : g
      )
    );

    setToastMessage(
      status === 'confirmed'
        ? 'Presença confirmada com sucesso!'
        : 'Ausência informada com sucesso.'
    );
  };

  // Submit RSVP from the Public Event Link perspective (/rsvp/evento/:slug)
  const handlePublicRsvpSubmit = (
    _guestId: string,
    status: 'confirmed' | 'declined',
    companionCount: number,
    companionNames: string[],
    answers: Record<string, any>,
    guestInfo?: { name: string; phone: string; email: string },
    members?: InviteMember[]
  ) => {
    if (!route.matchedEvent) return;
    const targetEvent = route.matchedEvent;
    const updatedTimestamp = new Date().toISOString().split('T')[0];
    const newName = guestInfo?.name?.trim() || 'Convidado';
    const newEmail = guestInfo?.email?.trim().toLowerCase();
    const newPhone = guestInfo?.phone?.trim();

    // Check for existing duplicate responses in this event
    const preventDuplicates = targetEvent.preventDuplicateResponses !== false;
    const existingIndex = guests.findIndex(
      (g) =>
        g.eventId === targetEvent.id &&
        ((newEmail && g.email && g.email.trim().toLowerCase() === newEmail) ||
          (newPhone && g.phone && g.phone.replace(/\D/g, '') === newPhone.replace(/\D/g, '') && newPhone.length > 5) ||
          (newName.length > 2 && g.name.trim().toLowerCase() === newName.toLowerCase()))
    );

    if (preventDuplicates && existingIndex >= 0) {
      if (targetEvent.allowResponseEdit !== false) {
        // Update existing guest response instead of duplicating
        const existing = guests[existingIndex];
        const updatedGuest: GuestData = {
          ...existing,
          name: newName || existing.name,
          displayName: newName || existing.displayName,
          phone: guestInfo?.phone || existing.phone,
          email: guestInfo?.email || existing.email,
          status,
          companionCount,
          companionNames,
          respondedAt: updatedTimestamp,
          answers: { ...existing.answers, ...answers },
          members: members || existing.members,
        };

        setGuests((prev) => prev.map((g, idx) => (idx === existingIndex ? updatedGuest : g)));
        setToastMessage(`Resposta de "${updatedGuest.name}" atualizada com sucesso!`);
        return;
      } else {
        setToastMessage(`Já existe uma resposta para "${newName}". Alterações estão desabilitadas.`);
        return;
      }
    }

    const newGuest: GuestData = {
      id: `g-pub-${Date.now()}`,
      eventId: targetEvent.id,
      name: newName,
      displayName: newName,
      inviteName: newName,
      phone: guestInfo?.phone || '',
      email: guestInfo?.email || '',
      group: 'Geral',
      maxGuests: targetEvent.maxGuestsPerInvite || 2,
      rsvpCode: `RSVP-${targetEvent.id.toUpperCase().replace(/\W/g, '')}-${Date.now().toString().slice(-4)}`,
      notes: 'Confirmado pelo link público do evento',
      status,
      respondedAt: updatedTimestamp,
      companionCount,
      companionNames,
      answers,
      members,
    };

    setGuests((prev) => [newGuest, ...prev]);
    setToastMessage(
      status === 'confirmed'
        ? `Presença confirmada para "${newName}"!`
        : `Ausência informada para "${newName}".`
    );
  };

  // User Profile update
  const handleSaveUserProfile = (updatedUser: AdminUser) => {
    setCurrentUser(updatedUser);
    setAdminUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  // Administrative users management
  const handleSaveAdminUser = (user: AdminUser) => {
    setAdminUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.map((u) => (u.id === user.id ? user : u));
      }
      return [...prev, user];
    });
    if (user.id === currentUser.id) {
      setCurrentUser(user);
    }
  };

  const handleToggleAdminUserStatus = (userId: string, newStatus?: AdminUserStatus) => {
    if (userId === currentUser.id) return;
    setAdminUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const targetStatus: AdminUserStatus =
          newStatus || (u.status === 'active' ? 'disabled' : 'active');
        return { ...u, status: targetStatus };
      })
    );
    setToastMessage('Status do usuário administrativo alterado com sucesso.');
  };

  // Save / Update client
  const handleSaveClient = (client: ClientData) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = client;
        return next;
      }
      return [client, ...prev];
    });
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setToastMessage('Sessão encerrada com sucesso.');
  };

  // Login
  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setToastMessage(`Bem-vindo(a) ao Rafluo, ${user.name}!`);
  };

  // Export CSV for active event
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Nome Principal',
      'Nome Exibicao',
      'Telefone',
      'Grupo',
      'Codigo RSVP',
      'Status',
      'Qtd Acompanhantes',
      'Nomes Acompanhantes',
      'Data Resposta',
      'Observacoes',
    ];

    const rows = activeEventGuests.map((g) => [
      `"${g.id}"`,
      `"${g.name}"`,
      `"${g.displayName}"`,
      `"${g.phone}"`,
      `"${g.group}"`,
      `"${g.rsvpCode}"`,
      `"${g.status}"`,
      `"${g.companionCount}"`,
      `"${g.companionNames.join(', ')}"`,
      `"${g.respondedAt || ''}"`,
      `"${g.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `convidados_${activeEvent.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('Planilha de convidados exportada com sucesso!');
  };

  // 0. CLIENT PORTAL (PAINEL DO RESPONSÁVEL / CONTRATANTE): /responsavel/:slugOrId
  // Dedicated access portal for the client/responsible party to track RSVPs, get metrics and share links
  if (route.type === 'client-portal' && route.matchedEvent) {
    const portalGuests = guests.filter((g) => g.eventId === route.matchedEvent!.id);
    const portalManagers = managers.filter((m) => m.eventId === route.matchedEvent!.id);
    const portalQuestions = questions.filter((q) => q.eventId === route.matchedEvent!.id);

    return (
      <>
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        <ClientPortalView
          event={route.matchedEvent}
          guests={portalGuests}
          managers={portalManagers}
          questions={portalQuestions}
          onBackToHub={() => navigateTo('/eventos')}
          onShowToast={(msg) => setToastMessage(msg)}
        />
      </>
    );
  }

  // 1. PUBLIC EVENT RSVP: /rsvp/evento/:slugOrId
  // Clean public invite for any guest to introduce themselves and confirm their own RSVP
  if (route.type === 'rsvp-event' && route.matchedEvent) {
    const currentEvent =
      getStoredEventByIdOrSlug(route.matchedEvent.slug || route.matchedEvent.id) ||
      events.find((e) => e.id === route.matchedEvent!.id) ||
      route.matchedEvent;
    const eventQuestions = getStoredQuestionsForEvent(currentEvent.id);

    return (
      <>
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        <GuestRsvpView
          event={currentEvent}
          guest={null}
          questions={eventQuestions}
          onBackToAdmin={() => navigateTo('/dashboard')}
          onSubmitRsvp={handlePublicRsvpSubmit}
          isPublicMode={true}
          isPublicEventInvite={true}
        />
      </>
    );
  }

  // 2. INDIVIDUAL GUEST RSVP: /rsvp/:code
  // Preserves existing response editing/consultation for a specific identified guest
  if (route.type === 'rsvp-guest' && route.matchedGuest) {
    const currentEvent =
      getStoredEventByIdOrSlug(route.matchedEvent?.slug || route.matchedEvent?.id || '') ||
      events.find((e) => e.id === route.matchedEvent!.id) ||
      route.matchedEvent!;
    const eventQuestions = getStoredQuestionsForEvent(currentEvent.id);

    return (
      <>
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        <GuestRsvpView
          event={currentEvent}
          guest={route.matchedGuest}
          questions={eventQuestions}
          onBackToAdmin={() => navigateTo('/dashboard')}
          onSubmitRsvp={handleSubmitGuestRsvp}
          isPublicMode={true}
          isPublicEventInvite={false}
        />
      </>
    );
  }

  // 3. 404 NOT FOUND: for invalid event slugs, guests codes, or unknown paths
  if (route.type === 'not-found') {
    return (
      <NotFoundView
        searchedSlug={route.eventIdOrSlug || route.guestCode || currentPath.replace(/^\//, '')}
        onGoHome={() => navigateTo('/dashboard')}
      />
    );
  }

  // 4. AUTHENTICATION CHECK: Login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        <LoginView
          onLogin={handleLogin}
          defaultUser={currentUser}
          registeredUsers={adminUsers}
        />
      </>
    );
  }

  // 5. GUEST SIMULATION PREVIEW (Admin tool within dashboard)
  if (isGuestPreviewMode) {
    const activeGuest =
      guests.find((g) => g.rsvpCode === previewGuestCode) ||
      activeEventGuests[0] ||
      guests[0] ||
      INITIAL_GUESTS[0];

    const currentEvent = getStoredEventByIdOrSlug(activeEvent.slug || activeEvent.id) || activeEvent;
    const eventQuestions = getStoredQuestionsForEvent(currentEvent.id);

    return (
      <GuestRsvpView
        event={currentEvent}
        guest={activeGuest}
        questions={eventQuestions}
        onBackToAdmin={() => setIsGuestPreviewMode(false)}
        onSubmitRsvp={handleSubmitGuestRsvp}
        isPublicMode={false}
        isPublicEventInvite={false}
      />
    );
  }

  // 6. MAIN APPLICATION: Master Hub or Client Event Workspace
  const isMasterView = route.type === 'hub';
  const currentHubSection: HubSection = route.hubSection || 'dashboard';
  const currentSection: NavSection =
    (route.type === 'event' && route.eventSection) || 'overview';

  return (
    <>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <AdminLayout
        isMasterView={isMasterView}
        currentHubSection={currentHubSection}
        onSelectHubSection={handleSelectHubSection}
        currentSection={currentSection}
        onSelectSection={handleSelectEventSection}
        onOpenPreview={() => handleOpenGuestPreview()}
        activeEvent={activeEvent}
        events={events}
        guests={guests}
        currentUser={currentUser}
        onSelectEvent={handleSelectEvent}
        onExitToMaster={handleExitToMaster}
        onCopyEventLink={() => handleCopyEventLink()}
        hasCopiedLink={hasCopiedHeaderLink}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        onLogout={handleLogout}
      >
        {isMasterView ? (
          /* MASTER ADMINISTRATIVE HUB: Dashboard | Eventos | Relatórios | Usuários */
          <>
            {currentHubSection === 'dashboard' && (
              <HubDashboardView
                currentUser={currentUser}
                events={events}
                guests={guests}
                onSelectEvent={handleSelectEvent}
                onNavigateToEvents={() => navigateTo('/eventos')}
              />
            )}

            {currentHubSection === 'events' && (
              <MasterEventsHub
                events={events}
                guests={guests}
                onSelectEvent={handleSelectEvent}
                onNewEvent={handleOpenNewEventModal}
                onEditEvent={handleOpenEditEventModal}
                onDeleteEvent={handleDeleteEvent}
                onShowToast={(msg) => setToastMessage(msg)}
                onOpenPreview={handleOpenGuestPreview}
                currentUser={currentUser}
              />
            )}

            {currentHubSection === 'clients' && (
              <HubClientsView
                clients={clients}
                onSaveClient={handleSaveClient}
                onShowToast={(msg) => setToastMessage(msg)}
              />
            )}

            {currentHubSection === 'reports' && (
              <HubReportsView
                events={events}
                guests={guests}
                onShowToast={(msg) => setToastMessage(msg)}
                onSelectEvent={(ev) => {
                  setActiveEventId(ev.id);
                  navigateTo(getEventPath(ev, 'analytics'));
                }}
              />
            )}

            {currentHubSection === 'users' && (
              <HubUsersView
                adminUsers={adminUsers}
                currentUser={currentUser}
                onSaveUser={handleSaveAdminUser}
                onToggleStatus={handleToggleAdminUserStatus}
                onShowToast={(msg) => setToastMessage(msg)}
              />
            )}

            {currentHubSection === 'settings' && (
              <HubSettingsView
                onShowToast={(msg) => setToastMessage(msg)}
              />
            )}
          </>
        ) : (
          /* CLIENT EVENT OPERATIONAL WORKSPACE: Deep management of active event */
          <DashboardSkeleton
            currentSection={currentSection}
            onNavigate={handleSelectEventSection}
            event={activeEvent}
            onEditEvent={() => handleOpenEditEventModal(activeEvent)}
            questions={questions.filter((q) => !q.eventId || q.eventId === activeEvent.id)}
            onAddQuestion={() => {
              setEditingQuestion(null);
              setIsQuestionModalOpen(true);
            }}
            onEditQuestion={(q) => {
              setEditingQuestion(q);
              setIsQuestionModalOpen(true);
            }}
            onDeleteQuestion={handleDeleteQuestion}
            guests={activeEventGuests}
            onAddGuest={() => {
              setEditingGuest(null);
              setIsGuestModalOpen(true);
            }}
            onEditGuest={(g) => {
              setEditingGuest(g);
              setIsGuestModalOpen(true);
            }}
            onDeleteGuest={handleDeleteGuest}
            onSaveEventCustomization={handleSaveEventCustomization}
            onImportCsv={() => setIsImportCsvModalOpen(true)}
            onOpenWhatsApp={handleOpenWhatsApp}
            onOpenGuestDetails={handleOpenGuestDetails}
            onOpenGuestPreview={handleOpenGuestPreview}
            managers={activeEventManagers}
            onAddManager={() => {
              setEditingManager(null);
              setIsManagerModalOpen(true);
            }}
            onEditManager={(m) => {
              setEditingManager(m);
              setIsManagerModalOpen(true);
            }}
            onDeleteManager={handleDeleteManager}
            onExportCsv={handleExportCsv}
            onExitToMaster={handleExitToMaster}
            onShowToast={(msg) => setToastMessage(msg)}
            onCopyEventLink={() => handleCopyEventLink()}
            hasCopiedLink={hasCopiedHeaderLink}
          />
        )}

        {/* User Profile Modal (Dados Cadastrais) */}
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          currentUser={currentUser}
          onSaveProfile={handleSaveUserProfile}
          onShowToast={(msg) => setToastMessage(msg)}
        />

        {/* Existing Event, Guest & Operational Modals */}
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          event={editingEvent || activeEvent}
          onSave={handleSaveEvent}
        />

        <GuestModal
          isOpen={isGuestModalOpen}
          onClose={() => {
            setIsGuestModalOpen(false);
            setEditingGuest(null);
          }}
          onSave={handleSaveGuest}
          guest={editingGuest}
          defaultMaxGuests={activeEvent.maxGuestsPerInvite}
        />

        <ImportCsvModal
          isOpen={isImportCsvModalOpen}
          onClose={() => setIsImportCsvModalOpen(false)}
          onImport={handleImportGuests}
        />

        <QuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => {
            setIsQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          onSave={handleAddQuestion}
          existingQuestions={questions}
          question={editingQuestion}
        />

        <ManagerModal
          isOpen={isManagerModalOpen}
          onClose={() => {
            setIsManagerModalOpen(false);
            setEditingManager(null);
          }}
          onSave={handleSaveManager}
          manager={editingManager}
          eventName={activeEvent.name}
        />

        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setSelectedGuest(null);
          }}
          guest={selectedGuest}
          event={activeEvent}
          onOpenGuestPreview={handleOpenGuestPreview}
        />

        <GuestDetailsModal
          isOpen={isGuestDetailsModalOpen}
          onClose={() => {
            setIsGuestDetailsModalOpen(false);
            setSelectedGuest(null);
          }}
          guest={selectedGuest}
          questions={questions}
        />
      </AdminLayout>
    </>
  );
}
