import { undo, redo } from "prosemirror-history";
import type { EditorState } from "prosemirror-state";

export function runUndo(state: EditorState, dispatch: any, view: any) {
  return undo(state, dispatch, view);
}

export function runRedo(state: EditorState, dispatch: any, view: any) {
  return redo(state, dispatch, view);
}

/** Enable/disable buttons correctly */
export function canUndo(state: EditorState) {
  return undo(state, undefined as any);
}
export function canRedo(state: EditorState) {
  return redo(state, undefined as any);
}