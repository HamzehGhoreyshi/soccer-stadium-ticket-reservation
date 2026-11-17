#!/bin/zsh
# Politely downloads the original Azadi Stadium photos listed in assets-src/photos/credits.json.
# Wikimedia rate-limits bursts, so: one file at a time, retry every 60 s on HTTP 429.
cd "$(dirname "$0")/../assets-src/photos" || exit 1
UA="StadiumBookingDemo/1.0 (personal non-commercial demo)"
python3 -I -c "import json;[print(k, v['url'].split('?')[0]) for k,v in json.load(open('credits.json')).items()]" | while read key url; do
  [[ -s "$key.jpg" ]] && { echo "skip $key"; continue; }
  for attempt in {1..40}; do
    code=$(curl -s -A "$UA" -o "$key.part" -w '%{http_code}' "$url")
    if [[ $code == 200 ]]; then mv "$key.part" "$key.jpg"; echo "ok $key $(du -k $key.jpg | cut -f1)KB"; sleep 8; break; fi
    echo "$key: HTTP $code, retry in 60s ($attempt)"; rm -f "$key.part"; sleep 60
  done
done
echo done
