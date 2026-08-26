import { logout } from '../../_lib/auth.js';

export default function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    logout(req, res);
}
