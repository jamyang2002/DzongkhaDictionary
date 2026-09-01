import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , sourceArgument, outputArgument] = process.argv;

if (!sourceArgument || !outputArgument) {
    console.error('Usage: node scripts/build_english_dictionary.mjs <extracted-oewn-directory> <output-directory>');
    process.exit(1);
}

const sourceDirectory = path.resolve(sourceArgument);
const outputDirectory = path.resolve(outputArgument);
const partOfSpeechLabels = {
    n: 'noun',
    v: 'verb',
    a: 'adjective',
    s: 'adjective',
    r: 'adverb'
};

function normalizeLookupKey(value) {
    return String(value || '').normalize('NFKC').trim().toLowerCase();
}

function shardFor(value) {
    const firstCharacter = normalizeLookupKey(value).charAt(0);
    return /^[a-z]$/.test(firstCharacter) ? firstCharacter : '0';
}

function uniqueStrings(values) {
    const seen = new Set();
    return values.filter((value) => {
        const text = String(value || '').trim();
        const key = text.toLowerCase();
        if (!text || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function formatDefinitions(definitions) {
    if (definitions.length <= 1) return definitions[0] || '';
    return definitions.map((definition, index) => `${index + 1}. ${definition}`).join('\n');
}

async function readJson(filePath) {
    return JSON.parse(await readFile(filePath, 'utf8'));
}

const sourceFiles = await readdir(sourceDirectory);
const synsetFiles = sourceFiles.filter((fileName) => (
    fileName.endsWith('.json')
    && !fileName.startsWith('entries-')
    && fileName !== 'frames.json'
));
const entryFiles = sourceFiles.filter((fileName) => fileName.startsWith('entries-') && fileName.endsWith('.json'));

const synsets = new Map();
for (const fileName of synsetFiles) {
    const records = await readJson(path.join(sourceDirectory, fileName));
    Object.entries(records).forEach(([id, synset]) => synsets.set(id, synset));
}

const shards = Object.fromEntries(['0', ...'abcdefghijklmnopqrstuvwxyz'].map((name) => [name, Object.create(null)]));
let definitionEntryCount = 0;
let lookupKeyCount = 0;

function addToShard(alias, entry) {
    const lookupKey = normalizeLookupKey(alias);
    if (!lookupKey) return;
    const shard = shards[shardFor(lookupKey)];
    if (!shard[lookupKey]) {
        shard[lookupKey] = [];
        lookupKeyCount += 1;
    }
    const signature = `${entry.root}|${entry.type}|${entry.definition}`;
    if (!shard[lookupKey].some((candidate) => `${candidate.root}|${candidate.type}|${candidate.definition}` === signature)) {
        shard[lookupKey].push(entry);
    }
}

for (const fileName of entryFiles.sort()) {
    const lexicalEntries = await readJson(path.join(sourceDirectory, fileName));
    for (const [lemma, partsOfSpeech] of Object.entries(lexicalEntries)) {
        for (const [partOfSpeech, lexicalEntry] of Object.entries(partsOfSpeech)) {
            const senses = Array.isArray(lexicalEntry.sense) ? lexicalEntry.sense : [];
            const matchingSynsets = senses.map((sense) => synsets.get(sense.synset)).filter(Boolean);
            const definitions = uniqueStrings(matchingSynsets.flatMap((synset) => synset.definition || []));
            if (!definitions.length) continue;

            const normalizedLemma = normalizeLookupKey(lemma);
            const synonyms = uniqueStrings(
                matchingSynsets
                    .flatMap((synset) => synset.members || [])
                    .filter((member) => normalizeLookupKey(member) !== normalizedLemma)
            ).slice(0, 12);
            const examples = uniqueStrings(matchingSynsets.flatMap((synset) => synset.example || [])).slice(0, 3);
            const entry = {
                root: lemma,
                type: partOfSpeechLabels[partOfSpeech] || partOfSpeech,
                definition: formatDefinitions(definitions)
            };
            if (synonyms.length) entry.synonyms = synonyms.join('; ');
            if (examples.length) entry.examples = examples.join('\n');

            definitionEntryCount += 1;
            addToShard(lemma, entry);
            (lexicalEntry.form || []).forEach((form) => addToShard(form, entry));
        }
    }
}

await mkdir(outputDirectory, { recursive: true });
for (const shardName of Object.keys(shards)) {
    const sortedShard = Object.fromEntries(
        Object.entries(shards[shardName])
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([lookupKey, entries]) => [lookupKey, entries.sort((left, right) => left.type.localeCompare(right.type))])
    );
    await writeFile(path.join(outputDirectory, `${shardName}.json`), JSON.stringify(sortedShard));
}

const manifest = {
    title: 'Open English WordNet',
    version: '2025',
    source: 'https://en-word.net/downloads',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    changes: 'Converted to compact, alphabetically sharded English definition lookup data for the Dzongkha Dictionary app.',
    definitionEntryCount,
    lookupKeyCount,
    generatedAt: new Date().toISOString()
};
await writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Created ${definitionEntryCount.toLocaleString()} English definition entries across ${lookupKeyCount.toLocaleString()} lookup keys.`);
