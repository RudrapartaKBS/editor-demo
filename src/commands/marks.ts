import { toggleMark } from "prosemirror-commands";
import type { EditorState, Transaction } from "prosemirror-state";

/* ---------- helpers ---------- */

function isMarkActive(state: EditorState, mark: any) {
  const { from, to, empty } = state.selection;

  // CKEditor-like: show active based on actual marks at cursor/selection,
  // NOT storedMarks (storedMarks can remain set after toggling and causes "stuck" UI).
  if (empty) {
    return !!mark.isInSet(state.selection.$from.marks());
  }

  return state.doc.rangeHasMark(from, to, mark);
}

function canToggleMark(state: EditorState, mark: any) {
  // Command returns boolean when dispatch is not provided
  return toggleMark(mark)(state);
}

/* ---------- basic marks ---------- */

export function toggleBold(state: EditorState, dispatch?: (tr: Transaction) => void, view?: any) {
  const mark = state.schema.marks.strong;
  if (!mark) return false;
  return toggleMark(mark)(state, dispatch as any, view);
}

export function toggleItalic(state: EditorState, dispatch?: (tr: Transaction) => void, view?: any) {
  const mark = state.schema.marks.em;
  if (!mark) return false;
  return toggleMark(mark)(state, dispatch as any, view);
}

export function toggleUnderline(state: EditorState, dispatch?: (tr: Transaction) => void, view?: any) {
  const mark = state.schema.marks.underline;
  if (!mark) return false;
  return toggleMark(mark)(state, dispatch as any, view);
}

/* ---------- active state ---------- */

export const isBoldActive = (state: EditorState) =>
  !!state.schema.marks.strong && isMarkActive(state, state.schema.marks.strong);

export const isItalicActive = (state: EditorState) =>
  !!state.schema.marks.em && isMarkActive(state, state.schema.marks.em);

export const isUnderlineActive = (state: EditorState) =>
  !!state.schema.marks.underline && isMarkActive(state, state.schema.marks.underline);

/* ---------- enabled state ---------- */

export const canBold = (state: EditorState) =>
  !!state.schema.marks.strong && canToggleMark(state, state.schema.marks.strong);

export const canItalic = (state: EditorState) =>
  !!state.schema.marks.em && canToggleMark(state, state.schema.marks.em);

export const canUnderline = (state: EditorState) =>
  !!state.schema.marks.underline && canToggleMark(state, state.schema.marks.underline);

/* ---------- color + highlight ---------- */

export function setTextColor(color: string | null) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const m = state.schema.marks.textColor;
    if (!m) return false;

    const { from, to, empty } = state.selection;

    // No dispatch: just report if it can run
    if (!dispatch) {
      if (color == null) return true;
      return toggleMark(m, { color })(state);
    }

    if (!color) {
      // If cursor only, remove stored mark too so UI doesn't look stuck
      let tr = state.tr.removeMark(from, to, m);
      if (empty) tr = tr.setStoredMarks(null);
      dispatch(tr);
      return true;
    }

    return toggleMark(m, { color })(state, dispatch);
  };
}

export function setHighlight(color: string | null) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const m = state.schema.marks.highlight;
    if (!m) return false;

    const { from, to, empty } = state.selection;

    // No dispatch: just report if it can run
    if (!dispatch) {
      if (color == null) return true;
      return toggleMark(m, { color })(state);
    }

    if (!color) {
      let tr = state.tr.removeMark(from, to, m);
      if (empty) tr = tr.setStoredMarks(null);
      dispatch(tr);
      return true;
    }

    return toggleMark(m, { color })(state, dispatch);
  };
}




// import { toggleMark } from "prosemirror-commands";
// import type { EditorState, Transaction } from "prosemirror-state";

// /* ---------- helpers ---------- */

// function isMarkActive(state: EditorState, mark: any) {
//   const { from, to, empty } = state.selection;
//   if (empty) {
//     return !!mark.isInSet(state.storedMarks || state.selection.$from.marks());
//   }
//   return state.doc.rangeHasMark(from, to, mark);
// }

// function canToggleMark(state: EditorState, mark: any) {
//   // ProseMirror's command itself knows when it can run.
//   // Calling with dispatch = undefined returns boolean.
//   return toggleMark(mark)(state, undefined as any);
// }

// /* ---------- basic marks ---------- */

// export function toggleBold(state: EditorState, dispatch: any, view: any) {
//   const mark = state.schema.marks.strong;
//   if (!mark) return false;
//   return toggleMark(mark)(state, dispatch, view);
// }

// export function toggleItalic(state: EditorState, dispatch?: (tr: Transaction) => void) {
//   const m = state.schema.marks.em;
//   if (!m) return false;
//   return toggleMark(m)(state, dispatch);
// }

// export function toggleUnderline(state: EditorState, dispatch?: (tr: Transaction) => void) {
//   const m = state.schema.marks.underline;
//   if (!m) return false;
//   return toggleMark(m)(state, dispatch);
// }

// /* ---------- active state ---------- */

// export const isBoldActive = (state: EditorState) =>
//   !!state.schema.marks.strong && isMarkActive(state, state.schema.marks.strong);

// export const isItalicActive = (state: EditorState) =>
//   !!state.schema.marks.em && isMarkActive(state, state.schema.marks.em);

// export const isUnderlineActive = (state: EditorState) =>
//   !!state.schema.marks.underline && isMarkActive(state, state.schema.marks.underline);

// /* ---------- enabled state ---------- */

// export const canBold = (state: EditorState) =>
//   !!state.schema.marks.strong && canToggleMark(state, state.schema.marks.strong);

// export const canItalic = (state: EditorState) =>
//   !!state.schema.marks.em && canToggleMark(state, state.schema.marks.em);

// export const canUnderline = (state: EditorState) =>
//   !!state.schema.marks.underline && canToggleMark(state, state.schema.marks.underline);

// /* ---------- color + highlight ---------- */

// export function setTextColor(color: string | null) {
//   return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
//     const m = state.schema.marks.textColor;
//     if (!m || !dispatch) return false;

//     const { from, to } = state.selection;
//     if (!color) {
//       dispatch(state.tr.removeMark(from, to, m));
//       return true;
//     }

//     return toggleMark(m, { color })(state, dispatch);
//   };
// }

// export function setHighlight(color: string | null) {
//   return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
//     const m = state.schema.marks.highlight;
//     if (!m || !dispatch) return false;

//     const { from, to } = state.selection;
//     if (!color) {
//       dispatch(state.tr.removeMark(from, to, m));
//       return true;
//     }

//     return toggleMark(m, { color })(state, dispatch);
//   };
// }






// import { toggleMark } from "prosemirror-commands";
// import type { EditorState } from "prosemirror-state";

// /** True if selection can apply mark (avoid enabling when not possible) */
// function canToggleMark(state: EditorState, markType: any) {
//   const { from, $from, to, empty } = state.selection;

//   if (empty) {
//     // Stored marks or cursor marks
//     return !!markType.isInSet(state.storedMarks || $from.marks());
//   }

//   return state.doc.rangeHasMark(from, to, markType) || true;
// }

// export function toggleBold(state: EditorState, dispatch: any, view: any) {
//   const mark = state.schema.marks.strong;
//   if (!mark) return false;
//   return toggleMark(mark)(state, dispatch, view);
// }

// export function toggleItalic(state: EditorState, dispatch: any, view: any) {
//   const mark = state.schema.marks.em;
//   if (!mark) return false;
//   return toggleMark(mark)(state, dispatch, view);
// }

// export function toggleUnderline(state: EditorState, dispatch: any, view: any) {
//   const mark = state.schema.marks.underline;
//   if (!mark) return false;
//   return toggleMark(mark)(state, dispatch, view);
// }

// export function isBoldActive(state: EditorState) {
//   const mark = state.schema.marks.strong;
//   if (!mark) return false;
//   const { from, to, empty } = state.selection;
//   if (empty) return !!mark.isInSet(state.storedMarks || state.selection.$from.marks());
//   return state.doc.rangeHasMark(from, to, mark);
// }

// export function isItalicActive(state: EditorState) {
//   const mark = state.schema.marks.em;
//   if (!mark) return false;
//   const { from, to, empty } = state.selection;
//   if (empty) return !!mark.isInSet(state.storedMarks || state.selection.$from.marks());
//   return state.doc.rangeHasMark(from, to, mark);
// }

// export function isUnderlineActive(state: EditorState) {
//   const mark = state.schema.marks.underline;
//   if (!mark) return false;
//   const { from, to, empty } = state.selection;
//   if (empty) return !!mark.isInSet(state.storedMarks || state.selection.$from.marks());
//   return state.doc.rangeHasMark(from, to, mark);
// }

// export function canBold(state: EditorState) {
//   const mark = state.schema.marks.strong;
//   if (!mark) return false;
//   return canToggleMark(state, mark);
// }

// export function canItalic(state: EditorState) {
//   const mark = state.schema.marks.em;
//   if (!mark) return false;
//   return canToggleMark(state, mark);
// }

// export function canUnderline(state: EditorState) {
//   const mark = state.schema.marks.underline;
//   if (!mark) return false;
//   return canToggleMark(state, mark);
// }