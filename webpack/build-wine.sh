#!/bin/bash

set -e

docker build -t wournal_builder_win --file=webpack/build-wine.dockerfile .

docker run --rm -ti \
       --env ELECTRON_CACHE="/root/.cache/electron" \
       --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
       -v ~/.cache/electron:/root/.cache/electron \
       -v ~/.cache/electron-builder:/root/.cache/electron-builder \
       -v ${PWD}:/project \
       wournal_builder_win \
       /project/webpack/build-wine-in-container.sh
