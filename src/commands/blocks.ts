import { setBlockType, wrapIn, lift } from "prosemirror-commands";
import { TextSelection } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";

export function setParagraph(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const p = state.schema.nodes.paragraph;
  if (!p) return false;
  return setBlockType(p)(state, dispatch);
}

// Smart heading function that only affects selected blocks
export function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const h = state.schema.nodes.heading;
    if (!h) return false;
    
    const { $from, $to } = state.selection;
    
    // If there's no selection (cursor only), apply to current block only
    if ($from.pos === $to.pos) {
      const currentBlockStart = $from.start($from.depth);
      const currentBlockEnd = $from.end($from.depth);
      
      if (dispatch) {
        const tr = state.tr.setBlockType(currentBlockStart, currentBlockEnd, h, { level });
        dispatch(tr);
      }
      return true;
    }
    
    // If there's a selection, use the standard setBlockType
    return setBlockType(h, { level })(state, dispatch);
  };
}

export function toggleBlockquote(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const bq = state.schema.nodes.blockquote;
  if (!bq) return false;
  
  const { $from, $to } = state.selection;
  
  // Check if we're already in a blockquote
  for (let i = $from.depth; i >= 0; i--) {
    if ($from.node(i).type === bq) {
      // We're inside a blockquote, so unwrap it
      return lift(state, dispatch);
    }
  }
  
  // Not in a blockquote, so wrap with one
  return wrapIn(bq)(state, dispatch);
}