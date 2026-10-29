/**
 * Every word the blog's pages and feed show, in each language it publishes.
 * Templates take the text from here and never spell it out themselves, so a
 * translation is one place to look and tests/blog/strings.test.ts can check
 * that no language is missing a key.
 *
 * "Field Notes" stays the name in every language: it is the brand, like the
 * mark. Post content (titles, evidence, corrections) comes from the posts.
 */

/** Publishing languages, English first: it is the x-default and every post has it. */
export const BLOG_LANGUAGES = Object.freeze(['en', 'tr', 'nl']);

const en = {
  blogName: 'Field Notes',
  tagline: 'Notes on quality, and the rest of life.',
  description:
    'Notes on software quality, test automation and working with AI, by Emre Dursun, QA consultant in the Netherlands.',
  intro:
    'I test software for a living, in the Netherlands, in three languages. This is where I write down what I learn: at work, with AI, and in between.',
  bandLabel: 'What I write about',
  band: {
    honest: 'Testing, honestly',
    ai: 'Working with AI',
    tools: 'Pega and Tosca',
    life: 'Life in three languages',
  },
  readLatest: 'Read the latest',
  followFeed: 'Follow with a feed reader',
  essays: 'Essays',
  essaysIntro: 'Longer pieces, rewritten until they hold.',
  notes: 'Short notes',
  notesIntro: 'Smaller thoughts, still being tested.',
  minutesShort: 'min',
  minutesRead: 'min read',
  staleShort: 'Needs a re-run',
  skipLink: 'Skip to content',
  brandHome: 'Emre Dursun, portfolio home',
  siteNav: 'Site',
  navPortfolio: 'Portfolio',
  navContact: 'Contact',
  darkTheme: 'Dark theme',
  closingKicker: 'Working on test strategy for a Pega or Tosca project?',
  closingTitle: 'Let’s compare notes.',
  closingLink: 'Say hello',
  footerLine: 'Written by a person, checked twice.',
  allPosts: 'All posts',
  feed: 'Feed',
  updated: 'updated',
  aboutAuthor: 'About the author',
  writtenBy: 'Written by Emre Dursun',
  authorBio:
    'QA consultant for Pega and Tricentis Tosca in the Netherlands. I write here to think more clearly about my work.',
  moreAboutMe: 'More about me',
  keepReading: 'Keep reading',
  evidenceTitle: 'Evidence for this note',
  status: 'Status',
  confidence: 'Confidence',
  basedOn: 'Based on',
  rechecked: 'Re-checked',
  nextBy: 'next by',
  staleEvidence: 'Needs a re-run: this evidence is more than a year old.',
  aiTitle: 'How this was written',
  aiMine: 'Mine',
  aiAssisted: 'With AI’s help',
  aiNothing: 'Nothing.',
  aiChecked: 'I checked every claim myself before publishing.',
  aiPrompts: 'See the prompts I used',
  correctionsTitle: 'Found a mistake?',
  correctionsIntro: 'Report it the way you would in a sprint. Fixes are logged here.',
  reportBug: 'Report a bug',
  correctionsLog: 'Corrections',
  correctionsNone: 'None yet.',
  toc: 'On this page',
  topicEyebrow: 'Topic',
  topicDescriptions: {
    testing: 'Notes on testing software honestly: what a result proves, and what it does not.',
    ai: 'Notes on working with AI: where it helps, where it misleads, and how I check it.',
    life: 'Notes on everything around the work: three languages, one country, and learning.',
  },
  languageNav: 'Language',
  inEnglish: 'In English',
  englishNewer: 'The English version has changed since this translation.',
  readEnglish: 'Read the English version',
  aiTranslatedWithAi: 'Translated with AI’s help, then checked by me.',
  aiTranslatedByMe: 'Translated by me.',
  languageNames: {
    en: 'English',
    tr: 'Türkçe',
    nl: 'Nederlands',
  },
  statusLabels: {
    hypothesis: 'Hypothesis',
    testing: 'Testing',
    verified: 'Verified',
    revised: 'Revised',
  },
  topicLabels: {
    testing: 'Testing',
    ai: 'Working with AI',
    life: 'Life',
  },
};

/** @type {typeof en} */
const tr = {
  blogName: 'Field Notes',
  tagline: 'Kalite üzerine notlar ve hayatın geri kalanı.',
  description:
    'Yazılım kalitesi, test otomasyonu ve yapay zekâyla çalışmak üzerine notlar. Yazan: Hollanda’da QA danışmanı Emre Dursun.',
  intro:
    'Hollanda’da, üç dilde yazılım test ederek hayatımı kazanıyorum. Öğrendiklerimi burada yazıyorum: işte, yapay zekâyla ve ikisinin arasında.',
  bandLabel: 'Ne hakkında yazıyorum',
  band: {
    honest: 'Dürüstçe test',
    ai: 'Yapay zekâyla çalışmak',
    tools: 'Pega ve Tosca',
    life: 'Üç dilde hayat',
  },
  readLatest: 'En yenisini okuyun',
  followFeed: 'Bir feed okuyucuyla takip edin',
  essays: 'Denemeler',
  essaysIntro: 'Sağlam durana kadar yeniden yazılmış uzun yazılar.',
  notes: 'Kısa notlar',
  notesIntro: 'Hâlâ test edilen küçük düşünceler.',
  minutesShort: 'dk',
  minutesRead: 'dk okuma',
  staleShort: 'Yeniden çalıştırılmalı',
  skipLink: 'İçeriğe geç',
  brandHome: 'Emre Dursun, portfolyo ana sayfası',
  siteNav: 'Site',
  navPortfolio: 'Portfolyo',
  navContact: 'İletişim',
  darkTheme: 'Koyu tema',
  closingKicker: 'Bir Pega ya da Tosca projesinde test stratejisi üzerinde mi çalışıyorsunuz?',
  closingTitle: 'Notlarımızı karşılaştıralım.',
  closingLink: 'Merhaba deyin',
  footerLine: 'Bir insan yazdı, iki kez kontrol edildi.',
  allPosts: 'Tüm yazılar',
  feed: 'Feed',
  updated: 'güncellendi',
  aboutAuthor: 'Yazar hakkında',
  writtenBy: 'Yazan: Emre Dursun',
  authorBio:
    'Hollanda’da Pega ve Tricentis Tosca için QA danışmanıyım. İşim hakkında daha net düşünmek için burada yazıyorum.',
  moreAboutMe: 'Hakkımda daha fazlası',
  keepReading: 'Okumaya devam edin',
  evidenceTitle: 'Bu notun kanıtları',
  status: 'Durum',
  confidence: 'Güven',
  basedOn: 'Dayanak',
  rechecked: 'Yeniden kontrol',
  nextBy: 'sonraki kontrol',
  staleEvidence: 'Yeniden çalıştırılmalı: bu kanıt bir yıldan eski.',
  aiTitle: 'Bu yazı nasıl yazıldı',
  aiMine: 'Benim',
  aiAssisted: 'Yapay zekânın yardımıyla',
  aiNothing: 'Hiçbir şey.',
  aiChecked: 'Yayımlamadan önce her iddiayı kendim kontrol ettim.',
  aiPrompts: 'Kullandığım istemleri görün',
  correctionsTitle: 'Bir hata mı buldunuz?',
  correctionsIntro: 'Bir sprintte yapacağınız gibi bildirin. Düzeltmeler burada kayda geçer.',
  reportBug: 'Hata bildirin',
  correctionsLog: 'Düzeltmeler',
  correctionsNone: 'Henüz yok.',
  toc: 'Bu sayfada',
  topicEyebrow: 'Konu',
  topicDescriptions: {
    testing:
      'Yazılımı dürüstçe test etmek üzerine notlar: bir sonuç neyi kanıtlar, neyi kanıtlamaz.',
    ai: 'Yapay zekâyla çalışmak üzerine notlar: nerede yardım eder, nerede yanıltır, nasıl kontrol ederim.',
    life: 'İşin etrafındaki her şey üzerine notlar: üç dil, bir ülke ve öğrenmek.',
  },
  languageNav: 'Dil',
  inEnglish: 'İngilizce',
  englishNewer: 'İngilizce sürüm bu çeviriden sonra değişti.',
  readEnglish: 'İngilizce sürümü okuyun',
  aiTranslatedWithAi: 'Yapay zekânın yardımıyla çevrildi, ardından tarafımdan kontrol edildi.',
  aiTranslatedByMe: 'Kendim çevirdim.',
  languageNames: {
    en: 'English',
    tr: 'Türkçe',
    nl: 'Nederlands',
  },
  statusLabels: {
    hypothesis: 'Hipotez',
    testing: 'Test ediliyor',
    verified: 'Doğrulandı',
    revised: 'Revize edildi',
  },
  topicLabels: {
    testing: 'Test',
    ai: 'Yapay zekâyla çalışmak',
    life: 'Hayat',
  },
};

/** @type {typeof en} */
const nl = {
  blogName: 'Field Notes',
  tagline: 'Notities over kwaliteit, en de rest van het leven.',
  description:
    'Notities over softwarekwaliteit, testautomatisering en werken met AI, door Emre Dursun, QA-consultant in Nederland.',
  intro:
    'Ik test software voor mijn werk, in Nederland, in drie talen. Hier schrijf ik op wat ik leer: op het werk, met AI en alles daartussen.',
  bandLabel: 'Waar ik over schrijf',
  band: {
    honest: 'Eerlijk testen',
    ai: 'Werken met AI',
    tools: 'Pega en Tosca',
    life: 'Leven in drie talen',
  },
  readLatest: 'Lees de nieuwste',
  followFeed: 'Volg met een feedreader',
  essays: 'Essays',
  essaysIntro: 'Langere stukken, herschreven tot ze standhouden.',
  notes: 'Korte notities',
  notesIntro: 'Kleinere gedachten, nog in de test.',
  minutesShort: 'min',
  minutesRead: 'min lezen',
  staleShort: 'Moet opnieuw draaien',
  skipLink: 'Naar de inhoud',
  brandHome: 'Emre Dursun, portfolio-startpagina',
  siteNav: 'Site',
  navPortfolio: 'Portfolio',
  navContact: 'Contact',
  darkTheme: 'Donker thema',
  closingKicker: 'Bezig met een teststrategie voor een Pega- of Tosca-project?',
  closingTitle: 'Laten we notities vergelijken.',
  closingLink: 'Zeg hallo',
  footerLine: 'Geschreven door een mens, twee keer gecontroleerd.',
  allPosts: 'Alle berichten',
  feed: 'Feed',
  updated: 'bijgewerkt',
  aboutAuthor: 'Over de auteur',
  writtenBy: 'Geschreven door Emre Dursun',
  authorBio:
    'QA-consultant voor Pega en Tricentis Tosca in Nederland. Ik schrijf hier om helderder over mijn werk na te denken.',
  moreAboutMe: 'Meer over mij',
  keepReading: 'Lees verder',
  evidenceTitle: 'Bewijs voor deze notitie',
  status: 'Status',
  confidence: 'Zekerheid',
  basedOn: 'Gebaseerd op',
  rechecked: 'Opnieuw gecontroleerd',
  nextBy: 'volgende vóór',
  staleEvidence: 'Moet opnieuw draaien: dit bewijs is meer dan een jaar oud.',
  aiTitle: 'Hoe dit geschreven is',
  aiMine: 'Van mij',
  aiAssisted: 'Met hulp van AI',
  aiNothing: 'Niets.',
  aiChecked: 'Ik heb elke bewering zelf gecontroleerd voor publicatie.',
  aiPrompts: 'Bekijk de prompts die ik gebruikte',
  correctionsTitle: 'Een fout gevonden?',
  correctionsIntro:
    'Meld het zoals je dat in een sprint zou doen. Correcties worden hier bijgehouden.',
  reportBug: 'Meld een bug',
  correctionsLog: 'Correcties',
  correctionsNone: 'Nog geen.',
  toc: 'Op deze pagina',
  topicEyebrow: 'Onderwerp',
  topicDescriptions: {
    testing: 'Notities over eerlijk software testen: wat een resultaat bewijst, en wat niet.',
    ai: 'Notities over werken met AI: waar het helpt, waar het misleidt en hoe ik het controleer.',
    life: 'Notities over alles rond het werk: drie talen, één land en blijven leren.',
  },
  languageNav: 'Taal',
  inEnglish: 'In het Engels',
  englishNewer: 'De Engelse versie is na deze vertaling gewijzigd.',
  readEnglish: 'Lees de Engelse versie',
  aiTranslatedWithAi: 'Vertaald met hulp van AI en daarna door mij gecontroleerd.',
  aiTranslatedByMe: 'Door mij vertaald.',
  languageNames: {
    en: 'English',
    tr: 'Türkçe',
    nl: 'Nederlands',
  },
  statusLabels: {
    hypothesis: 'Hypothese',
    testing: 'In test',
    verified: 'Geverifieerd',
    revised: 'Herzien',
  },
  topicLabels: {
    testing: 'Testen',
    ai: 'Werken met AI',
    life: 'Leven',
  },
};

function deepFreeze(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') deepFreeze(child);
  });
  return Object.freeze(value);
}

const STRINGS = deepFreeze({ en, tr, nl });

/**
 * The text for one language. Throws for any other, so a typo in a language
 * code fails the build instead of rendering a page with missing words.
 * @param {string} lang
 * @returns {Readonly<typeof en>}
 */
export function strings(lang) {
  if (!BLOG_LANGUAGES.includes(lang)) throw new Error(`blog: no strings for language "${lang}"`);
  return STRINGS[lang];
}
