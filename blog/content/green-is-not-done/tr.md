---
title: 'Yeşil, bitti demek değil'
description: 'Kodu bir yapay zekâ agent’ı yazdı ve 249 testin hepsi geçti. Yine de bir kalite kontrolü “hayır” dedi ve haklıydı.'
publishedAt: 2026-10-29
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Yaşananlar için yüksek, oradaydım. Tek bir workshop ve tek bir feature: genel bir kural değil, bir gözlem.'
  basedOn:
    - 'Şirket içi bir AI-driven development aracıyla uygulamalı workshop, Sopra Steria, Eylül 2026'
    - 'Martin Fowler, ContractTest (martinfowler.com)'
  recheckedAt: 2026-10-29
aiAssistance:
  mine:
    - 'Deneyim, fark ettiklerim ve çıkardığım dersler'
  assisted:
    - 'Claude notlarımdan bu metni yazdı ve benim talimatımla kısalttı'
translation:
  from: 2026-10-29
  assistedByAi: true
---

![Akşam gökyüzünde yeşil yanan bir trafik lambası.](green-light.webp)

*Fotoğraf: [Tord Romundstad, Unsplash](https://unsplash.com/photos/a-traffic-light-on-a-pole-with-a-sky-background-JAT4Xx2UCEE)*

Her test uzmanı o anı bilir. Pipeline yeşile döner, biri “tamam” der ve içinizde henüz kimsenin sormadığı küçük bir soru belirir.

Eylül’de o soruyu hiç beklemediğim bir yerde hissettim: beni bir sonraki adıma geçirmeyen bir yapay zekâ aracının içinde.

## Workshop

Sopra Steria’da şirket içi bir AI-driven development aracını uygulamalı bir workshop’ta denedik. Fikri anlatması kolay: yapay zekâ kodu serbestçe yazmıyor, belirli adımlardan geçiyor ve her adımda bir insan sonucu kontrol edip karar veriyor.

![Yukarıdan görülen ortak bir masa: dizüstü bilgisayarlar, defterler ve çay bardakları.](workshop-table.webp)

*Fotoğraf: [Marvin Meyer, Unsplash](https://unsplash.com/photos/people-sitting-down-near-table-with-assorted-laptop-computers-SYTO3xs06fU)*

Farklı rollerden oluşan küçük bir ekiple tek bir küçük feature’ın kapsamını birlikte belirledik. O gün ancak spesifikasyona kadar gelebildik. Sürecin commit’e kadar nasıl dayanacağını merak ettiğim için geri kalanını evde tamamladım.

## Yeşil, ama bitmedi

İlk task’ın kodunu yapay zekâ yazdı. Testleri kendim çalıştırdım: 249 testin hepsi yeşildi, tıpkı değişiklikten önceki gibi.

![Yakından bir ekranda renkli sözdizimi vurgulu kod.](code-screen.webp)

*Fotoğraf: [Chris Ried, Unsplash](https://unsplash.com/photos/a-computer-screen-with-a-bunch-of-code-on-it-ieic5Tq8YMk)*

Çoğu araç burada durur ve başarı bildirir. Dürüst olmak gerekirse birçok ekip de öyle yapar.

Bu araç yapmadı. Yeni kodun bir veri sözleşmesi eklediğini ve 249 testin hiçbirinin bunu kontrol etmediğini fark etti. Test seti yeşildi, çünkü içinde o tarafa bakan hiçbir şey yoktu. Devam etmeden önce 11 yeni contract test istedi.

Bunların hiçbiri test uzmanları için yeni değil. Yeşil bir test seti, sadece yazdığımız kontrollerin başarısız olmadığını söyler; [contract testler](https://martinfowler.com/bliki/ContractTest.html) tam da bu boşluk için vardır. Beni şaşırtan, aceleci birinin “yayınla gitsin” diyeceği anda bir aracın bu çizgiyi koruduğunu görmekti.

## Daha küçük bir an

Üretilen testlerden biri temiz bir başlangıç için veritabanını sıfırlıyordu. Benim makinemde bu, üzerinde çalıştığım verileri silerdi. Araç, test geçici bir ortamda çalışana kadar commit’i engelledi.

Zekice bir şey değil, sadece doğru yere konmuş sıkıcı bir kontrol. Bir test uzmanı olarak en çok değer verdiklerim de bunlar.

## İnsana kalan kısım

“Yapay zekâ, insanların kaçırdığını yakaladı” demek kolay olurdu. Ama benim gördüğüm tam olarak bu değildi.

Günün en önemli anı bir kontrol değildi. Feature talebinde aynı anda doğru olamayacak gereksinimler vardı ve yapay zekâ yine de devam etmeye hazırdı. Onu durdurduk, seçimi kendimiz yaptık ve kimin, neden karar verdiğini yazdık.

Araç bir sözleşmenin testi olmadığını görebiliyordu. Hangi iş kuralının geçerli olacağına ise karar veremezdi. Bunun için hâlâ, yapay zekânın ürettiğini gerçekten okuyan bir insan gerekiyor.

## Bana kalanlar

Her zaman rahat değildi. Her adım zorunlu, okunacak çok şey var ve başta yavaş geliyor. Ama açıklayamadığım bir yeşil ışıkla hızlı çalışmaktansa, izi net olan bir süreçle yavaş çalışmayı tercih ederim.

Kendime üç küçük alışkanlık çıkardım:

- **“Bütün testler geçti”yi bir soru olarak ele al.** Hangi testler, neyi kontrol ediyor, hangi değişiklik için?
- **Sıkıcı kontrolleri sürecin içine koy,** birinin atlayabileceği bir kontrol listesine değil.
- **Yapay zekâ önersin, insanlar karar versin,** ve kimin karar verdiği yazılsın.

Boş zamanlarımda çok daha küçük ölçekte benzer bir şey geliştiriyorum: yapay zekâ kodlama araçlarına kalite kontrolleri ekleyen açık kaynak bir kit, [devran-ai/kit](https://github.com/devran-ai/kit). Aynı fikirleri şirket ölçeğinde görmek, bu fikirlerin ne kadar ileri gidebileceğini gösterdi.

İlk kez bir yapay zekâ aracı yeşil bir sonuca biraz daha az güvenmemi sağladı ve bu bana ilerleme gibi geldi.
