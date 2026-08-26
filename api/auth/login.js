import { login, verifyPassword } from '../../_lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!verifyPassword(req.body?.password)) return res.status(401).json({ error: 'Invalid password' });
    login(req, res);
}
