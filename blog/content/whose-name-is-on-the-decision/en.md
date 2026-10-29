---
title: 'Whose name is on the decision?'
description: 'A trail of AI-assisted work is only useful if it names the person who decided, and if we know whose rights the agent used.'
publishedAt: 2026-10-29
topic: ai
kind: note
status: hypothesis
evidence:
  confidence: 'Medium: one workshop and conversations with colleagues who use AI agents every day.'
  basedOn:
    - 'Hands-on workshop with an internal AI-driven development tool, September 2026'
    - 'OWASP Top 10 for LLM Applications 2025, LLM06 Excessive Agency'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'The questions and what prompted them'
  assisted:
    - 'Claude turned my notes into this text and suggested the OWASP source'
---

![Two people at a table, one signing a document while the other reviews the papers.](signing.webp)

*Photo: [Gabrielle Henderson on Unsplash](https://unsplash.com/photos/woman-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-HJckKnwCXxQ)*

After the workshop I wrote about in [Green is not done](/blog/green-is-not-done), two questions stayed with me.

## Who decided?

When a team works with an AI tool, usually one person drives it while the others discuss. It is then easy for the record to name the person at the keyboard instead of the person who made the call.

That sounds small, but a trail of decisions is only useful if it names the right person. "The team" is not an owner, and neither is whoever happened to type.

## With whose rights?

Colleagues who use AI agents every day pointed out something simple: an agent works with your credentials. Whatever you are allowed to do, it can do too. Rules in a project file help, but they are not a sandbox.

![A hand holding a bunch of keys in front of an open door.](keys.webp)

*Photo: [Maria Ziegler on Unsplash](https://unsplash.com/photos/keys-on-hand-jJnZg7vBfMs)*

OWASP calls this [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/): more rights or freedom than the task needs. The advice is not new: give the least rights you can, and keep a person in the loop for anything with real impact.

## What I ask now

When I hear "we use AI, but everything is traceable", I want to ask two things:

1. Does the record show who **decided**, or only who **typed**?
2. Whose **rights** did the agent use?

I do not have full answers yet. That is why this is a note.
