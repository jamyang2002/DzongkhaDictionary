# English definition data

The JSON shards in this directory are adapted from **Open English WordNet 2025**, created by the Open English WordNet Community.

- Source: https://en-word.net/downloads
- Project: https://github.com/globalwordnet/english-wordnet
- Licence: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Changes: The official JSON release was converted into compact, alphabetically sharded lookup records. Definitions were grouped by lemma and part of speech; synonyms and a limited number of examples were retained; inflected forms supplied by the source were added as lookup aliases.

The generated files can be reproduced with:

```sh
node scripts/build_english_dictionary.mjs <extracted-oewn-directory> english_definitions
```
