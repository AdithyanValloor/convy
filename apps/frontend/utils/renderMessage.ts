import twemoji from "twemoji";

const urlRegex = /(https?:\/\/[^\s]+)/g;

/**
 * Convert raw text -> DOM -> linkify -> twemoji -> HTML string
 * Assumes `raw` is plain text (no HTML). If your input can contain HTML/markdown,
 * handle that separately (see notes below).
 */
export function renderMessageHTML(raw: string): string {
  if (typeof document === "undefined") {
    // Server side fallback: return raw (no twemoji)
    return raw;
  }
  
  // 1) Create container and ensure we start from TEXT only (no HTML parsing)
  const container = document.createElement("div");
  container.textContent = raw; // escape any accidental HTML

  // 2) Walk text nodes and replace URLs with anchor elements
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);

  const nodesToReplace: { node: Text; fragments: (Text | HTMLAnchorElement)[] }[] = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    if (!textNode || !textNode.nodeValue) continue;
    const txt = textNode.nodeValue;
    if (!urlRegex.test(txt)) continue;

    // split preserving urls
    const parts = txt.split(urlRegex);
    const fragments: (Text | HTMLAnchorElement)[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      if (urlRegex.test(part)) {
        const a = document.createElement("a");
        a.href = part;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "text-[#33ddff] underline hover:text-primary-focus";
        a.textContent = part;
        fragments.push(a);
      } else {
        fragments.push(document.createTextNode(part));
      }
    }

    nodesToReplace.push({ node: textNode, fragments });
  }

  // apply replacements (separately to avoid messing TreeWalker)
  for (const { node, fragments } of nodesToReplace) {
    const parent = node.parentNode;
    if (!parent) continue;
    for (const f of fragments) parent.insertBefore(f, node);
    parent.removeChild(node);
  }

  // 3) Run Twemoji on DOM node (this mutates the DOM nodes and inserts <img> tags)
  twemoji.parse(container, {
    folder: "svg",
    ext: ".svg",
    base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
  });

  // 4) Return innerHTML
  return container.innerHTML;
}
