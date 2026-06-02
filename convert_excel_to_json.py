#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path
from typing import Optional

import pandas as pd

COLUMN_MAP = {
    # English → Dzongkha
    "root": "root",
    "rootword": "root",
    "root_word": "root",
    "roorword": "root",
    "also": "also",
    "dzongkha": "root",
    "word": "root",
    "verb": "root",
    "english": "root",
    "type": "type",
    "plural": "plural",
    "verbalform": "verbalForm",
    "verbal_form": "verbalForm",
    "comparative": "comparative",
    "comparativeform": "comparative",
    "comparative_form": "comparative",
    "equivalent": "equivalent",
    "equivalentword": "equivalent",
    "equivalent_word": "equivalent",
    "country": "root",
    "capital": "equivalent",
    "source": "source",
    "ཚིག་སྡེ།": "type",
    "རྫོང་ཁའི་དོ་མཉམ།": "equivalent",
    "ཨིང་སྐད།": "root",
    "རྫོང་ཁ།": "equivalent",
    "རྒྱལ་ཁབ།": "countryDz",
    "རྒྱལ་ས།": "capitalDz",
    "meaning": "meaning",

    # Dzongkha → English
    "tenses": "tenses",
    "short": "short",
    "syn": "syn",
    "synonym": "syn",
    "app": "app",
    "hon": "hon",
    "equivalentterm": "equivalentTerm",
    "equivalent_term": "equivalentTerm",
    "equivalentterm": "equivalentTerm",

    # Tense Specifics
    "future": "future",
    "present": "present",
    "past": "past",
    "imperative": "imperative",
}


def normalize_header(name: str) -> str:
    if name is None:
        return ""

    original = str(name).strip()
    normalized = original.lower()
    simplified = re.sub(r"[^a-z0-9]", "", normalized)

    return (
        COLUMN_MAP.get(original)
        or COLUMN_MAP.get(normalized)
        or COLUMN_MAP.get(simplified)
        or simplified
        or normalized
    )


def convert_excel_to_json(input_path: Path, output_path: Path, sheet_name: Optional[str]):
    if not input_path.exists():
        raise FileNotFoundError(f"Input file does not exist: {input_path}")

    df = pd.read_excel(input_path, sheet_name=sheet_name)
    if isinstance(df, dict):
        if sheet_name is None:
            first_sheet = next(iter(df))
            df = df[first_sheet]
        else:
            df = df[sheet_name]

    df = df.rename(columns={col: normalize_header(col) for col in df.columns})
    records = []

    for row_index, row in df.iterrows():
        record = {}
        for key, value in row.items():
            if pd.isna(value):
                continue
            record[key] = str(value).strip()

        if not record.get("root"):
            record["root"] = record.get("present") or record.get("future") or record.get("past") or record.get("imperative")

        if not record.get("root"):
            continue

        records.append(record)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Converted {len(records)} rows from {input_path.name} to {output_path.name}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert Excel dictionary files into normalized JSON for the Dzongkha dictionary web app."
    )
    parser.add_argument("input", type=Path, help="Input Excel file path (.xlsx or .xls)")
    parser.add_argument("output", type=Path, help="Output JSON file path")
    parser.add_argument("--sheet", type=str, default=None, help="Sheet name to convert (default: first sheet)")

    args = parser.parse_args()
    convert_excel_to_json(args.input, args.output, args.sheet)


if __name__ == "__main__":
    main()
