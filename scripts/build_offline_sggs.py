#!/usr/bin/env python3
"""Prepare compact, numbered Open Granth SGGS packs for the Games Planet offline installer.

Source: https://github.com/opengranth/open-granth/tree/main/corpus
Uses the upstream Open Granth Gurmukhi and DSSK English text without altering wording.
Requires Python 3.11+, internet, and no third-party Python packages.
"""
from __future__ import annotations
import argparse, concurrent.futures, datetime, json, pathlib, re, time, urllib.request, urllib.error

BASE = "https://raw.githubusercontent.com/opengranth/open-granth/main/corpus"
TOTAL = 1430
PACK_SIZE = 20
WORKERS = 6
LINE_RE = re.compile(r"<!--\s*LINE:\s*(\d+)\s*-->")
GURMUKHI_RE = re.compile(r"^\*\*(.+?)\*\*\s*$",re.MULTILINE)
ROMAN_RE = re.compile(r"^\*(?!\*)(.*?)\*(?!\*)\s*$",re.MULTILINE)
CITATION = "Open Granth (Shabad OS source), original Gurmukhi transliteration, https://github.com/opengranth/open-granth; DSSK English by Dr Sant Singh Khalsa where supplied."

def parse_ang(number: int, markdown: str) -> dict:
    pieces=LINE_RE.split(markdown)
    if len(pieces)<12: raise ValueError(f"Ang {number} invalid or incomplete")
    page=[]
    for index in range(1,len(pieces)-1,2):
        body=pieces[index+1]
        g=GURMUKHI_RE.search(body)
        if not g: continue
        text=g.group(1)
        if not re.search(r"[\u0a00-\u0a7f]",text): continue
        rest=body[g.end():]
        latin=ROMAN_RE.search(rest)
        line={"verse":{"unicode":text},"pageNo":number,"source":{"sourceId":"G","name":"Sri Guru Granth Sahib Ji"}}
        if latin:
            line["transliteration"]={"english":latin.group(1)}
            translated=rest[latin.end():].split("\n---",1)[0].strip()
            if translated:line["translation"]={"en":{"unicode":translated}}
        page.append(line)
    if len(page)<5: raise ValueError(f"Ang {number} has too few verses: {len(page)}")
    return {"number":number,"page":page}

def fetch_ang(number: int) -> dict:
    url=f"{BASE}/ang-{number:04d}.md"
    for retry in range(5):
        try:
            request=urllib.request.Request(url,headers={"User-Agent":"GamesPlanetGurbaniOffline/1.0","Accept":"text/plain"})
            with urllib.request.urlopen(request,timeout=45) as resp:
                return parse_ang(number,resp.read().decode("utf-8"))
        except (OSError,urllib.error.URLError,UnicodeError,ValueError):
            if retry==4:raise
            time.sleep(min(20,2**retry))
    raise RuntimeError(f"Ang {number} unavailable")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",type=pathlib.Path,default=pathlib.Path("data/offline-packs"))
    args=parser.parse_args()
    root=args.output
    dest=root/"G"
    dest.mkdir(parents=True,exist_ok=True)
    for stale in dest.glob("chunk-*.json"):stale.unlink()
    manifest_file=root/"manifest.json"
    manifest=json.loads(manifest_file.read_text("utf-8")) if manifest_file.exists() else {
        "format":"gamesplanet-gurbani-packs-v1","sources":{}}
    pack_refs=[]
    for start in range(1,TOTAL+1,PACK_SIZE):
        end=min(start+PACK_SIZE-1,TOTAL)
        print(f"Downloading SGGS Ang {start}–{end} from Open Granth",flush=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
            pages=list(pool.map(fetch_ang,range(start,end+1)))
        assert [p["number"] for p in pages]==list(range(start,end+1))
        part=(start-1)//PACK_SIZE+1
        filename=f"chunk-{part:04d}.json"
        pack={"format":"gamesplanet-gurbani-angs-v1","source":"G",
              "citation":CITATION,"pages":pages}
        (dest/filename).write_text(json.dumps(pack,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
        pack_refs.append({"path":f"G/{filename}","count":len(pages),"start":start,"end":end})
    manifest.setdefault("sources",{})["G"]={
        "label":"Sri Guru Granth Sahib Ji","pages":TOTAL,"parts":pack_refs,
        "source":"Open Granth (Shabad OS transcription)"}
    manifest["generatedAt"]=datetime.datetime.now(datetime.timezone.utc).isoformat()
    manifest["status"]="published"
    manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Published {len(pack_refs)} GitHub Packs with {TOTAL} verified Angs",flush=True)

if __name__=="__main__":
    main()
