import { useStore } from "../store";
import type { Tab } from "../types";

export function SourceView({ tab }: { tab: Tab }) {
  const updateContent = useStore((s) => s.updateContent);
  const settings = useStore((s) => s.settings);
  return (
    <div className="nd-editor-scroll">
      <textarea
        className="nd-source"
        value={tab.content}
        spellCheck={false}
        onChange={(e) => updateContent(tab.id, e.target.value)}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: String(settings.lineHeight),
          maxWidth: `${settings.contentWidth}px`,
        }}
        placeholder="# Source mode — raw Markdown"
      />
    </div>
  );
}
