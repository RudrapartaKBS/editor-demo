import { EditorView } from "prosemirror-view";
import { increaseFontSize, decreaseFontSize, getCurrentFontSize } from "../../../commands/fontSize";

export const fontSizeIncreaseTool = {
  name: "fontSizeIncrease",
  title: "Increase Font Size",
  icon: "A+",
  action: (view: EditorView) => {
    increaseFontSize()(view.state, view.dispatch);
  },
  isActive: () => false,
  isEnabled: () => true,
};

export const fontSizeDecreaseTool = {
  name: "fontSizeDecrease", 
  title: "Decrease Font Size",
  icon: "A-",
  action: (view: EditorView) => {
    decreaseFontSize()(view.state, view.dispatch);
  },
  isActive: () => false,
  isEnabled: () => true,
};

export const fontSizeDropdownTool = {
  name: "fontSizeDropdown",
  title: "Font Size",
  icon: "A",
  isDropdown: true,
  action: (view: EditorView, container: HTMLElement) => {
    const currentSize = getCurrentFontSize(view.state);
    
    const dropdown = document.createElement("div");
    dropdown.className = "myeditor-dropdown font-size-dropdown";
    dropdown.innerHTML = `
      <div class="dropdown-header">
        <span>Font Size</span>
        <span class="current-size">${currentSize}px</span>
      </div>
      <div class="size-controls">
        <button class="size-btn decrease-btn" title="Decrease">A-</button>
        <input type="range" class="size-slider" min="8" max="72" step="2" value="${currentSize}">
        <button class="size-btn increase-btn" title="Increase">A+</button>
      </div>
      <div class="size-presets">
        <button class="preset-btn" data-size="12">Small (12px)</button>
        <button class="preset-btn" data-size="14">Normal (14px)</button>
        <button class="preset-btn ${currentSize === 16 ? 'active' : ''}" data-size="16">Default (16px)</button>
        <button class="preset-btn" data-size="18">Large (18px)</button>
        <button class="preset-btn" data-size="24">X-Large (24px)</button>
        <button class="preset-btn" data-size="32">XX-Large (32px)</button>
      </div>
    `;

    const slider = dropdown.querySelector(".size-slider") as HTMLInputElement;
    const currentSizeSpan = dropdown.querySelector(".current-size") as HTMLElement;
    const decreaseBtn = dropdown.querySelector(".decrease-btn") as HTMLButtonElement;
    const increaseBtn = dropdown.querySelector(".increase-btn") as HTMLButtonElement;
    const presetBtns = dropdown.querySelectorAll(".preset-btn");

    // Slider control
    slider.addEventListener("input", () => {
      const newSize = parseInt(slider.value);
      currentSizeSpan.textContent = `${newSize}px`;
    });

    slider.addEventListener("change", () => {
      const newSize = parseInt(slider.value);
      setFontSize(newSize)(view.state, view.dispatch);
      dropdown.remove();
      view.focus();
    });

    // Decrease button
    decreaseBtn.addEventListener("click", () => {
      decreaseFontSize()(view.state, view.dispatch);
      dropdown.remove();
      view.focus();
    });

    // Increase button  
    increaseBtn.addEventListener("click", () => {
      increaseFontSize()(view.state, view.dispatch);
      dropdown.remove();
      view.focus();
    });

    // Preset buttons
    presetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const size = parseInt(btn.getAttribute("data-size") || "16");
        setFontSize(size)(view.state, view.dispatch);
        dropdown.remove();
        view.focus();
      });
    });

    // Position and show dropdown
    const rect = container.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.top = rect.bottom + "px";
    dropdown.style.left = rect.left + "px";
    dropdown.style.zIndex = "1000";

    document.body.appendChild(dropdown);

    // Click outside to close
    setTimeout(() => {
      document.addEventListener("click", function closeDropdown(e) {
        if (!dropdown.contains(e.target as Node)) {
          dropdown.remove();
          document.removeEventListener("click", closeDropdown);
        }
      });
    }, 0);
  },
  isActive: () => false,
  isEnabled: () => true,
};

function setFontSize(size: number) {
  return (state: any, dispatch: any) => {
    const { schema, selection } = state;
    const fontSizeMark = schema.marks.fontSize;

    if (!fontSizeMark) return false;

    const { from, to } = selection;
    
    let tr = state.tr;
    
    // Remove existing fontSize mark
    tr = tr.removeMark(from, to, fontSizeMark);
    
    // Add new fontSize mark if not default
    if (size !== 16) {
      tr = tr.addMark(from, to, fontSizeMark.create({ size: String(size) }));
    }
    
    dispatch(tr);
    return true;
  };
}