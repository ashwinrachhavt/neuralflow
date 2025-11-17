import type { IncomingHttpHeaders } from 'http';

export type SearchResult = { title: string; url: string };

function decodeUddg(url: string) {
  try {
    const u = new URL(url, 'https://duckduckgo.com');
    const redir = u.searchParams.get('uddg');
    return redir ? decodeURIComponent(redir) : url;
  } catch {
    return url;
  }
}

export async function duckDuckGoSearch(query: string, limit = 5, headers?: IncomingHttpHeaders): Promise<SearchResult[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}&kl=us-en`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DaoBot/1.0)'
    },
    cache: 'no-store',
  });
  const html = await res.text();
  // very lightweight parse: find-result links
  const results: SearchResult[] = [];
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && results.length < limit) {
    const href = decodeUddg(m[1]);
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    if (href && title) results.push({ title, url: href });
  }
  return results;
}
