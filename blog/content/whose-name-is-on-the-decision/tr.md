---
title: 'Kararın altında kimin adı var?'
description: 'Yapay zekâ destekli bir işin kaydı, ancak kararı vereni doğru gösteriyorsa ve agent’ın kimin yetkileriyle çalıştığını biliyorsak işe yarar.'
publishedAt: 2026-10-29
topic: ai
kind: note
status: hypothesis
evidence:
  confidence: 'Orta: tek bir workshop ve her gün yapay zekâ agent’larıyla çalışan meslektaşlarımla yaptığım sohbetler.'
  basedOn:
    - 'Şirket içi bir AI-driven development aracıyla uygulamalı workshop, Eylül 2026'
    - 'OWASP Top 10 for LLM Applications 2025, LLM06 Excessive Agency'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'Sorular ve onları doğuran deneyim'
  assisted:
    - 'Claude notlarımdan bu metni yazdı ve OWASP kaynağını önerdi'
translation:
  from: 2026-10-29
  assistedByAi: true
---

![Masada iki kişi: biri bir belgeyi imzalıyor, diğeri kâğıtları inceliyor.](signing.webp)

*Fotoğraf: [Gabrielle Henderson, Unsplash](https://unsplash.com/photos/woman-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-HJckKnwCXxQ)*

[Yeşil, bitti demek değil](/tr/blog/green-is-not-done) yazısında anlattığım workshop’tan sonra aklımda iki soru kaldı.

## Kim karar verdi?

Bir ekip yapay zekâ aracıyla çalışırken genelde aracı bir kişi kullanır, diğerleri tartışır. O zaman kayıtta kararı veren kişinin değil, klavyedeki kişinin adının geçmesi çok kolaydır.

Küçük bir ayrıntı gibi görünüyor, ama kararların izi ancak doğru kişiyi gösteriyorsa işe yarar. “Ekip” bir karar sahibi değildir; o sırada yazan kişi de değildir.

## Kimin yetkileriyle?

Her gün yapay zekâ agent’larıyla çalışan meslektaşlarım basit bir noktaya dikkat çekti: agent senin kimlik bilgilerinle çalışır. Senin yapabildiğin her şeyi o da yapabilir. Proje dosyasındaki kurallar işe yarar, ama bir sandbox değildir.

![Açık bir kapının önünde bir tutam anahtar tutan bir el.](keys.webp)

*Fotoğraf: [Maria Ziegler, Unsplash](https://unsplash.com/photos/keys-on-hand-jJnZg7vBfMs)*

OWASP buna [excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) diyor: bir agent’ın, işin gerektirdiğinden fazla yetkiye veya serbestliğe sahip olması. Tavsiyesi de yeni değil: verebildiğin en az yetkiyi ver ve gerçek etkisi olan her işte bir insanı sürecin içinde tut.

## Artık sorduklarım

“Yapay zekâ kullanıyoruz, ama her şey izlenebilir” dendiğinde iki şey sormak istiyorum:

1. Kayıt kimin **karar verdiğini** mi gösteriyor, yoksa sadece kimin **yazdığını** mı?
2. Agent kimin **yetkilerini** kullandı?

Henüz tam cevaplarım yok. Bu yüzden bu bir not.
