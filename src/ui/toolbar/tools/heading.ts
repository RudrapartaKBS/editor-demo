import type { Tool } from "../../../core/types";
import { setHeading } from "../../../commands/blocks";

export const h1Tool: Tool = { id: "h1", label: "H1", run: (v) => setHeading(1)(v.state, v.dispatch) };
export const h2Tool: Tool = { id: "h2", label: "H2", run: (v) => setHeading(2)(v.state, v.dispatch) };
export const h3Tool: Tool = { id: "h3", label: "H3", run: (v) => setHeading(3)(v.state, v.dispatch) };