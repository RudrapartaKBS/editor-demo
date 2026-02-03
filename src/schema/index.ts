import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";

import { underline } from "./marks/underline";
import { textColorMark } from "./marks/textColor";
import { highlightMark } from "./marks/highlight";
import { linkMark } from "./marks/link";
import { fontSizeMark } from "./marks/fontSize";
import { imageNode, codeBlockNode, figureNode, figcaptionNode, embed } from "./nodes";

// Start with basic nodes and add lists
let nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");

// Add custom nodes
nodes = nodes.addToEnd("image", imageNode);
nodes = nodes.addToEnd("code_block", codeBlockNode);
nodes = nodes.addToEnd("figure", figureNode);
nodes = nodes.addToEnd("figcaption", figcaptionNode);
nodes = nodes.addToEnd("embed", embed);

// Extend marks
let marks = basicSchema.spec.marks;

// underline
marks = marks.addToEnd("underline", underline);

// text color
marks = marks.addToEnd("textColor", textColorMark);

// highlight
marks = marks.addToEnd("highlight", highlightMark);

// link
marks = marks.addToEnd("link", linkMark);

// font size
marks = marks.addToEnd("fontSize", fontSizeMark);

export const schema = new Schema({
  nodes,
  marks,
});