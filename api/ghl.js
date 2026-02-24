import dotenv from 'dotenv';
dotenv.config();

const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'pit-c75a6455-5051-473a-bf4b-5980cf32e7a3';
const GHL_API_KEY = process.env.GHL_API_KEY || 'VYZcxHGdxD0Dj1cj1ZU4';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

/**
 * Push a new lead as a contact in GoHighLevel.
 * Returns { contactId } on success, throws on error.
 */
export async function pushLeadToGHL({ name, email, phone, source }) {
    const nameParts = (name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const body = {
        firstName,
        lastName,
        email,
        phone,
        locationId: GHL_LOCATION_ID,
        source: 'Landing Page – ' + (source || 'unknown'),
        tags: ['landing-page-lead', source || 'unknown'].filter(Boolean)
    };

    const res = await fetch(`${GHL_BASE_URL}/contacts/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GHL error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return { contactId: data?.contact?.id || data?.id };
}
