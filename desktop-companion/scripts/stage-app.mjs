import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const companionDirectory = resolve(scriptDirectory, '..');
const projectDirectory = resolve(companionDirectory, '..');
const outputDirectory = resolve(companionDirectory, 'dist');

const files = [
  'index.html',
  'admin.html',
  'admin.js',
  'style.css',
  'modern.css',
  'script.js',
  'quick-lookup.js',
  'quick-lookup.css',
  'pwa-quick-lookup.js',
  'pwa-quick-lookup.css',
  'desktop-updater.js',
  'desktop-updater.css',
  'manifest.json',
  'sw.js',
  'favicon.ico',
  'additional_terminology.json',
  'collected_terminology.json',
  'colloquial_terminology.json',
  'countries_capitals.json',
  'dzongkha_to_dzongkha.json',
  'dzongkha_to_english.json',
  'english_to_dzongkha.json',
  'final_tense.json',
  'kangdrang.json',
  'notifications.json',
  'place_names.json',
  'public_service.json',
  'terminology_2026.json',
  'Design pictures/divider.png'
];

const directories = ['assets', 'english_definitions', 'Font'];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of files) {
  const destination = resolve(outputDirectory, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(projectDirectory, file), destination);
}

for (const directory of directories) {
  await cp(resolve(projectDirectory, directory), resolve(outputDirectory, directory), { recursive: true });
}

console.log(`Staged the dictionary web app in ${outputDirectory}`);
