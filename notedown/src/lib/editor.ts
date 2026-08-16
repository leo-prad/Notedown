import type { Crepe } from "@milkdown/crepe";
import { callCommand } from "@milkdown/kit/utils";
import { editorViewCtx } from "@milkdown/kit/core";
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  createCodeBlockCommand,
  insertHrCommand,
  insertImageCommand,
  sinkListItemCommand,
  liftListItemCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm";
import { undoCommand, redoCommand } from "@milkdown/kit/plugin/history";

/**
 * The Crepe instance for the currently-focused editor. Set by EditorPane on
 * mount so that the menu bar and keyboard shortcuts can drive it without prop
 * drilling.
 */
let current: Crepe | null = null;

export function setCurrentEditor(crepe: Crepe | null) {
  current = crepe;
}

export function getCurrentEditor(): Crepe | null {
  return current;
}

function run(fn: (crepe: Crepe) => void) {
  if (current) {
    fn(current);
    focusEditor();
  }
}

export function focusEditor() {
  current?.editor.action((ctx) => {
    try {
      ctx.get(editorViewCtx).focus();
    } catch {
      /* view not ready */
    }
  });
}

export const editorCmd = {
  heading: (level: number) =>
    run((c) => c.editor.action(callCommand(wrapInHeadingCommand.key, level))),
  paragraph: () =>
    run((c) => c.editor.action(callCommand(turnIntoTextCommand.key))),
  bold: () => run((c) => c.editor.action(callCommand(toggleStrongCommand.key))),
  italic: () =>
    run((c) => c.editor.action(callCommand(toggleEmphasisCommand.key))),
  strike: () =>
    run((c) => c.editor.action(callCommand(toggleStrikethroughCommand.key))),
  inlineCode: () =>
    run((c) => c.editor.action(callCommand(toggleInlineCodeCommand.key))),
  blockquote: () =>
    run((c) => c.editor.action(callCommand(wrapInBlockquoteCommand.key))),
  bulletList: () =>
    run((c) => c.editor.action(callCommand(wrapInBulletListCommand.key))),
  orderedList: () =>
    run((c) => c.editor.action(callCommand(wrapInOrderedListCommand.key))),
  indent: () =>
    run((c) => c.editor.action(callCommand(sinkListItemCommand.key))),
  outdent: () =>
    run((c) => c.editor.action(callCommand(liftListItemCommand.key))),
  codeBlock: () =>
    run((c) => c.editor.action(callCommand(createCodeBlockCommand.key))),
  hr: () => run((c) => c.editor.action(callCommand(insertHrCommand.key))),
  table: () =>
    run((c) => c.editor.action(callCommand(insertTableCommand.key))),
  image: (src: string, alt = "") =>
    run((c) => c.editor.action(callCommand(insertImageCommand.key, { src, alt }))),
  undo: () => run((c) => c.editor.action(callCommand(undoCommand.key))),
  redo: () => run((c) => c.editor.action(callCommand(redoCommand.key))),
};
