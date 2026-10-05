import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_EVENTS,
  INITIAL_QUESTIONS,
  INITIAL_GUESTS,
  INITIAL_MANAGERS,
  INITIAL_CLIENTS,
  EventData,
  FormQuestionData,
  GuestData,
  ManagerData,
  ClientData,
} from './src/data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface AppDb {
  events: EventData[];
  questions: FormQuestionData[];
  guests: GuestData[];
  managers: ManagerData[];
  clients: ClientData[];
  companyData?: any;
  lastUpdated: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB state
function loadDb(): AppDb {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.events) && Array.isArray(data.questions)) {
        return data;
      }
    } catch (err) {
      console.error('Error reading db.json, falling back to initial data:', err);
    }
  }

  const initialDb: AppDb = {
    events: INITIAL_EVENTS,
    questions: INITIAL_QUESTIONS,
    guests: INITIAL_GUESTS,
    managers: INITIAL_MANAGERS,
    clients: INITIAL_CLIENTS,
    lastUpdated: new Date().toISOString(),
  };

  saveDb(initialDb);
  return initialDb;
}

function saveDb(db: AppDb): void {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let db = loadDb();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Full sync
  app.get('/api/sync', (_req: Request, res: Response) => {
    res.json(db);
  });

  app.post('/api/sync', (req: Request, res: Response) => {
    const { events, questions, guests, managers, clients, companyData } = req.body;
    if (events) db.events = events;
    if (questions) db.questions = questions;
    if (guests) db.guests = guests;
    if (managers) db.managers = managers;
    if (clients) db.clients = clients;
    if (companyData) db.companyData = companyData;
    saveDb(db);
    res.json({ success: true, lastUpdated: db.lastUpdated });
  });

  // Company endpoints
  app.get('/api/company', (_req: Request, res: Response) => {
    res.json(db.companyData || null);
  });

  app.put('/api/company', (req: Request, res: Response) => {
    db.companyData = req.body;
    saveDb(db);
    res.json({ success: true, companyData: db.companyData });
  });

  app.post('/api/company', (req: Request, res: Response) => {
    db.companyData = req.body;
    saveDb(db);
    res.json({ success: true, companyData: db.companyData });
  });

  // 2. Events endpoints
  app.get('/api/events', (_req: Request, res: Response) => {
    res.json(db.events);
  });

  app.get('/api/events/:slugOrId', (req: Request, res: Response) => {
    const identifier = req.params.slugOrId.toLowerCase().trim();
    const event = db.events.find(
      (e) => (e.slug && e.slug.toLowerCase().trim() === identifier) || e.id.toLowerCase().trim() === identifier
    );
    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  });

  app.put('/api/events', (req: Request, res: Response) => {
    if (Array.isArray(req.body)) {
      db.events = req.body;
      saveDb(db);
      return res.json({ success: true, count: db.events.length });
    }
    res.status(400).json({ error: 'Expected array of events' });
  });

  app.put('/api/events/:id', (req: Request, res: Response) => {
    const eventId = req.params.id;
    const updatedEvent = req.body as EventData;
    const index = db.events.findIndex((e) => e.id === eventId);
    if (index >= 0) {
      db.events[index] = { ...db.events[index], ...updatedEvent };
    } else {
      db.events.push(updatedEvent);
    }
    saveDb(db);
    res.json(db.events[index >= 0 ? index : db.events.length - 1]);
  });

  // 3. Questions endpoints
  app.get('/api/questions', (req: Request, res: Response) => {
    const eventId = req.query.eventId as string | undefined;
    if (eventId) {
      return res.json(db.questions.filter((q) => q.eventId === eventId));
    }
    res.json(db.questions);
  });

  app.put('/api/questions', (req: Request, res: Response) => {
    if (Array.isArray(req.body)) {
      db.questions = req.body;
      saveDb(db);
      return res.json({ success: true, count: db.questions.length });
    }
    res.status(400).json({ error: 'Expected array of questions' });
  });

  app.delete('/api/questions/:id', (req: Request, res: Response) => {
    const questionId = req.params.id;
    const initialCount = db.questions.length;
    db.questions = db.questions.filter((q) => q.id !== questionId);
    saveDb(db);
    res.json({
      success: true,
      removedId: questionId,
      remainingCount: db.questions.length,
      deleted: initialCount > db.questions.length,
    });
  });

  // 4. RSVP endpoint: dedicated helper returning exact event, its questions and guests
  app.get('/api/rsvp/:slugOrId', (req: Request, res: Response) => {
    const identifier = req.params.slugOrId.toLowerCase().trim();
    const event = db.events.find(
      (e) => (e.slug && e.slug.toLowerCase().trim() === identifier) || e.id.toLowerCase().trim() === identifier
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const questions = db.questions.filter((q) => q.eventId === event.id);
    const guests = db.guests.filter((g) => g.eventId === event.id);
    res.json({ event, questions, guests });
  });

  app.post('/api/rsvp/:slugOrId', (req: Request, res: Response) => {
    const identifier = req.params.slugOrId.toLowerCase().trim();
    const event = db.events.find(
      (e) => (e.slug && e.slug.toLowerCase().trim() === identifier) || e.id.toLowerCase().trim() === identifier
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const guestData = req.body as GuestData;
    if (!guestData || !guestData.name) {
      return res.status(400).json({ error: 'Invalid guest payload' });
    }
    guestData.eventId = event.id;
    const existingIndex = db.guests.findIndex(
      (g) => g.id === guestData.id || (g.eventId === event.id && g.name.trim().toLowerCase() === guestData.name.trim().toLowerCase() && guestData.name.length > 2)
    );
    if (existingIndex >= 0) {
      db.guests[existingIndex] = { ...db.guests[existingIndex], ...guestData };
    } else {
      db.guests.unshift(guestData);
    }
    saveDb(db);
    res.json({ success: true, guest: guestData });
  });

  // 5. Guests endpoint
  app.get('/api/guests', (req: Request, res: Response) => {
    const eventId = req.query.eventId as string | undefined;
    if (eventId) {
      return res.json(db.guests.filter((g) => g.eventId === eventId));
    }
    res.json(db.guests);
  });

  app.put('/api/guests', (req: Request, res: Response) => {
    if (Array.isArray(req.body)) {
      db.guests = req.body;
      saveDb(db);
      return res.json({ success: true, count: db.guests.length });
    }
    res.status(400).json({ error: 'Expected array of guests' });
  });

  app.post('/api/guests', (req: Request, res: Response) => {
    const newGuest = req.body as GuestData;
    db.guests = [newGuest, ...db.guests];
    saveDb(db);
    res.json(newGuest);
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rafluo server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
