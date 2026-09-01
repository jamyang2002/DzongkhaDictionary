# Legacy Monlam dictionary conversion notes

This repository contains a converter for examining the legacy `MLDic.ml` database from [`iamironrabbit/monlam-dictionary`](https://github.com/iamironrabbit/monlam-dictionary).

Do not commit or publish converted Monlam data until the dictionary data owner confirms the redistribution licence. The source repository calls the project and data open source and includes a GPL text, but its separate `LICENSE.txt` explicitly addresses the bundled font and does not clearly state which licence covers `MLDic.ml`.

## Source database

`MLDic.ml` is a UTF-8 SQLite 3 database with three tables:

| Table | Direction | Records |
| --- | --- | ---: |
| `entotb` | English → Tibetan | 38,271 |
| `tben` | Tibetan → English | 88,938 |
| `tbtb` | Tibetan → Tibetan | 55,124 |
| **Total** |  | **182,333** |

There are no empty headwords or definitions. One Tibetan → English source record contains an existing Unicode replacement character: source row `63491`, `རིག་འཛིན་འདུས་པའི་ཚོགས་`, definition `ganapuja of Rigdzin D�pa`. The converter reports this but does not guess a correction.

## Local conversion

Use Node.js 22.5 or newer because the converter uses the built-in `node:sqlite` module:

```sh
node scripts/build_monlam_legacy_dictionary.mjs /path/to/MLDic.ml /path/to/empty-output-directory
```

The output is approximately 38 MB across exact-lookup JSON shards. It includes `manifest.json` with source counts and a `DO_NOT_PUBLISH.txt` warning. The project-level `.gitignore` excludes `monlam_legacy/` as an additional safeguard.

## Future app integration after permission

- English queries can load the matching `english_to_tibetan` shard alongside the existing English results.
- Tibetan-script queries can load matching `tibetan_to_english` and `tibetan_to_tibetan` shards alongside the existing Dzongkha results.
- Results must be clearly labelled `English → Tibetan`, `Tibetan → English`, or `Tibetan → Tibetan`, because Tibetan and Dzongkha cannot be reliably distinguished by Unicode script alone.
- The existing result cards, favourites, history, and dynamic service-worker cache can be reused without changing the overall interface.
