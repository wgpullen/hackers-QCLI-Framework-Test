#!/usr/bin/env bash

npm audit --json > audit.json 2>/dev/null
trap "rm audit.json" EXIT

mkdir -p vulnerable_modules

jq -r '.vulnerabilities | to_entries[] | select(.values.severity == "high" or .value.severity == "critical") | .value.name' audit.json | sort -u | while read pkg; do
  if [ -d "node_modules/$pkg" ]; then
   cp -r "node_modules/$pkg" "vulnerable_modules/$pkg"
  fi

done

