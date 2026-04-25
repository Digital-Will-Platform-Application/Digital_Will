import express from 'express';

const router = express.Router();

/** Output languages for note will UI + UI translation (fallback provider). */
const TARGET_LANGS = new Set([
  // Existing app languages
  'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'ur',
  // UI switcher additions
  'fr', 'de', 'it', 'fi', 'pt',
  // Base
  'en',
]);

function chunkText(s, max = 380) {
  const parts = [];
  let rest = s.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut < Math.floor(max * 0.45)) cut = max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts.length ? parts : [''];
}

/**
 * POST /api/translate/note
 * Body: { text, targetLang, sourceLang? } — default source "en" (user types English, convert to selected language).
 */
router.post('/note', async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    let targetLang = String(req.body?.targetLang ?? '').trim().toLowerCase();
    let sourceLang = String(req.body?.sourceLang ?? 'en').trim().toLowerCase();

    if (!text) {
      return res.status(400).json({ success: false, message: 'No text to translate.' });
    }
    if (text.length > 12000) {
      return res.status(400).json({ success: false, message: 'Note is too long to translate in one request.' });
    }
    if (!TARGET_LANGS.has(targetLang)) {
      return res.status(400).json({ success: false, message: 'Unsupported target language.' });
    }
    if (!/^[a-z]{2}$/.test(sourceLang)) {
      return res.status(400).json({ success: false, message: 'Invalid source language.' });
    }
    if (sourceLang === targetLang) {
      return res.json({ success: true, translatedText: text });
    }

    const parts = chunkText(text);
    const out = [];

    for (const part of parts) {
      if (!part) continue;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(part)}&langpair=${sourceLang}|${targetLang}`;
      const r = await fetch(url);
      const data = await r.json();

      if (data.responseStatus !== 200) {
        console.error('MyMemory translate:', data.responseStatus, data.responseDetails);
        return res.status(502).json({
          success: false,
          message:
            data.responseDetails ||
            'Translation service is busy or unavailable. Try again in a moment, or write directly in your language.',
        });
      }

      out.push(data.responseData.translatedText);
      await new Promise((x) => setTimeout(x, 120));
    }

    return res.json({
      success: true,
      translatedText: out.join('\n\n'),
    });
  } catch (e) {
    console.error('translate/note:', e);
    return res.status(500).json({ success: false, message: 'Translation failed.' });
  }
});

export default router;
