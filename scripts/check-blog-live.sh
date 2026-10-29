#!/usr/bin/env bash
# Checks Field Notes on a live site: the deploy smoke test, the uptime check
# and the preview channel run it with their base URL.
#
#   scripts/check-blog-live.sh https://emredursun.nl
#
# Before launch there is no feed, so it reports that and passes: the checks
# switch themselves on when BLOG_LAUNCHED ships, with no workflow change.
set -euo pipefail

base="${1:?usage: check-blog-live.sh <base-url>}"
fetch() { curl -sS --max-time 30 --retry 3 --retry-all-errors "$@"; }
code() { fetch -o /dev/null -w '%{http_code}' "$base$1"; }

if [ "$(code /blog/feed.xml)" != "200" ]; then
  echo "blog: not launched yet (no /blog/feed.xml); nothing to check"
  exit 0
fi

for path in /blog /tr/blog /nl/blog; do
  [ "$(code "$path")" = "200" ] || { echo "::error::$path is not served"; exit 1; }
done

# The newest English post, as the index links it.
post="$(fetch "$base/blog" | grep -oE 'href="/blog/[a-z0-9]+(-[a-z0-9]+)*"' | grep -vE '/blog/(topic|now|feed)' | head -1 | cut -d'"' -f2)"
[ -n "$post" ] || { echo "::error::/blog links to no post"; exit 1; }
html="$(fetch "$base$post")"
grep -qF "<link rel=\"canonical\" href=\"https://emredursun.nl$post\">" <<<"$html" \
  || { echo "::error::$post is not served its own page"; exit 1; }
if grep -qF 'content="noindex' <<<"$html"; then
  echo "::error::$post is noindex after launch"
  exit 1
fi

for feed in /blog/feed.xml /tr/blog/feed.xml /nl/blog/feed.xml; do
  headers="$(fetch -I "$base$feed")"
  grep -qiE '^content-type: application/atom\+xml' <<<"$headers" \
    || { echo "::error::$feed is not served as Atom"; exit 1; }
  grep -qi '^x-content-type-options: nosniff' <<<"$headers" \
    || { echo "::error::$feed has no nosniff header"; exit 1; }
done

[ "$(code /blog/no-such-post-live-check)" = "404" ] || { echo "::error::an unknown post is not a 404"; exit 1; }
echo "blog: live checks passed ($post)"
