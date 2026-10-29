---
title: 'Voorbeeld: wat vertelt een groene test je eigenlijk?'
description: 'Voorbeeldbericht voor de testbuild. Een geslaagde run en een betrouwbaar resultaat zijn twee verschillende dingen.'
publishedAt: 2026-10-28
updatedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Voorbeeld: hoog voor UI-tests, niet getest voor API’s'
  basedOn:
    - 'Voorbeeld: het echte bericht noemt zijn bronnen'
  recheckedAt: 2026-10-28
aiAssistance:
  mine:
    - 'Voorbeeld: het echte bericht zegt wat van mij is'
  assisted:
    - 'Voorbeeld: en waar AI bij hielp'
corrections:
  - date: 2026-10-29
    text: 'Voorbeeldcorrectie, om te laten zien hoe het logboek eruitziet.'
translation:
  from: 2026-10-29
  assistedByAi: true
---

**Dit is een voorbeeldbericht.** Het bestaat om de blogbuild vóór de lancering te testen, het wordt niet geïndexeerd, en de definitieve tekst wordt door Emre geschreven en gecontroleerd.

Het meeste testwerk eindigt in een kleur. Een pipeline wordt groen, een dashboard zegt dat alles geslaagd is, en iemand vraagt of we kunnen releasen. De kleur is het begin van een vraag, niet het antwoord.

## Een geslaagde test is een negatieve uitspraak

Een geslaagde test zegt niet dat de functie werkt. Hij zegt dat geen van de controles die we schreven faalde, in deze run, met deze data, in deze omgeving.

> Vertrouwen in een resultaat komt van het bewijs erachter, niet van de kleur.

### Wat de kleur verbergt

Alles wat we niet controleerden, is nog steeds onbekend. Bekijk de [projecten](/nl/projects), de [Playwright-documentatie](https://playwright.dev/docs/test-assertions) of [schrijf me](mailto:info.emredursun@gmail.com).

## Drie vragen voordat ik het vertrouw

1. **Wat controleerde hij echt?** Een uitkomst, of alleen dat een stap klaar was?
2. **Met welke data?** Eén happy path bewijst minder dan een paar gevallen die gekozen zijn om iets te breken.
3. **Waar draaide hij?** Een omgeving die niet op productie lijkt, kan om de verkeerde redenen slagen.

## Dezelfde controle in vijf talen

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

## Wat ik nu anders doe

Als ik een resultaat rapporteer, rapporteer ik wat het dekt, en wat het nog niet dekt.
