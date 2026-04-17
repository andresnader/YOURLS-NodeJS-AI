import { parse } from 'node-html-parser';

export async function fetchMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YOURLS-Node-Bot/1.0',
      },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) return { title: null, favicon: null };

    const html = await response.text();
    const root = parse(html);

    // Get Title
    const title = root.querySelector('title')?.text || 
                 root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                 null;

    // Get Favicon
    let favicon = root.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                  root.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
                  root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                  null;

    if (favicon && !favicon.startsWith('http')) {
      const urlObj = new URL(url);
      favicon = `${urlObj.origin}${favicon.startsWith('/') ? '' : '/'}${favicon}`;
    }

    return { 
      title: title?.trim() || null, 
      favicon: favicon 
    };
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return { title: null, favicon: null };
  }
}
