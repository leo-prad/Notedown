const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
         line-height: 1.65; color: #1a1a1a; max-width: 780px;
         margin: 40px auto; padding: 0 24px; }
  h1,h2,h3,h4,h5,h6 { line-height: 1.25; margin: 1.4em 0 0.6em; font-weight: 650; }
  h1 { font-size: 2em; } h2 { font-size: 1.55em; } h3 { font-size: 1.25em; }
  p { margin: 0.6em 0; }
  a { color: #2f6fd8; }
  code { font-family: "Cascadia Code", Consolas, monospace; font-size: 0.9em;
         background: #f3f3f3; padding: 0.15em 0.35em; border-radius: 4px; }
  pre { background: #f6f6f6; padding: 14px 16px; border-radius: 8px; overflow: auto; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 0.8em 0; padding: 0.2em 1em; border-left: 3px solid #ccc; color: #555; }
  table { border-collapse: collapse; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 6px 12px; text-align: left; }
  img { max-width: 100%; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.6em 0; }
  ul, ol { padding-left: 1.6em; }
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) =>
    char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : "&quot;",
  );
}

function safeUrl(url: string): string {
  return /^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i.test(url) ? url : "";
}

function inlineMarkdown(source: string): string {
  let html = escapeHtml(source);
  html = html.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_all, alt, src) => {
    const safe = safeUrl(src);
    return safe ? `<img src="${escapeHtml(safe)}" alt="${alt}">` : alt;
  });
  html = html.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_all, label, href) => {
    const safe = safeUrl(href);
    return safe ? `<a href="${escapeHtml(safe)}">${label}</a>` : label;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_all, strongA, strongB) => `<strong>${strongA ?? strongB}</strong>`);
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g, (_all, emA, emB) => `<em>${emA ?? emB}</em>`);
  return html;
}

function cells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

/** Convert the supported Markdown surface to self-contained export HTML. */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let fence: { language: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${paragraph.map(inlineMarkdown).join("<br>\n")}</p>`);
    paragraph = [];
  };
  const flushQuote = () => {
    if (quote.length) output.push(`<blockquote>${quote.map(inlineMarkdown).join("<br>\n")}</blockquote>`);
    quote = [];
  };
  const flushList = () => {
    if (!list) return;
    const tag = list.ordered ? "ol" : "ul";
    output.push(`<${tag}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${tag}>`);
    list = null;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const fenceMatch = /^(?:```|~~~)([^\s]*)\s*$/.exec(line);
    if (fence) {
      if (fenceMatch) {
        const language = fence.language ? ` class="language-${escapeHtml(fence.language)}"` : "";
        output.push(`<pre><code${language}>${escapeHtml(fence.lines.join("\n"))}</code></pre>`);
        fence = null;
      } else {
        fence.lines.push(line);
      }
      continue;
    }
    if (fenceMatch) {
      flushParagraph(); flushQuote(); flushList();
      fence = { language: fenceMatch[1], lines: [] };
      continue;
    }

    const tableSeparator = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] ?? "");
    if (/^\s*\|/.test(line) && tableSeparator) {
      flushParagraph(); flushQuote(); flushList();
      const headers = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && /^\s*\|/.test(lines[index])) rows.push(cells(lines[index++]));
      index--;
      output.push(`<table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_header, col) => `<td>${inlineMarkdown(row[col] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    const blockquote = /^>\s?(.*)$/.exec(line);
    const bullet = /^[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph(); flushQuote(); flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
    } else if (blockquote) {
      flushParagraph(); flushList(); quote.push(blockquote[1]);
    } else if (bullet || ordered) {
      flushParagraph(); flushQuote();
      const orderedList = Boolean(ordered);
      if (!list || list.ordered !== orderedList) { flushList(); list = { ordered: orderedList, items: [] }; }
      list.items.push((bullet ?? ordered)![1]);
    } else if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushParagraph(); flushQuote(); flushList(); output.push("<hr>");
    } else if (!line.trim()) {
      flushParagraph(); flushQuote(); flushList();
    } else {
      flushQuote(); flushList(); paragraph.push(line);
    }
  }
  if (fence) output.push(`<pre><code>${escapeHtml(fence.lines.join("\n"))}</code></pre>`);
  flushParagraph(); flushQuote(); flushList();
  return output.join("\n");
}

export function buildHtmlDocument(title: string, markdown: string): string {
  const safeTitle = escapeHtml(title);
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>${PRINT_CSS}</style></head>
<body>${markdownToHtml(markdown)}</body></html>`;
}

export function printDocument(title: string, markdown: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(buildHtmlDocument(title, markdown));
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow!.onafterprint = cleanup;
  setTimeout(() => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    cleanup();
  }, 250);
}
