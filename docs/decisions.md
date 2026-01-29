# Decisions

## Public name
MyEditor

## Primary output
JSON-first.

`{ schemaVersion, doc }`

## Browser support
Modern browsers only: Chrome, Edge, Firefox, Safari.

## Paste policy
Pasted HTML is sanitized to allow only semantic formatting:

- Headings
- Paragraphs
- Lists
- Bold, Italic, Underline
- Links

All inline styles are stripped. Color/highlight marks are only produced by explicit editor commands.

## Schema versioning
Increment `SCHEMA_VERSION` when you change schema in a breaking way.
Add a migration layer before raising it.
