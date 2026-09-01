import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(resolve(projectDirectory, 'package.json'), 'utf8'));
const tauriConfig = JSON.parse(await readFile(resolve(projectDirectory, 'src-tauri/tauri.conf.json'), 'utf8'));
const cargoToml = await readFile(resolve(projectDirectory, 'src-tauri/Cargo.toml'), 'utf8');
const updaterPublicKey = (await readFile(resolve(projectDirectory, 'UPDATER_PUBLIC_KEY.txt'), 'utf8')).trim();
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const versions = new Set([packageJson.version, tauriConfig.version, cargoVersion]);

if (versions.size !== 1 || versions.has(undefined)) {
  throw new Error(`Desktop versions do not match: package=${packageJson.version}, tauri=${tauriConfig.version}, cargo=${cargoVersion}`);
}

if (tauriConfig.plugins?.updater?.pubkey !== updaterPublicKey) {
  throw new Error('The committed updater public key does not match src-tauri/tauri.conf.json');
}

const version = packageJson.version;
const tag = process.env.GITHUB_REF_NAME;
if (tag && tag !== `desktop-v${version}`) {
  throw new Error(`Tag ${tag} does not match desktop app version ${version}; expected desktop-v${version}`);
}

console.log(`Desktop release version ${version} is consistent.`);
