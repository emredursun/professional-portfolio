---
title: 'Wiens naam staat bij het besluit?'
description: 'Een spoor van AI-ondersteund werk is pas nuttig als het noemt wie besliste, en als we weten met wiens rechten de agent werkte.'
publishedAt: 2026-10-29
topic: ai
kind: note
status: hypothesis
evidence:
  confidence: 'Gemiddeld: één workshop en gesprekken met collega’s die dagelijks met AI-agents werken.'
  basedOn:
    - 'Hands-on workshop met een interne AI-driven development tool, september 2026'
    - 'OWASP Top 10 for LLM Applications 2025, LLM06 Excessive Agency'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'De vragen en wat ze opriep'
  assisted:
    - 'Claude maakte van mijn aantekeningen deze tekst en stelde de OWASP-bron voor'
translation:
  from: 2026-10-29
  assistedByAi: true
---

![Twee mensen aan een tafel: de een tekent een document, de ander bekijkt de papieren.](signing.webp)

*Foto: [Gabrielle Henderson op Unsplash](https://unsplash.com/photos/woman-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-HJckKnwCXxQ)*

Na de workshop waarover ik schreef in [Groen is nog niet klaar](/nl/blog/green-is-not-done), bleven er twee vragen hangen.

## Wie besliste?

Als een team met een AI-tool werkt, bedient meestal één persoon de tool terwijl de anderen overleggen. Dan komt in het verslag al snel de naam van wie typte te staan, in plaats van wie de keuze maakte.

Dat klinkt klein, maar een spoor van besluiten is alleen nuttig als het de juiste persoon noemt. “Het team” is geen eigenaar, en wie toevallig typte ook niet.

## Met wiens rechten?

Collega’s die dagelijks met AI-agents werken, wezen op iets eenvoudigs: een agent werkt met jouw inloggegevens. Alles wat jij mag, mag hij ook. Regels in een projectbestand helpen, maar ze zijn geen sandbox.

![Een hand met een bos sleutels voor een open deur.](keys.webp)

*Foto: [Maria Ziegler op Unsplash](https://unsplash.com/photos/keys-on-hand-jJnZg7vBfMs)*

OWASP noemt dit [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/): meer rechten of vrijheid dan de taak nodig heeft. Het advies is niet nieuw: geef zo min mogelijk rechten, en houd een mens betrokken bij alles met echte impact.

## Wat ik nu vraag

Als ik hoor “we gebruiken AI, maar alles is herleidbaar”, wil ik twee dingen vragen:

1. Laat het verslag zien wie **besliste**, of alleen wie **typte**?
2. Wiens **rechten** gebruikte de agent?

Ik heb nog geen volledige antwoorden. Daarom is dit een notitie.
