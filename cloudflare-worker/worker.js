/**
 * SpendWise Scraper Proxy — Cloudflare Worker
 *
 * Routes product page fetches through Cloudflare's edge network (AS13335),
 * bypassing IP allowlists that block datacenter IPs (GCP/AWS/Azure).
 * Free tier: 100,000 requests/day.
 *
 * Deploy: https://dash.cloudflare.com → Workers & Pages → Create Worker → paste this
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Block private/internal IPs (SSRF protection — mirrors server/utils/urlScraper.js)
function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h.startsWith('127.') ||
    h.startsWith('10.') ||
    h.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url');

    if (!target) {
      return new Response('Missing ?url= parameter', { status: 400 });
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return new Response('Only http/https allowed', { status: 400 });
    }

    if (isBlockedHost(parsed.hostname)) {
      return new Response('Blocked host', { status: 403 });
    }

    try {
      const upstream = await fetch(target, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8',
          'Cache-Control': 'no-cache',
        },
        // Follow redirects automatically
        redirect: 'follow',
      });

      const body = await upstream.arrayBuffer();

      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'X-Proxy-Status': String(upstream.status),
        },
      });
    } catch (err) {
      return new Response(`Fetch failed: ${err.message}`, { status: 502 });
    }
  },
};
