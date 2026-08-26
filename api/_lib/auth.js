import crypto from 'node:crypto';

const COOKIE_NAME = 'dz_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function secret() {
    if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');
    return process.env.SESSION_SECRET;
}

function sign(value) {
    return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function encodeSession() {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

function parseCookies(header = '') {
    return Object.fromEntries(header.split(';').map((part) => part.trim().split('=')) .filter(([key, value]) => key && value));
}

function isAuthenticated(req) {
    const value = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
    if (!value) return false;
    const [payload, signature] = value.split('.');
    const expectedSignature = payload ? sign(payload) : '';
    if (!payload || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;
    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
    } catch {
        return false;
    }
}

export function requireAuth(req, res) {
    if (isAuthenticated(req)) return true;
    res.status(401).json({ error: 'Authentication required' });
    return false;
}

export function login(req, res) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeSession()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.status(200).json({ authenticated: true });
}

export function logout(_req, res) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.status(200).json({ authenticated: false });
}

export function verifyPassword(value) {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || typeof value !== 'string') return false;
    const actualBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
