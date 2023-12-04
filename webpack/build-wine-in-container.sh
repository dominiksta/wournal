#!/bin/bash

set -e

npm run clean
npm run build
npm run package:wine:internal
