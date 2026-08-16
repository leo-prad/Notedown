import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import { useStore } from "../store";
import { setCurrentEditor } from "../lib/editor";
import { resolveImageSrc, saveImage } from "../lib/tauri";
import { buildAiProvider } from "../lib/ai";

export function EditorPane() {
  const tabId = useStore((s) => s.activeId);
  const epoch = useStore((s) => s.editorEpoch);
  const settings = useStore((s) => s.settings);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !tabId) return;
    const tab = useStore.getState().tabs.find((t) => t.id === tabId);
    if (!tab || tab.sourceMode) return;

    const docPath = tab.path;
    const folder = settings.imageFolderName || "assets";
    let ready = false;
    let destroyed = false;

    const crepe = new Crepe({
      root: host,
      defaultValue: tab.content,
      features: {
        [Crepe.Feature.AI]: settings.aiEnabled,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: "Write here, or press '/' for commands…",
          mode: "block",
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: (f: File) => saveImage(f, docPath, folder),
          blockOnUpload: (f: File) => saveImage(f, docPath, folder),
          proxyDomURL: (url: string) => resolveImageSrc(url, docPath),
        },
        ...(settings.aiEnabled
          ? {
              [Crepe.Feature.AI]: {
                provider: buildAiProvider(settings),
                instructionPlaceholder: "Ask AI to write or edit…",
              },
            }
          : {}),
      },
    });

    crepe
      .create()
      .then(() => {
        if (destroyed) {
          crepe.destroy();
          return;
        }
        ready = true;
        setCurrentEditor(crepe);
        crepe.on((listener) => {
          listener.markdownUpdated((_ctx, markdown) => {
            useStore.getState().updateContent(tabId, markdown);
          });
        });
        const pm = host.querySelector(".ProseMirror");
        if (pm) pm.setAttribute("spellcheck", String(settings.spellcheck));
      })
      .catch((e) => console.error("Editor init failed", e));

    return () => {
      destroyed = true;
      setCurrentEditor(null);
      if (ready) crepe.destroy();
    };
    // Rebuild on tab switch or when settings bump the epoch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, epoch]);

  return (
    <div
      className="nd-editor-scroll"
      style={
        {
          "--nd-font-size": `${settings.fontSize}px`,
          "--nd-line-height": String(settings.lineHeight),
          "--nd-content-width": `${settings.contentWidth}px`,
        } as React.CSSProperties
      }
    >
      <div ref={hostRef} className="nd-editor-host" />
    </div>
  );
}
