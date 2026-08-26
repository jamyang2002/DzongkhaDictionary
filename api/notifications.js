import { requireAuth } from './_lib/auth.js';
import { readRepositoryFile, writeRepositoryFile } from './_lib/github.js';

function validateNotifications(data) {
    if (!Array.isArray(data) || data.length > 100) throw new Error('Notifications must be an array of at most 100 items.');
    if (data.some((item) => !item || typeof item.message !== 'string' || !item.message.trim())) throw new Error('Every notification needs a message.');
}

export default async function handler(req, res) {
    if (!requireAuth(req, res)) return;
    try {
        const current = await readRepositoryFile('notifications.json');
        if (req.method === 'GET') return res.status(200).json({ sha: current.sha, notifications: current.data });
        if (req.method === 'PUT') {
            const notifications = req.body?.notifications;
            validateNotifications(notifications);
            if (req.body?.sha && req.body.sha !== current.sha) return res.status(409).json({ error: 'Notifications changed on GitHub. Reload before saving again.' });
            const result = await writeRepositoryFile('notifications.json', notifications, current.sha, 'Update dictionary notifications from admin');
            return res.status(200).json({ count: notifications.length, sha: result.content?.sha || current.sha });
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Notification request failed' });
    }
}
