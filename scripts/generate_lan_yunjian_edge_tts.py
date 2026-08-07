#!/usr/bin/env python3
"""Generate 80%-speed Yunjian narration for the 懒 decomposition video."""

from __future__ import annotations

import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts


PROJECT = Path(__file__).resolve().parents[1]
PUBLIC_AUDIO = PROJECT / "public" / "audio-lan-yunjian"
SRC = PROJECT / "src"
VOICE = "zh-CN-YunjianNeural"
RATE = "-20%"
TEXT = "懒，是心里住进了一个“赖”。凡事都想等一等、靠一靠，时间久了，行动也就慢了下来。"
CAPTION_LINES = [
    ("懒，是心里住进了一个“赖”", ["懒", "是", "心里", "住", "进", "了", "一个", "赖"]),
    ("凡事都想等一等、靠一靠", ["凡事", "都", "想", "等", "一等", "靠", "一", "靠"]),
    ("时间久了", ["时间", "久", "了"]),
    ("行动也就慢了下来", ["行动", "也", "就", "慢", "了", "下来"]),
]


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


async def main() -> None:
    PUBLIC_AUDIO.mkdir(parents=True, exist_ok=True)
    mp3_path = PUBLIC_AUDIO / "narration.mp3"
    boundaries_path = PUBLIC_AUDIO / "word-boundaries.jsonl"

    # Generate the slower delivery directly so the original pitch is preserved.
    await edge_tts.Communicate(
        TEXT,
        VOICE,
        rate=RATE,
        boundary="WordBoundary",
    ).save(str(mp3_path), str(boundaries_path))

    wav_path = PUBLIC_AUDIO / "narration.wav"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(mp3_path),
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(wav_path),
        ],
        check=True,
    )

    duration = probe_duration(wav_path)
    boundaries = [
        json.loads(line)
        for line in boundaries_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    expected_words = [word for _, words in CAPTION_LINES for word in words]
    actual_words = [boundary["text"] for boundary in boundaries]
    if actual_words != expected_words:
        raise RuntimeError(
            "Edge TTS word boundaries changed; update CAPTION_LINES before rendering. "
            f"Expected {expected_words}, got {actual_words}."
        )

    starts_ms: list[int] = []
    word_cursor = 0
    for _, words in CAPTION_LINES:
        starts_ms.append(
            0 if word_cursor == 0 else round(boundaries[word_cursor]["offset"] / 10_000)
        )
        word_cursor += len(words)

    audio_end_ms = round(duration * 1000)
    captions = []
    for index, (line_text, _) in enumerate(CAPTION_LINES):
        captions.append(
            {
                "text": line_text,
                "startMs": starts_ms[index],
                "endMs": starts_ms[index + 1]
                if index + 1 < len(starts_ms)
                else audio_end_ms,
                "timestampMs": None,
                "confidence": None,
            }
        )

    manifest = {
        "backend": "edge-tts",
        "voice": VOICE,
        "rate": RATE,
        "pitch": "default",
        "volume": "default",
        "audioFile": "audio-lan-yunjian/narration.wav",
        "audioDuration": duration,
        "videoDuration": duration,
        "segments": [
            {
                "index": index,
                "text": caption["text"],
                "duration": (caption["endMs"] - caption["startMs"]) / 1000,
                "startMs": caption["startMs"],
                "endMs": caption["endMs"],
            }
            for index, caption in enumerate(captions)
        ],
    }

    (SRC / "generated-lan-yunjian-captions.json").write_text(
        json.dumps(captions, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (SRC / "generated-lan-yunjian-voiceover.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_AUDIO / "captions.json").write_text(
        json.dumps(captions, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (PUBLIC_AUDIO / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
