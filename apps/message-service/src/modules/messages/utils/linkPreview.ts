import ogs from "open-graph-scraper";
import dns from "dns/promises";
import { URL } from "url";

const urlRegex = /(https?:\/\/[^\s]+)/g;

/** Link preview helpers for URL extraction and safe metadata fetching. */

export function extractFirstUrl(text: string): string | null {
  const match = text.match(urlRegex);

  return match ? match[0] : null;
}

/** Rejects local or private network targets before fetching preview metadata. */
async function isSafeUrl(targetUrl: string) {
  const parsed = new URL(targetUrl);

  if (!["http:", "https:"].includes(parsed.protocol)) return false;

  const { address } = await dns.lookup(parsed.hostname);

  // Block common private and loopback ranges to reduce SSRF risk.
  if (
    address.startsWith("10.") ||
    address.startsWith("192.168.") ||
    address.startsWith("172.") ||
    address === "127.0.0.1"
  ) {
    return false;
  }

  return true;
}

/** Fetches normalized Open Graph metadata for a URL when the target is safe. */
export async function fetchLinkPreview(originalUrl: string) {
  try {
    const safe = await isSafeUrl(originalUrl);
    if (!safe) return null;

    const { result } = await ogs({
      url: originalUrl,
      timeout: 5000,
    });

    if (!result.success) return null;

    const finalUrl = result.requestUrl || originalUrl;
    const hostname = new URL(finalUrl).hostname.replace("www.", "");

    const ogImage = result.ogImage?.[0];

    const width = ogImage?.width ? Number(ogImage.width) : 0;
    const height = ogImage?.height ? Number(ogImage.height) : 0;

    const isLargeImage = width >= 300 && height >= 200;

    return {
      url: finalUrl,
      title: result.ogTitle || result.twitterTitle || hostname,
      description:
        result.ogDescription || result.twitterDescription || undefined,
      image:
        ogImage?.url ||
        result.twitterImage?.[0]?.url ||
        result.favicon ||
        undefined,
      siteName: result.ogSiteName || hostname,
      isLargeImage,
    };
  } catch {
    return null;
  }
}
