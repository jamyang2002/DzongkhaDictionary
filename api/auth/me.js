import { requireAuth } from '../../_lib/auth.js';

export default function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAuth(req, res)) return;
    res.status(200).json({ authenticated: true });
}
