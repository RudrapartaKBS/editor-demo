import type { EditorView } from "prosemirror-view";

/**
 * A single toolbar tool. Keep it tiny and pure.
 * UI layer will call isActive + run.
 */
export type Tool =
  | {
      type: "button";
      id: string;
      label: string;
      title?: string;
      isActive?: (view: EditorView) => boolean;
      isEnabled?: (view: EditorView) => boolean;
      run: (view: EditorView, button?: HTMLElement) => boolean | void;
    }
  | {
      type: "dropdown";
      id: string;
      title?: string;
      options: { label: string; value: string }[];
      getValue?: (view: EditorView) => string | null;
      onSelect: (view: EditorView, value: string) => void;
    }
  | {
      type: "color";
      id: string;
      title?: string;
      colors: string[];
      clearLabel?: string;
      onPick: (view: EditorView, color: string) => void;
      onClear: (view: EditorView) => void;
    };

/**
 * Toolbar configuration. UI is optional.
 * If not provided, editor still works without toolbar.
 */
export type ToolbarConfig = {
  target: string | HTMLElement;   // where toolbar will mount
  tools?: Tool[];                 // ordered tools (optional when using sections/rows)
  useSections?: boolean;          // use organized sections (default: false)
  useRows?: boolean;              // use two-row layout (default: true)
};

/**
 * Output payload sent on every change.
 */
export type EditorOutput = {
  // Wrapped JSON for long-term safety
  json: { schemaVersion: number; doc: any };
  html: string;
  text: string;
};

/**
 * Editor public API returned from createEditor().
 */
export type EditorAPI = {
  view: EditorView;
  // Core API methods
  getJSON: () => any;
  getHTML: () => string;
  getValue: () => EditorOutput;
  getContent: () => any;
  setContent: (content: any) => void;
  getText: () => string;
  focus: () => void;
  hasChanges: () => boolean;
  destroy: () => void;
  // Enhanced utility methods
  insertContent: (content: string) => void;
  insertHTML: (html: string) => void;
  getWordCount: () => number;
  // Future-proof public API (Phase 2)
  exec?: (command: string, attrs?: any) => boolean;
  canExec?: (command: string, attrs?: any) => boolean;
};

/**
 * Editor initialization config.
 */
export type EditorConfig = {
  textarea?: string | HTMLTextAreaElement;   // bind: hide textarea and keep values synced
  initialJSON?: any;
  initialHTML?: string;
  placeholder?: string;                      // placeholder text for empty editor
  onChange?: (payload: EditorOutput) => void;

  // Performance
  debounceMs?: number;
  outputHTML?: boolean;

  // Optional UI
  toolbar?: ToolbarConfig;
};