---
title: 'Örnek: yeşil bir test size aslında ne söyler?'
description: 'Derleme denemesi için örnek yazı. Geçen bir koşu ile güvenilir bir sonuç aynı şey değildir.'
publishedAt: 2026-10-28
updatedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Örnek: UI testleri için yüksek, API’ler için test edilmedi'
  basedOn:
    - 'Örnek: gerçek yazı kaynaklarını belirtecek'
  recheckedAt: 2026-10-28
aiAssistance:
  mine:
    - 'Örnek: gerçek yazı neyin bana ait olduğunu söyleyecek'
  assisted:
    - 'Örnek: ve yapay zekânın neye yardım ettiğini'
corrections:
  - date: 2026-10-29
    text: 'Günlüğün nasıl göründüğünü göstermek için örnek düzeltme.'
translation:
  from: 2026-10-29
  assistedByAi: true
---

**Bu bir örnek yazıdır.** Blog derlemesini yayından önce test etmek için var, dizine eklenmez; son metni Emre yazıp kontrol edecek.

Test işlerinin çoğu bir renkle biter. Pipeline yeşile döner, pano her şeyin geçtiğini söyler ve biri yayına çıkıp çıkamayacağımızı sorar. Renk, sorunun başlangıcıdır; cevabı değil.

## Geçen bir test olumsuz bir ifadedir

Geçen bir test, özelliğin çalıştığını söylemez. Yazdığımız doğrulamaların hiçbirinin bu koşuda, bu veriyle, bu ortamda başarısız olmadığını söyler.

> Bir sonuca duyulan güven renginden değil, arkasındaki kanıttan gelir.

### Rengin gizledikleri

Doğrulamadığımız her şey hâlâ bilinmiyor. [Projelere](/tr/projects), [Playwright belgelerine](https://playwright.dev/docs/test-assertions) bakın ya da [bana yazın](mailto:info.emredursun@gmail.com).

## Güvenmeden önce üç soru

1. **Aslında neyi kontrol etti?** Bir sonucu mu, yoksa yalnızca bir adımın bittiğini mi?
2. **Hangi veriyle?** Tek bir mutlu yol, bir şeyleri kırmak için seçilmiş birkaç durumdan daha azını kanıtlar.
3. **Nerede koştu?** Canlıya benzemeyen bir ortam yanlış nedenlerle geçebilir.

## Aynı kontrol beş dilde

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

## Artık neyi farklı yapıyorum

Bir sonucu raporlarken neyi kapsadığını ve henüz neyi kapsamadığını da raporluyorum.
