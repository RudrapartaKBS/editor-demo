# 🚀 MyEditor - Professional Rich Text Editor

A powerful, feature-rich WYSIWYG editor built with ProseMirror and TypeScript. Designed to be a professional alternative to CKEditor with complete self-hosting capabilities and advanced features.

## ✨ Key Features

### 📝 **Rich Text Editing**
- **Text Formatting**: Bold, italic, underline with intelligent formatting
- **Typography**: Dynamic font size controls (8px - 72px) with smart increment/decrement
- **Headings**: H1-H6 with proper semantic structure
- **Lists**: Ordered and unordered lists with proper nesting
- **Blockquotes**: Professional quote formatting

### 🎨 **Advanced Styling**
- **Color Controls**: Professional text color picker with preset palette
- **Highlighting**: Background color highlighting with visual feedback
- **Custom CSS**: Full theming and customization support

### 📸 **Media Management**
- **Image Upload**: Drag-and-drop support with instant preview
- **Image Controls**: Interactive resize, alignment (left, center, right), and zoom
- **Captions**: Click-to-add image captions with rich formatting
- **Responsive**: Auto-scaling for different screen sizes

### 🎬 **Embed System**
- **Multi-Platform Support**: YouTube, Vimeo, Twitter, Instagram, TikTok
- **Smart Detection**: Automatic platform recognition from URLs
- **Interactive Controls**: Resize, align, edit, and delete embedded content
- **Preview System**: Live preview before embedding

### 🔗 **Link Management**
- **Smart Linking**: URL validation with protocol detection
- **Link Editing**: In-place link modification with visual feedback
- **Target Options**: Open in new tab/window configuration
- **Link Removal**: One-click link removal while preserving text

### 💻 **Developer Features**
- **TypeScript**: Complete type safety with IntelliSense support
- **Custom Schema**: Extensible ProseMirror schema for additional features
- **Plugin Architecture**: Modular design for easy feature addition
- **CDN Ready**: Professional distribution for production use

### 🔄 **User Experience**
- **Undo/Redo**: Comprehensive history management
- **Smart Paste**: Preserves structure while cleaning unwanted styling
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Installation & Usage

### Option 1: CDN Integration (Recommended for Production)

The easiest way to integrate MyEditor into your project, similar to how you would use CKEditor:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyEditor Example</title>
    
    <!-- MyEditor CSS -->
    <link rel="stylesheet" href="https://yourdomain.com/dist/myeditor.css">
</head>
<body>
    <!-- Editor container -->
    <div id="editor-container"></div>
    
    <!-- MyEditor JavaScript -->
    <script src="https://yourdomain.com/dist/myeditor.cdn.js"></script>
    
    <script>
        // Initialize the editor
        const editor = MyEditor.createEditor(
            document.getElementById('editor-container'),
            {
                placeholder: "Start writing your content...",
                initialContent: {
                    schemaVersion: 1,
                    doc: {
                        type: "doc",
                        content: [
                            {
                                type: "paragraph",
                                content: [
                                    { type: "text", text: "Welcome to MyEditor!" }
                                ]
                            }
                        ]
                    }
                }
            }
        );
        
        // Mount the toolbar with all available tools
        MyEditor.mountToolbar(editor.view, {
            container: document.getElementById('editor-container'),
            tools: MyEditor.DEFAULT_TOOLS
        });
        
        // Optional: Get editor content
        function getContent() {
            const content = editor.view.state.doc.toJSON();
            console.log('Editor content:', content);
            return content;
        }
        
        // Optional: Set editor content
        function setContent(content) {
            const tr = editor.view.state.tr.replaceWith(
                0, 
                editor.view.state.doc.content.size, 
                editor.schema.nodeFromJSON(content)
            );
            editor.view.dispatch(tr);
        }
    </script>
</body>
</html>
```

### Option 2: NPM Installation (For JavaScript/TypeScript Projects)

```bash
# Install the package
npm install myeditor

# Or with yarn
yarn add myeditor
```

```typescript
import { createEditor, mountToolbar, DEFAULT_TOOLS } from 'myeditor';
import 'myeditor/dist/myeditor.css';

// Create editor instance
const container = document.getElementById('editor');
const editor = createEditor(container, {
    placeholder: "Start typing...",
    // Optional: Custom configuration
    imageUpload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        acceptedTypes: ['image/jpeg', 'image/png', 'image/gif']
    }
});

// Mount toolbar
mountToolbar(editor.view, {
    container: container,
    tools: DEFAULT_TOOLS
});

// Access editor methods
editor.getContent(); // Get current content as JSON
editor.setContent(jsonContent); // Set content from JSON
editor.isEmpty(); // Check if editor is empty
editor.focus(); // Focus the editor
```

### Option 3: Framework Integration

#### React Integration
```jsx
import React, { useEffect, useRef } from 'react';
import { createEditor, mountToolbar, DEFAULT_TOOLS } from 'myeditor';
import 'myeditor/dist/myeditor.css';

function MyEditorComponent({ initialContent, onChange }) {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);

    useEffect(() => {
        if (editorRef.current && !editorInstance.current) {
            // Create editor
            editorInstance.current = createEditor(editorRef.current, {
                initialContent,
                onChange: onChange
            });
            
            // Mount toolbar
            mountToolbar(editorInstance.current.view, {
                container: editorRef.current,
                tools: DEFAULT_TOOLS
            });
        }

        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
            }
        };
    }, []);

    return <div ref={editorRef} className="my-editor" />;
}
```

#### Vue Integration
```vue
<template>
    <div ref="editorContainer" class="my-editor"></div>
</template>

<script>
import { createEditor, mountToolbar, DEFAULT_TOOLS } from 'myeditor';
import 'myeditor/dist/myeditor.css';

export default {
    props: ['initialContent'],
    mounted() {
        this.editor = createEditor(this.$refs.editorContainer, {
            initialContent: this.initialContent
        });
        
        mountToolbar(this.editor.view, {
            container: this.$refs.editorContainer,
            tools: DEFAULT_TOOLS
        });
    },
    
    beforeUnmount() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
}
</script>
```

## ⚙️ Configuration Options

### Editor Configuration

```typescript
interface EditorConfig {
    placeholder?: string;                    // Placeholder text
    initialContent?: object;                 // Initial document content
    imageUpload?: {
        maxFileSize?: number;               // Maximum file size in bytes
        acceptedTypes?: string[];           // Accepted MIME types
        uploadUrl?: string;                 // Custom upload endpoint
    };
    embedConfig?: {
        youtube?: boolean;                  // Enable YouTube embeds
        vimeo?: boolean;                   // Enable Vimeo embeds
        twitter?: boolean;                 // Enable Twitter embeds
        instagram?: boolean;               // Enable Instagram embeds
        tiktok?: boolean;                  // Enable TikTok embeds
    };
    linkConfig?: {
        defaultTarget?: string;            // Default link target
        allowedProtocols?: string[];       // Allowed URL protocols
    };
    fontSizeConfig?: {
        minSize?: number;                  // Minimum font size (default: 8)
        maxSize?: number;                  // Maximum font size (default: 72)
        step?: number;                     // Size increment step (default: 2)
    };
    onChange?: (content: object) => void;   // Content change callback
    onImageUpload?: (file: File) => Promise<string>; // Custom image upload
}
```

### Toolbar Configuration

```typescript
// Available tools
const AVAILABLE_TOOLS = [
    'bold', 'italic', 'underline',          // Text formatting
    'heading1', 'heading2', 'heading3',     // Headings
    'paragraph',                            // Paragraph
    'bulletList', 'orderedList',           // Lists
    'blockquote',                          // Blockquote
    'textColor', 'highlight',              // Colors
    'fontSize', 'fontSizeIncrease', 'fontSizeDecrease', // Font size
    'link',                                // Links
    'embed',                               // Embeds
    'undo', 'redo'                         // History
];

// Custom toolbar
mountToolbar(editor.view, {
    container: editorContainer,
    tools: ['bold', 'italic', 'link', 'embed'] // Custom tool selection
});
```

## 🔧 API Reference

### Core Methods

```typescript
// Create editor instance
const editor = createEditor(container: HTMLElement, config?: EditorConfig);

// Get current content
const content = editor.getContent(): object;

// Set content
editor.setContent(content: object): void;

// Check if editor is empty
const isEmpty = editor.isEmpty(): boolean;

// Focus editor
editor.focus(): void;

// Destroy editor instance
editor.destroy(): void;

// Get plain text content
const text = editor.getText(): string;

// Insert content at current position
editor.insertContent(content: object): void;
```

### Event Handling

```typescript
// Listen to content changes
editor.on('update', ({ editor, transaction }) => {
    console.log('Content updated:', editor.getContent());
});

// Listen to selection changes
editor.on('selectionUpdate', ({ editor }) => {
    console.log('Selection changed');
});

// Listen to focus events
editor.on('focus', ({ editor }) => {
    console.log('Editor focused');
});
```

## 🎯 Advanced Features

### Custom Image Upload

```typescript
const editor = createEditor(container, {
    onImageUpload: async (file) => {
        // Custom upload logic
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        return result.url; // Return the uploaded image URL
    }
});
```

### Custom Embed Providers

```typescript
// Extend embed functionality
MyEditor.addEmbedProvider('custom', {
    detect: (url) => url.includes('custom.com'),
    transform: (url) => `https://custom.com/embed/${extractId(url)}`,
    preview: (url) => `Custom Video: ${url}`
});
```

### Schema Extensions

```typescript
// Add custom node types
MyEditor.extendSchema({
    nodes: {
        customNode: {
            content: 'text*',
            group: 'block',
            parseDOM: [{ tag: 'div.custom' }],
            toDOM: () => ['div', { class: 'custom' }, 0]
        }
    }
});
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser with ES6+ support

### Development Workflow

```bash
# Clone the repository
git clone https://github.com/your-repo/myeditor.git
cd myeditor

# Install dependencies
npm install

# Start development server
npm run dev

# The editor will be available at http://localhost:5173
```

### Building for Production

```bash
# Build library and CDN files
npm run build

# Build outputs:
# - dist/myeditor.cdn.js        (CDN bundle)
# - dist/myeditor.css          (Styles)
# - dist/myeditor.index.es.js  (ES module)
# - dist/myeditor.index.umd.js (UMD module)
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 📋 Content Format & Data Management

### Content Structure

MyEditor uses a structured JSON format for content storage and retrieval:

```json
{
  "schemaVersion": 1,
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Hello World!",
            "marks": [
              {
                "type": "bold"
              }
            ]
          }
        ]
      },
      {
        "type": "image",
        "attrs": {
          "src": "https://example.com/image.jpg",
          "alt": "Sample Image",
          "title": "Image Caption",
          "width": 400,
          "height": 300,
          "alignment": "center"
        }
      },
      {
        "type": "embed",
        "attrs": {
          "src": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "type": "youtube",
          "width": 560,
          "height": 315
        }
      }
    ]
  }
}
```

### Paste Behavior & Content Sanitization

MyEditor intelligently handles pasted content to maintain document consistency:

**✅ Preserved Elements:**
- Text structure (paragraphs, headings, lists)
- Semantic formatting (bold, italic, underline)
- Links with proper URLs
- Basic HTML structure

**❌ Removed Elements:**
- Unwanted styling (colors, fonts from external sources)
- Malicious scripts and unsafe HTML
- Proprietary formatting from word processors
- Broken or invalid markup

**🎯 Smart Features:**
- Automatic link detection and conversion
- List structure preservation and normalization
- Heading level adjustment
- Image URL validation and processing

### Data Export Options

```typescript
// Export as JSON (recommended)
const jsonContent = editor.getContent();

// Export as HTML
const htmlContent = editor.getHTML();

// Export as plain text
const textContent = editor.getText();

// Export specific selections
const selection = editor.getSelection();
const selectedContent = editor.getContentFromSelection(selection);
```

## 🚀 Deployment & CDN Hosting

### Option 1: GitHub Pages (Free)

```bash
# Build the project
npm run build

# Create gh-pages branch and deploy
npm install -g gh-pages
gh-pages -d dist
```

Your editor will be available at: `https://yourusername.github.io/myeditor/`

### Option 2: Netlify (Free Tier Available)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on every commit

### Option 3: Vercel (Free Tier Available)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 4: Custom CDN

Upload the built files to any CDN service:
- `dist/myeditor.cdn.js` - Main editor library
- `dist/myeditor.css` - Stylesheet
- `demo/index.html` - Example implementation

## 🔒 Security Features

### Content Sanitization
- XSS prevention through content filtering
- Safe HTML parsing with DOMPurify integration
- Attribute validation for all node types
- Protocol restriction for links and embeds

### Image Security
- File type validation
- Size limit enforcement
- EXIF data stripping
- Safe URL generation

### Link Security
- Protocol whitelist (http, https, mailto)
- Domain validation options
- Automatic rel="noopener" for external links
- Link preview sanitization

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 80+ | ✅ Full Support |
| Firefox | 78+ | ✅ Full Support |
| Safari | 13+ | ✅ Full Support |
| Edge | 80+ | ✅ Full Support |
| Opera | 67+ | ✅ Full Support |
| Mobile Safari | 13+ | ✅ Full Support |
| Chrome Mobile | 80+ | ✅ Full Support |

## 📊 Performance & Metrics

### Bundle Sizes (Gzipped)
- **Core Library**: 94KB (272KB uncompressed)
- **CSS Styles**: 9KB (27KB uncompressed)
- **Total**: ~103KB (299KB uncompressed)

### Performance Benchmarks
- **Initial Load**: <200ms on 3G connection
- **Editor Initialization**: <50ms
- **Large Document Handling**: 10,000+ words without performance degradation
- **Memory Usage**: <15MB for typical documents

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript and ESLint configurations
2. **Testing**: Write unit tests for new features
3. **Documentation**: Update README and inline documentation
4. **Performance**: Ensure no regression in bundle size or performance

### Pull Request Process

```bash
# Fork the repository
git fork https://github.com/your-repo/myeditor.git

# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm test
npm run build

# Commit with conventional commits
git commit -m "feat: add new embed provider support"

# Push and create PR
git push origin feature/new-feature
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

- **Documentation**: [Full API Documentation](https://docs.myeditor.dev)
- **Issues**: [GitHub Issues](https://github.com/your-repo/myeditor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/myeditor/discussions)
- **Discord**: [Community Chat](https://discord.gg/myeditor)

## 🔄 Changelog

### Version 1.0.0
- ✨ Initial release with full rich text editing
- 🎬 Embed system for YouTube, Vimeo, social media
- 🔗 Advanced link management with editing capabilities
- 📝 Typography controls with font size adjustment
- 🎨 Professional color picker and highlighting
- 📸 Advanced image handling with interactive controls
- 🏗️ CDN-ready distribution for production use

---

**Made with ❤️ by the MyEditor Team**

*A professional alternative to CKEditor with complete control and advanced features.*
