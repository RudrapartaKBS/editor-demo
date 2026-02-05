import { EditorState, Transaction } from "prosemirror-state";

export function increaseFontSize() { 
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { schema, selection } = state;
    const fontSizeMark = schema.marks.fontSize;

    if (!fontSizeMark) return false;

    const { from, to } = selection;
    
    // Get current font size
    const marks = state.doc.resolve(from).marks();
    const currentMark = fontSizeMark.isInSet(marks);
    const currentSize = currentMark ? parseInt(currentMark.attrs.size) : 16;
    
    // Increase font size (max 72px)
    const newSize = Math.min(currentSize + 2, 72);
    
    if (dispatch) {
      let tr = state.tr;
      
      // Remove existing fontSize mark if present
      if (currentMark) {
        tr = tr.removeMark(from, to, fontSizeMark);
      }
      
      // Add new fontSize mark
      tr = tr.addMark(from, to, fontSizeMark.create({ size: String(newSize) }));
      dispatch(tr);
    }

    return true;
  };
}

export function decreaseFontSize() {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { schema, selection } = state;
    const fontSizeMark = schema.marks.fontSize;

    if (!fontSizeMark) return false;

    const { from, to } = selection;
    
    // Get current font size
    const marks = state.doc.resolve(from).marks();
    const currentMark = fontSizeMark.isInSet(marks);
    const currentSize = currentMark ? parseInt(currentMark.attrs.size) : 16;
    
    // Decrease font size (min 8px)
    const newSize = Math.max(currentSize - 2, 8);
    
    if (dispatch) {
      let tr = state.tr;
      
      // Remove existing fontSize mark if present
      if (currentMark) {
        tr = tr.removeMark(from, to, fontSizeMark);
      }
      
      // Add new fontSize mark only if not default size
      if (newSize !== 16) {
        tr = tr.addMark(from, to, fontSizeMark.create({ size: String(newSize) }));
      }
      
      dispatch(tr);
    }

    return true;
  };
}

export function setFontSize(size: number) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { schema, selection } = state;
    const fontSizeMark = schema.marks.fontSize;

    if (!fontSizeMark) return false;

    const { from, to } = selection;
    
    if (dispatch) {
      let tr = state.tr;
      
      // Remove existing fontSize mark
      tr = tr.removeMark(from, to, fontSizeMark);
      
      // Add new fontSize mark if not default
      if (size !== 16) {
        tr = tr.addMark(from, to, fontSizeMark.create({ size: String(size) }));
      }
      
      dispatch(tr);
    }

    return true;
  };
}

export function getCurrentFontSize(state: EditorState): number {
  const { schema, selection } = state;
  const fontSizeMark = schema.marks.fontSize;

  if (!fontSizeMark) return 16;

  const { from } = selection;
  const marks = state.doc.resolve(from).marks();
  const mark = fontSizeMark.isInSet(marks);

  return mark ? parseInt(mark.attrs.size) : 16;
}