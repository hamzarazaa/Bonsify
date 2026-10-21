// Google Fonts stylesheet address for a brand's heading and body fonts, or null
// when neither is a Google font.
export function googleFontsHref(fonts) {
  const families = [
    fonts?.headingGoogle && fonts.heading,
    fonts?.bodyGoogle && fonts.body !== fonts.heading && fonts.body,
  ].filter(Boolean);
  if (!families.length) return null;
  const q = families.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}
