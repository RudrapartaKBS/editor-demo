import "./demo.css";
import "../src/styles";
import { createEditor } from "../src";

import { DEFAULT_TOOLS } from "../src/ui/toolbar/tools";

const statusText = document.getElementById("statusText") as HTMLElement;
const out = document.getElementById("out") as HTMLElement;
const wordCount = document.getElementById("wordCount") as HTMLElement;
const charCount = document.getElementById("charCount") as HTMLElement;
const lastSaved = document.getElementById("lastSaved") as HTMLElement;
const textarea = document.getElementById("desc") as HTMLTextAreaElement;

// Initial content for the editor
const initialContent = {
  "schemaVersion": 1,
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [{ "type": "text", "text": "Welcome to MyEditor Pro" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Start writing your " },
          { "type": "text", "marks": [{ "type": "strong" }], "text": "amazing content" },
          { "type": "text", "text": " here. This editor supports rich formatting, images, code blocks, and more!" }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [{ "type": "text", "text": "Features" }]
      },
      {
        "type": "bullet_list",
        "content": [
          {
            "type": "list_item",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "📸 Advanced image upload with positioning and zoom" }
                ]
              }
            ]
          },
          {
            "type": "list_item",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "💻 Code blocks with syntax highlighting" }
                ]
              }
            ]
          },
          {
            "type": "list_item",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "🎨 Rich text formatting and colors" }
                ]
              }
            ]
          }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Try the image button (🖼️) in the toolbar to upload images, or use the code block button (<>) for syntax highlighting!" }
        ]
      }
    ]
  }
};

// Function to count words and characters
function updateStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  
  if (wordCount) wordCount.textContent = words.toString();
  if (charCount) charCount.textContent = chars.toString();
}

// Function to update last saved time
function updateLastSaved() {
  if (lastSaved) {
    lastSaved.textContent = new Date().toLocaleTimeString();
  }
}

// Create the editor
const editor = createEditor("#editor", {
  textarea: "#desc",
  initialJSON: initialContent,
  toolbar: {
    target: "#toolbar",
    // Use two-row layout
    useRows: true,
  },
  onChange: ({ json, text }) => {
    out.textContent = JSON.stringify(json, null, 2);
    statusText.textContent = "Editing";
    updateStats(text);
    
    // Auto-save simulation
    setTimeout(() => {
      statusText.textContent = "Saved";
      updateLastSaved();
    }, 1000);
  },
});

console.log('🎯 Editor created successfully:', editor);
console.log('📋 Toolbar target element:', document.querySelector("#toolbar"));

// Copy JSON functionality
document.getElementById("copyJson")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(out.textContent || "");
    statusText.textContent = "JSON Copied!";
    setTimeout(() => statusText.textContent = "Ready", 2000);
  } catch {
    statusText.textContent = "Copy failed";
  }
});

// Export HTML functionality
document.getElementById("exportHtml")?.addEventListener("click", () => {
  const htmlContent = editor.getHTML();
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'article.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  statusText.textContent = "HTML Exported!";
  setTimeout(() => statusText.textContent = "Ready", 2000);
});

// Panel toggle functionality
document.getElementById("toggleJson")?.addEventListener("click", (e) => {
  const button = e.target as HTMLButtonElement;
  const panel = document.querySelector(".json-panel") as HTMLElement;
  
  if (panel.style.display === "none") {
    panel.style.display = "block";
    button.textContent = "Hide";
  } else {
    panel.style.display = "none";
    button.textContent = "Show";
  }
});

// Initialize stats
updateStats("");
updateLastSaved();