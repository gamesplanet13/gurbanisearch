#!/usr/bin/env python3
"""Export Shabad OS Unicode scripture from TOML into validated Github Pages offline packs.

Upstream: https://github.com/shabados/shabados/tree/main/database/collections
Install: Python 3.11+, no third-party dependencies.
Do not edit or transliterate the original Gurmukhi.
"""
from __future__ import annotations
import argparse, json, tomllib, pathlib, datetime, re, sys

SOURCE_IDS = {
    "D": ["SDGR"],
    "B": ["VBGJ", "KSBG"],
    "N": ["GJNL"],
}
SOURCES = {
    "D": "Sri Dasam Granth",
    "B": "Bhai Gurdas Ji Vaaran and Kabit Savaiye",
    "N": "Bhai Nand Lal Ji - Ganj Nama",
}
CITATION = "Shabad OS Database, Unicode primary corpus, https://github.com/shabados/shabados/tree/main/database/collections; follow Shabad OS source bibliography."
MAX_LINES = 850

def read_toml(path: pathlib.Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(path)
    with path.open("rb") as f:
        return tomllib.load(f)

def path_for(root: pathlib.Path, folder: str, ident: str) -> pathlib.Path:
    """Shabad OS stores groups by one character and lines by two characters."""
    loc = root / folder
    candidates = [
        loc / f"{ident}.toml",
        loc / ident[0] / f"{ident}.toml",
        loc / ident[0] / ident[:2] / f"{ident}.toml",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"{folder}:{ident} not in {candidates}")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collections", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, default=pathlib.Path("data/offline-packs"))
    args = parser.parse_args()
    root, output = args.collections, args.output
    if not (root / "sources" / "SDGR.toml").exists():
        raise SystemExit("Missing Shabad OS collections/sources/SDGR.toml")
    output.mkdir(parents=True, exist_ok=True)
    manifest={"format":"gamesplanet-gurbani-packs-v1","sourceRepository":"https://github.com/shabados/shabados","generatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"sources":{}}
    for src, source_ids in SOURCE_IDS.items():
        target=output/src
        target.mkdir(parents=True, exist_ok=True)
        for old in target.glob("chunk-*.json"): old.unlink()
        count=0
        parts=[]
        batch=[]
        serial=1
        seen_ids=set()
        def flush():
            nonlocal serial, batch
            if not batch:return
            filename=f"chunk-{serial:04d}.json"
            payload={"format":"gamesplanet-gurbani-source-v1","source":src,"id":f"shabados-{src}-{serial:04d}","title":SOURCES[src]+f" · Part {serial}","citation":CITATION,"lines":batch}
            (target/filename).write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
            parts.append({"path":f"{src}/{filename}","lines":len(batch)})
            serial+=1
            batch=[]
        for sid in source_ids:
            src_doc=read_toml(path_for(root, "sources", sid))
            for section_id in src_doc.get("sections",[]):
                section=read_toml(path_for(root, "sections", section_id))
                section_name=(section.get("name",{}).get("Latn") or section_id)
                for group_id in section.get("lineGroups",[]):
                    group=read_toml(path_for(root,"line-groups",group_id))
                    group_lines=[]
                    for line_id in group.get("lines",[]):
                        record=read_toml(path_for(root,"lines",line_id))
                        content=record.get("content",[])
                        primary=next((p for p in content if p.get("type")=="primary" and isinstance(p.get("data"),str)),None)
                        if not primary: raise ValueError(f"Missing primary for {line_id}")
                        text=primary["data"].strip()
                        if not text or not re.search(r"[\u0a00-\u0a7f]",text):
                            raise ValueError(f"Invalid/non-Gurmukhi primary for {line_id}")
                        item={"verse":{"unicode":text},"source":{"sourceId":src,"name":SOURCES[src]},"shabadId":group_id,"verseId":line_id,"section":section_name}
                        if isinstance(primary.get("page"),int):item["pageNo"]=primary["page"]
                        # Preserve canonical primary scripture only; editorial translations have independent rights.
                        group_lines.append(item)
                    if len(batch)+len(group_lines)>MAX_LINES:flush()
                    batch.extend(group_lines);count+=len(group_lines)
        flush()
        if not count or not parts:raise ValueError(f"Exported no lines for {src}")
        manifest["sources"][src]={"label":SOURCES[src],"lines":count,"parts":parts,"origin":source_ids}
    (output/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Export complete: {json.dumps({k:v['lines'] for k,v in manifest['sources'].items()})}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
