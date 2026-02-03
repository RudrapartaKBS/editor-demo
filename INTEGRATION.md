# 🚀 MyEditor Integration Guide

## CKEditor की तरह use करने के लिए:

### 1. CDN से Use करें

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
    
    <!-- MyEditor CSS (required) -->
    <link rel="stylesheet" href="https://yourdomain.com/dist/myeditor.css">
</head>
<body>
    <!-- Editor container -->
    <div id="my-editor"></div>
    
    <!-- MyEditor JavaScript -->
    <script src="https://yourdomain.com/dist/myeditor.cdn.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Create editor instance
            const editor = MyEditor.createEditor(
                document.getElementById('my-editor'),
                {
                    placeholder: "Type something awesome...",
                    // Optional: Set initial content
                    initialContent: {
                        schemaVersion: 1,
                        doc: {
                            type: "doc",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Welcome!" }]
                                }
                            ]
                        }
                    }
                }
            );
            
            // Mount toolbar with all tools
            MyEditor.mountToolbar(editor.view, {
                container: document.getElementById('my-editor'),
                tools: MyEditor.DEFAULT_TOOLS // All available tools
            });
            
            // Store editor globally for later use
            window.myEditorInstance = editor;
        });
        
        // Example: Get content
        function saveContent() {
            const content = window.myEditorInstance.getContent();
            console.log('Current content:', content);
            
            // Send to your backend
            fetch('/api/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });
        }
        
        // Example: Set content programmatically
        function loadContent() {
            const loadedContent = {
                schemaVersion: 1,
                doc: {
                    type: "doc",
                    content: [
                        {
                            type: "heading",
                            attrs: { level: 1 },
                            content: [{ type: "text", text: "Loaded Content" }]
                        },
                        {
                            type: "paragraph",
                            content: [
                                { type: "text", text: "This was loaded from server!" }
                            ]
                        }
                    ]
                }
            };
            
            window.myEditorInstance.setContent(loadedContent);
        }
    </script>
</body>
</html>
```

### 2. Self-Host करने के steps:

#### Step 1: Build करें
```bash
npm install
npm run build
```

#### Step 2: Files को अपने server पर upload करें
```
your-website.com/
  assets/
    myeditor/
      myeditor.cdn.js    (236KB)
      myeditor.css       (7KB)
```

#### Step 3: अपनी website में include करें
```html
<link rel="stylesheet" href="/assets/myeditor/myeditor.css">
<script src="/assets/myeditor/myeditor.cdn.js"></script>
```

### 3. Advanced Configuration

#### Custom Upload Handler
```javascript
const editor = MyEditor.createEditor(container, {
    uploadConfig: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        uploadHandler: async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': 'Bearer ' + yourAuthToken
                }
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const result = await response.json();
            return result.imageUrl; // Return the URL of uploaded image
        }
    }
});
```

#### Custom Toolbar
```javascript
// Only specific tools
MyEditor.mountToolbar(editor.view, {
    container: document.getElementById('editor'),
    tools: [
        MyEditor.boldTool,
        MyEditor.italicTool,
        MyEditor.underlineTool,
        MyEditor.imageTool,
        MyEditor.undoTool,
        MyEditor.redoTool
    ]
});
```

#### Multiple Editors on Same Page
```javascript
// Editor 1
const editor1 = MyEditor.createEditor(document.getElementById('editor1'));
MyEditor.mountToolbar(editor1.view, {
    container: document.getElementById('editor1'),
    tools: MyEditor.DEFAULT_TOOLS
});

// Editor 2 
const editor2 = MyEditor.createEditor(document.getElementById('editor2'));
MyEditor.mountToolbar(editor2.view, {
    container: document.getElementById('editor2'),
    tools: [MyEditor.boldTool, MyEditor.italicTool] // Limited tools
});
```

### 4. WordPress/PHP Integration Example

```php
<?php
// In your theme's functions.php or plugin
function enqueue_myeditor() {
    wp_enqueue_style('myeditor-css', 'https://yourdomain.com/dist/myeditor.css');
    wp_enqueue_script('myeditor-js', 'https://yourdomain.com/dist/myeditor.cdn.js', [], '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_myeditor');
?>

<!-- In your template -->
<div id="content-editor"></div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.MyEditor) {
        const editor = MyEditor.createEditor(
            document.getElementById('content-editor'),
            {
                placeholder: "Write your blog post..."
            }
        );
        
        MyEditor.mountToolbar(editor.view, {
            container: document.getElementById('content-editor'),
            tools: MyEditor.DEFAULT_TOOLS
        });
        
        // Save to WordPress
        document.getElementById('publish-button').onclick = function() {
            const content = editor.getContent();
            
            fetch('/wp-admin/admin-ajax.php', {
                method: 'POST',
                body: new FormData(Object.assign(document.createElement('form'), {
                    innerHTML: `<input name="action" value="save_editor_content">
                               <input name="content" value="${JSON.stringify(content)}">
                               <input name="nonce" value="${wpNonce}">`
                }))
            });
        };
    }
});
</script>
```

### 5. Benefits over CKEditor

| Feature | MyEditor | CKEditor |
|---------|----------|----------|
| **File Size** | 237KB total | 500KB+ |
| **Dependencies** | Self-contained | External dependencies |
| **Customization** | Full control | Limited |
| **Hosting** | Your server | Their CDN |
| **Privacy** | 100% private | Data may be tracked |
| **Cost** | Free forever | Paid plans |
| **TypeScript** | Built-in | Additional setup |

### 6. Migration from CKEditor

```javascript
// Old CKEditor code
CKEDITOR.replace('editor1', {
    toolbar: 'Basic'
});

// New MyEditor code
const editor = MyEditor.createEditor(
    document.getElementById('editor1'),
    { placeholder: "Start typing..." }
);

MyEditor.mountToolbar(editor.view, {
    container: document.getElementById('editor1'),
    tools: [
        MyEditor.boldTool,
        MyEditor.italicTool,
        MyEditor.undoTool,
        MyEditor.redoTool
    ]
});
```

## 🎯 Ready to Use!

अब आपका editor बिल्कुल CKEditor की तरह ready है! 🚀

- CDN से load हो सकता है
- Self-hosted है
- Fast और lightweight है
- TypeScript support है
- सभी modern features हैं