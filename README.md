# MyEditor

Self-hosted ProseMirror based editor library.

## Run demo (local)

```bash
npm i
npm run dev
```

Open the URL printed by Vite.

## Build library (CDN or NPM)

```bash
npm run build
```

Outputs:

- `dist/myeditor.index.es.js` and `dist/myeditor.index.umd.js`
- `dist/myeditor.styles.es.js` and `dist/myeditor.styles.umd.js` (loads CSS)

## Paste behavior (important)

- Paste keeps **structure**: paragraphs, headings, lists, bold, italic, underline, links
- Paste removes styling: no random colors/highlights from websites
- Colors/highlights are added **only when user clicks your toolbar buttons**
