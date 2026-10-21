import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SOURCE_ROOT = path.join(process.cwd(), "..", "source", "content");

// URL category name -> source/content subdirectory name (they differ for
// historical reasons: the directories were named before the final URL
// structure was decided against the sitemap/llms.txt).
const CATEGORY_DIRS = {
  vs: "compare",
  alternatives: "alternative",
  industries: "vertical",
  services: "service",
};

function categoryDir(category) {
  return path.join(SOURCE_ROOT, CATEGORY_DIRS[category] ?? category);
}

// Closing CTAs in the source content reference the old static site's paths
// or the bare domain. Point them at the real routes.
function fixLinks(body) {
  return body
    .replace(/\]\(contact\.html\)/g, "](/contact)")
    .replace(/\]\(https:\/\/bonsify\.io\)/g, "](/contact)");
}

// Nearly every source file ends with a standalone "Entity sentence: ..."
// line - a canonical "who is Bonsify" sentence meant for AI/entity
// recognition (schema, GEO), not for the visible page. It was never
// actually wired into structured data, so it just rendered as a stray,
// robotic-sounding duplicate paragraph in the body (the same sentence
// already appears naturally in each page's intro). Strip the line itself.
function stripEntitySentence(body) {
  return body.replace(/^Entity sentence:.*(?:\n|$)/im, "").trim();
}

// "## FAQ" sections use **Question** / answer-paragraph pairs. Pull them out
// as structured data for FAQPage schema and the interactive accordion, and
// strip the section from the prose body so it isn't rendered twice — once as
// plain text, once as the accordion.
function extractFaqSection(body) {
  const match = body.match(/##\s+FAQ\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n|$)/i);
  if (!match) return { items: [], body };

  const section = match[1];
  const items = [];
  const pairRe = /\*\*(.+?)\*\*\s*\n([\s\S]*?)(?=\n\*\*.+?\*\*\s*\n|\s*$)/g;
  let m;
  while ((m = pairRe.exec(section)) !== null) {
    const q = m[1].trim();
    const a = m[2].trim().replace(/\s+/g, " ");
    if (q && a) items.push({ q, a });
  }
  const bodyWithoutFaq = items.length ? body.replace(match[0], "").trim() : body;
  return { items, body: bodyWithoutFaq };
}

// Services consistently use a "## What's included" bullet list. Pulled out
// (without stripping it from the body - it still renders normally there too)
// so ContentPage.jsx can reuse the same bullets as cards on the service's
// phone visual, instead of that phone only ever showing one static image.
function extractChecklistItems(body) {
  const match = body.match(/##\s+What's included\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n|$)/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function readAllFrontmatter(category) {
  const dir = categoryDir(category);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data } = matter(raw);
      return {
        file: file.replace(/\.md$/, ""),
        slug: data.slug,
        title: data.title,
        description: data.description,
        heroImage: data.heroImage,
      };
    })
    .filter((entry) => entry.slug && entry.title)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getCategoryEntries(category) {
  return readAllFrontmatter(category);
}

export function getContentEntry(category, slug) {
  const entries = readAllFrontmatter(category);
  const meta = entries.find((e) => e.slug === slug);
  if (!meta) return null;

  const filePath = path.join(categoryDir(category), `${meta.file}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const rawBody = stripEntitySentence(fixLinks(content.trim()));
  const { items: faqItems, body } = extractFaqSection(rawBody);
  const checklist = extractChecklistItems(rawBody);

  return { ...meta, body, faqItems, checklist, heroImage: data.heroImage };
}
