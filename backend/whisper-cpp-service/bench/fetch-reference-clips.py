#!/usr/bin/env python3
"""Build a reference clip set for whisperbench from the Quran audio CDN.

WHAT THIS IS
    A correctness floor — not the gate ../README.md asks for. Every voice here
    belongs to a professional reciter reading fluently, so both engines will
    score well and neither is stressed the way a beginner stresses them.

    What it does prove: that a candidate engine transcribes the app's own
    curriculum at all, through the codec the app actually receives. That is
    enough to catch a broken model conversion, a missing ffmpeg decoder, or an
    engine that has quietly regressed — without waiting on human recordings.

WHAT IT IS NOT
    A substitute for real phone recordings of learners. Hesitation, restarts,
    mispronunciation and room noise are where the app's scoring earns its keep,
    and none of that is downloadable. Do not clear the whisper.cpp swap on this
    set alone; clearing it needs the human set the README describes.

CHOICES THAT MAKE IT WORTH RUNNING
    - Content is the app's own: only the surahs the curriculum teaches, at the
      length a lesson actually asks for.
    - Voices rotate across several reciters, so no single voice's quirks decide
      the result.
    - Audio is transcoded to 16 kHz mono AAC in an .m4a container — what phones
      upload. That exercises the decode path, which is exactly where a
      whisper.cpp build either has working ffmpeg support or does not.

USAGE
    ./fetch-reference-clips.py                 # ~80 clips into clips/
    ./fetch-reference-clips.py --count 40
    ./fetch-reference-clips.py --keep-mp3      # skip transcoding

    Needs network and curl. Transcoding runs in Docker, so no local ffmpeg is
    required.

The output (clips/ and clips.jsonl) is gitignored, like any clip set.
"""

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

API = "https://api.alquran.cloud/v1"
CDN = "https://cdn.islamic.network/quran/audio"
BITRATE = 128

# The short surahs the curriculum teaches. Al-Fatiha and the last ten are what
# a learner meets first and what the recitation lessons drill, so a clip set
# built from anything else would be measuring content the app never asks for.
SURAHS = [1, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]

# Rotated per clip. One voice would let a single reciter's pace or dialect
# decide whether the candidate passes.
#
# Candidates, not a guarantee: the CDN publishes per-ayah audio for some
# editions and not others, with no index saying which, and an unavailable one
# answers 403 per clip. They are probed once at startup instead of being
# trusted, so this list can rot without silently halving the clip set.
RECITER_CANDIDATES = [
    "ar.alafasy",
    "ar.husary",
    "ar.minshawi",
    "ar.shaatree",
    "ar.abdulbasitmurattal",
    "ar.abdullahbasfar",
    "ar.hudhaify",
    "ar.ahmedajamy",
    "ar.hanirifai",
    "ar.mahermuaiqly",
]

FFMPEG_IMAGE = "jrottenberg/ffmpeg:6.1-alpine"


# Everything goes through curl rather than urllib. On this toolchain urllib
# spends ~20 s per request where curl spends under one — long enough that
# fetching eighty clips would take half an hour and look like a hang.
def _curl(args, timeout=90):
    return subprocess.run(["curl", "-sS", "--fail", "--max-time", str(timeout),
                           "--retry", "2", "--retry-delay", "1"] + args,
                          capture_output=True)


# The API hands back a BOM on the first ayah of a surah, and zero-width joiners
# turn up inside some words. Neither is spoken, but both survive into the
# reference and count as a mismatch the reciter had no way to avoid.
_INVISIBLE = dict.fromkeys(map(ord, "\ufeff\u200b\u200c\u200d\u00a0"), None)


def clean(text):
    return text.translate(_INVISIBLE).strip()


def get_json(url, timeout=30):
    proc = _curl([url], timeout)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode(errors="replace").strip() or f"curl exit {proc.returncode}")
    return json.loads(proc.stdout)


def download(url, dest, timeout=60):
    proc = _curl(["-o", dest, url], timeout)
    if proc.returncode != 0:
        return None, proc.stderr.decode(errors="replace").strip() or f"curl exit {proc.returncode}"
    size = os.path.getsize(dest) if os.path.exists(dest) else 0
    if size < 1024:
        # A truncated or error-page response would otherwise reach the bench as
        # a clip that fails on both engines and tells you nothing.
        os.path.exists(dest) and os.remove(dest)
        return None, f"suspiciously small ({size} bytes)"
    return size, None


def usable_reciters(candidates):
    """Keep the editions that actually serve per-ayah audio."""
    ok = []
    for r in candidates:
        # Ayah 1 exists for every edition that exists at all.
        proc = _curl(["-o", os.devnull, "-w", "%{http_code}", f"{CDN}/{BITRATE}/{r}/1.mp3"], 20)
        code = proc.stdout.decode(errors="replace").strip()
        if proc.returncode == 0 and code == "200":
            ok.append(r)
            print(f"  ✓ {r}")
        else:
            print(f"  – {r} (no per-ayah audio)")
    return ok


def transcode_all(clip_dir):
    """mp3 -> 16 kHz mono AAC, the shape a phone uploads.

    One container for the whole batch: starting a container per clip costs more
    than the transcoding does.
    """
    script = (
        'for f in /work/*.mp3; do '
        '  [ -e "$f" ] || continue; '
        '  ffmpeg -nostdin -loglevel error -y -i "$f" '
        '    -ac 1 -ar 16000 -c:a aac -b:a 32k "${f%.mp3}.m4a" && rm "$f"; '
        'done'
    )
    proc = subprocess.run(
        ["docker", "run", "--rm", "-v", f"{clip_dir}:/work",
         "--entrypoint", "sh", FFMPEG_IMAGE, "-c", script],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print(proc.stderr.strip()[:800], file=sys.stderr)
    return proc.returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=80, help="how many clips to build")
    ap.add_argument("--out", default="clips", help="clip directory, relative to this file")
    ap.add_argument("--manifest", default="clips.jsonl")
    ap.add_argument("--keep-mp3", action="store_true", help="skip the Docker transcode step")
    args = ap.parse_args()

    clip_dir = os.path.join(HERE, args.out)
    manifest_path = os.path.join(HERE, args.manifest)

    if os.path.exists(clip_dir):
        print(f"{clip_dir} already exists — delete it to rebuild.", file=sys.stderr)
        return 1
    os.makedirs(clip_dir)

    print("▸ Checking which reciters the CDN serves per-ayah")
    reciters = usable_reciters(RECITER_CANDIDATES)
    if not reciters:
        print("no reciter has per-ayah audio — is the CDN reachable?", file=sys.stderr)
        return 1
    print(f"  using {len(reciters)} reciters\n")

    print("▸ Collecting ayahs from the surahs the curriculum teaches")
    ayahs = []
    for surah in SURAHS:
        try:
            data = get_json(f"{API}/surah/{surah}/quran-uthmani")["data"]
        except Exception as e:
            print(f"  surah {surah}: {e}", file=sys.stderr)
            continue
        name = data["englishName"].lower().replace(" ", "-").replace("'", "")
        for ayah in data["ayahs"]:
            ayahs.append({
                "surah": surah,
                "name": name,
                "in_surah": ayah["numberInSurah"],
                "global": ayah["number"],
                "text": clean(ayah["text"]),
            })
        print(f"  surah {surah:3} {name:16} {len(data['ayahs']):3} ayahs")

    if not ayahs:
        print("no ayahs collected — is the API reachable?", file=sys.stderr)
        return 1

    ayahs = ayahs[:args.count]
    print(f"\n▸ Downloading {len(ayahs)} clips across {len(reciters)} reciters")

    entries, failures = [], 0
    for i, ayah in enumerate(ayahs):
        reciter = reciters[i % len(reciters)]
        stem = f"{i + 1:03d}-{ayah['name']}-{ayah['in_surah']}-{reciter.split('.')[1]}"
        dest = os.path.join(clip_dir, stem + ".mp3")
        url = f"{CDN}/{BITRATE}/{reciter}/{ayah['global']}.mp3"

        size, err = download(url, dest)
        if err:
            print(f"  ✗ {stem}: {err}", file=sys.stderr)
            failures += 1
            continue

        entries.append({
            "audio": f"{args.out}/{stem}" + (".mp3" if args.keep_mp3 else ".m4a"),
            "reference": ayah["text"],
        })
        print(f"  ✓ {stem}  {size // 1024} KB")

    if not entries:
        print("nothing downloaded", file=sys.stderr)
        return 1

    if not args.keep_mp3:
        print("\n▸ Transcoding to 16 kHz mono AAC (what phones upload)")
        if not transcode_all(clip_dir):
            print("transcode failed — rerun with --keep-mp3 to bench the mp3s as-is",
                  file=sys.stderr)
            return 1

    with open(manifest_path, "w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    total = sum(
        os.path.getsize(os.path.join(clip_dir, n)) for n in os.listdir(clip_dir)
    )
    print(f"\n✓ {len(entries)} clips, {total // 1024} KB → {manifest_path}")
    if failures:
        print(f"  ({failures} failed to download)")
    print("\nThis is a floor, not the gate. Real learner recordings still decide")
    print("the swap — see ../README.md.")
    print("\nNext:")
    print("  make -C ../.. whisper-bench")
    return 0


if __name__ == "__main__":
    sys.exit(main())
