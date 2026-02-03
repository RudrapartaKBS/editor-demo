import type { EditorState, Transaction } from "prosemirror-state";
import { setBlockType } from "prosemirror-commands";

// Toggle code block
export function toggleCodeBlock(language?: string) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const codeBlockType = state.schema.nodes.code_block;
    const paragraphType = state.schema.nodes.paragraph;
    
    if (!codeBlockType || !paragraphType) return false;
    
    const { $from } = state.selection;
    const currentNode = $from.parent;
    
    // If currently in a code block, convert to paragraph
    if (currentNode.type === codeBlockType) {
      return setBlockType(paragraphType)(state, dispatch);
    }
    
    // Otherwise convert to code block
    return setBlockType(codeBlockType, { language })(state, dispatch);
  };
}

// Check if code block is active
export function isCodeBlockActive(state: EditorState): boolean {
  const { $from } = state.selection;
  return $from.parent.type === state.schema.nodes.code_block;
}