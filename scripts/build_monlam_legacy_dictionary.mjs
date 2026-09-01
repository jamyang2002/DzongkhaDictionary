import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const [, , databaseArgument, outputArgument] = process.argv;

if (!databaseArgument || !outputArgument) {
    console.error('Usage: node scripts/build_monlam_legacy_dictionary.mjs <MLDic.ml> <empty-output-directory>');
    process.exit(1);
}

const databasePath = path.resolve(databaseArgument);
const outputDirectory = path.resolve(outputArgument);
const directions = [
    {
        table: 'entotb',
        directory: 'english_to_tibetan',
        rootLanguage: 'english',
        valueField: 'equivalent',
        label: 'English → Tibetan'
    },
    {
        table: 'tben',
        directory: 'tibetan_to_english',
        rootLanguage: 'tibetan',
        valueField: 'equivalentTerm',
        label: 'Tibetan → English'
    },
    {
        table: 'tbtb',
        directory: 'tibetan_to_tibetan',
        rootLanguage: 'tibetan',
        valueField: 'meaning',
        label: 'Tibetan → Tibetan'
    }
];

function cleanText(value) {
    return String(value ?? '')
        .normalize('NFC')
        .replaceAll('\u0000', '')
        .replace(/\r\n?/g, '\n')
        .trim();
}

function normalizeEnglish(value) {
    return cleanText(value).normalize('NFKC').toLowerCase();
}

function normalizeTibetan(value) {
    return cleanText(value).replace(/[་།\s]+$/g, '');
}

function normalizeLookup(value, language) {
    return language === 'english' ? normalizeEnglish(value) : normalizeTibetan(value);
}

function shardName(lookupKey, language) {
    const firstCharacter = [...lookupKey][0] || '';
    if (language === 'english') return /^[a-z]$/i.test(firstCharacter) ? firstCharacter.toLowerCase() : 'other';
    const codePoint = firstCharacter.codePointAt(0);
    return codePoint >= 0x0f00 && codePoint <= 0x0fff ? `u${codePoint.toString(16).padStart(4, '0')}` : 'other';
}

async function assertEmptyOutputDirectory(directory) {
    await mkdir(directory, { recursive: true });
    const existing = await readdir(directory);
    if (existing.length) throw new Error(`Output directory must be empty: ${directory}`);
}

function addEntry(shards, lookupKey, language, entry) {
    const name = shardName(lookupKey, language);
    if (!shards.has(name)) shards.set(name, Object.create(null));
    const shard = shards.get(name);
    if (!shard[lookupKey]) shard[lookupKey] = [];
    const signature = `${entry.root}\u0000${Object.values(entry).join('\u0000')}`;
    if (!shard[lookupKey].some((candidate) => `${candidate.root}\u0000${Object.values(candidate).join('\u0000')}` === signature)) {
        shard[lookupKey].push(entry);
    }
}

await assertEmptyOutputDirectory(outputDirectory);

const databaseBytes = await readFile(databasePath);
const sourceSha256 = createHash('sha256').update(databaseBytes).digest('hex');
const database = new DatabaseSync(databasePath, { readOnly: true });
const manifestDirections = {};

try {
    for (const direction of directions) {
        const rows = database.prepare(`SELECT _id, word, definition FROM ${direction.table} ORDER BY _id`).all();
        const shards = new Map();
        let skippedEntries = 0;
        let replacementCharacterRecords = 0;

        for (const row of rows) {
            const root = cleanText(row.word);
            const definition = cleanText(row.definition);
            const lookupKey = normalizeLookup(root, direction.rootLanguage);
            if (!root || !definition || !lookupKey) {
                skippedEntries += 1;
                continue;
            }
            if (root.includes('\uFFFD') || definition.includes('\uFFFD')) replacementCharacterRecords += 1;

            addEntry(shards, lookupKey, direction.rootLanguage, {
                root,
                [direction.valueField]: definition
            });
        }

        const directionDirectory = path.join(outputDirectory, direction.directory);
        await mkdir(directionDirectory, { recursive: true });
        let lookupKeyCount = 0;
        let convertedEntryCount = 0;

        for (const [name, shard] of [...shards.entries()].sort(([left], [right]) => left.localeCompare(right))) {
            const sortedShard = Object.fromEntries(Object.entries(shard).sort(([left], [right]) => left.localeCompare(right)));
            lookupKeyCount += Object.keys(sortedShard).length;
            convertedEntryCount += Object.values(sortedShard).reduce((total, entries) => total + entries.length, 0);
            await writeFile(path.join(directionDirectory, `${name}.json`), JSON.stringify(sortedShard));
        }

        manifestDirections[direction.directory] = {
            label: direction.label,
            sourceTable: direction.table,
            sourceEntryCount: rows.length,
            convertedEntryCount,
            lookupKeyCount,
            skippedEntries,
            replacementCharacterRecords,
            shardCount: shards.size
        };
    }
} finally {
    database.close();
}

const manifest = {
    title: 'Legacy Monlam Tibetan Dictionary data',
    sourceRepository: 'https://github.com/iamironrabbit/monlam-dictionary',
    sourceFile: 'app/src/main/assets/MLDic.ml',
    sourceSha256,
    redistributionStatus: 'UNCONFIRMED — do not publish these converted files without permission from the data owner.',
    changes: 'Converted the legacy SQLite tables into normalized, exact-lookup JSON shards. Source wording is otherwise preserved.',
    directions: manifestDirections,
    generatedAt: new Date().toISOString()
};

await writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(
    path.join(outputDirectory, 'DO_NOT_PUBLISH.txt'),
    'Redistribution rights for the legacy Monlam dictionary database have not been confirmed. Keep these converted files local until the data owner grants permission.\n'
);

const totalEntries = Object.values(manifestDirections).reduce((total, direction) => total + direction.convertedEntryCount, 0);
console.log(`Converted ${totalEntries.toLocaleString()} entries. Output is local-only until redistribution permission is confirmed.`);
