import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const companionDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectDirectory = resolve(companionDirectory, '..');
const runNumber = String(process.env.GITHUB_RUN_NUMBER || '').trim();

if (!/^\d+$/.test(runNumber) || Number(runNumber) < 1) {
  throw new Error('GITHUB_RUN_NUMBER must be a positive integer');
}

const manifestPath = resolve(projectDirectory, 'manifest.json');
const packagePath = resolve(companionDirectory, 'package.json');
const lockPath = resolve(companionDirectory, 'package-lock.json');
const tauriPath = resolve(companionDirectory, 'src-tauri/tauri.conf.json');
const cargoPath = resolve(companionDirectory, 'src-tauri/Cargo.toml');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const trackMatch = String(manifest.version || '').match(/^(\d+)\.(\d+)(?:\.\d+)?$/);

if (!trackMatch) {
  throw new Error(`PWA manifest version ${manifest.version} is not semantic (major.minor.patch)`);
}

const releaseVersion = `${trackMatch[1]}.${trackMatch[2]}.${runNumber}`;
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const packageLock = JSON.parse(await readFile(lockPath, 'utf8'));
const tauriConfig = JSON.parse(await readFile(tauriPath, 'utf8'));
let cargoToml = await readFile(cargoPath, 'utf8');

packageJson.version = releaseVersion;
packageLock.version = releaseVersion;
packageLock.packages[''].version = releaseVersion;
tauriConfig.version = releaseVersion;
cargoToml = cargoToml.replace(/^version\s*=\s*"[^"]+"/m, `version = "${releaseVersion}"`);

await Promise.all([
  writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`),
  writeFile(tauriPath, `${JSON.stringify(tauriConfig, null, 2)}\n`),
  writeFile(cargoPath, cargoToml)
]);

console.log(`Prepared automatic desktop release ${releaseVersion} from PWA track ${manifest.version}.`);
