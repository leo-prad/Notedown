export type FileFormat = "md" | "txt";

export type ThemeName =
  | "system"
  | "classic"
  | "classic-dark"
  | "frame"
  | "frame-dark"
  | "nord"
  | "nord-dark";

export interface Tab {
  id: string;
  /** Absolute path on disk, or null for an untitled buffer. */
  path: string | null;
  /** Display title (filename, or "Untitled-N"). */
  title: string;
  /** Current buffer content (markdown or plain text). */
  content: string;
  /** Content as last persisted to disk — used for the dirty check. */
  savedContent: string;
  format: FileFormat;
  /** Whether this tab is showing raw source instead of WYSIWYG. */
  sourceMode: boolean;
}

export interface Settings {
  // Appearance
  theme: ThemeName;
  accent: string;
  // Editor
  fontSize: number;
  lineHeight: number;
  contentWidth: number; // px
  indentation: number;
  autoQuotes: boolean;
  autoBrackets: boolean;
  autoMarkdown: boolean;
  spellcheck: boolean;
  // General
  restoreSession: boolean;
  defaultFormat: FileFormat;
  // Image
  imageStrategy: "copy-local" | "keep-absolute";
  imageFolderName: string;
  // AI
  aiEnabled: boolean;
  aiProvider: "anthropic" | "openai" | "custom";
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accent: "#3574f0",
  fontSize: 16,
  lineHeight: 1.6,
  contentWidth: 800,
  indentation: 4,
  autoQuotes: true,
  autoBrackets: true,
  autoMarkdown: true,
  spellcheck: true,
  restoreSession: true,
  defaultFormat: "md",
  imageStrategy: "copy-local",
  imageFolderName: "assets",
  aiEnabled: false,
  aiProvider: "anthropic",
  aiApiKey: "",
  aiModel: "claude-sonnet-5",
  aiBaseUrl: "",
};

export interface SessionState {
  tabs: Tab[];
  activeId: string | null;
  settings: Settings;
}
