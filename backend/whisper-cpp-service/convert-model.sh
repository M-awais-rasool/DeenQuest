set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="${HERE}/.convert"
OUT_DIR="${HERE}/models"
OUT="${OUT_DIR}/quran-base-ggml.bin"

SOURCE_MODEL="tarteel-ai/whisper-base-ar-quran"
WHISPER_CPP_REF="${WHISPER_CPP_REF:-v1.7.4}"

PYTHON="${PYTHON:-python3}"

CHECKPOINT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --checkpoint) CHECKPOINT="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -f "${OUT}" ]]; then
  echo "Model already built: ${OUT}"
  echo "Delete it to rebuild."
  exit 0
fi

mkdir -p "${WORK}" "${OUT_DIR}"

echo "▸ Python environment"
"${PYTHON}" -m venv "${WORK}/venv"
"${WORK}/venv/bin/pip" install --upgrade pip >/dev/null
"${WORK}/venv/bin/pip" install \
  "numpy<2" \
  "torch>=2.2" \
  "transformers>=4.44" \
  "huggingface_hub>=0.24" \
  "openai-whisper>=20231117"

echo "▸ Sources"
[[ -d "${WORK}/whisper.cpp" ]] || git clone --depth 1 --branch "${WHISPER_CPP_REF}" \
  https://github.com/ggml-org/whisper.cpp "${WORK}/whisper.cpp"
[[ -d "${WORK}/openai-whisper" ]] || git clone --depth 1 \
  https://github.com/openai/whisper "${WORK}/openai-whisper"

if [[ -n "${CHECKPOINT}" ]]; then
  if [[ ! -f "${CHECKPOINT}/config.json" ]]; then
    echo "no config.json in ${CHECKPOINT} — that is not a checkpoint directory" >&2
    exit 1
  fi
  echo "▸ Using the checkpoint already on disk: ${CHECKPOINT}"
  rm -rf "${WORK}/hf-model"
  cp -R "${CHECKPOINT}" "${WORK}/hf-model"
else
echo "▸ Downloading ${SOURCE_MODEL}"
"${WORK}/venv/bin/python" - "$WORK" <<'PY'
import sys
from huggingface_hub import snapshot_download

work = sys.argv[1]
path = snapshot_download(
    "tarteel-ai/whisper-base-ar-quran",
    local_dir=f"{work}/hf-model",
    allow_patterns=[
        "*.json", "*.txt", "*.bin", "*.safetensors", "*.model",
    ],
)
print(f"downloaded to {path}")
PY
fi

echo "▸ Aligning the decoder context size"
"${WORK}/venv/bin/python" - "${WORK}/hf-model/config.json" <<'ALIGN'
import json, sys

path = sys.argv[1]
with open(path) as f:
    cfg = json.load(f)

positions = cfg.get("max_target_positions")
if positions and cfg.get("max_length") != positions:
    print(f"  max_length {cfg.get('max_length')} -> {positions} (max_target_positions)")
    cfg["max_length"] = positions
    with open(path, "w") as f:
        json.dump(cfg, f, indent=2)
else:
    print("  already consistent")
ALIGN

echo "▸ Converting to GGML"
mkdir -p "${WORK}/ggml-out"
"${WORK}/venv/bin/python" \
  "${WORK}/whisper.cpp/models/convert-h5-to-ggml.py" \
  "${WORK}/hf-model" \
  "${WORK}/openai-whisper" \
  "${WORK}/ggml-out"

produced="$(find "${WORK}/ggml-out" -name 'ggml*.bin' -print -quit)"
if [[ -z "${produced}" ]]; then
  echo "conversion produced no ggml file — look in ${WORK}/ggml-out" >&2
  exit 1
fi
mv "${produced}" "${OUT}"

echo
echo "✓ ${OUT}  ($(du -h "${OUT}" | cut -f1))"
echo
echo "Next: seed it into the whisper_models volume, then run the comparison:"
echo "  make whisper-bench"
