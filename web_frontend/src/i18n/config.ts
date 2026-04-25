import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import teTranslations from './locales/te.json';

export const SUPPORTED_LANGS = ['en', 'hi', 'te', 'fr', 'de', 'it', 'fi', 'pt'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Map browser / stored codes (e.g. en-US) to en | hi | te */
export function normalizeLanguageCode(lng: string | null | undefined): SupportedLang {
  if (!lng) return 'en';
  const base = lng.split('-')[0].toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as SupportedLang) : 'en';
}

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  te: {
    translation: teTranslations,
  },
  // These languages will currently fall back to English until their locale JSON is added.
  fr: { translation: enTranslations },
  de: { translation: enTranslations },
  it: { translation: enTranslations },
  fi: { translation: enTranslations },
  pt: { translation: enTranslations },
};

type TranslationDict = Record<string, unknown>;

function flattenStrings(obj: TranslationDict, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else if (v && typeof v === "object" && !Array.isArray(v)) flattenStrings(v as TranslationDict, key, out);
  }
  return out;
}

function unflattenStrings(flat: Record<string, string>) {
  const root: any = {};
  for (const [k, v] of Object.entries(flat)) {
    const parts = k.split(".");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) cur[p] = v;
      else {
        cur[p] = cur[p] ?? {};
        cur = cur[p];
      }
    }
  }
  return root as TranslationDict;
}

async function ensureTranslatedUiBundle(lang: SupportedLang) {
  if (lang === "en" || lang === "hi" || lang === "te") return;
  const cacheKey = `ui_i18n_cache_${lang}`;
  try {
    const cached = typeof localStorage !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      const parsed = JSON.parse(cached) as TranslationDict;
      i18n.addResourceBundle(lang, "translation", parsed, true, true);
      return;
    }
  } catch {
    /* ignore cache errors */
  }

  // Translate English bundle via backend API (Neon). Markers help us map lines back to keys.
  const flat = flattenStrings(enTranslations as unknown as TranslationDict);
  const entries = Object.entries(flat);
  const translated: Record<string, string> = {};

  const { backendApi } = await import("@/lib/backendApi");
  const SEP = "\n<<<DW_SEP>>>\n";
  const batchSize = 30;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const marked = batch.map(([k, v]) => `[[[${k}]]]${v}`).join(SEP);
    const out = await backendApi.translateNote(marked, lang, "en");
    const parts = String(out).split(SEP);
    for (const part of parts) {
      const m = part.match(/^\[\[\[(.+?)\]\]\](.*)$/s);
      if (!m) continue;
      const key = m[1];
      const value = m[2].trim();
      if (key) translated[key] = value || flat[key] || "";
    }
  }

  const bundle = unflattenStrings(translated);
  i18n.addResourceBundle(lang, "translation", bundle, true, true);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(cacheKey, JSON.stringify(bundle));
  } catch {
    /* ignore */
  }
}

const initialLng = normalizeLanguageCode(
  typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null,
);

function applyDocumentLang(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = normalizeLanguageCode(lng);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

applyDocumentLang(i18n.language);

i18n.on('languageChanged', (lng) => {
  const code = normalizeLanguageCode(lng);
  applyDocumentLang(code);
  if (code !== lng) {
    void i18n.changeLanguage(code);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('language', code);
  }
  void ensureTranslatedUiBundle(code);
});

export default i18n;
