import type { Tool } from "../../../core/types";
import { toggleBulletList, toggleOrderedList, liftList } from "../../../commands/lists";

export const bulletListTool: Tool = {
  id: "bullet_list",
  label: "• List",
  run: (v) => toggleBulletList(v.state, v.dispatch),
};

export const orderedListTool: Tool = {
  id: "ordered_list",
  label: "1. List",
  run: (v) => toggleOrderedList(v.state, v.dispatch),
};

export const liftListTool: Tool = {
  id: "lift_list",
  label: "↩",
  title: "Outdent list",
  run: (v) => liftList(v.state, v.dispatch),
};