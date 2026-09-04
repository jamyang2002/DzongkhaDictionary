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
    "public service year": "publicServiceYear",
    "publicserviceyear": "publicServiceYear",
    "service type": "serviceType",
    "servicetype": "serviceType",
    "agency / client": "agencyClient",
    "agencyclient": "agencyClient",
    "validity status": "validityStatus",
    "validitystatus": "validityStatus",
    "source file": "sourceFile",
    "sourcefile": "sourceFile",
    "source location": "sourceLocation",
    "sourcelocation": "sourceLocation",
    "dictionary direction": "dictionaryLabel",
    "dictionarydirection": "dictionaryLabel",
    "dictionary_direction": "dictionaryLabel",
    "ཚིག་སྡེ།": "type",
    "རྫོང་ཁའི་དོ་མཉམ།": "equivalent",
    "ཨིང་སྐད།": "root",
    "རྫོང་ཁ།": "equivalent",
    "village(standardized)": "root",
    "villagestandardized": "root",
    "village(dzongkha)": "equivalent",
    "villagedzongkha": "equivalent",
    "chiwogstandardized": "chiwog",
    "chiwog(dzongkha)": "chiwogDz",
    "chiwogdzongkha": "chiwogDz",
    "gewog(standardized)": "gewog",
    "gewogstandardized": "gewog",
    "gewog(dzongkha)": "gewogDz",
    "gewogdzongkha": "gewogDz",
    "dzongkhag": "dzongkhag",
    "རྒྱལ་ཁབ།": "countryDz",
    "རྒྱལ་ས།": "capitalDz",
    "meaning": "meaning",
    "book": "dictionaryLabel",
    "རྩ་ཚིག།": "root",
    "རྐང་གྲངས།": "equivalent",
    "ཕལ་སྐད།": "root",
    "ཞེ་ས།": "meaning",

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

DZONGKHA_RE = re.compile(r"[\u0F00-\u0FFF]")
DUPLICATE_DICTIONARY_LABEL = "Coined and contributed by Kundor (During NLP Corpus Editing)"


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


def split_bilingual_cell(value: str) -> tuple[Optional[str], Optional[str]]:
    """Split cells like 'རྫོང་ཁ།\nEnglish Name' into English/Dzongkha parts."""
    lines = [line.strip() for line in str(value).splitlines() if line and line.strip()]
    if len(lines) < 2:
        return None, None

    dzongkha_lines = [line for line in lines if DZONGKHA_RE.search(line)]
    english_lines = [line for line in lines if not DZONGKHA_RE.search(line)]
    if not dzongkha_lines or not english_lines:
        return None, None

    return " ".join(english_lines), " ".join(dzongkha_lines)


def dataframe_to_records(df: pd.DataFrame) -> list[dict[str, str]]:
    has_english_column = any(str(col).strip().lower() == "english" for col in df.columns)
    rename_map = {}
    for col in df.columns:
        normalized = normalize_header(col)
        if has_english_column and str(col).strip().lower() == "dzongkha":
            normalized = "equivalent"
        rename_map[col] = normalized

    df = df.rename(columns=rename_map)
    records = []

    for row_index, row in df.iterrows():
        record = {}
        for key, value in row.items():
            if pd.isna(value):
                continue
            record[key] = str(value).strip()

        if not record.get("root"):
            record["root"] = record.get("present") or record.get("future") or record.get("past") or record.get("imperative")

        if record.get("root") and not record.get("equivalent"):
            english, dzongkha = split_bilingual_cell(record["root"])
            if english and dzongkha:
                record["root"] = english
                record["equivalent"] = dzongkha

        if not record.get("root"):
            continue

        if record.get("dictionaryLabel") == DUPLICATE_DICTIONARY_LABEL:
            continue

        records.append(record)

    return records


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

    records = dataframe_to_records(df)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Converted {len(records)} rows from {input_path.name} to {output_path.name}")


def convert_excel_workbook_to_json(input_path: Path, output_path: Path):
    if not input_path.exists():
        raise FileNotFoundError(f"Input file does not exist: {input_path}")

    workbook = pd.ExcelFile(input_path)
    records = []
    for sheet_name in workbook.sheet_names:
        sheet_records = dataframe_to_records(pd.read_excel(workbook, sheet_name=sheet_name))
        records.extend(sheet_records)
        print(f"Converted {len(sheet_records)} rows from sheet {sheet_name!r}")

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
    parser.add_argument("--all-sheets", action="store_true", help="Combine every sheet into one JSON file")

    args = parser.parse_args()
    if args.all_sheets:
        convert_excel_workbook_to_json(args.input, args.output)
    else:
        convert_excel_to_json(args.input, args.output, args.sheet)


if __name__ == "__main__":
    main()
