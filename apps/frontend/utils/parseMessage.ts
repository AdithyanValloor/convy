export function parseMessageText(text: string): string {
  if (!text) return "";

  // Regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // Regex to detect @mentions
  const mentionRegex = /@([\w.]+)/g;

  // Split by URLs first to avoid processing mentions inside URLs
  const parts = text.split(urlRegex);

  return parts
    .map((part, i) => {
      // Even-indexed parts are plain text, odd-indexed are URLs
      if (i % 2 === 1) {
        // This is a URL
        return `<a href="${part}" target="_blank" rel="noopener noreferrer" class="text-cyan-500 hover:underline hover:text-primary-focus">${part}</a>`;
      }
      // Plain text — highlight @mentions
      return part.replace(
        mentionRegex,
        `<span class="text-green-600 font-semibold cursor-pointer">@$1</span>`
      );
    })
    .join("");
}