/**
 * Every word the blog's pages and feed show, in each language it publishes.
 * Templates take the text from here and never spell it out themselves, so a
 * translation is one place to look and tests/blog/strings.test.ts can check
 * that no language is missing a key.
 *
 * "Insights" stays the name in every language: it is the brand, like the
 * mark. Post content (titles, evidence, corrections) comes from the posts.
 */

/** Publishing languages, English first: it is the x-default and every post has it. */
export const BLOG_LANGUAGES = Object.freeze(['en', 'tr', 'nl']);

const en = {
  blogName: 'Insights',
  tagline: 'Notes on quality, and the rest of life.',
  description:
    'Notes on software quality, test automation and working with AI, by Emre Dursun, QA consultant in the Netherlands.',
  intro:
    'I am a QA consultant in the Netherlands, working on Pega, Tricentis Tosca and Playwright test automation. Here I write about what I see in practice: in projects, with AI, and in between.',
  latest: 'Latest',
  kindLabels: {
    essay: 'Essay',
    note: 'Short note',
  },
  topicsNav: 'Browse by topic',
  postOne: 'post',
  postMany: 'posts',
  browseAll: 'Browse all posts',
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
  closingKicker: 'Working on test strategy for a Pega, Tosca or Playwright project?',
  closingTitle: 'Let’s compare notes.',
  closingLink: 'Say hello',
  footerLine: 'Written by a person, checked twice.',
  allPosts: 'All posts',
  feed: 'Feed',
  updated: 'updated',
  aboutAuthor: 'About the author',
  writtenBy: 'Written by Emre Dursun',
  authorBio:
    'QA consultant for Pega, Tricentis Tosca and Playwright in the Netherlands. I write here to think more clearly about my work.',
  moreAboutMe: 'More about me',
  keepReading: 'Keep reading',
  videoPlay: 'Play video',
  videoNote: 'Playing it loads the video from Vimeo, which may set cookies.',
  videoCredit: 'Video:',
  videoWatch: 'Watch on Vimeo',
  evidenceTitle: 'Sources',
  aiDisclosure:
    'I used AI tools for research, fact-checking and editing, and reviewed the content before publishing.',
  reportMistake: 'Found a mistake?',
  reportLink: 'Report it.',
  correctionsLog: 'Corrections',
  toc: 'On this page',
  tableLabel: 'Table',
  nowTitle: 'Now',
  nowIntro: 'What I am focused on at the moment.',
  nowUpdated: 'Last updated',
  nowMore: 'What I’m doing now',
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
  blogName: 'Insights',
  tagline: 'Kalite üzerine notlar ve hayatın geri kalanı.',
  description:
    'Yazılım kalitesi, test otomasyonu ve yapay zekâyla çalışmak üzerine notlar. Yazan: Hollanda’da QA danışmanı Emre Dursun.',
  intro:
    'Hollanda’da Pega, Tricentis Tosca ve Playwright ile test otomasyonu üzerine çalışan bir QA danışmanıyım. Burada sahada gördüklerimi yazıyorum: projelerde, yapay zekâyla ve ikisinin arasında.',
  latest: 'En yeni',
  kindLabels: {
    essay: 'Deneme',
    note: 'Kısa not',
  },
  topicsNav: 'Konuya göre göz atın',
  postOne: 'yazı',
  postMany: 'yazı',
  browseAll: 'Tüm yazılara göz atın',
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
  closingKicker:
    'Bir Pega, Tosca ya da Playwright projesinde test stratejisi üzerinde mi çalışıyorsunuz?',
  closingTitle: 'Notlarımızı karşılaştıralım.',
  closingLink: 'Merhaba deyin',
  footerLine: 'Bir insan yazdı, iki kez kontrol edildi.',
  allPosts: 'Tüm yazılar',
  feed: 'Feed',
  updated: 'güncellendi',
  aboutAuthor: 'Yazar hakkında',
  writtenBy: 'Yazan: Emre Dursun',
  authorBio:
    'Hollanda’da Pega, Tricentis Tosca ve Playwright için QA danışmanıyım. İşim hakkında daha net düşünmek için burada yazıyorum.',
  moreAboutMe: 'Hakkımda daha fazlası',
  keepReading: 'Okumaya devam edin',
  videoPlay: 'Videoyu oynat',
  videoNote: 'Oynattığınızda video Vimeo üzerinden yüklenir ve Vimeo çerez bırakabilir.',
  videoCredit: 'Video:',
  videoWatch: 'Vimeo’da izleyin',
  evidenceTitle: 'Kaynaklar',
  aiDisclosure:
    'Araştırma, doğrulama, düzenleme ve çeviride yapay zekâ araçlarından yararlandım; içeriği yayımlamadan önce gözden geçirdim.',
  reportMistake: 'Bir hata mı buldunuz?',
  reportLink: 'Bildirin.',
  correctionsLog: 'Düzeltmeler',
  toc: 'Bu sayfada',
  tableLabel: 'Tablo',
  nowTitle: 'Şu sıralar',
  nowIntro: 'Şu sıralar odaklandığım işler.',
  nowUpdated: 'Son güncelleme',
  nowMore: 'Şu sıralar ne yapıyorum',
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
  blogName: 'Insights',
  tagline: 'Notities over kwaliteit, en de rest van het leven.',
  description:
    'Notities over softwarekwaliteit, testautomatisering en werken met AI, door Emre Dursun, QA-consultant in Nederland.',
  intro:
    'Ik ben QA-consultant in Nederland en werk met Pega, Tricentis Tosca en Playwright-testautomatisering. Hier schrijf ik over wat ik in de praktijk zie: in projecten, met AI en alles daartussen.',
  latest: 'Nieuwste',
  kindLabels: {
    essay: 'Essay',
    note: 'Korte notitie',
  },
  topicsNav: 'Bladeren per onderwerp',
  postOne: 'stuk',
  postMany: 'stukken',
  browseAll: 'Alle stukken bekijken',
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
  closingKicker: 'Bezig met een teststrategie voor een Pega-, Tosca- of Playwright-project?',
  closingTitle: 'Laten we notities vergelijken.',
  closingLink: 'Zeg hallo',
  footerLine: 'Geschreven door een mens, twee keer gecontroleerd.',
  allPosts: 'Alle berichten',
  feed: 'Feed',
  updated: 'bijgewerkt',
  aboutAuthor: 'Over de auteur',
  writtenBy: 'Geschreven door Emre Dursun',
  authorBio:
    'QA-consultant voor Pega, Tricentis Tosca en Playwright in Nederland. Ik schrijf hier om helderder over mijn werk na te denken.',
  moreAboutMe: 'Meer over mij',
  keepReading: 'Lees verder',
  videoPlay: 'Video afspelen',
  videoNote: 'Bij afspelen wordt de video van Vimeo geladen, dat cookies kan plaatsen.',
  videoCredit: 'Video:',
  videoWatch: 'Bekijk op Vimeo',
  evidenceTitle: 'Bronnen',
  aiDisclosure:
    'Bij onderzoek, factchecking, redactie en vertaling heb ik AI-tools gebruikt; de inhoud heb ik voor publicatie nagelezen.',
  reportMistake: 'Een fout gevonden?',
  reportLink: 'Meld het.',
  correctionsLog: 'Correcties',
  toc: 'Op deze pagina',
  tableLabel: 'Tabel',
  nowTitle: 'Nu',
  nowIntro: 'Waar ik me op dit moment op richt.',
  nowUpdated: 'Laatst bijgewerkt',
  nowMore: 'Waar ik nu mee bezig ben',
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
