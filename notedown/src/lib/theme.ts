import classicUrl from "@milkdown/crepe/theme/classic.css?url";
import classicDarkUrl from "@milkdown/crepe/theme/classic-dark.css?url";
import frameUrl from "@milkdown/crepe/theme/frame.css?url";
import frameDarkUrl from "@milkdown/crepe/theme/frame-dark.css?url";
import nordUrl from "@milkdown/crepe/theme/nord.css?url";
import nordDarkUrl from "@milkdown/crepe/theme/nord-dark.css?url";
import type { ThemeName } from "../types";

const URLS: Record<Exclude<ThemeName, "system">, string> = {
  classic: classicUrl,
  "classic-dark": classicDarkUrl,
  frame: frameUrl,
  "frame-dark": frameDarkUrl,
  nord: nordUrl,
  "nord-dark": nordDarkUrl,
};

const DARK = new Set<ThemeName>(["classic-dark", "frame-dark", "nord-dark"]);

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(theme: ThemeName): Exclude<ThemeName, "system"> {
  if (theme === "system") return systemPrefersDark() ? "classic-dark" : "classic";
  return theme;
}

export function isDarkTheme(theme: ThemeName): boolean {
  return DARK.has(resolveTheme(theme));
}

let linkEl: HTMLLinkElement | null = null;

/** Load / swap the Crepe theme stylesheet and drive the app chrome theme. */
export function applyTheme(theme: ThemeName, accent: string) {
  const effective = resolveTheme(theme);
  if (!linkEl) {
    linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.id = "crepe-theme";
    document.head.appendChild(linkEl);
  }
  const href = URLS[effective];
  if (linkEl.getAttribute("href") !== href) linkEl.setAttribute("href", href);

  const root = document.documentElement;
  root.dataset.theme = isDarkTheme(theme) ? "dark" : "light";
  root.style.setProperty("--nd-accent", accent);
}
