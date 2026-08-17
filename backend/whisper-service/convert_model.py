"""
Build the Quran-finetuned Whisper model this service runs on.

Why a conversion step instead of a model name
---------------------------------------------
faster-whisper runs CTranslate2 weights. The Quran-finetuned checkpoint is
published by Tarteel AI in Transformers format, so it has to be converted once
before the service can load it. Pre-converted copies do exist on the Hub, but
they are third-party re-uploads of someone else's conversion — this script goes
to the original weights instead, so what the service runs is traceable to the
people who trained it.

Why this model
--------------
tarteel-ai/whisper-base-ar-quran is fine-tuned on Quranic recitation and reports
5.75% WER on its own eval set, against a general-purpose model that has never
been shown a mushaf. It is also a *base* model — smaller and faster than the
`small` this service used to default to — so the accuracy comes with a latency
win rather than a cost.

Run it in its own environment
-----------------------------
    python3 -m venv .venv-convert
    .venv-convert/bin/pip install -r requirements-convert.txt
    .venv-convert/bin/python convert_model.py

The pins in requirements-convert.txt are not the ones the service runs on, and
deliberately so — see that file. Output goes to models/quran-base-ct2/, which is
what main.py looks for. It is a build artifact; keep it out of version control.
"""

import os

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import argparse  # noqa: E402
import shutil  # noqa: E402
import sys  # noqa: E402
from pathlib import Path  # noqa: E402

SOURCE_MODEL = "tarteel-ai/whisper-base-ar-quran"
HERE = Path(__file__).parent
DEFAULT_OUTPUT = HERE / "models" / "quran-base-ct2"
# int8 matches the service's default WHISPER_COMPUTE and keeps the model small
# enough to sit in memory alongside the API.
QUANTIZATION = "int8"

# Files the CTranslate2 converter and the tokenizer read alongside the weights.
_STAGED_FILES = (
    "config.json", "generation_config.json", "preprocessor_config.json",
    "tokenizer_config.json", "special_tokens_map.json", "added_tokens.json",
    "vocab.json", "merges.txt", "normalizer.json",
)


def stage_as_safetensors(staging: Path) -> Path:
    """Materialise the checkpoint locally with safetensors weights.

    Tarteel published the model as a PyTorch pickle, and modern Transformers
    refuses to unpickle one unless torch is at least 2.6 (CVE-2025-32434) — a
    version with no macOS x86_64 build, so on that platform the two
    requirements cannot both be met. Reading the pickle once here under
    weights_only=True and rewriting it as safetensors settles it properly:
    every later load, the converter's included, goes through a format that
    cannot execute code at all.
    """
    from huggingface_hub import snapshot_download
    import torch
    from safetensors.torch import save_file

    if (staging / "model.safetensors").is_file():
        print(f"✓ staged checkpoint already at {staging}")
        return staging

    print(f"Downloading {SOURCE_MODEL}...")
    src = Path(snapshot_download(SOURCE_MODEL, allow_patterns=["*.json", "*.txt", "*.bin"]))

    staging.mkdir(parents=True, exist_ok=True)
    for name in _STAGED_FILES:
        if (src / name).is_file():
            shutil.copy2(src / name, staging / name)

    print("Rewriting weights as safetensors...")
    state = torch.load(src / "pytorch_model.bin", map_location="cpu", weights_only=True)
    # Whisper ties the decoder embedding to the output projection. safetensors
    # refuses to write tensors that share storage, so break the sharing.
    state = {k: v.clone().contiguous() for k, v in state.items()}
    save_file(state, str(staging / "model.safetensors"), metadata={"format": "pt"})
    print(f"✓ staged checkpoint at {staging}")
    return staging


def convert(source: Path, output: Path, force: bool) -> None:
    from ctranslate2.converters import TransformersConverter

    if output.exists() and not force:
        print(f"✓ {output} already exists — nothing to do (use --force to rebuild)")
        return

    print(f"Converting {source.name} → {output} ({QUANTIZATION})")
    TransformersConverter(str(source)).convert(
        str(output), quantization=QUANTIZATION, force=True
    )
    # The converter writes weights and vocabulary; the feature extractor config
    # has to be carried across so the service does not need the source repo.
    src_cfg = source / "preprocessor_config.json"
    if src_cfg.is_file():
        shutil.copy2(src_cfg, output / "preprocessor_config.json")
    print(f"✓ converted to {output}")


def write_tokenizer(source: Path, output: Path) -> None:
    """Save a fast tokenizer next to the weights.

    The Tarteel repo ships only the slow tokenizer's files. Without a
    tokenizer.json faster-whisper silently falls back to fetching OpenAI's
    tokenizer at load time, which both needs the network on every cold start
    and quietly swaps a component of the model. Materialising it here keeps the
    build self-contained.
    """
    from transformers import WhisperTokenizerFast

    WhisperTokenizerFast.from_pretrained(str(source)).save_pretrained(str(output))
    if not (output / "tokenizer.json").is_file():
        raise SystemExit("conversion produced no tokenizer.json")
    print(f"✓ tokenizer.json written to {output}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--force", action="store_true", help="rebuild even if it exists")
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    staging = stage_as_safetensors(args.output.parent / "hf-checkpoint")
    convert(staging, args.output, args.force)
    write_tokenizer(staging, args.output)

    print(
        "\nDone. Now start the service as usual:\n"
        "    make whisper-run\n"
        "Check it came up on this model:\n"
        "    curl localhost:8001/health"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
