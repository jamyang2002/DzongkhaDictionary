import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
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
  'honorific_terms.json',
  'notifications.json',
  'place_names.json',
  'public_service.json',
  'terminology_2026.json',
  'Design pictures/divider.png'
];

const directories = ['assets', 'english_definitions', 'Font'];
let updatedCount = 0;
let unchangedCount = 0;

async function filesMatch(source, destination) {
  try {
    const [sourceStat, destinationStat] = await Promise.all([stat(source), stat(destination)]);
    if (sourceStat.size !== destinationStat.size) return false;
    const [sourceData, destinationData] = await Promise.all([
      readFile(source),
      readFile(destination)
    ]);
    return sourceData.equals(destinationData);
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function syncFile(source, destination) {
  if (await filesMatch(source, destination)) {
    unchangedCount += 1;
    return;
  }
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { preserveTimestamps: true });
  updatedCount += 1;
}

async function syncDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  const [sourceEntries, destinationEntries] = await Promise.all([
    readdir(source, { withFileTypes: true }),
    readdir(destination, { withFileTypes: true })
  ]);
  const sourceNames = new Set(sourceEntries.map((entry) => entry.name));

  await Promise.all(destinationEntries
    .filter((entry) => !sourceNames.has(entry.name))
    .map((entry) => rm(resolve(destination, entry.name), { recursive: true, force: true })));

  await Promise.all(sourceEntries.map(async (entry) => {
    const sourcePath = resolve(source, entry.name);
    const destinationPath = resolve(destination, entry.name);
    if (entry.isDirectory()) {
      await syncDirectory(sourcePath, destinationPath);
    } else {
      await syncFile(sourcePath, destinationPath);
    }
  }));
}

await mkdir(outputDirectory, { recursive: true });

const expectedTopLevelEntries = new Set([
  ...files.map((file) => file.split('/')[0]),
  ...directories
]);
const outputEntries = await readdir(outputDirectory, { withFileTypes: true });
await Promise.all(outputEntries
  .filter((entry) => !expectedTopLevelEntries.has(entry.name))
  .map((entry) => rm(resolve(outputDirectory, entry.name), { recursive: true, force: true })));

await Promise.all(files.map((file) => syncFile(
  resolve(projectDirectory, file),
  resolve(outputDirectory, file)
)));

await Promise.all(directories.map((directory) => syncDirectory(
  resolve(projectDirectory, directory),
  resolve(outputDirectory, directory)
)));

console.log(`Staged the dictionary web app in ${outputDirectory} (${updatedCount} updated, ${unchangedCount} unchanged).`);
