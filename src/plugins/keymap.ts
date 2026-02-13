import { keymap } from "prosemirror-keymap";
import {
  toggleMark,
  setBlockType,
  splitBlock,
  wrapIn,
} from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import {
  splitListItem,
  liftListItem,
  sinkListItem,
} from "prosemirror-schema-list";
import type { Plugin, EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { schema } from "../schema";

/**
 * Smart Enter handler (CKEditor-like)
 */
function smartEnterHandler(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) {
  const activeElement = document.activeElement as HTMLElement;

  // Ignore caption editing
  if (activeElement?.getAttribute("data-pm-caption") === "true") {
    return false;
  }

  const { $from, empty } = state.selection;

  if (!empty) {
    return splitBlock(state, dispatch);
  }

  const nodeBefore = $from.nodeBefore;
  const nodeAfter = $from.nodeAfter;

  /**
   * ===== FIGURE / IMAGE HANDLING =====
   */
  if (
    nodeBefore?.type.name === "figure" ||
    nodeAfter?.type.name === "figure"
  ) {
    if (dispatch) {
      const para = state.schema.nodes.paragraph;
      const tr = state.tr;
      tr.insert($from.pos, para.create());
      tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1));
      dispatch(tr);
    }
    return true;
  }

  // If cursor is inside figure → exit figure
  for (let i = $from.depth; i >= 0; i--) {
    if ($from.node(i).type.name === "figure") {
      if (dispatch) {
        const para = state.schema.nodes.paragraph;
        const tr = state.tr;
        const pos = $from.after(i);
        tr.insert(pos, para.create());
        tr.setSelection(TextSelection.create(tr.doc, pos + 1));
        dispatch(tr);
      }
      return true;
    }
  }

  /**
   * ===== BLOCK WALK =====
   */
  for (let i = $from.depth; i >= 0; i--) {
    const node = $from.node(i);
    const type = node.type.name;

    /**
     * ===== LIST ITEM =====
     */
    if (type === "list_item") {
      const start = $from.start(i);
      const end = $from.end(i);
      const text = state.doc.textBetween(start, end).trim();

      if (text === "" || $from.pos === end) {
        return liftListItem(schema.nodes.list_item)(state, dispatch);
      }

      return splitListItem(schema.nodes.list_item)(state, dispatch);
    }

    /**
     * ===== BLOCKQUOTE =====
     */
    if (type === "blockquote") {
      const end = $from.end(i);

      if ($from.pos === end - 1) {
        if (dispatch) {
          const para = state.schema.nodes.paragraph;
          const tr = state.tr;
          const pos = $from.after(i);
          tr.insert(pos, para.create());
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          dispatch(tr);
        }
        return true;
      }

      return splitBlock(state, dispatch);
    }

    /**
     * ===== HEADING (FIXED) =====
     * CKEditor behavior:
     * - End of heading → new paragraph
     * - Middle of heading → split heading
     */
    if (type === "heading") {
      const headingEnd = $from.end(i);

      // Cursor at END → exit heading
      if ($from.pos === headingEnd) {
        if (dispatch) {
          const para = state.schema.nodes.paragraph;
          const tr = state.tr;
          const pos = $from.after(i);
          tr.insert(pos, para.create());
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          dispatch(tr);
        }
        return true;
      }

      // Cursor in middle → normal split
      return splitBlock(state, dispatch);
    }
  }

  /**
   * ===== DEFAULT =====
   */
  return splitBlock(state, dispatch);
}

/**
 * Editor keymap plugin
 */
export function editorKeymap(): Plugin {
  return keymap({
    Enter: smartEnterHandler,

    // Undo / Redo
    "Mod-z": undo,
    "Mod-y": redo,
    "Mod-Shift-z": redo,

    // Lists
    Tab: sinkListItem(schema.nodes.list_item),
    "Shift-Tab": liftListItem(schema.nodes.list_item),

    // Underline
    "Mod-u": (state, dispatch, view) => {
      const mark = state.schema.marks.underline;
      if (!mark) return false;
      return toggleMark(mark)(state, dispatch, view as any);
    },

    // Blockquote toggle
    "Mod-Shift-.": (state, dispatch) => {
      const bq = state.schema.nodes.blockquote;
      if (!bq) return false;

      const { $from } = state.selection;

      for (let i = $from.depth; i >= 0; i--) {
        if ($from.node(i).type === bq) {
          return setBlockType(state.schema.nodes.paragraph)(state, dispatch);
        }
      }

      return wrapIn(bq)(state, dispatch);
    },
  });
}
