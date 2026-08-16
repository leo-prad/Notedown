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
let overrideEl: HTMLStyleElement | null = null;

const UI_FONT =
  '"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif';
const CODE_FONT =
  '"Cascadia Code", "Cascadia Mono", Consolas, ui-monospace, monospace';

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

  // Crepe defines its font/color vars ON the `.milkdown` element, so a :root
  // override loses. Inject a `.milkdown` rule AFTER the theme link so it wins.
  if (!overrideEl) {
    overrideEl = document.createElement("style");
    overrideEl.id = "crepe-overrides";
    document.head.appendChild(overrideEl);
  } else if (overrideEl.previousElementSibling !== linkEl) {
    document.head.appendChild(overrideEl); // keep it after the link
  }

  const dark = isDarkTheme(theme);
  const bg = dark ? "#202020" : "#fffff5";
  const fg = dark ? "#e6e6e6" : "#1b1b1b";
  overrideEl.textContent = `.milkdown{
    --crepe-font-title: ${UI_FONT};
    --crepe-font-default: ${UI_FONT};
    --crepe-font-code: ${CODE_FONT};
    --crepe-color-background: ${bg};
    --crepe-color-on-background: ${fg};
  }`;

  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.style.setProperty("--nd-accent", accent);
}
