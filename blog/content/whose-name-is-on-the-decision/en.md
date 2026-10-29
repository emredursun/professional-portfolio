---
title: 'Whose name is on the decision?'
description: 'Traceability in AI-assisted delivery is only worth something if it records the right person, with the right rights.'
publishedAt: 2026-10-29
topic: ai
kind: note
status: hypothesis
evidence:
  confidence: 'Medium: based on one workshop and conversations with colleagues who use agentic AI daily; I have not tested it at scale.'
  basedOn:
    - 'My own run of the AI Backbone workshop at Sopra Steria Nieuwegein (8 September 2026)'
    - 'OWASP Top 10 for LLM Applications 2025, LLM06 Excessive Agency'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'The observations and the questions'
    - 'The final edit'
  assisted:
    - 'Claude drafted the text from my presentation notes and suggested the OWASP source'
# Remove both once this version is written: until then it cannot launch.
placeholder: true
draft: true
---

AI-assisted delivery platforms are getting good at recording things. In the workshop I wrote about in [Green is not done](/blog/green-is-not-done), every step from request to commit left a file behind, and you could walk the whole chain back months later.

Two questions came up that the chain alone does not answer.

## Who decided?

In a team session, one person usually drives the tool while the team discusses. The record then tends to name the person at the keyboard, not the person who made the call. An architecture decision taken by the architect can end up attributed to whoever happened to type it in.

That sounds like a detail. It is not. Traceability is only valuable if the name next to a decision is the name of the person who owns it. "The team" is not an owner, and neither is "the operator". If the record cannot tell those apart, it gives an audit a confident answer that is wrong, which is worse than no answer.

## With whose rights?

Colleagues who work with agentic AI every day added a second point. An agent acts with *your* credentials: whatever you are allowed to do, it can do too. Guardrails written as files in your project are useful, but they are not a sandbox, and a true sandbox for agents is not yet part of most setups.

The [OWASP Top 10 for LLM applications](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) calls this excessive agency: more functionality, permissions or autonomy than a task needs. Its advice is the old one: least privilege, authorisation checks in the systems the agent calls, and a human approval for actions with real impact.

## The question I now ask

When a team tells me "we use AI, but everything is traceable", I want to ask two things before I relax:

1. Does the record show who **decided**, or only who **typed**?
2. With whose **rights** did the agent act, and what could it have done that it did not?

I do not have a complete answer yet. That is why this is a note and not an essay.
