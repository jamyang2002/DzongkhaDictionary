import { requireAuth } from './_lib/auth.js';
import { fileForKey, updateFile } from './_lib/data.js';
import { readRepositoryFile } from './_lib/github.js';

export default async function handler(req, res) {
    if (!requireAuth(req, res)) return;
    const key = req.query?.key;
    try {
        const path = fileForKey(key);
        if (req.method === 'GET') {
            const file = await readRepositoryFile(path);
            return res.status(200).json({ key, path, sha: file.sha, entries: file.data });
        }
        if (req.method === 'PUT') {
            const result = await updateFile(key, req.body?.entries, req.body?.sha, `Update ${path} from dictionary admin`);
            return res.status(200).json(result);
        }
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        const status = error.message.includes('changed on GitHub') ? 409 : error.message.startsWith('Unknown dictionary') ? 400 : 500;
        return res.status(status).json({ error: error.message || 'Dictionary request failed' });
    }
}
