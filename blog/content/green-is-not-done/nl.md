---
title: 'Groen is nog niet klaar'
description: 'Een AI-agent schreef de code en alle 249 tests slaagden. Toch zei een kwaliteitscontrole nee, en terecht.'
publishedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Hoog dat het zo is gegaan: ik was erbij. Laag als algemene bewering: het is één workshop en één feature, geen onderzoek.'
  basedOn:
    - 'Mijn eigen ervaring in een hands-on workshop met een interne AI-driven development tool bij Sopra Steria (september 2026)'
    - 'Martin Fowler, ContractTest (martinfowler.com)'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'De ervaring, wat mij opviel en wat ik eruit meeneem'
  assisted:
    - 'Claude maakte van mijn aantekeningen deze tekst en kortte die in op mijn aanwijzingen'
translation:
  from: 2026-10-29
  assistedByAi: true
# Remove both once this version is written: until then it cannot launch.
placeholder: true
draft: true
---

Elke tester kent het moment. De pipeline wordt groen, iemand zegt “klaar”, en je voelt een kleine vraag die nog niemand heeft gesteld.

In september voelde ik die vraag op een plek waar ik hem niet verwachtte: in een AI-tool die me niet verder liet gaan.

## De workshop

Bij Sopra Steria probeerden we in een hands-on workshop een interne AI-driven development tool uit. Het idee is eenvoudig uit te leggen: de AI schrijft niet vrij code, maar doorloopt vaste stappen, en bij elke stap controleert een mens het resultaat en beslist.

We werkten in een klein team met verschillende rollen en bakenden samen één kleine feature af. Op de dag zelf kwamen we tot de specificatie. Ik was benieuwd hoe het zich zou houden tot aan een commit, dus maakte ik de rest thuis af.

## Groen, en toch niet klaar

De AI schreef de code voor de eerste taak. Ik draaide de tests zelf: 249 tests, allemaal groen, net als voor de wijziging.

De meeste tools stoppen hier en melden succes. Eerlijk gezegd doen veel teams dat ook.

Deze niet. Hij zag dat de nieuwe code een datacontract toevoegde, en dat geen van de 249 tests dat controleerde. De testset was groen omdat niets erin keek. Voordat ik verder mocht, vroeg hij om 11 nieuwe contracttests.

![Diagram: 249 bestaande tests, allemaal groen, komen bij de kwaliteitscontrole. Op de vraag welke test het nieuwe datacontract controleert is het antwoord geen, dus komen er 11 contracttests bij voordat het werk verdergaat.](green-gate.svg)

Niets hiervan is nieuw voor testers. Een groene testset zegt alleen dat de controles die we schreven niet faalden, en [contracttests](https://martinfowler.com/bliki/ContractTest.html) bestaan precies voor dit gat. Wat mij verraste, was dat een tool die lijn vasthield op het moment dat iemand met haast zou zeggen: “zet het maar live”.

## Een kleiner moment

Eén gegenereerde test zette de database terug om schoon te beginnen. Op mijn machine zou dat de gegevens wissen waarmee ik werkte. De tool blokkeerde de commit tot de test in een tijdelijke omgeving draaide.

Niets slims, gewoon een saaie controle op de juiste plek. Als tester zijn dat de controles die ik het meest waardeer.

## Het deel dat menselijk blijft

Het zou makkelijk zijn om te zeggen: “de AI ving op wat mensen missen”. Maar dat is niet helemaal wat ik zag.

Het belangrijkste moment van de dag was helemaal geen controle. In het verzoek stonden eisen die niet tegelijk waar konden zijn, en de AI was klaar om toch door te gaan. We hielden hem tegen, maakten zelf de keuze en schreven op wie besliste en waarom.

De tool kon zien dat een contract geen tests had. Hij kon niet beslissen welke bedrijfsregel moest winnen. Daarvoor is nog steeds een mens nodig die echt leest wat de AI maakte.

## Wat ik eruit meeneem

Het was niet altijd prettig. Elke stap is verplicht, er is veel te lezen en in het begin voelt het traag. Maar ik werk liever langzamer met een duidelijk spoor dan snel met een groen licht dat ik niet kan uitleggen.

Dus, drie kleine gewoontes:

- **Zie “alle tests slagen” als een vraag.** Welke tests, die wat controleren, bij welke wijziging?
- **Zet de saaie controles in het proces,** niet op een checklist die iemand kan overslaan.
- **Laat de AI voorstellen en laat mensen beslissen,** en schrijf op wie besliste.

In mijn vrije tijd bouw ik iets vergelijkbaars op veel kleinere schaal: [devran-ai/kit](https://github.com/devran-ai/kit), een open-source kit die kwaliteitscontroles toevoegt aan AI-codeertools. Dezelfde ideeën op bedrijfsschaal zien, liet me zien hoeveel verder ze kunnen gaan.

Ik leer nog steeds hoe ik met zulke tools moet werken. Maar dit was de eerste keer dat een AI-tool me een groen resultaat iets minder deed vertrouwen, en dat voelde als vooruitgang.
