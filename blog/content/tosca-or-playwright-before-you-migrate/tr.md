---
title: 'Tosca mı Playwright mı: bir test paketini taşımadan önce sorulacak sorular'
description: 'Tricentis Tosca’dan Playwright’a ya da tersine geçişin projeye, testçilere ve geliştiricilere yarayıp yaramayacağına nasıl karar verilir.'
publishedAt: 2026-11-18
topic: testing
kind: essay
status: verified
evidence:
  confidence: 'Araç bilgileri için yüksek: Kasım 2026’da üreticilerin kendi sayfalarından kontrol ettim. “200+ technologies” rakamı üreticinin kendi ifadesi, doğrulamadım. Lab tek bir küçük uygulama, dolayısıyla yanıtlarım genel bir kural değil, bir gözlem.'
  basedOn:
    - 'Tosca ve Playwright için üretici ve proje sayfaları, 2026-11-17 ve 2026-11-18 tarihlerinde okundu'
    - 'Kendi labım: Pega Infinity 26.1 Constellation üzerinde kurgusal bir kişisel kredi talebi uygulaması, Tosca 26.1.2 ile test edildi ve Playwright 1.65.0’a taşındı'
  recheckedAt: 2026-11-18
aiAssistance:
  mine:
    - 'Deneyim, lab, sorular ve yanıtlar'
  assisted:
    - 'Claude kendi taslağımı iki ayrı yazıya böldü ve ifadeleri sıkılaştırdı'
    - 'Claude iddiaları atıf yapılan sayfalarla karşılaştırdı ve üç ayrıntıyı düzeltti (Airbnb zamanlaması, Node.js 20 ifadesi, desteklenen diller)'
translation:
  from: 2026-11-18
  assistedByAi: true
---

Bir test paketini taşıma talebi çoğu zaman bir araç sorusu gibi duyulur: “Tosca’dan Playwright’a geçelim mi?” Tersi de olabilir: kod tabanlı paketine bakacak kimsesi kalmayan bir ekipten gelir. Araç nadiren ilk karara bağlanacak şeydir. Bir geçiş, kalitenin sahibini, ekibin ne ödediğini ve hangi becerilere işe alım yapılacağını değiştirir. Test edilen teknoloji tartışmayı baştan bitirebilir.

Aşağıda böyle bir ekibe sırasıyla soracağım soruları veriyorum. Araçlarla ilgili bilgileri Kasım 2026’da üreticilerin kendi sayfalarından kontrol ettim. Kendi deneyimim bir labdan geliyor: bir Pega Academy lab ortamında Pega Blueprint ile oluşturduğum kurgusal bir kişisel kredi talebi uygulaması (PLR). Uygulama Pega Infinity '26.1 Constellation üzerinde çalışıyor, Tosca 26.1.2 ile ([2026.1 LTS](https://docs.tricentis.com/tosca-2026.1/en-us/content/release_notes/key_features.htm) sürüm hattı) test edildi ve Playwright 1.65.0’a taşındı.

![Karar akışı: sorun paket tasarımıysa paketi yerinde düzeltin. Testleri geliştiriciler yazıyorsa kod tabanlı yaklaşım doğal evdir; kalacak iş testçileri yazıyorsa ya Tosca ya da bütçeli bir eğitim programı gerekir. Tarayıcı uygulamaları Playwright’a uyar, SAP GUI ve masaüstü Tosca’da kalır, karma ortamlarda çoğu zaman ikisi birden kullanılır.](decision-flow.webp)

## Hangi sorunu çözüyoruz?

“Tosca pahalı” ya da “geliştiriciler Tosca’yı sevmiyor” birer belirtidir. Bunların ardındaki somut sorunu sorarım:

- Geri bildirim çok yavaş: testler geceleri ayrı bir agent üzerinde çalışıyor ve geliştirici bir regresyonu bir gün sonra öğreniyor.
- Sahiplik bölünmüş: paketin bakımını testçiler yapıyor, geliştiriciler bozuyor ve kırmızı bir build’i kimse hızlıca düzeltmiyor.
- Lisans, onu kullanan kişi sayısından fazla koltuğu kapsıyor ya da ekibin ihtiyacından azını.
- Uygulama modern bir web ön yüzüne geçti ve paketlenmiş uygulama kapsamı artık kullanılmıyor.

Gerçek sorun paket tasarımıysa (tekrarlanan adımlar, tek bir ortama bağlı veri, iş kurallarının arayüz üzerinden kontrolü), yeni bir araç bunu çözmez. Geçiş bu tasarımı yeni araca kopyalar ve paketi yerinde düzeltmek daha ucuz olabilir. Geçiş, sorun yapısal olduğunda maliyetini çıkarır: testleri kim yazıyor, nerede çalışıyor, ekip neyi sürdürebilir.

## Testlerin ve kırmızı build’in sahibi kim?

Bence en çok ağırlık taşıyan soru bu ve üç parçası var: testleri kim yazıyor, üç yıl sonra kim bakımını yapıyor ve kırmızı bir build’i kim düzeltiyor.

Tricentis, Tosca’nın gücünü ürün sayfasında açıkça anlatıyor: “Codeless authoring removes the programming requirement”, böylece manuel testçiler, iş analistleri ve konu uzmanları mühendislerle birlikte otomasyon kurabiliyor ([Tricentis Tosca ürün sayfası](https://www.tricentis.com/products/automate-continuous-testing-tosca), 2026-11-17’de okundu). İş sürecini bilen kişiler geliştirici değilse ve asıl yazarlar olarak kalacaksa, bu gerçek bir avantajdır.
Playwright kod tabanlı bir framework. [Diller sayfası](https://playwright.dev/docs/languages) TypeScript, JavaScript, Python, Java ve .NET’i sayıyor. İyi kurulmuş bir Playwright framework’ü, Tosca’nın Module’leri (uygulamanın ekranlarının paylaşılan, yeniden kullanılabilir tanımları) yeniden kullanması gibi ekranları ve akışları yeniden kullanabilir, ama bu katmanı birinin tasarlaması gerekir. O olmadan kod tabanlı bir paket hızla kopyalanmış locator’lar biriktirir. Kod tabanlı yaklaşım okunabilir diff’ler, tip kontrolleri ve boş testleri yakalayan lint kuralları getirir; programcı olmayanlar için düşük giriş eşiğini ise ortadan kaldırır.

Testleri mümkünse uygulamanın deposunda tutun. Böylece geliştiriciler kırmızı bir testi kendi sorunları olarak görür ve onu bozan pull request içinde düzeltir. Testler yalnızca testçilerin açtığı ayrı bir araçta durduğunda, kırmızı bir test genellikle bir bilete dönüşür. Playwright komut satırından çalışır, bu yüzden bir pipeline’a sıradan bir iş olarak oturur ([Playwright dokümantasyonu](https://playwright.dev/docs/intro)).

Beceriler de aynı sorunun parçası. Ekibin işi yürütecek kişilerle dolduramadığı bir araç, özellikleri ne olursa olsun bir risktir. Playwright becerilerinin ön yüz geliştirmeyle örtüşmesini bekliyorum; kariyerini Tosca üzerine kurmuş bir test ekibi ise geçişte bu yatırımı kaybeder. O yüzden şunu sorun: sonraki yüz testi kim yazacak? Geliştiriciler yazacaksa ve bir test mühendisi inceleyecekse, kod tabanlı yaklaşım doğal evdir. İş testçileri yazacaksa, onları TypeScript’e geçirmek bir eğitim programıdır ve bütçe ister.

## Beş yılda maliyeti ne?

Yalnızca lisans fiyatına değil, toplam sahip olma maliyetine bakarım. Tosca için buna execution agent’lar, altyapıları ve workspace’in bakımını yapan uzmanlar dahildir. Tricentis web sitesinde herkese açık bir fiyat listesi bulamadım, bu yüzden forumlarda geçen rakamlar yerine kendi sözleşme rakamlarınızı kullanın.

Playwright’ın kendisi ücretsiz ve Apache-2.0 lisansıyla açık kaynak ([GitHub’daki microsoft/playwright](https://github.com/microsoft/playwright), 2026-11-17’de okundu). Bu, çalıştırmanın ücretsiz olduğu anlamına gelmez. Maliyet insanlara ve pipeline’lara kayar: framework katmanı, CI dakikaları ya da agent’lar, tarayıcı güncellemeleri ve sürümleri takip etmek. Örneğin Playwright 1.65 artık Node.js 20 üzerinde test etmiyor ([Playwright sürüm notları](https://playwright.dev/docs/release-notes), 2026-11-17’de okundu). Her sürümün notlarını birinin okuması gerekir.

Adil bir karşılaştırma, geçişin kendisini ve iki paketin yan yana çalıştığı dönemi de içerir.

## Hangi teknoloji test ediliyor?

Bu soru tartışmayı baştan bitirebilir.

- Pega Constellation dahil modern web ön yüzleri: Playwright güçlü bir uyum. PLR labımda Constellation arayüzü, alan etiketlerinden türetilen test id’leri ve her testin yeniden kullandığı paylaşılan bir Pega katmanıyla (oturum açma, case görünümü, tablolar) otomatize edildi.
- SAP GUI, masaüstü istemcileri ve birkaç sistemi kapsayan karma uçtan uca akışlar gibi paketlenmiş kurumsal uygulamalar: Tosca’nın tam da bunun için kurulduğu alan burası. Tricentis, Tosca’nın “200+ technologies” teknolojiyi yerleşik olarak kapsadığını belirtiyor ([ürün sayfası](https://www.tricentis.com/products/automate-continuous-testing-tosca)). Bildiğim kadarıyla Playwright tarayıcıları sürüyor, SAP GUI’yi ya da kalın istemciyi sürmüyor; bunu kendi sistemlerinizle kontrol edin.

Birçok ortam karma. O zaman dürüst yanıt çoğu zaman ikisi birden: geliştiricilerin sahip olduğu web kanalları için Playwright, iş testçilerinin sahip olduğu paketlenmiş uygulama süreçleri için Tosca.

## Ne zaman taşımamalıyız?

Geçiş yanlış seçimdir ya da paketin bir kısmı Tosca’da kalmalıdır, eğer:

- testler SAP GUI, masaüstü ya da tarayıcı dışı başka bir teknolojiyi kapsıyorsa;
- asıl yazarlar kalacak iş testçileriyse ve TypeScript’in bakımını kimse yapmayacaksa;
- paket kararlıysa, yeterince hızlıysa ve beş yılda alternatiften ucuzsa;
- lisans yıllarca taahhüt edilmişse ve ekip bitmeden bir şey kazanmıyorsa;
- taşınma nedenleri zayıfsa, örneğin mevcut araca duyulan genel bir hoşnutsuzluk gibi.

Tersi yöndeki geçiş, yani koddan Tosca’ya, aynadaki durumda anlamlıdır: geliştiricilerin geride bıraktığı kod tabanlı bir paket, onu şimdi sahiplenmesi gereken iş testçileri ve kapsama giren paketlenmiş uygulamalar.

## Kısa bir karar kontrol listesi

- [ ] Sorun yazılı ve yapısal (sahiplik, geri bildirim hızı, maliyet, beceriler), yalnızca paket tasarımı değil.
- [ ] Üç yıl sonra testleri kimin yazıp bakımını yapacağını biliyoruz ve onlar hedef araçta çalışabiliyor.
- [ ] Kırmızı bir build’i kimin düzelttiğini ve testlerin nerede duracağını biliyoruz.
- [ ] Test edilen teknoloji tarayıcı tabanlı ya da tarayıcı dışı kısım Tosca’da kalıyor.
- [ ] Paralel çalıştırma dahil, kendi sözleşme rakamlarımızdan beş yıllık bir maliyet karşılaştırmamız var.

Bu kutuların çoğu boş kalıyorsa, elinizdeki paketi iyileştirmek muhtemelen daha iyi yatırımdır. Yanıt taşımaksa, sıradaki soru taşınan her testin eskisinin kontrol ettiğini hâlâ kontrol ettiğinin nasıl gösterileceği. [İkinci yazının](/tr/blog/prove-a-migrated-test-is-as-strong) konusu bu.

## Kaynaklar

Başka bir yayın tarihi verilmediyse hepsi 2026-11-17’de okundu.

- Playwright dilleri (2026-11-18’de okundu): https://playwright.dev/docs/languages
- Playwright sürüm notları (sürüm 1.65, Node.js desteği): https://playwright.dev/docs/release-notes
- Playwright kurulumu ve sistem gereksinimleri: https://playwright.dev/docs/intro
- microsoft/playwright deposu (Apache-2.0 lisansı): https://github.com/microsoft/playwright
- Tricentis Tosca ürün sayfası (kodsuz yazım, teknoloji kapsamı): https://www.tricentis.com/products/automate-continuous-testing-tosca
- Tosca 2026.1 LTS temel özellikleri (sürüm hattı): https://docs.tricentis.com/tosca-2026.1/en-us/content/release_notes/key_features.htm
