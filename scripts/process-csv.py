"""
All Things Tyler – CSV Processor
Run this script whenever you export a new CSV from MembershipWorks.

Usage:
  python3 scripts/process-csv.py path/to/export.csv

Output:
  data/businesses.json  (overwrites previous version)
"""

import sys
import json
import re
import pandas as pd
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_PATH = SCRIPT_DIR.parent / "data" / "businesses.json"

BRONZE_COL = "Bronze Membership Plan - $50/mo"
PLUS_COL = "Bronze PLUS+ Membership Plan  - $75/mo"

# Columns that are NOT service tags
NON_SERVICE_COLS = {
    "Account Name", "First Name", "Last Name", "Phone", "Website",
    "Business card image URL", "Profile description", "Google Review ",
    "Facebook", BRONZE_COL, PLUS_COL,
    "Cancelled / Paused Accounts", "Promo / Non-Profit (Internal)",
    "Account ID", "Parent Account ID",
}


def strip_html(text):
    if not text or str(text).strip() in ("", "nan"):
        return None
    clean = re.sub(r"<[^>]+>", "", str(text))
    clean = re.sub(r"&nbsp;", " ", clean)
    clean = re.sub(r"&amp;", "&", clean)
    clean = re.sub(r"&lt;", "<", clean)
    clean = re.sub(r"&gt;", ">", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean if clean else None


def safe_str(val):
    s = str(val).strip()
    return s if s and s != "nan" else None


def process(csv_path: str):
    df = pd.read_csv(csv_path)
    service_cols = [c for c in df.columns if c not in NON_SERVICE_COLS]

    businesses = []
    for _, row in df.iterrows():
        is_plus = str(row.get(PLUS_COL, "")).strip() == PLUS_COL
        is_bronze = str(row.get(BRONZE_COL, "")).strip() == BRONZE_COL

        if not is_plus and not is_bronze:
            continue  # skip cancelled / paused / internal

        services = [
            col for col in service_cols
            if str(row.get(col, "")).strip() == col
        ]

        businesses.append({
            "id": safe_str(row.get("Account ID")),
            "name": safe_str(row.get("Account Name")),
            "phone": safe_str(row.get("Phone")),
            "website": safe_str(row.get("Website")),
            "facebook": safe_str(row.get("Facebook")),
            "photo": safe_str(row.get("Business card image URL")),
            "description": strip_html(row.get("Profile description")),
            "rating": safe_str(row.get("Google Review ")),
            "services": services,
            "tier": "plus" if is_plus else "bronze",
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(businesses, f, indent=2)

    print(f"✅ Processed {len(businesses)} businesses → {OUTPUT_PATH}")
    print(f"   PLUS+: {sum(1 for b in businesses if b['tier']=='plus')}")
    print(f"   Bronze: {sum(1 for b in businesses if b['tier']=='bronze')}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/process-csv.py path/to/export.csv")
        sys.exit(1)
    process(sys.argv[1])
