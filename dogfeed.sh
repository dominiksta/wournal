#!/bin/bash

set -e

npm run package:wine

cp -rfv ./dist/release/win-unpacked/ /mnt/c/Users/dominik/AppData/Local/wournal/
