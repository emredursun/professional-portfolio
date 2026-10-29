#!/usr/bin/env bash
# Checks Field Notes on a live site: the deploy smoke test, the uptime check
# and the preview channel run it with their base URL.
#
#   scripts/check-blog-live.sh https://emredursun.nl
#
# Whether the blog is launched comes from this checkout's
# scripts/blog/config.js (BLOG_LAUNCHED), never from the site: a launched
# blog whose feed went missing must fail, not pass as "not launched".
# The pages to check come from the site's own sitemap.xml, so the check
# follows whatever languages and topics the content has.
set -euo pipefail

base="${1:?usage: check-blog-live.sh <base-url>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
fetch() { curl -sS --max-time 15 --retry 2 --retry-all-errors "$@"; }
code() { fetch -o /dev/null -w '%{http_code}' "$base$1" || true; }
fail() { echo "::error::$1"; exit 1; }

if ! grep -qE '^export const BLOG_LAUNCHED = true;' "$root/scripts/blog/config.js"; then
  echo "blog: not launched in this checkout (BLOG_LAUNCHED is false); nothing to check"
  exit 0
fi

# Every blog URL the sitemap lists, as paths (/blog, /tr/blog/<slug>, ...).
sitemap="$(fetch "$base/sitemap.xml" || true)"
paths="$(grep -oE '<loc>https://emredursun\.nl(/(tr|nl))?/blog[^<]*</loc>' <<<"$sitemap" \
  | sed -E 's#</?loc>##g; s#https://emredursun\.nl##' || true)"
[ -n "$paths" ] || fail "sitemap.xml lists no blog pages after launch"

indexes="$(grep -E '^(/(tr|nl))?/blog$' <<<"$paths" || true)"
[ -n "$indexes" ] || fail "sitemap.xml lists no blog index"
while read -r path; do
  [ "$(code "$path")" = "200" ] || fail "$path is not served"
done <<<"$paths"

# One post: served its own page, and indexable.
post="$(grep -vE '/blog(/(topic|now)(/|$)|$)' <<<"$paths" | head -1 || true)"
[ -n "$post" ] || fail "sitemap.xml lists no blog post"
html="$(fetch "$base$post" || true)"
grep -qF "<link rel=\"canonical\" href=\"https://emredursun.nl$post\">" <<<"$html" \
  || fail "$post is not served its own page"
if grep -qF 'content="noindex' <<<"$html"; then fail "$post is noindex after launch"; fi

# Each language's feed, as Atom with nosniff.
while read -r index; do
  headers="$(fetch -I "$base$index/feed.xml" || true)"
  grep -qE '^HTTP/[0-9.]+ 200' <<<"$headers" || fail "$index/feed.xml is not served"
  grep -qiE '^content-type: application/atom\+xml' <<<"$headers" \
    || fail "$index/feed.xml is not served as Atom"
  grep -qi '^x-content-type-options: nosniff' <<<"$headers" \
    || fail "$index/feed.xml has no nosniff header"
done <<<"$indexes"

[ "$(code /blog/no-such-post-live-check)" = "404" ] || fail "an unknown post is not a 404"
echo "blog: live checks passed ($(wc -l <<<"$paths") pages, $(wc -l <<<"$indexes") feeds)"
