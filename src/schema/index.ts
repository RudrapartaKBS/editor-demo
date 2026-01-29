import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";


import { underline } from "./marks/underline";
import { textColorMark } from "./marks/textColor";
import { highlightMark } from "./marks/highlight";

const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");

// Extend marks
let marks = basicSchema.spec.marks;

// underline
marks = marks.addToEnd("underline", underline);

// text color
marks = marks.addToEnd("textColor", textColorMark);

// highlight
marks = marks.addToEnd("highlight", highlightMark);

export const schema = new Schema({
  nodes,
  marks,
});