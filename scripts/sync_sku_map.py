#!/usr/bin/env python3
"""
sync_sku_map.py
================
Keeps the dashboard's SKU whitelist / category map (SKU_CAT_MAP) in sync with the
published Google Sheet. Reads columns A (Item SKU Code) and B (Item Type Name) as the
watched source; resolves each SKU's category from column C when present, else from a
prefix rule derived from the current catalogue.

Behaviour:
  1. Fetch the published CSV.
  2. Build the desired map {sku: category} for every SKU in columns A/B.
  3. Read the CURRENT SKU_CAT_MAP embedded in components/Dashboard.js.
  4. Diff -> report ADDED / CHANGED / (optionally) REMOVED SKUs.
  5. If anything changed, rewrite the inline `var SKU_CAT_MAP = {...};` in Dashboard.js.
  6. Exit code 0 = no change, 10 = changes written, 1 = error.

Any new SKU whose prefix is unknown is still mapped (via col C) but FLAGGED in the log
so a human can confirm, and — if col C is also blank — parked as 'Uncategorised' and
listed loudly so it never silently disappears.

Run locally:   python3 sync_sku_map.py --repo /path/to/Sourcing-Dashboard
CI (default):  python3 sync_sku_map.py            # assumes repo root is CWD
Dry run:       python3 sync_sku_map.py --dry-run
"""

import argparse, csv, io, json, os, re, sys, urllib.request

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQ0olbpjA5mHId19xwOqF6bHyXg4g4sNJCMNotEXkcU-7Hh5e8BHxWUapdYZb82mlYUoijVoF-ckmGx"
    "/pub?gid=4541055&single=true&output=csv"
)

# Prefix -> category fallback, derived from the authoritative catalogue.
# Only used when a row's Category (col C) is blank. Keeps brand-new SKUs mappable
# even before someone fills column C.
PREFIX_RULES = {
    "BP":   "Bracelets and Pendants",
    "CRY":  "Crystal",
    "F":    "Frame",
    "M":    "Murti",
    "RD":   "Rudraksha",
    "VST":  "Vastu",
    "WJ":   "Womens Jewellery",
    "SEL":  "Selenite",
    "WH":   "Wall Hanging",
    "ACRY": "Acrylic",
    "LK":   "Lal Kitaab Remedy",
    "RING": "RING",
}

# Per-SKU exceptions that override the prefix rule (e.g. a BP item that is really Crystal).
# Populated from the current catalogue; extend if new exceptions appear.
SKU_EXCEPTIONS = {
    "BP_0411": "Crystal",
}


def log(msg): print(msg, flush=True)


def fetch_csv(url):
    req = urllib.request.Request(url, headers={"User-Agent": "sku-sync/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read().decode("utf-8", errors="replace")
    return list(csv.DictReader(io.StringIO(raw)))


def norm(s): return (s or "").strip()


def prefix_of(sku):
    m = re.match(r"^([A-Za-z]+)", sku)
    return m.group(1) if m else ""


def resolve_category(sku, sheet_cat):
    """Category precedence: explicit exception -> sheet col C -> prefix rule -> Uncategorised."""
    if sku in SKU_EXCEPTIONS:
        return SKU_EXCEPTIONS[sku], "exception"
    if sheet_cat:
        return sheet_cat, "sheet"
    pref = prefix_of(sku)
    if pref in PREFIX_RULES:
        return PREFIX_RULES[pref], "prefix"
    return "Uncategorised", "unknown"


def build_desired_map(rows):
    desired, flags = {}, []
    for row in rows:
        # normalise header keys (strip spaces)
        r = {norm(k): v for k, v in row.items()}
        sku = norm(r.get("Item SKU Code"))
        name = norm(r.get("Item Type Name"))
        sheet_cat = norm(r.get("Category"))
        if not sku or sku.lower() == "nan":
            continue
        cat, source = resolve_category(sku, sheet_cat)
        # keep first occurrence; note dupes
        if sku in desired:
            continue
        desired[sku] = cat
        if source == "unknown":
            flags.append(("UNKNOWN", sku, name, "no category + unknown prefix -> Uncategorised"))
        elif source == "prefix":
            flags.append(("PREFIX", sku, name, f"col C blank -> mapped by prefix -> {cat}"))
    return desired, flags


def extract_current_map(dashboard_src):
    m = re.search(r"var\s+SKU_CAT_MAP\s*=\s*(\{[^\n]*?\});", dashboard_src)
    if not m:
        raise RuntimeError("Could not locate `var SKU_CAT_MAP = {...};` in Dashboard.js")
    return json.loads(m.group(1)), m.span(1)


def write_map_into_dashboard(dashboard_src, new_map, span):
    payload = json.dumps(new_map, ensure_ascii=False, separators=(",", ":"))
    start, end = span
    return dashboard_src[:start] + payload + dashboard_src[end:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".", help="Path to Sourcing-Dashboard repo root")
    ap.add_argument("--url", default=SHEET_CSV_URL)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--allow-removals", action="store_true",
                    help="If set, SKUs no longer in the sheet are removed from the map")
    args = ap.parse_args()

    dash_path = os.path.join(args.repo, "components", "Dashboard.js")

    if not os.path.isfile(dash_path):
        log(f"ERROR: {dash_path} not found"); return 1

    log("Fetching published sheet...")
    rows = fetch_csv(args.url)
    log(f"  {len(rows)} data rows read from sheet")

    desired, flags = build_desired_map(rows)
    log(f"  {len(desired)} unique SKUs resolved from columns A/B/C")

    src = open(dash_path, encoding="utf-8").read()
    current, span = extract_current_map(src)
    log(f"  {len(current)} SKUs currently in dashboard SKU_CAT_MAP")

    added   = {s: c for s, c in desired.items() if s not in current}
    changed = {s: (current[s], c) for s, c in desired.items() if s in current and current[s] != c}
    removed = {s: current[s] for s in current if s not in desired}

    log("\n=== DIFF ===")
    log(f"ADDED   : {len(added)}")
    for s, c in sorted(added.items()):
        log(f"   + {s:16} -> {c}")
    log(f"CHANGED : {len(changed)}")
    for s, (old, new) in sorted(changed.items()):
        log(f"   ~ {s:16} : {old!r} -> {new!r}")
    log(f"REMOVED (in dashboard, no longer in sheet): {len(removed)}"
        + ("  [will remove]" if args.allow_removals else "  [kept — use --allow-removals to drop]"))
    for s, c in sorted(removed.items()):
        log(f"   - {s:16} ({c})")

    if flags:
        log("\n=== FLAGS (needs a human eye) ===")
        for kind, sku, name, why in flags:
            log(f"   [{kind}] {sku:16} {name[:45]:45} {why}")

    # Compose the new map
    new_map = dict(current)
    new_map.update(desired)              # add + update
    if args.allow_removals:
        for s in removed: new_map.pop(s, None)
    # sort for stable diffs
    new_map = {k: new_map[k] for k in sorted(new_map.keys())}

    no_change = (not added and not changed and not (removed and args.allow_removals)
                 and new_map == current)
    if no_change:
        log("\nNo changes. SKU_CAT_MAP already in sync. ✅")
        return 0

    if args.dry_run:
        log("\n--dry-run: not writing files.")
        return 10

    # Write Dashboard.js
    new_src = write_map_into_dashboard(src, new_map, span)
    open(dash_path, "w", encoding="utf-8").write(new_src)
    log(f"\nUpdated {dash_path}")

    log(f"\nDone. Map now has {len(new_map)} SKUs.")
    return 10


if __name__ == "__main__":
    sys.exit(main())
