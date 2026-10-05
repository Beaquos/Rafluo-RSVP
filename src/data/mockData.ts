export interface EventData {
  id: string;
  name: string;
  clientName?: string;
  slug?: string;
  type: string;
  date: string;
  time: string;
  location: string;
  address: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  mapsUrl: string;
  description: string;
  rsvpDeadline: string;
  allowGuests: boolean;
  maxGuestsPerInvite: number;
  status: 'active' | 'closed' | 'draft';
  allowResponseEdit?: boolean;
  preventDuplicateResponses?: boolean;
  colors?: {
    primary: string;
    background: string;
    accent: string;
    secondary: string;
  };
  // Personalização da Página de Confirmação (Cards opcionais)
  showCoverImage?: boolean;
  showWelcomeMessage?: boolean;
  showGiftList?: boolean;
  showCountdown?: boolean;
  coverImage?: string;
  welcomeMessage?: string;
  giftListType?: 'link' | 'items' | 'none';
  giftListUrl?: string;
  giftListItems?: string;
  giftListItemsList?: string[];
  childAgeLimit?: number;
}

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  invitationType: 'Aniversário Infantil' | 'Aniversário Adulto' | 'Chá de Bebê' | 'Chá de Fraldas' | 'Chá de Bebê ou Fraldas' | 'Outros';
  createdAt: string;
  notes?: string;
}

export interface InviteMember {
  id: string;
  name: string;
  category: 'Adulto' | 'Criança';
  status: 'confirmed' | 'declined' | 'pending' | null;
  isPrimary?: boolean;
  age?: number;
}

export interface GuestData {
  id: string;
  eventId: string;
  name: string;
  displayName: string;
  phone: string;
  email: string;
  group: string;
  maxGuests: number;
  rsvpCode: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'declined';
  respondedAt: string | null;
  companionCount: number;
  companionNames: string[];
  answers: Record<string, any>;
  // Nova estrutura de Convites agrupados (Itens 5, 6, 7 e 12)
  inviteName?: string;
  members?: InviteMember[];
}

export interface ManagerData {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  accessStart: string;
  accessEnd: string;
  status: 'active' | 'inactive';
}

export interface FormQuestionData {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  type: 'short_text' | 'long_text' | 'yes_no' | 'single_choice' | 'multiple_choice' | 'number' | 'dropdown' | 'date';
  required: boolean;
  options?: string[];
  order: number;
  condition?: {
    targetQuestionId: string;
    operator: 'equals' | 'greater_than' | 'not_equals';
    value: any;
  };
}

export const INITIAL_EVENTS: EventData[] = [
  {
    id: 'ev-01',
    name: 'Aniversário Marina Silva',
    clientName: 'Marina Silva',
    slug: 'marina-silva',
    type: 'Aniversário Adulto',
    date: '2026-10-24',
    time: '16:30',
    location: 'Villa Giardini Espaço de Eventos',
    address: 'SHTQ Trecho 1 Conjunto 12, Lago Norte, Brasília - DF',
    mapsUrl: 'https://maps.google.com/?q=Villa+Giardini+Brasilia',
    description: 'Celebração com recepção ao ar livre e muita música.',
    rsvpDeadline: '2026-10-10',
    allowGuests: true,
    maxGuestsPerInvite: 2,
    status: 'active',
    allowResponseEdit: true,
    preventDuplicateResponses: true,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    welcomeMessage: 'É uma alegria enorme poder celebrar este dia tão especial com você! Por favor, confirme sua presença até o dia 10 de outubro.',
    showCoverImage: true,
    showWelcomeMessage: true,
    showCountdown: true,
    showGiftList: true,
    giftListType: 'items',
    giftListUrl: 'https://listadepresentes.com/marina-silva',
    giftListItems: 'Jogo de Pratos de Porcelana\nFritadeira Elétrica Airfryer\nAparelho de Jantar 30 Peças',
    giftListItemsList: ['Jogo de Pratos de Porcelana', 'Fritadeira Elétrica Airfryer', 'Aparelho de Jantar 30 Peças', 'Cafeteira Nespresso'],
    childAgeLimit: 10,
  },
  {
    id: 'ev-02',
    name: 'Aniversário Sophia Martins',
    clientName: 'Família Martins & Sophia',
    slug: 'aniversario-sophia',
    type: 'Aniversário Infantil',
    date: '2026-11-14',
    time: '20:00',
    location: 'Espaço Contemporâneo Festas',
    address: 'Setor de Mansões Park Way, Brasília - DF',
    mapsUrl: 'https://maps.google.com/?q=Espaco+Contemporaneo+Park+Way',
    description: 'Comemoração infantil com buffet especial e recreação.',
    rsvpDeadline: '2026-10-31',
    allowGuests: true,
    maxGuestsPerInvite: 1,
    status: 'active',
    allowResponseEdit: true,
    preventDuplicateResponses: true,
    coverImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
    welcomeMessage: 'Venha se divertir com a gente nos 7 aninhos da Sophia! Recreação mágica e muita alegria para toda a família.',
    showCoverImage: true,
    showWelcomeMessage: true,
    showCountdown: true,
    showGiftList: true,
    giftListType: 'items',
    giftListUrl: '',
    giftListItems: 'Jogos educativos, Livros ilustrados infantis, Roupas tamanho 8',
    childAgeLimit: 10,
  },
  {
    id: 'ev-03',
    name: 'Chá de Bebê do Theo',
    clientName: 'Helena & Roberto Costa',
    slug: 'cha-bebe-theo',
    type: 'Chá de Bebê',
    date: '2026-12-05',
    time: '12:30',
    location: 'Restaurante Coco Bambu Lago Sul',
    address: 'SCES Trecho 2, Conjunto 36, Brasília - DF',
    mapsUrl: 'https://maps.google.com/?q=Coco+Bambu+Lago+Sul',
    description: 'Chá de fraldas e recepção em família para chegada do Theo.',
    rsvpDeadline: '2026-11-20',
    allowGuests: true,
    maxGuestsPerInvite: 2,
    status: 'draft',
    allowResponseEdit: true,
    preventDuplicateResponses: true,
    coverImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
    welcomeMessage: 'O Theo está a caminho! Preparamos um almoço especial para comemorar com familiares e amigos queridos.',
    showCoverImage: true,
    showWelcomeMessage: true,
    showCountdown: true,
    showGiftList: true,
    giftListType: 'items',
    giftListUrl: '',
    giftListItems: 'Fraldas Pampers M e G, Toalhinhas umedecidas, Termômetro digital',
    childAgeLimit: 8,
  },
  {
    id: 'ev-04',
    name: 'Encontro Anual Beaquos Tech 2026',
    clientName: 'Beaquos Estúdio Criativo',
    slug: 'beaquos-tech-2026',
    type: 'Outros',
    date: '2026-08-15',
    time: '19:30',
    location: 'Centro de Convenções Ulysses Guimarães',
    address: 'SDC Eixo Monumental, Brasília - DF',
    mapsUrl: 'https://maps.google.com/?q=Centro+de+Convencoes+Ulysses+Guimaraes',
    description: 'Premiação e confraternização anual de parceiros do estúdio.',
    rsvpDeadline: '2026-08-01',
    allowGuests: false,
    maxGuestsPerInvite: 1,
    status: 'closed',
    allowResponseEdit: false,
    preventDuplicateResponses: true,
    showCoverImage: false,
    showWelcomeMessage: false,
    showCountdown: false,
    showGiftList: false,
    giftListType: 'none',
  },
];

export const INITIAL_CLIENTS: ClientData[] = [
  {
    id: 'cli-01',
    name: 'Marina Silva',
    email: 'marina.silva@email.com',
    phone: '(11) 98765-4321',
    invitationType: 'Aniversário Adulto',
    createdAt: '2026-08-10',
    notes: 'Cliente de aniversário adulto com festa ao ar livre.',
  },
  {
    id: 'cli-02',
    name: 'Sophia Martins',
    email: 'sophia.martins@email.com',
    phone: '(11) 91234-5678',
    invitationType: 'Aniversário Infantil',
    createdAt: '2026-08-22',
    notes: 'Aniversário infantil para 60 convidados com buffet temático.',
  },
  {
    id: 'cli-03',
    name: 'Helena & Roberto Costa',
    email: 'helena.costa@email.com',
    phone: '(21) 99887-6655',
    invitationType: 'Chá de Bebê',
    createdAt: '2026-09-01',
    notes: 'Chá de fraldas e recepção intimista.',
  },
  {
    id: 'cli-04',
    name: 'Beaquos Estúdio Criativo',
    email: 'contato@beaquos.com',
    phone: '(11) 3456-7890',
    invitationType: 'Outros',
    createdAt: '2026-09-12',
    notes: 'Confraternização corporativa e eventos especiais.',
  },
];

export const INITIAL_EVENT: EventData = INITIAL_EVENTS[0];

export const INITIAL_QUESTIONS: FormQuestionData[] = [];

export const INITIAL_GUESTS: GuestData[] = [
  {
    id: 'g-01',
    eventId: 'ev-01',
    name: 'Carlos Eduardo Mendes',
    displayName: 'Carlos e Juliana Mendes',
    inviteName: 'Carlos e Juliana Mendes',
    phone: '(61) 98765-4321',
    email: 'carlos.mendes@email.com',
    group: 'Padrinhos',
    maxGuests: 1,
    rsvpCode: 'RAF-7X9K2',
    notes: 'Padrinho do noivo. Precisa de transfer do aeroporto.',
    status: 'confirmed',
    respondedAt: '2026-09-21 10:14',
    companionCount: 1,
    companionNames: ['Juliana Mendes'],
    members: [
      { id: 'm-g01-1', name: 'Carlos Eduardo Mendes', category: 'Adulto', status: 'confirmed', isPrimary: true },
      { id: 'm-g01-2', name: 'Juliana Mendes', category: 'Adulto', status: 'confirmed' },
    ],
    answers: {
      q_presence: 'sim',
      q_has_companions: 'sim',
      q_companion_count: 1,
      q_companion_names: 'Juliana Mendes',
      q_dietary: ['Vegetariano'],
      q_message: 'Muito felizes por celebrar este momento tão lindo com vocês!',
    },
  },
  {
    id: 'g-02',
    eventId: 'ev-01',
    name: 'Mariana Duarte',
    displayName: 'Família Duarte',
    inviteName: 'Família Duarte',
    phone: '(61) 99123-8877',
    email: 'mariana.duarte@email.com',
    group: 'Família Noiva',
    maxGuests: 2,
    rsvpCode: 'RAF-3M4P9',
    notes: 'Tia da noiva. Mesa 04 reservada.',
    status: 'confirmed',
    respondedAt: '2026-09-20 18:32',
    companionCount: 2,
    companionNames: ['Lucas Duarte', 'Beatriz Duarte'],
    members: [
      { id: 'm-g02-1', name: 'Mariana Duarte', category: 'Adulto', status: 'confirmed', isPrimary: true },
      { id: 'm-g02-2', name: 'Lucas Duarte', category: 'Adulto', status: 'confirmed' },
      { id: 'm-g02-3', name: 'Beatriz Duarte', category: 'Criança', status: 'confirmed' },
    ],
    answers: {
      q_presence: 'sim',
      q_has_companions: 'sim',
      q_companion_count: 2,
      q_companion_names: 'Lucas Duarte, Beatriz Duarte',
      q_dietary: ['Nenhuma restrição'],
      q_message: 'Estaremos todos aí para comemorar!',
    },
  },
  {
    id: 'g-03',
    eventId: 'ev-01',
    name: 'Rafael Augusto Prado',
    displayName: 'Rafael Prado',
    inviteName: 'Rafael Augusto Prado',
    phone: '(11) 97654-3210',
    email: 'rafael.prado@email.com',
    group: 'Amigos',
    maxGuests: 1,
    rsvpCode: 'RAF-8L2W5',
    notes: 'Mora em SP, estará viajando a trabalho na data.',
    status: 'declined',
    respondedAt: '2026-09-19 14:05',
    companionCount: 0,
    companionNames: [],
    members: [
      { id: 'm-g03-1', name: 'Rafael Augusto Prado', category: 'Adulto', status: 'declined', isPrimary: true },
    ],
    answers: {
      q_presence: 'nao',
      q_message: 'Infelizmente estarei fora do país nessa semana, mas desejo toda felicidade do mundo a vocês!',
    },
  },
  {
    id: 'g-04',
    eventId: 'ev-01',
    name: 'Ana Beatriz Souza',
    displayName: 'Dra. Ana Beatriz',
    inviteName: 'Dra. Ana Beatriz Souza',
    phone: '(61) 99881-2233',
    email: 'anabeatriz@hospital.com',
    group: 'Trabalho',
    maxGuests: 1,
    rsvpCode: 'RAF-9Q1Z4',
    notes: 'Colega de clínica da noiva.',
    status: 'confirmed',
    respondedAt: '2026-09-22 14:10',
    companionCount: 0,
    companionNames: [],
    members: [
      { id: 'm-g04-1', name: 'Ana Beatriz Souza', category: 'Adulto', status: 'confirmed', isPrimary: true },
    ],
    answers: {
      q_presence: 'sim',
      q_message: 'Parabéns ao casal! Estarei lá com certeza.',
    },
  },
  {
    id: 'g-05',
    eventId: 'ev-01',
    name: 'Henrique Faria e Convidada',
    displayName: 'Henrique Faria',
    inviteName: 'Henrique Faria e Convidada',
    phone: '(61) 98444-5566',
    email: 'henrique.faria@email.com',
    group: 'Amigos',
    maxGuests: 1,
    rsvpCode: 'RAF-2T8Y1',
    notes: 'Convite entregue pessoalmente.',
    status: 'confirmed',
    respondedAt: '2026-09-23 09:20',
    companionCount: 1,
    companionNames: ['Larissa Costa'],
    members: [
      { id: 'm-g05-1', name: 'Henrique Faria', category: 'Adulto', status: 'confirmed', isPrimary: true },
      { id: 'm-g05-2', name: 'Larissa Costa', category: 'Adulto', status: 'confirmed' },
    ],
    answers: {
      q_presence: 'sim',
      q_companions_count: '1',
    },
  },
  {
    id: 'g-06',
    eventId: 'ev-02',
    name: 'Isabela Ribeiro',
    displayName: 'Isa Ribeiro',
    inviteName: 'Isabela Ribeiro',
    phone: '(61) 98111-2233',
    email: 'isabela.rib@email.com',
    group: 'Amigas de Escola',
    maxGuests: 1,
    rsvpCode: 'RAF-SOPH1',
    notes: 'Colega de turma do 1º ano.',
    status: 'confirmed',
    respondedAt: '2026-09-20 16:45',
    companionCount: 0,
    companionNames: [],
    members: [
      { id: 'm-g06-1', name: 'Isabela Ribeiro', category: 'Criança', status: 'confirmed', isPrimary: true },
    ],
    answers: {
      q_presence: 'sim',
    },
  },
  {
    id: 'g-07',
    eventId: 'ev-02',
    name: 'Felipe Valente',
    displayName: 'Felipe Valente e Família',
    inviteName: 'Felipe Valente e Família',
    phone: '(61) 99222-3344',
    email: 'felipe.valente@email.com',
    group: 'Família',
    maxGuests: 2,
    rsvpCode: 'RAF-SOPH2',
    notes: 'Primo de segundo grau.',
    status: 'confirmed',
    respondedAt: '2026-09-21 11:30',
    companionCount: 2,
    companionNames: ['Patrícia Valente', 'Enzo Valente'],
    members: [
      { id: 'm-g07-1', name: 'Felipe Valente', category: 'Adulto', status: 'confirmed', isPrimary: true },
      { id: 'm-g07-2', name: 'Patrícia Valente', category: 'Adulto', status: 'confirmed' },
      { id: 'm-g07-3', name: 'Enzo Valente', category: 'Criança', status: 'confirmed' },
    ],
    answers: {
      q_presence: 'sim',
      q_companions_count: '2',
    },
  },
];

export const INITIAL_MANAGERS: ManagerData[] = [
  {
    id: 'm-01',
    eventId: 'ev-01',
    name: 'Marina Silva (Responsável)',
    email: 'marina.silva@exemplo.com',
    phone: '(61) 98111-2233',
    accessStart: '2026-09-01',
    accessEnd: '2026-10-30',
    status: 'active',
  },
  {
    id: 'm-02',
    eventId: 'ev-01',
    name: 'Camila Cerimonialista',
    email: 'camila@cerimonialbeaquos.com',
    phone: '(61) 99881-4455',
    accessStart: '2026-09-15',
    accessEnd: '2026-10-28',
    status: 'active',
  },
  {
    id: 'm-03',
    eventId: 'ev-02',
    name: 'Sophia Martins',
    email: 'sophia.martins@exemplo.com',
    phone: '(61) 99123-8877',
    accessStart: '2026-09-10',
    accessEnd: '2026-11-20',
    status: 'active',
  },
  {
    id: 'm-04',
    eventId: 'ev-03',
    name: 'Helena Costa',
    email: 'helena.costa@exemplo.com',
    phone: '(61) 99881-2233',
    accessStart: '2026-09-15',
    accessEnd: '2026-12-10',
    status: 'active',
  },
  {
    id: 'm-05',
    eventId: 'ev-04',
    name: 'Coordenação Beaquos',
    email: 'contato@beaquos.com',
    phone: '(11) 3456-7890',
    accessStart: '2026-07-01',
    accessEnd: '2026-08-30',
    status: 'active',
  },
];
