# Secure admin dashboard setup

The admin dashboard now uses Vercel serverless functions. GitHub credentials stay on the server and are never sent to the browser.

## Deploy

1. Create a free Vercel account and import `jamyang2002/DzongkhaDictionary`.
2. Set the project framework to **Other** and deploy from the repository root.
3. Add these environment variables in Vercel for Production and Preview:
   - `GITHUB_TOKEN`: a fine-grained GitHub token scoped to this repository with **Contents: Read and write**.
   - `GITHUB_REPO`: `jamyang2002/DzongkhaDictionary`.
   - `GITHUB_BRANCH`: `main`.
   - `SESSION_SECRET`: a long random secret, at least 32 characters.
   - `ADMIN_PASSWORD`: a strong password for the dashboard.
4. Redeploy after saving the environment variables.
5. Open `https://YOUR-VERCEL-DOMAIN.vercel.app/admin.html` on any device.

## What it supports

- Secure admin password session using an HTTP-only cookie.
- Loading the latest JSON data directly from GitHub.
- Adding, editing, and deleting dictionary entries.
- Publishing notifications.
- Automatic GitHub commits after every successful save.
- Conflict protection when someone else changes a file first.

## Important security notes

- Never put `GITHUB_TOKEN` in `admin.js`, HTML, or any public file.
- Never commit `.env` or real credentials.
- The JSON dictionary files remain public because the frontend needs them for searching. This protects editing access, not dictionary data visibility.
- Use a GitHub fine-grained token limited to this repository, not a broad personal access token.

The existing GitHub Pages site can continue serving the dictionary. Use the Vercel URL specifically for the secure admin dashboard. To make the dashboard share the same domain as the dictionary, deploy the frontend through Vercel as well.
