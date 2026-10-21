// Splits a "vs" compare page's markdown body (FAQ already stripped by
// lib/content.js) into structured blocks so the page can render a wider,
// comparison-shaped layout instead of one long column of prose. Works off
// the H2 headings already present in the compare markdown - no
// page-specific hardcoding, so it holds up across every file in
// source/content/compare.

function splitByH2(markdown) {
  const chunks = markdown.split(/\n(?=##\s)/);
  const sections = [];
  let intro = "";
  for (const chunk of chunks) {
    const m = chunk.match(/^##\s+(.+?)\s*\n([\s\S]*)$/);
    if (m) {
      sections.push({ heading: m[1].trim(), body: m[2].trim() });
    } else if (!sections.length) {
      intro = chunk.trim();
    }
  }
  return { intro, sections };
}

function hasTable(md) {
  return /^\s*\|.+\|\s*$/m.test(md);
}

// A "decision" section reads as two or more "**Label:**" groups, each
// followed by its own bullet list - e.g. "Choose X if: / Choose Y if:".
function splitDecisionGroups(md) {
  const parts = md.split(/\n(?=\*\*[^*]+\*\*\s*\n)/);
  const groups = parts
    .map((p) => {
      const m = p.match(/^\*\*(.+?)\*\*\s*\n([\s\S]*)$/);
      return m ? { label: m[1].trim(), body: m[2].trim() } : null;
    })
    .filter(Boolean);
  return groups.length >= 2 ? groups : null;
}

export function buildCompareBlocks(body) {
  const { intro, sections } = splitByH2(body);

  const tableIndex = sections.findIndex((s) => hasTable(s.body));
  const table = tableIndex >= 0 ? sections[tableIndex] : null;
  const rest = sections.filter((_, i) => i !== tableIndex);

  const blocks = [];
  let i = 0;
  while (i < rest.length) {
    const section = rest[i];
    const decision = splitDecisionGroups(section.body);
    if (decision) {
      blocks.push({ type: "decision", heading: section.heading, groups: decision });
      i += 1;
      continue;
    }

    const next = rest[i + 1];
    const nextIsDecision = next && splitDecisionGroups(next.body);
    if (next && !nextIsDecision) {
      blocks.push({ type: "pair", items: [section, next] });
      i += 2;
    } else {
      blocks.push({ type: "single", items: [section] });
      i += 1;
    }
  }

  return { intro, table, blocks };
}
