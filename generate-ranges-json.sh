#!/bin/bash
# Régénère ranges.json à partir des fichiers PNG dans ranges/
# Usage: ./generate-ranges-json.sh

cd "$(dirname "$0")"
ls ranges/*.png | sed 's|ranges/||;s|\.png$||' | \
  python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin], ensure_ascii=False, indent=2))" \
  > ranges.json

echo "ranges.json généré avec $(python3 -c "import json; print(len(json.load(open('ranges.json'))))" ) ranges."
