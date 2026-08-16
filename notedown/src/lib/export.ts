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
  th, td { border: 1px solid #ddd; padding: 6px 12px; }
  img { max-width: 100%; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.6em 0; }
  ul, ol { padding-left: 1.6em; }
`;

function renderedBody(): string {
  const pm = document.querySelector(".nd-editor-host .ProseMirror");
  return pm ? pm.innerHTML : "";
}

export function buildHtmlDocument(title: string): string {
  const safe = title.replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
  );
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${safe}</title>
<style>${PRINT_CSS}</style></head>
<body>${renderedBody()}</body></html>`;
}

export function printDocument(title: string) {
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
  doc.write(buildHtmlDocument(title));
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow!.onafterprint = cleanup;
  setTimeout(() => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    cleanup();
  }, 250);
}
