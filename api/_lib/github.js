const GITHUB_API = 'https://api.github.com';

function repo() {
    if (!process.env.GITHUB_REPO) throw new Error('GITHUB_REPO is not configured');
    return process.env.GITHUB_REPO;
}

function headers() {
    if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured');
    return {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

export async function readRepositoryFile(path) {
    const response = await fetch(`${GITHUB_API}/repos/${repo()}/contents/${path}?ref=${encodeURIComponent(process.env.GITHUB_BRANCH || 'main')}`, { headers: headers() });
    if (!response.ok) throw new Error(`GitHub read failed (${response.status})`);
    const file = await response.json();
    return {
        sha: file.sha,
        data: JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'))
    };
}

export async function writeRepositoryFile(path, data, sha, message) {
    const branch = process.env.GITHUB_BRANCH || 'main';
    const response = await fetch(`${GITHUB_API}/repos/${repo()}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8').toString('base64'),
            sha,
            branch
        })
    });
    if (response.status === 409) throw new Error('The file changed on GitHub. Reload it before saving again.');
    if (!response.ok) throw new Error(`GitHub write failed (${response.status})`);
    return response.json();
}
