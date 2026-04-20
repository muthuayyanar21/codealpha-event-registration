const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('events.db');

// Init DB tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'attendee',       -- 'attendee' | 'organizer'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TEXT NOT NULL,
    capacity INTEGER DEFAULT 100,
    organizer_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',    -- 'confirmed' | 'cancelled'
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`);

app.use(express.json());

// ─── USER ROUTES ──────────────────────────────────────────────

// POST /api/users/register — register a new user
app.post('/api/users/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });

  try {
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, password, role || 'attendee');
    res.status(201).json({ id: result.lastInsertRowid, name, email, role: role || 'attendee' });
  } catch {
    res.status(409).json({ error: 'Email already registered' });
  }
});

// POST /api/users/login — simple login (returns user info)
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

// ─── EVENT ROUTES ─────────────────────────────────────────────

// GET /api/events — list all upcoming events
app.get('/api/events', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, u.name AS organizer_name,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    FROM events e
    JOIN users u ON u.id = e.organizer_id
    ORDER BY e.event_date ASC
  `).all();
  res.json(events);
});

// GET /api/events/:id — event detail
app.get('/api/events/:id', (req, res) => {
  const event = db.prepare(`
    SELECT e.*, u.name AS organizer_name,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    FROM events e
    JOIN users u ON u.id = e.organizer_id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/events — create event (organizer only)
app.post('/api/events', (req, res) => {
  const { title, description, location, event_date, capacity, organizer_id } = req.body;
  if (!title || !event_date || !organizer_id) return res.status(400).json({ error: 'title, event_date and organizer_id required' });

  const organizer = db.prepare('SELECT * FROM users WHERE id = ?').get(organizer_id);
  if (!organizer || organizer.role !== 'organizer') return res.status(403).json({ error: 'Only organizers can create events' });

  const result = db.prepare(
    'INSERT INTO events (title, description, location, event_date, capacity, organizer_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description, location, event_date, capacity || 100, organizer_id);

  res.status(201).json({ id: result.lastInsertRowid, title, event_date });
});

// PUT /api/events/:id — update event (organizer only)
app.put('/api/events/:id', (req, res) => {
  const { title, description, location, event_date, capacity, organizer_id } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.organizer_id !== organizer_id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare(`
    UPDATE events SET title=?, description=?, location=?, event_date=?, capacity=? WHERE id=?
  `).run(title || event.title, description || event.description, location || event.location,
    event_date || event.event_date, capacity || event.capacity, req.params.id);
  res.json({ message: 'Event updated' });
});

// DELETE /api/events/:id — delete event
app.delete('/api/events/:id', (req, res) => {
  const { organizer_id } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.organizer_id !== organizer_id) return res.status(403).json({ error: 'Not authorized' });

  db.prepare('DELETE FROM registrations WHERE event_id = ?').run(req.params.id);
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Event deleted' });
});

// ─── REGISTRATION ROUTES ──────────────────────────────────────

// POST /api/registrations — register for an event
app.post('/api/registrations', (req, res) => {
  const { user_id, event_id } = req.body;
  if (!user_id || !event_id) return res.status(400).json({ error: 'user_id and event_id required' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const count = db.prepare("SELECT COUNT(*) AS c FROM registrations WHERE event_id = ? AND status = 'confirmed'").get(event_id).c;
  if (count >= event.capacity) return res.status(409).json({ error: 'Event is full' });

  try {
    const result = db.prepare('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)').run(user_id, event_id);
    res.status(201).json({ id: result.lastInsertRowid, user_id, event_id, status: 'confirmed' });
  } catch {
    res.status(409).json({ error: 'Already registered for this event' });
  }
});

// DELETE /api/registrations/:id — cancel registration
app.delete('/api/registrations/:id', (req, res) => {
  const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });

  db.prepare("UPDATE registrations SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: 'Registration cancelled' });
});

// GET /api/users/:id/registrations — user's event registrations
app.get('/api/users/:id/registrations', (req, res) => {
  const registrations = db.prepare(`
    SELECT r.*, e.title, e.event_date, e.location
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.user_id = ?
    ORDER BY e.event_date ASC
  `).all(req.params.id);
  res.json(registrations);
});

// GET /api/events/:id/registrations — attendees for an event (organizer view)
app.get('/api/events/:id/registrations', (req, res) => {
  const attendees = db.prepare(`
    SELECT r.*, u.name, u.email
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    WHERE r.event_id = ? AND r.status = 'confirmed'
    ORDER BY r.registered_at ASC
  `).all(req.params.id);
  res.json(attendees);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Task 2 — Event Registration running on http://localhost:${PORT}`));
