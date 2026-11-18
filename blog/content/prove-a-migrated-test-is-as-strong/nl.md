---
title: 'Hoe bewijs je dat een gemigreerde test even sterk is als het origineel'
description: 'Een gemigreerde test die slaagt bewijst weinig. Zes bewijsniveaus, een classificatiestap vóór de conversie en wat een lab-migratie naar Playwright liet zien.'
publishedAt: 2026-11-18
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Hoog voor de labresultaten, die uit de laatste run van 2026-11-17 komen. Eén kleine labapplicatie, dus een waarneming en geen algemene regel.'
  basedOn:
    - 'Een eigen lab: een fictieve applicatie voor persoonlijke leningaanvragen op Pega Infinity 26.1 Constellation, getest met Tosca 26.1.2 en gemigreerd naar Playwright 1.65.0'
    - 'Mijn eerdere LinkedIn-post over dezelfde lab en de converterplugin die ik schreef'
    - 'Pagina’s van Playwright, Tosca, Google en Airbnb en artikelen van martinfowler.com (Vocke; Cartwright, Horn en Lewis), onderaan vermeld, gelezen op 2026-11-17'
  recheckedAt: 2026-11-18
aiAssistance:
  mine:
    - 'De ervaring, de lab, de converterplugin, de methode en de resultaten'
  assisted:
    - 'Claude splitste mijn eigen concept in twee aparte posts en maakte de formuleringen strakker'
    - 'Claude controleerde beweringen tegen de aangehaalde pagina’s en corrigeerde drie details (timing van Airbnb, formulering over Node.js 20, ondersteunde talen)'
translation:
  from: 2026-11-18
  assistedByAi: true
---

![Infographic: Tosca Commander naar een gegenereerde Playwright-bridge naar Playwright-native tests, bewijsniveaus L1 tot en met L6 en de cijfers 17 gemigreerde TestCases, 105 van de 105 mutaties van checks gevangen, 16 van de 17 met hetzelfde oordeel als Tosca.](proof-levels.webp)

Als een team heeft besloten een testsuite van Tricentis Tosca naar Playwright te verplaatsen, is het onderdeel waar ik het kritiekst naar kijk: weten dat elke geconverteerde test nog steeds vangt wat het origineel ving. De beslissing zelf, of je überhaupt moet migreren, staat in [een bijbehorende post](/nl/blog/tosca-or-playwright-before-you-migrate).

Mijn voorbeelden komen uit een lab die ik hiervoor heb gebouwd: een fictieve applicatie voor persoonlijke leningaanvragen (PLR) die ik in een Pega Academy-labomgeving met een Pega Blueprint heb gebouwd. De applicatie draait op Pega Infinity '26.1 Constellation, is getest met Tosca 26.1.2 (de [2026.1 LTS](https://docs.tricentis.com/tosca-2026.1/en-us/content/release_notes/key_features.htm)-releaselijn) en gemigreerd naar Playwright 1.65.0.

## Een slagende test bewijst weinig

Een gemigreerde test die slaagt bewijst weinig: een test die niets controleert, slaagt ook. Gegenereerde code heeft hetzelfde risico. De Playwright-documentatie zelf zegt dat gegenereerde tests “may include initial errors” kunnen bevatten, en dat de healer agent “a skipped test” kan teruggeven als die denkt dat de functionaliteit kapot is ([Playwright test agents](https://playwright.dev/docs/test-agents), gelezen op 2026-11-17). In een samenvattend overzicht kan een skip worden gelezen als een pass.

## Classificeer vóór je converteert

Ik zou een suite niet één op één migreren. Voordat iets wordt gegenereerd, classificeer ik elke TestCase (de eenheid van een test in Tosca): verplaatsen, in Tosca houden, uitfaseren (voorgesteld aan de testeigenaar) of uitsluiten (bijvoorbeeld sandbox- en template-TestCases).

Ik zoek ook naar wat ik levelschuld noem: bedrijfsregels die via de UI worden gecontroleerd en thuishoren in een API- of unittest. “Due to their high maintenance cost you should aim to reduce the number of end-to-end tests to a bare minimum,” schreef Ham Vocke in [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) (2018). Een migratie is een goed moment om die schuld af te lossen, omdat elke test toch al wordt aangeraakt.

Dekkingsbeslissingen volgen het risico. De flows met geld, data of regelgevend gewicht gaan eerst en krijgen het strengste bewijs.

## Converteer naar een bridge, ontwerp daarna opnieuw

Ik kon geen officiële converter van Tricentis Tosca naar Playwright vinden, dus schreef ik er zelf een als Claude Code-plugin. Hij leest Tosca Commander via de Tosca MCP Server in read-only modus en genereert een Playwright Test-project in TypeScript.

De gegenereerde code behoudt bewust de vorm van Tosca: één klasse per Module, één flow per TestStepBlock, één Playwright-project per Tosca-configuratie. Dat maakt hem een goede bridge en een slecht framework. Elke check blijft vergelijkbaar met het Tosca-origineel, zodat hij tegen het Tosca-oordeel bewezen kan worden. Daarna wordt elke test opnieuw ontworpen in een Playwright-native structuur en wordt de geconverteerde versie uitgefaseerd. Een migratie die bij de conversie stopt, is een lift and shift: nieuwe runtime, oud ontwerp.

## De methode in vijf stappen

1. Inventarisatie: lees de hele Tosca-workspace, niet een deel. De eigen subset-export van Tosca laat alles weg wat op het rootelement van het project (het bovenste knooppunt van het Tosca-project) is gedefinieerd, inclusief testconfiguratieparameters op projectniveau ([Tosca 2026.1-documentatie, subsets](https://docs.tricentis.com/tosca-2026.1/en-us/content/tosca_commander/import_export_subsets.htm)). Een converter die die mist, mist omgevingsdata.
2. Analyse: breng gebruikersflows in kaart, besluit per TestCase zoals hierboven, benoem de levelschuld en stem de doelarchitectuur met het team af voordat er code bestaat.
3. Eerst de gedeelde laag, in het Playwright-native herontwerp: schermen, flows, data en inloggen, daarna de tests. Anders krijgt elke test zijn eigen helpers. De gegenereerde bridge spiegelt Tosca; de gedeelde laag hoort bij het herontwerp.
4. Bewijs per test, op zes niveaus (volgende sectie). Een test telt pas als gemigreerd wanneer zijn bewijs is vastgelegd tegen de code waarop het draaide.
5. Parallelle run en uitfasering: draai beide suites op dezelfde builds, vergelijk de oordelen per test en fase Tosca-TestCases plak voor plak uit. Een cutover in één keer zou de vergelijking wegnemen die het bewijs mogelijk maakt.

## Zes niveaus van bewijs

| Niveau | Wat het bewijst |
|---|---|
| L1 | De test bouwt: types, lint, gelist door de runner |
| L2 | Elke check uit de Tosca-TestCase is aanwezig |
| L3 | Elke check wordt één keer gemuteerd en de test faalt op die check |
| L4 | De test is stabiel over herhaalde runs |
| L5 | Hetzelfde oordeel als Tosca op dezelfde build |
| L6 | Als beide falen, falen ze bij dezelfde stap |

L3 leent van mutation testing, dat Google op grote schaal in code review draait ([Petrovic en Ivankovic, State of Mutation Testing at Google](https://research.google/pubs/state-of-mutation-testing-at-google/)). L5 en L6 lenen van parallel draaien bij het vervangen van legacy, waarmee wordt gecontroleerd dat “key numbers match up” tussen oud en nieuw ([Cartwright, Horn en Lewis, Patterns of Legacy Displacement, 2022](https://martinfowler.com/articles/patterns-legacy-displacement/divert-the-flow.html)).

## Wat de lab liet zien

In de laatste run, op 2026-11-17, vielen 20 TestCases binnen de scope. Eén werd gedekt door de gedeelde inlog- en omgevingscheck, één was een templatedefinitie en één een sandbox-TestCase, dus 17 werden gemigreerd. De onderstaande cijfers gelden voor deze gemigreerde Playwright-tests, die elk precies dezelfde bedrijfsvereisten testen als hun Tosca-origineel. De run gebruikte twee doelarchitecturen, een gelaagde en een BDD-architectuur op playwright-bdd, en alle 105 mutanten van de checks werden in beide gedood. De cijfers verschillen van [mijn eerdere LinkedIn-post](https://www.linkedin.com/posts/emre-dursun-nl_tosca-playwright-testautomation-activity-7528389765512171525-Ajmi), omdat de laatste run de hieronder beschreven TestCase voor een ongeldig wachtwoord toevoegde. Die eerdere run had 16 TestCases en 104 mutanten.

Eén test liep één keer op een time-out in zijn herhaalde stabiliteitsruns; opnieuw herhaald slaagde hij drie van de drie keer. Die run blijft in zijn stabiliteitshistorie staan in plaats van te worden weggewuifd. L6 vraagt om een falen aan beide kanten. De eerdere run kon dat niet laten zien, omdat er in Tosca niets faalde, dus de laatste run controleerde L6 met een bewust geïnjecteerde fout.

16 van de 17 gemigreerde tests gaven hetzelfde oordeel als Tosca op dezelfde build. De 17e is de leerzame. De naam zegt dat hij een login met een ongeldig wachtwoord test. De check verwacht echter dat het inloggen wordt geaccepteerd. In Tosca voert de stap een fout wachtwoord in, Pega wijst het inloggen af en de TestCase faalt op zijn eigen check. De gemigreerde test logt in met het wachtwoord van het testaccount en slaagt. De twee oordelen verschillen en omdat check en naam elkaar tegenspreken, ging de case naar de testeigenaar.

Een migratie kan de bedoeling van een test omkeren zonder dat iemand het merkt. In de lab maakte de vergelijking per test dat zichtbaar.

De scope was één applicatie, één lab en alleen Chromium, zonder snelheidsvergelijking met Tosca.

## Automatisering en de lange staart

Automatisering helpt bij volume. Airbnb meldde dat het met een LLM-pipeline 75% van zijn doelbestanden voor tests in vier uur migreerde en 97% na vier dagen afstellen. De overige bestanden kostten met de hand ongeveer nog een week en de hele migratie kostte zes weken engineeringtijd tegenover een handmatige schatting van 1,5 jaar ([Airbnb Tech Blog, Accelerating Large-Scale Test Migration with LLMs](https://airbnb.tech/?p=366)). De les is de lange staart: plan menselijke tijd in voor de laatste procenten en tel een test niet als klaar omdat een tool hem heeft gemaakt.

## Bewijschecklist

- [ ] Elke TestCase heeft een besluit: verplaatsen, houden, uitfaseren (afgestemd met de eigenaar) of uitsluiten.
- [ ] De volledige workspace zit in de inventaris, inclusief parameters op rootniveau.
- [ ] Elke gemigreerde test heeft vastgelegd bewijs: bouwt, elke check aanwezig, gemuteerd en gedood, stabiel, hetzelfde oordeel als Tosca.
- [ ] Verschillen in oordeel gaan naar een benoemde testeigenaar.
- [ ] Tosca-TestCases worden plak voor plak uitgefaseerd, na pariteit.

## Bronnen

Allemaal gelezen op 2026-11-17, tenzij een publicatiedatum is genoemd.

- Playwright test agents (planner, generator, healer): https://playwright.dev/docs/test-agents
- Tosca 2026.1 LTS key features (releaselijn): https://docs.tricentis.com/tosca-2026.1/en-us/content/release_notes/key_features.htm
- Tosca 2026.1, import en export van subsets: https://docs.tricentis.com/tosca-2026.1/en-us/content/tosca_commander/import_export_subsets.htm
- Ham Vocke, The Practical Test Pyramid (2018-02-26): https://martinfowler.com/articles/practical-test-pyramid.html
- Ian Cartwright, Rob Horn, James Lewis, Patterns of Legacy Displacement: Divert the Flow (2022-01-20): https://martinfowler.com/articles/patterns-legacy-displacement/divert-the-flow.html
- Goran Petrovic, Marko Ivankovic, State of Mutation Testing at Google (ICSE SEIP 2018): https://research.google/pubs/state-of-mutation-testing-at-google/
- Airbnb Tech Blog, Accelerating Large-Scale Test Migration with LLMs: https://airbnb.tech/?p=366
- Mijn eerdere LinkedIn-post over de Tosca-naar-Playwright-lab (16 TestCases, 104 mutanten): https://www.linkedin.com/posts/emre-dursun-nl_tosca-playwright-testautomation-activity-7528389765512171525-Ajmi
