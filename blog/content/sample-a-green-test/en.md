---
title: 'Sample: what does a green test actually tell you?'
description: 'Placeholder post for the Phase 1 build spike. A passing run and a trustworthy result are different things.'
publishedAt: 2026-10-28
updatedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Placeholder: high for UI tests, untested for APIs'
  basedOn:
    - 'Placeholder: the real post will name its sources'
  recheckedAt: 2026-10-28
placeholder: true
aiAssistance:
  mine:
    - 'Placeholder: the real post will say what is mine'
  assisted:
    - 'Placeholder: and what AI helped with'
corrections:
  - date: 2026-10-29
    text: 'Placeholder correction, to show how the log looks.'
---

**This is a sample post.** It exists to test the blog build before launch, it is not indexed, and the final text will be written and checked by Emre.

Most test work ends in a colour. A pipeline turns green, a dashboard says everything passed, and someone asks whether we can release. The colour is the start of a question, not the answer.

## A pass is a negative statement

A passing test does not say that the feature works. It says that none of the assertions we wrote failed, on this run, with this data, in this environment.

> Trust in a result comes from the evidence behind it, not from its colour.

### What the colour hides

Everything we did not assert is still unknown. See the [projects](/projects), the [Playwright documentation](https://playwright.dev/docs/test-assertions) or [write to me](mailto:info.emredursun@gmail.com).

## Three questions before I trust it

1. **What did it actually check?** An outcome, or only that a step finished?
2. **With what data?** One happy path proves less than a few cases chosen to break things.
3. **Where did it run?** An environment unlike production can pass for the wrong reasons.

## The same check in five languages

```ts
await expect(page.getByRole('status')).toHaveText('Payment of €120.00 scheduled');
```

```js
const passed = results.filter((result) => result.status === 'passed').length;
```

```json
{ "status": "passed", "assertions": 0 }
```

```bash
npx playwright test --grep "payment"
```

```yaml
evidence:
  confidence: high
```

## What I do differently now

When I report a result, I report what it covers, and what it does not cover yet.
