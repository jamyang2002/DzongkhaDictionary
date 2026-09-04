import { readRepositoryFile, writeRepositoryFile } from './github.js';

export const DICTIONARY_FILES = {
    enDz: 'english_to_dzongkha.json',
    dzEn: 'dzongkha_to_english.json',
    dzDz: 'dzongkha_to_dzongkha.json',
    tenses: 'final_tense.json',
    kangdrang: 'kangdrang.json',
    countries: 'countries_capitals.json',
    publicService: 'public_service.json',
    placeNames: 'place_names.json',
    collected: 'collected_terminology.json',
    terminology2026: 'terminology_2026.json',
    colloquial: 'colloquial_terminology.json',
    additional: 'additional_terminology.json',
    honorificTerms: 'honorific_terms.json'
};

export function fileForKey(key) {
    const file = DICTIONARY_FILES[key];
    if (!file) throw new Error('Unknown dictionary');
    return file;
}

export function validateEntries(data) {
    if (!Array.isArray(data) || data.length > 100000) throw new Error('Dictionary data must be an array of at most 100,000 entries.');
    for (const entry of data) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.root !== 'string' || !entry.root.trim()) {
            throw new Error('Every dictionary entry must have a root word.');
        }
    }
}

export async function updateFile(key, data, sha, message) {
    validateEntries(data);
    const path = fileForKey(key);
    const current = await readRepositoryFile(path);
    if (sha && sha !== current.sha) throw new Error('The file changed on GitHub. Reload it before saving again.');
    const result = await writeRepositoryFile(path, data, current.sha, message);
    return { key, path, sha: result.content?.sha || current.sha, count: data.length };
}
