import { setBlockType, wrapIn } from "prosemirror-commands";
import type { EditorState, Transaction } from "prosemirror-state";

export function setParagraph(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const p = state.schema.nodes.paragraph;
  if (!p) return false;
  return setBlockType(p)(state, dispatch);
}

export function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const h = state.schema.nodes.heading;
    if (!h) return false;
    return setBlockType(h, { level })(state, dispatch);
  };
}

export function toggleBlockquote(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const bq = state.schema.nodes.blockquote;
  if (!bq) return false;
  return wrapIn(bq)(state, dispatch);
}