/** Shared CORS headers, response helpers, JWT & password crypto */

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

export const jsonResponse = json;

export const errorResponse = (message, status = 400) =>
    new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

// ── JWT (HS256 via Web Crypto) ──────────────────────────────────────

const b64url = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const encodeJSON = (obj) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const importKey = (secret) =>
    crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export async function signJWT(payload, secret) {
    const header = encodeJSON({ alg: 'HS256', typ: 'JWT' });
    const body = encodeJSON(payload);
    const data = `${header}.${body}`;
    const key = await importKey(secret);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return `${data}.${b64url(sig)}`;
}

export async function verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const [h, p, s] = parts;
    const key = await importKey(secret);
    const sigBytes = Uint8Array.from(
        atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes,
        new TextEncoder().encode(`${h}.${p}`));
    if (!ok) throw new Error('Invalid signature');
    const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expired');
    return payload;
}

// ── Password (SHA-256) ──────────────────────────────────────────────

export async function hashPassword(password) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return b64url(buf);
}

export async function verifyPassword(password, hash) {
    return (await hashPassword(password)) === hash;
}
