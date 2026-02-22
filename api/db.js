import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

let pool;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost')
            ? false
            : { rejectUnauthorized: false }
    });
} else {
    console.warn('[DB] No DATABASE_URL set – running without database (in-memory mode)');
}

// ─── In-memory fallback store ───────────────────────────────────────────────
const inMemoryLeads = [];
const inMemoryEvents = [];

// ─── Helpers ────────────────────────────────────────────────────────────────
export async function saveLead({ name, email, phone, source, survey_q1, survey_q2, ghl_contact_id, ghl_status }) {
    if (!pool) {
        const lead = {
            id: inMemoryLeads.length + 1,
            name, email, phone, source, survey_q1, survey_q2,
            ghl_contact_id, ghl_status,
            created_at: new Date().toISOString()
        };
        inMemoryLeads.push(lead);
        return lead;
    }
    const result = await pool.query(
        `INSERT INTO leads (name, email, phone, source, survey_q1, survey_q2, ghl_contact_id, ghl_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
        [name, email, phone, source, survey_q1, survey_q2, ghl_contact_id, ghl_status]
    );
    return result.rows[0];
}

export async function updateLeadGHL(id, ghl_contact_id, ghl_status) {
    if (!pool) {
        const lead = inMemoryLeads.find(l => l.id === id);
        if (lead) { lead.ghl_contact_id = ghl_contact_id; lead.ghl_status = ghl_status; }
        return;
    }
    await pool.query(
        'UPDATE leads SET ghl_contact_id=$1, ghl_status=$2 WHERE id=$3',
        [ghl_contact_id, ghl_status, id]
    );
}

export async function saveEvent({ session_id, page, event_type, event_data, user_agent, ip }) {
    if (!pool) {
        inMemoryEvents.push({ id: inMemoryEvents.length + 1, session_id, page, event_type, event_data, user_agent, ip, created_at: new Date().toISOString() });
        return;
    }
    await pool.query(
        `INSERT INTO page_events (session_id, page, event_type, event_data, user_agent, ip)
     VALUES ($1,$2,$3,$4,$5,$6)`,
        [session_id, page, event_type, event_data ? JSON.stringify(event_data) : null, user_agent, ip]
    );
}

export async function getDashboardData() {
    if (!pool) {
        const bySource = {};
        inMemoryLeads.forEach(l => { bySource[l.source || 'unknown'] = (bySource[l.source || 'unknown'] || 0) + 1; });
        return {
            totalLeads: inMemoryLeads.length,
            bySource,
            recentLeads: inMemoryLeads.slice(-20).reverse(),
            pageViews: {},
            scrollDepth: {},
            formConversions: {}
        };
    }

    const [totalRes, bySourceRes, recentLeadsRes, pageViewsRes, scrollRes, formStartRes, formSubmitRes] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM leads'),
        pool.query('SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC'),
        pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 20'),
        pool.query("SELECT page, COUNT(*) as count FROM page_events WHERE event_type='pageview' GROUP BY page ORDER BY count DESC"),
        pool.query("SELECT page, event_type, COUNT(*) as count FROM page_events WHERE event_type LIKE 'scroll_%' GROUP BY page, event_type ORDER BY page, event_type"),
        pool.query("SELECT page, COUNT(*) as count FROM page_events WHERE event_type='form_start' GROUP BY page"),
        pool.query("SELECT page, COUNT(*) as count FROM page_events WHERE event_type='form_submit' GROUP BY page")
    ]);

    const pageViews = {};
    pageViewsRes.rows.forEach(r => { pageViews[r.page] = parseInt(r.count); });

    const scrollDepth = {};
    scrollRes.rows.forEach(r => {
        if (!scrollDepth[r.page]) scrollDepth[r.page] = {};
        scrollDepth[r.page][r.event_type] = parseInt(r.count);
    });

    const formStarts = {};
    formStartRes.rows.forEach(r => { formStarts[r.page] = parseInt(r.count); });
    const formSubmits = {};
    formSubmitRes.rows.forEach(r => { formSubmits[r.page] = parseInt(r.count); });

    const formConversions = {};
    Object.keys(formStarts).forEach(page => {
        formConversions[page] = {
            starts: formStarts[page] || 0,
            submits: formSubmits[page] || 0,
            rate: formStarts[page] ? ((formSubmits[page] || 0) / formStarts[page] * 100).toFixed(1) + '%' : '0%'
        };
    });

    return {
        totalLeads: parseInt(totalRes.rows[0].count),
        bySource: Object.fromEntries(bySourceRes.rows.map(r => [r.source || 'unknown', parseInt(r.count)])),
        recentLeads: recentLeadsRes.rows,
        pageViews,
        scrollDepth,
        formConversions
    };
}
