#!/bin/bash
# master.sh <premaster.wav> <out_base> <title>
set -e
IN="$1"; OUT="$2"; TITLE="$3"
CHAIN="volume=-1.0dB,alimiter=level_in=1:level_out=1:limit=0.87:attack=2:release=60:asc=1:level=disabled"
ffmpeg -v error -y -i "$IN" -af "$CHAIN" -c:a pcm_s24le "$OUT.wav"
ffmpeg -v error -y -i "$OUT.wav" -c:a libmp3lame -b:a 320k -metadata title="$TITLE" -metadata artist="かめりあ × Creo (mashup)" "$OUT.mp3"
ffmpeg -hide_banner -nostats -i "$OUT.mp3" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tr -s ' '
