import { useState } from "react";
import { useStore } from "../store";
import { DEFAULT_SETTINGS, type Settings as SettingsT, type ThemeName } from "../types";

const SECTIONS = [
  "General",
  "Appearance",
  "Editor",
  "Image",
  "AI",
  "Export",
  "About",
] as const;
type Section = (typeof SECTIONS)[number];

export function Settings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setUI = useStore((s) => s.setUI);
  const [section, setSection] = useState<Section>("General");

  const set = <K extends keyof SettingsT>(key: K, value: SettingsT[K]) =>
    setSettings({ [key]: value } as Partial<SettingsT>);

  return (
    <div className="nd-settings">
      <div className="nd-settings-nav">
        <button className="nd-settings-back" onClick={() => setUI("settingsOpen", false)}>
          ← Back
        </button>
        {SECTIONS.map((sec) => (
          <button
            key={sec}
            className={`nd-settings-navitem ${section === sec ? "active" : ""}`}
            onClick={() => setSection(sec)}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="nd-settings-content">
        <h1 className="nd-settings-h1">{section}</h1>

        {section === "General" && (
          <>
            <Row title="Restore session on launch" desc="Reopen tabs and unsaved buffers when you return.">
              <Toggle value={settings.restoreSession} onChange={(v) => set("restoreSession", v)} />
            </Row>
            <Row title="Default format" desc="Format for new documents.">
              <Select
                value={settings.defaultFormat}
                options={[
                  ["md", "Markdown (.md)"],
                  ["txt", "Plain text (.txt)"],
                ]}
                onChange={(v) => set("defaultFormat", v as "md" | "txt")}
              />
            </Row>
          </>
        )}

        {section === "Appearance" && (
          <>
            <Row title="Theme" desc="Editor color theme.">
              <Select
                value={settings.theme}
                options={[
                  ["system", "System"],
                  ["classic", "Classic Light"],
                  ["classic-dark", "Classic Dark"],
                  ["frame", "Frame Light"],
                  ["frame-dark", "Frame Dark"],
                  ["nord", "Nord Light"],
                  ["nord-dark", "Nord Dark"],
                ]}
                onChange={(v) => set("theme", v as ThemeName)}
              />
            </Row>
            <Row title="Accent color" desc="Used for highlights and controls.">
              <input
                type="color"
                className="nd-color"
                value={settings.accent}
                onChange={(e) => set("accent", e.target.value)}
              />
            </Row>
          </>
        )}

        {section === "Editor" && (
          <>
            <Row title="Font size" desc="Default editor font size.">
              <Num value={settings.fontSize} min={10} max={40} onChange={(v) => set("fontSize", v)} />
            </Row>
            <Row title="Line height" desc="Editor line-height multiple.">
              <Num value={settings.lineHeight} min={1} max={3} step={0.1} onChange={(v) => set("lineHeight", v)} />
            </Row>
            <Row title="Content width" desc="Maximum width of editor content (px).">
              <Num value={settings.contentWidth} min={400} max={2000} step={20} onChange={(v) => set("contentWidth", v)} />
            </Row>
            <Row title="Default indentation" desc="Spaces for quotes and lists.">
              <Num value={settings.indentation} min={1} max={8} onChange={(v) => set("indentation", v)} />
            </Row>
            <Row title="Auto complete quotes"><Toggle value={settings.autoQuotes} onChange={(v) => set("autoQuotes", v)} /></Row>
            <Row title="Auto complete brackets"><Toggle value={settings.autoBrackets} onChange={(v) => set("autoBrackets", v)} /></Row>
            <Row title="Auto complete markdown tags"><Toggle value={settings.autoMarkdown} onChange={(v) => set("autoMarkdown", v)} /></Row>
            <Row title="Spell check"><Toggle value={settings.spellcheck} onChange={(v) => set("spellcheck", v)} /></Row>
          </>
        )}

        {section === "Image" && (
          <>
            <Row title="When inserting images" desc="How pasted / dropped images are stored.">
              <Select
                value={settings.imageStrategy}
                options={[
                  ["copy-local", "Copy into a folder next to the document"],
                  ["keep-absolute", "Keep absolute path"],
                ]}
                onChange={(v) => set("imageStrategy", v as SettingsT["imageStrategy"])}
              />
            </Row>
            <Row title="Image folder name" desc="Folder created beside the document for images.">
              <input
                className="nd-text"
                value={settings.imageFolderName}
                onChange={(e) => set("imageFolderName", e.target.value)}
              />
            </Row>
          </>
        )}

        {section === "AI" && (
          <>
            <Row title="Enable AI assistant" desc="Adds Milkdown's inline AI (slash '/ai' and toolbar).">
              <Toggle value={settings.aiEnabled} onChange={(v) => set("aiEnabled", v)} />
            </Row>
            <Row title="Provider">
              <Select
                value={settings.aiProvider}
                options={[
                  ["anthropic", "Anthropic (Claude)"],
                  ["openai", "OpenAI"],
                  ["custom", "Custom (OpenAI-compatible)"],
                ]}
                onChange={(v) => set("aiProvider", v as SettingsT["aiProvider"])}
              />
            </Row>
            <Row title="API key" desc="Stored locally in your session file.">
              <input
                className="nd-text"
                type="password"
                value={settings.aiApiKey}
                onChange={(e) => set("aiApiKey", e.target.value)}
                placeholder="sk-…"
              />
            </Row>
            <Row title="Model">
              <input className="nd-text" value={settings.aiModel} onChange={(e) => set("aiModel", e.target.value)} />
            </Row>
            <Row title="Base URL" desc="Only for custom / self-hosted endpoints.">
              <input className="nd-text" value={settings.aiBaseUrl} onChange={(e) => set("aiBaseUrl", e.target.value)} placeholder="https://…" />
            </Row>
          </>
        )}

        {section === "Export" && (
          <Row title="Export" desc="Use File → Export for HTML, or Print to save as PDF.">
            <span className="nd-status-text">Configured per-document at export time.</span>
          </Row>
        )}

        {section === "About" && (
          <div className="nd-about">
            <div className="nd-about-logo">N</div>
            <h2>Notedown</h2>
            <p>Version {DEFAULT_SETTINGS ? "0.1.0" : ""}</p>
            <p className="nd-status-text">
              A tabbed, WYSIWYG Markdown &amp; text editor with unsaved-session
              persistence. Built with Tauri + Milkdown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="nd-setting-row">
      <div className="nd-setting-label">
        <div className="nd-setting-title">{title}</div>
        {desc && <div className="nd-setting-desc">{desc}</div>}
      </div>
      <div className="nd-setting-control">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`nd-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}>
      <span className="nd-toggle-knob" />
    </button>
  );
}

function Num({ value, min, max, step = 1, onChange }: { value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      className="nd-num"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function Select({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <select className="nd-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
