#!/bin/bash

BASE_URL="https://github.com/smaeryleric/a4-wallpapers/blob/main"

urlencode() {
  python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

find ./images -type f | while read -r filepath; do
  clean_path="${filepath#./}"
  encoded_path=$(urlencode "$clean_path")
  echo "$BASE_URL/$encoded_path?raw=true"
done
