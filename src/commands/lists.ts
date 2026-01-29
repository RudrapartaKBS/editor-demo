import { wrapInList, liftListItem } from "prosemirror-schema-list";
import type { EditorState, Transaction } from "prosemirror-state";

function isInsideListItem(state: EditorState) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === state.schema.nodes.list_item) return true;
  }
  return false;
}

export function toggleBulletList(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const ul = state.schema.nodes.bullet_list;
  const li = state.schema.nodes.list_item;
  if (!ul || !li) return false;

  if (isInsideListItem(state)) {
    return liftListItem(li)(state, dispatch);
  }
  return wrapInList(ul)(state, dispatch);
}

export function toggleOrderedList(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const ol = state.schema.nodes.ordered_list;
  const li = state.schema.nodes.list_item;
  if (!ol || !li) return false;

  if (isInsideListItem(state)) {
    return liftListItem(li)(state, dispatch);
  }
  return wrapInList(ol)(state, dispatch);
}




// import { wrapInList } from "prosemirror-schema-list";
// import { liftListItem } from "prosemirror-schema-list";
// import type { EditorState, Transaction } from "prosemirror-state";

// export function toggleBulletList(state: EditorState, dispatch?: (tr: Transaction) => void) {
//   const ul = state.schema.nodes.bullet_list;
//   if (!ul) return false;
//   return wrapInList(ul)(state, dispatch);
// }

// export function toggleOrderedList(state: EditorState, dispatch?: (tr: Transaction) => void) {
//   const ol = state.schema.nodes.ordered_list;
//   if (!ol) return false;
//   return wrapInList(ol)(state, dispatch);
// }

// export function liftList(state: EditorState, dispatch?: (tr: Transaction) => void) {
//   const li = state.schema.nodes.list_item;
//   if (!li) return false;
//   return liftListItem(li)(state, dispatch);
// }