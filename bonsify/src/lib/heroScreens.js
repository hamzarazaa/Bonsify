import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isClientVisible } from "@/lib/clients";

// Admin-editable via the CMS at /admin (see public/admin/config.yml, "Homepage
// Hero - Phone Screens" collection) - each file is one screen in the phone's
// rotation. A "client" field of "none" always shows; any other value gates
// the entry through the same NEXT_PUBLIC_SHOW_* mechanism as the case-study
// pages (src/lib/clients.js), so a content editor can add a gated client's
// screenshot ahead of time without it going live before that client clears it.
const HERO_SCREENS_DIR = path.join(
  process.cwd(),
  "..",
  "source",
  "content",
  "hero-screens"
);

export function getHeroScreens() {
  if (!fs.existsSync(HERO_SCREENS_DIR)) return [];

  return fs
    .readdirSync(HERO_SCREENS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(HERO_SCREENS_DIR, file), "utf8");
      const { data } = matter(raw);
      return {
        src: data.image,
        alt: data.alt || "",
        client: data.client || "none",
        order: typeof data.order === "number" ? data.order : 10,
      };
    })
    .filter(
      (entry) =>
        entry.src && (entry.client === "none" || isClientVisible(entry.client))
    )
    .sort((a, b) => a.order - b.order)
    .map(({ src, alt }) => ({ src, alt }));
}
