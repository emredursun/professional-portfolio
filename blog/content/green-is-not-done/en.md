---
title: 'Green is not done'
description: 'All 249 tests passed after an AI agent wrote the code. A quality check still said no, and it was right.'
publishedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'High that it happened this way: I was there. Low as a general claim: it is one workshop and one feature, not a study.'
  basedOn:
    - 'My own experience in a hands-on workshop with an internal AI-driven development tool at Sopra Steria (September 2026)'
    - 'Martin Fowler, ContractTest (martinfowler.com)'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'The experience, what I noticed and what I took from it'
  assisted:
    - 'Claude turned my notes into this text and shortened it on my instructions'
---

Every tester knows the moment. The pipeline turns green, someone says "done", and you feel a small question that nobody has asked yet.

In September I felt that question somewhere I did not expect it: inside an AI tool that would not let me move on.

## The workshop

At Sopra Steria we tried an internal AI-driven development tool in a hands-on workshop. The idea is simple to say: the AI does not write code freely, it works through fixed steps, and at each step a person checks the result and decides.

We worked in a small team with mixed roles and scoped one small feature together. On the day we only got as far as the specification. I was curious how it would hold up all the way to a commit, so I finished the rest at home.

## Green, and still not done

The AI wrote the code for the first task. I ran the tests myself: 249 tests, all green, just like before the change.

Most tools would stop there and report success. Honestly, so would many teams.

This one did not. It saw that the new code added a data contract, and that none of the 249 tests checked it. The suite was green because nothing in it was looking. Before I could continue, it asked for 11 new contract tests.

![Diagram: 249 existing tests, all green, reach the quality check. Asked which test checks the new data contract, the answer is none, so 11 contract tests are added before work continues.](green-gate.svg)

None of this is new to testers. A green suite only says that the checks we wrote did not fail, and [contract tests](https://martinfowler.com/bliki/ContractTest.html) exist for exactly this gap. What surprised me was seeing a tool hold that line at the moment when a person in a hurry would say "ship it".

## A smaller moment

One generated test reset the database to start clean. On my machine, that would have wiped the data I was working with. The tool blocked the commit until the test ran in a temporary setup instead.

Nothing clever, just a boring check in the right place. As a tester, those are the ones I value most.

## The part that stays human

It would be easy to say "the AI caught what people miss". That is not quite what I saw.

The most important moment of the day was not a check at all. The feature request had requirements that could not all be true at once, and the AI was ready to carry on anyway. We stopped it, made the choice ourselves, and wrote down who decided and why.

The tool could see that a contract had no tests. It could not decide which business rule should win. That still needs a person who actually reads what the AI produced.

## What I take from it

It was not always comfortable. Every step is mandatory, there is a lot to read, and at first it feels slow. But I would rather work slower with a clear trail than quickly with a green light I cannot explain.

So, three small habits:

- **Treat "all tests pass" as a question.** Which tests, checking what, about which change?
- **Put the boring checks in the path,** not on a checklist someone may skip.
- **Let the AI suggest and let people decide,** and write down who decided.

In my spare time I build something similar on a much smaller scale: [devran-ai/kit](https://github.com/devran-ai/kit), an open-source kit that adds quality gates to AI coding tools. Seeing the same ideas at company scale showed me how much further they can go.

I am still learning how to work with tools like this. But this was the first time an AI tool made me trust a green result a little less, and that felt like progress.
