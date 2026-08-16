import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { appConfigDir, appDataDir, dirname, join } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { SessionState } from "../types";

// ---------- File IO (via Rust commands, no scope hassles) ----------

export function readText(path: string): Promise<string> {
  return invoke<string>("read_text", { path });
}

export function writeText(path: string, content: string): Promise<void> {
  return invoke("write_text", { path, content });
}

export function writeBinary(path: string, data: Uint8Array): Promise<void> {
  return invoke("write_binary", { path, data: Array.from(data) });
}

export function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>("path_exists", { path });
}

// ---------- Dialogs ----------

const MD_FILTERS = [
  { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd"] },
  { name: "Text", extensions: ["txt"] },
  { name: "All Files", extensions: ["*"] },
];

export async function openFileDialog(): Promise<string[] | null> {
  const result = await open({
    multiple: true,
    directory: false,
    filters: MD_FILTERS,
  });
  if (!result) return null;
  return Array.isArray(result) ? result : [result];
}

export async function saveFileDialog(
  defaultName: string,
): Promise<string | null> {
  const result = await save({
    defaultPath: defaultName,
    filters: MD_FILTERS,
  });
  return result ?? null;
}

// ---------- Session persistence ----------

async function sessionPath(): Promise<string> {
  const dir = await appConfigDir();
  return join(dir, "session.json");
}

export async function loadSession(): Promise<SessionState | null> {
  try {
    const p = await sessionPath();
    if (!(await pathExists(p))) return null;
    const raw = await readText(p);
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export async function saveSession(state: SessionState): Promise<void> {
  try {
    const p = await sessionPath();
    await writeText(p, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

// ---------- Images ----------

/** Directory that holds images for a document (or a scratch dir for untitled). */
async function imageDirFor(
  docPath: string | null,
  folderName: string,
): Promise<string> {
  if (docPath) {
    const dir = await dirname(docPath);
    return join(dir, folderName);
  }
  const data = await appDataDir();
  return join(data, "unsaved-images");
}

function extFromFile(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
  };
  return map[file.type] ?? "png";
}

/**
 * Save an uploaded image next to the document and return the string that should
 * be stored in the markdown (a relative path when the doc is saved, otherwise
 * an absolute path). Display resolution is handled separately by resolveImageSrc.
 */
export async function saveImage(
  file: File,
  docPath: string | null,
  folderName: string,
  strategy: "copy-local" | "keep-absolute" = "copy-local",
): Promise<string> {
  const ext = extFromFile(file);
  const base = (file.name.replace(/\.[^.]+$/, "") || "image")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .slice(0, 40);
  const stamp = Math.abs(hashString(file.name + file.size + file.type))
    .toString(36)
    .slice(0, 6);
  const filename = `${base || "image"}-${stamp}.${ext}`;

  const dir = await imageDirFor(docPath, folderName);
  const target = await join(dir, filename);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeBinary(target, bytes);

  if (docPath && strategy === "copy-local") {
    // Store a path relative to the document.
    return `${folderName}/${filename}`;
  }
  // Absolute paths (either explicitly chosen or required for an untitled doc)
  // use forward slashes so they remain valid Markdown destinations.
  return target.replace(/\\/g, "/");
}

/** Turn a stored image src into something the webview can render. */
export async function resolveImageSrc(
  src: string,
  docPath: string | null,
): Promise<string> {
  if (!src) return src;
  if (/^(https?:|data:|asset:|blob:)/i.test(src)) return src;
  // Absolute Windows path (C:\..., C:/...) or POSIX absolute.
  const isAbsolute = /^[a-z]:[\\/]/i.test(src) || src.startsWith("/");
  let abs = src;
  if (!isAbsolute) {
    if (!docPath) return src;
    const dir = await dirname(docPath);
    abs = await join(dir, src);
  }
  return convertFileSrc(abs);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
