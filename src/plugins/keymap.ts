import { keymap } from "prosemirror-keymap";
import { toggleMark, setBlockType, baseKeymap, splitBlock, wrapIn } from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import { splitListItem, liftListItem, sinkListItem } from "prosemirror-schema-list";
import type { Plugin, EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { schema } from "../schema";

// Enhanced Enter handler for all block elements with better logic
function smartEnterHandler(state: EditorState, dispatch?: (tr: Transaction) => void, view?: any) {
  // Check if the active element is a caption being edited
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.getAttribute("data-pm-caption") === "true") {
    // Don't handle Enter when editing captions - let the caption editor handle it
    return false;
  }

  const { $from, empty } = state.selection;
  
  if (!empty) {
    // If there's a selection, use default splitBlock behavior
    return splitBlock(state, dispatch);
  }
  
  // Check if we're directly after a figure node (which contains image)
  const nodeAfter = $from.nodeAfter;
  const nodeBefore = $from.nodeBefore;
  
  // Check if we're positioned after a figure containing an image
  if (nodeBefore && nodeBefore.type.name === "figure") {
    if (dispatch) {
      const paragraph = state.schema.nodes.paragraph;
      if (paragraph) {
        const tr = state.tr;
        const insertPos = $from.pos;
        
        // Insert empty paragraph after figure
        tr.insert(insertPos, paragraph.create());
        tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
        
        dispatch(tr);
      }
    }
    return true;
  }
  
  // Check if we're positioned before a figure containing an image  
  if (nodeAfter && nodeAfter.type.name === "figure") {
    if (dispatch) {
      const paragraph = state.schema.nodes.paragraph;
      if (paragraph) {
        const tr = state.tr;
        const insertPos = $from.pos;
        
        // Insert empty paragraph before figure
        tr.insert(insertPos, paragraph.create());
        tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
        
        dispatch(tr);
      }
    }
    return true;
  }
  
  // Also check if we're inside or at the end of a figure node
  for (let i = $from.depth; i >= 0; i--) {
    const node = $from.node(i);
    if (node.type.name === "figure") {
      // We're inside a figure, create paragraph after it
      if (dispatch) {
        const paragraph = state.schema.nodes.paragraph;
        if (paragraph) {
          const tr = state.tr;
          const figurePos = $from.after(i);
          
          // Insert paragraph after figure
          tr.insert(figurePos, paragraph.create());
          tr.setSelection(TextSelection.create(tr.doc, figurePos + 1));
          
          dispatch(tr);
        }
      }
      return true;
    }
  }
  
  // Walk up the node hierarchy to find what block we're in
  for (let i = $from.depth; i >= 0; i--) {
    const node = $from.node(i);
    const nodeType = node.type.name;
    
    // Handle list items first (highest priority)
    if (nodeType === "list_item") {
      const itemStart = $from.start(i);
      const itemEnd = $from.end(i);
      const itemContent = state.doc.textBetween(itemStart, itemEnd).trim();
      
      if (itemContent === "" || $from.pos === itemEnd) {
        // Empty list item or at end - exit the list
        if (liftListItem(state.schema.nodes.list_item)(state, dispatch)) {
          return true;
        }
      } else {
        // Non-empty list item - split it normally
        if (splitListItem(state.schema.nodes.list_item)(state, dispatch)) {
          return true;
        }
      }
    }
    
    // Handle blockquotes
    else if (nodeType === "blockquote") {
      const blockStart = $from.start(i);
      const blockEnd = $from.end(i);
      
      // Check if we're at the very end of the blockquote
      if ($from.pos >= blockEnd - 1) {
        if (dispatch) {
          const paragraph = state.schema.nodes.paragraph;
          if (paragraph) {
            const tr = state.tr;
            const insertPos = $from.after(i);
            
            // Insert paragraph after blockquote
            tr.insert(insertPos, paragraph.create());
            tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
            
            dispatch(tr);
          }
        }
        return true;
      }
      
      // Check if current paragraph in blockquote is empty
      const paraStart = $from.start($from.depth);
      const paraEnd = $from.end($from.depth);
      const paraContent = state.doc.textBetween(paraStart, paraEnd).trim();
      
      if (paraContent === "" && $from.pos === paraEnd) {
        if (dispatch) {
          const paragraph = state.schema.nodes.paragraph;
          if (paragraph) {
            const tr = state.tr;
            const insertPos = $from.after(i);
            
            // Remove empty paragraph and exit blockquote
            tr.delete(paraStart, paraEnd);
            tr.insert(insertPos - (paraEnd - paraStart), paragraph.create());
            tr.setSelection(TextSelection.create(tr.doc, insertPos - (paraEnd - paraStart) + 1));
            
            dispatch(tr);
          }
        }
        return true;
      }
    }
    
    // Handle headings
    else if (nodeType === "heading") {
      const headingStart = $from.start(i);
      const headingEnd = $from.end(i);
      
      if (dispatch) {
        const paragraph = state.schema.nodes.paragraph;
        if (paragraph) {
          const tr = state.tr;
          
          // Check if cursor is at the end of heading
          if ($from.pos === headingEnd) {
            // At end - create new paragraph after heading
            const insertPos = $from.after(i);
            tr.insert(insertPos, paragraph.create());
            tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
          } else {
            // In middle - split heading content
            const beforeText = state.doc.textBetween(headingStart, $from.pos);
            const afterText = state.doc.textBetween($from.pos, headingEnd);
            
            if (afterText.trim()) {
              // Split heading: keep first part as heading, make second part paragraph
              const insertPos = $from.after(i);
              const newParagraph = paragraph.create(null, afterText ? state.schema.text(afterText) : null);
              
              // Update heading to contain only before text
              if (beforeText.trim()) {
                tr.replaceWith(headingStart, headingEnd, state.schema.text(beforeText));
              } else {
                // If no text before cursor, convert heading to paragraph
                tr.replaceWith($from.before(i), $from.after(i), newParagraph);
                tr.setSelection(TextSelection.create(tr.doc, $from.before(i) + 1));
                dispatch(tr);
                return true;
              }
              
              tr.insert(insertPos, newParagraph);
              tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
            } else {
              // No text after cursor - just create new paragraph
              const insertPos = $from.after(i);
              tr.insert(insertPos, paragraph.create());
              tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
            }
          }
          
          dispatch(tr);
        }
      }
      return true;
    }
  }
  
  // Use default splitBlock if we're not in any special block
  return splitBlock(state, dispatch);
}

/**
 * Enhanced editor shortcuts with comprehensive block handling
 */
export function editorKeymap(): Plugin {
  return keymap({
    // Smart Enter handler for all blocks
    "Enter": smartEnterHandler,
    
    // History commands (undo/redo)
    "Mod-z": undo,
    "Mod-y": redo,
    "Mod-Shift-z": redo,
    
    // List-specific shortcuts
    "Tab": sinkListItem(schema.nodes.list_item),
    "Shift-Tab": liftListItem(schema.nodes.list_item),
    
    // Text formatting shortcuts
    "Mod-u": (state, dispatch, view) => {
      const mark = state.schema.marks.underline;
      if (!mark) return false;
      return toggleMark(mark)(state, dispatch, view as any);
    },
    
    // Blockquote shortcut
    "Mod-Shift-.": (state, dispatch) => {
      const bq = state.schema.nodes.blockquote;
      if (!bq) return false;
      
      // Check if already in blockquote
      const { $from } = state.selection;
      for (let i = $from.depth; i >= 0; i--) {
        if ($from.node(i).type === bq) {
          // Already in blockquote - exit it
          const para = state.schema.nodes.paragraph;
          if (!para) return false;
          return setBlockType(para)(state, dispatch);
        }
      }
      
      // Not in blockquote - create one
      return wrapIn(bq)(state, dispatch);
    },
  });
}