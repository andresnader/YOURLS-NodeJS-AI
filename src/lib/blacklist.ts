// Simple domain blacklist
// In a real scenario, this would check against a larger database or API (e.g. Google Safe Browsing)

const BLACKLISTED_DOMAINS = [
  'bit.ly', // Prevent recursive shortening if desired
  'tinyurl.com',
  't.co',
  'malicious-site.com',
  'phishing-link.net',
  'temp-mail.org'
];

export function isBlacklisted(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return BLACKLISTED_DOMAINS.some(b => domain === b || domain.endsWith('.' + b));
  } catch {
    return true; // Invalid URLs are treats as "blacklisted" for safety
  }
}
