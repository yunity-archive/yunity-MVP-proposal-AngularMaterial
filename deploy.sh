#!/bin/bash

set -e

HOST=yuca.yunity.org

mkdir public
cp -R api assets css directives js login panels partials templates index.html public/

echo "sending [public] to [$HOST]"

rsync -av --delete public/ deploy@$HOST:public-mvp-design/
