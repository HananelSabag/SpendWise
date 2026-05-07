/**
 * Product URL scraper — extracts og:image + og:title from product pages.
 * Uses only the <head> which is always server-rendered, even on React/Next sites.
 */

const cheerio = require('cheerio');

const TIMEOUT_MS = 8000;
const MAX_BYTES  = 256 * 1024; // read first 256 KB — head is always near the top

async function scrapeProductUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
  } catch {
    return { success: false, reason: 'invalid_url' };
  }

  // Block private/internal IPs (SSRF protection)
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
  ) {
    return { success: false, reason: 'blocked_host' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'he,en-US;q=0.9',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return { success: false, reason: 'fetch_error', status: res.status };

    // Stream only what we need — og tags are always in the first ~50 KB
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    let done = false;

    while (!done && received < MAX_BYTES) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) { chunks.push(value); received += value.length; }
      // Stop early once we've passed </head> — no need to parse the full body
      const partial = Buffer.concat(chunks).toString('utf8');
      if (partial.includes('</head>')) break;
    }
    reader.cancel().catch(() => {});

    const html = Buffer.concat(chunks).toString('utf8');
    const $ = cheerio.load(html, { xmlMode: false });

    const pick = (...selectors) => {
      for (const sel of selectors) {
        const val = $(sel).attr('content') || $(sel).text();
        if (val && val.trim()) return val.trim();
      }
      return null;
    };

    const image = pick(
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    );

    const title = pick(
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title',
    );

    // Validate image URL
    let imageUrl = null;
    if (image) {
      try {
        const imgUrl = new URL(image, rawUrl);
        if (['http:', 'https:'].includes(imgUrl.protocol)) imageUrl = imgUrl.href;
      } catch { /* ignore bad image urls */ }
    }

    if (!imageUrl && !title) return { success: false, reason: 'no_data' };

    return { success: true, image_url: imageUrl, title: title || null };

  } catch (err) {
    if (err.name === 'AbortError') return { success: false, reason: 'timeout' };
    return { success: false, reason: 'error', message: err.message };
  }
}

module.exports = { scrapeProductUrl };
