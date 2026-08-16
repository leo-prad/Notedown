import { useStore, isDirty } from "../store";

/**
 * Notepad/Typedown-style "save your changes?" prompt shown when the user tries
 * to close a tab with unsaved edits. Three choices: Save, Don't Save, Cancel.
 */
export function ConfirmClose() {
  const id = useStore((s) => s.confirmCloseId);
  const tab = useStore((s) => s.tabs.find((t) => t.id === s.confirmCloseId));
  const saveTab = useStore((s) => s.saveTab);
  const closeTab = useStore((s) => s.closeTab);
  const cancelClose = useStore((s) => s.cancelClose);

  if (!id || !tab) return null;

  const onSave = async () => {
    await saveTab(id);
    // Only close if the save actually went through (Save As dialog not cancelled).
    const fresh = useStore.getState().tabs.find((t) => t.id === id);
    if (fresh && !isDirty(fresh)) closeTab(id);
    else cancelClose();
  };

  return (
    <div className="nd-modal-backdrop" onMouseDown={cancelClose}>
      <div
        className="nd-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="nd-modal-title">Save changes?</div>
        <div className="nd-modal-body">
          Do you want to save the changes you made to{" "}
          <strong>{tab.title}</strong>?
          <br />
          Your changes will be lost if you don't save them.
        </div>
        <div className="nd-modal-actions">
          <button className="nd-btn nd-btn-primary" onClick={onSave} autoFocus>
            Save
          </button>
          <button className="nd-btn" onClick={() => closeTab(id)}>
            Don't Save
          </button>
          <button className="nd-btn" onClick={cancelClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
