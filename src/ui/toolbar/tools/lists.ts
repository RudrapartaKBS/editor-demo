import type { Tool } from "../../../core/types";
import { toggleBulletList, toggleOrderedList, liftList } from "../../../commands/lists";

export const bulletListTool: Tool = {
  type: "button",
  id: "bullet_list",
  label: "• List",
  title: "Bullet list",
  run: (v) => toggleBulletList(v.state, v.dispatch),
};

export const orderedListTool: Tool = {
  type: "button",
  id: "ordered_list",
  label: "1. List",
  title: "Ordered list",
  run: (v) => toggleOrderedList(v.state, v.dispatch),
};

export const liftListTool: Tool = {
  type: "button",
  id: "lift_list",
  label: "↩",
  title: "Outdent list",
  run: (v) => liftList(v.state, v.dispatch),
};



// import type { Tool } from "../../../core/types";
// import { toggleBulletList, toggleOrderedList, liftList } from "../../../commands/lists";

// export const bulletListTool: Tool = {
//   id: "bullet_list",
//   label: "• List",
//   run: (v) => toggleBulletList(v.state, v.dispatch),
// };

// export const orderedListTool: Tool = {
//   id: "ordered_list",
//   label: "1. List",
//   run: (v) => toggleOrderedList(v.state, v.dispatch),
// };

// export const liftListTool: Tool = {
//   id: "lift_list",
//   label: "↩",
//   title: "Outdent list",
//   run: (v) => liftList(v.state, v.dispatch),
// };