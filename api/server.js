import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveLead, updateLeadGHL, saveEvent, getDashboardData } from './db.js';
import { pushLeadToGHL } from './ghl.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Resolve landing page directories ────────────────────────────────────────
const sixWeekDir = path.join(__dirname, '..', 'barn-gym-6-week-replica');
const ptDir = path.join(__dirname, '..', 'barn-gym-pt-replica');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        /\.railway\.app$/, 'https://join.barn-gym.com'],
    credentials: true
}));
app.use(express.json());

// ─── API routes ───────────────────────────────────────────────────────────────

// POST /api/leads
app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone, source, survey_q1, survey_q2 } = req.body;
        if (!name || !email) {
            return res.status(400).json({ success: false, error: 'name and email are required' });
        }
        const lead = await saveLead({ name, email, phone, source, survey_q1, survey_q2, ghl_contact_id: null, ghl_status: 'pending' });
        console.log(`[LEAD SAVED] id=${lead.id} name="${name}" email="${email}" source="${source}"`);
        await saveEvent({
            session_id: req.body.session_id, page: source, event_type: 'form_submit',
            event_data: { name, email, source }, user_agent: req.headers['user-agent'], ip: req.ip
        });
        pushLeadToGHL({ name, email, phone, source })
            .then(async ({ contactId }) => { await updateLeadGHL(lead.id, contactId, 'success'); console.log(`[GHL PUSHED] lead_id=${lead.id} ghl_contact_id=${contactId}`); })
            .catch(async (err) => { await updateLeadGHL(lead.id, null, 'failed'); console.error(`[GHL ERROR] lead_id=${lead.id}`, err.message); });
        return res.json({ success: true, lead_id: lead.id });
    } catch (err) {
        console.error('[LEADS ERROR]', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/events
app.post('/api/events', async (req, res) => {
    try {
        const { session_id, page, event_type, event_data } = req.body;
        await saveEvent({ session_id, page, event_type, event_data, user_agent: req.headers['user-agent'], ip: req.ip });
        return res.json({ success: true });
    } catch (err) {
        console.error('[EVENTS ERROR]', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
    try {
        return res.json(await getDashboardData());
    } catch (err) {
        console.error('[STATS ERROR]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /health
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ─── Dashboard ────────────────────────────────────────────────────────────────
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.get(['/dashboard', '/dashboard/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// ─── PT landing page at /pt ───────────────────────────────────────────────────
// PT's own stylesheet served at /pt-style.css
app.get('/pt-style.css', (req, res) => res.sendFile(path.join(ptDir, 'style.css')));
// PT public assets (images shared via root /images path, same as 6-week)
app.use(express.static(path.join(ptDir, 'public')));
const ptRouter = express.Router();
ptRouter.get('/', (req, res) => res.sendFile(path.join(ptDir, 'index.html')));
app.use('/pt', ptRouter);

// ─── 6-week landing page at root / ───────────────────────────────────────────
app.use(express.static(path.join(sixWeekDir, 'public'))); // /images, /logos, /videos
app.use(express.static(sixWeekDir));                       // /style.css
app.get(['/'], (req, res) => res.sendFile(path.join(sixWeekDir, 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 Barn Gym API  → http://localhost:${PORT}`);
    console.log(`📊 Dashboard     → http://localhost:${PORT}/dashboard`);
    console.log(`📄 6-week page   → http://localhost:${PORT}/`);
    console.log(`📄 PT page       → http://localhost:${PORT}/pt`);
});
