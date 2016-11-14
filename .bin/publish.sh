#!/bin/bash

NODEVER="$(node -v)"
echo "$NODEVER" | grep -Eqv '^v[4-9]\.' && echo "Incorrect node version (${NODEVER}). Must be v4 or later." 1>&2 && exit 1

cd "$(dirname "$0")"
[ $? -ne 0 ] && echo "Failed to CD to script dir" 1>&2 && exit 1

SCRIPTDIR="$(pwd)"

git diff-index --quiet HEAD
[ $? -ne 0 ] && echo "Failed: There are uncommitted changes in the working tree and/or index" 1>&2 && exit 1

test -z "$(git ls-files --exclude-standard --others)"
[ $? -ne 0 ] && echo "Failed: One or more untracked files are present" 1>&2 && exit 1

echo
echo "NPM install..."
echo "========================"
npm install
[ $? -ne 0 ] && echo "Failed to npm install" 1>&2 && exit 1

echo
echo "Running tests..."
echo "========================"
npm test
[ $? -ne 0 ] && echo "Failed to run tests" 1>&2 && exit 1

echo
echo "Packing..."
echo "========================"
packfile="$(npm pack . | tail -n 1)"
[ $? -ne 0 ] && echo "Failed to NPM pack" 1>&2 && exit 1
[ -z "$packfile" ] && echo "Failed to get file path from NPM pack" 1>&2 && exit 1
[ ! -f "$packfile" ] && echo "Failed to get pack file name from NPM pack" 1>&2 && exit 1

echo
echo "Contents:"
echo "========================"
tar tzf "$packfile"

echo
echo "Publish using:"
echo npm publish "$SCRIPTDIR/$packfile"
