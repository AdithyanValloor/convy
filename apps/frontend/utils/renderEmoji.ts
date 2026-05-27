import twemoji from "twemoji";

/**
 * @param html  - raw text or HTML string containing emoji
 * @param size  - pixel size for the rendered SVG img tags (default: 20)
 */
export function renderTwemoji(html: string, size: number = 20): string {
  return twemoji.parse(html, {
    folder: "svg",
    ext: ".svg",
    base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
    attributes: () => ({
      width: String(size),
      height: String(size),
      style: `width:${size}px;height:${size}px;display:inline-block;vertical-align:middle`,
    }),
  });
}