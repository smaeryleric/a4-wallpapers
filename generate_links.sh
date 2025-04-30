#!/bin/bash

BASE_URL="https://github.com/smaeryleric/a4-wallpapers/blob/main"

find ./images -type f | while read -r filepath; do
  clean_path="${filepath#./}"
  encoded_path="${clean_path// /%20}"
  echo "$BASE_URL/$encoded_path?raw=true"
done
