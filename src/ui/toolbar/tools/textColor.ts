import type { Tool } from "../../../core/types";
import { setTextColor } from "../../../commands/marks";

// Preset color palette like CKEditor
const COLOR_PRESETS = [
  // Row 1: Grays and basic colors
  ['#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F3F7', '#FFFFFF'],
  // Row 2: Reds
  ['#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF'],
  // Row 3: Light variations
  ['#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7', '#D6D6E7', '#E7D6DE'],
  // Row 4: Medium variations
  ['#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF', '#B5A5D6', '#D6A5BD'],
  // Row 5: Dark variations
  ['#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE', '#8C7BC6', '#C67BA5'],
  // Row 6: Darker variations
  ['#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6', '#634AA5', '#A54A7B'],
  // Row 7: Very dark
  ['#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294', '#311873', '#731842'],
  // Row 8: Darkest
  ['#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163', '#21104A', '#4A1031']
];

let colorDropdown: HTMLElement | null = null;

function createColorDropdown(view: any, currentColor?: string) {
  const dropdown = document.createElement('div');
  dropdown.className = 'myeditor-color-dropdown';
  dropdown.innerHTML = `
    <div class="color-dropdown-header">
      <span class="color-dropdown-title">Text Color</span>
    </div>
    
    <!-- Remove Color Option -->
    <div class="color-remove-section">
      <button class="color-remove-btn" data-color="">
        <span class="remove-icon">🚫</span>
        Remove color
      </button>
    </div>
    
    <!-- Preset Colors -->
    <div class="color-presets-section">
      <div class="color-section-label">PRESETS</div>
      <div class="color-presets-grid">
        ${COLOR_PRESETS.map(row => 
          `<div class="color-row">
            ${row.map(color => 
              `<button class="color-preset" data-color="${color}" style="background-color: ${color}" title="${color}"></button>`
            ).join('')}
          </div>`
        ).join('')}
      </div>
    </div>
    
    <!-- Custom Color -->
    <div class="color-custom-section">
      <div class="color-section-label">CUSTOM</div>
      <div class="custom-color-controls">
        <div class="custom-color-preview"></div>
        <input type="text" class="custom-color-input" placeholder="#000000" value="${currentColor || '#000000'}">
        <input type="color" class="custom-color-picker" value="${currentColor || '#000000'}">
      </div>
    </div>
  `;
  
  // Add event listeners
  setupColorDropdownEvents(dropdown, view);
  
  return dropdown;
}

function setupColorDropdownEvents(dropdown: HTMLElement, view: any) {
  // Remove color button
  const removeBtn = dropdown.querySelector('.color-remove-btn');
  removeBtn?.addEventListener('click', () => {
    setTextColor(null)(view.state, view.dispatch);
    hideColorDropdown();
  });
  
  // Preset color buttons
  const presetBtns = dropdown.querySelectorAll('.color-preset');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = (e.target as HTMLElement).dataset.color;
      if (color) {
        setTextColor(color)(view.state, view.dispatch);
        hideColorDropdown();
      }
    });
  });
  
  // Custom color input
  const customInput = dropdown.querySelector('.custom-color-input') as HTMLInputElement;
  const colorPicker = dropdown.querySelector('.custom-color-picker') as HTMLInputElement;
  const preview = dropdown.querySelector('.custom-color-preview') as HTMLElement;
  
  function updateCustomColor(color: string) {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      customInput.value = color;
      colorPicker.value = color;
      preview.style.backgroundColor = color;
    }
  }
  
  customInput?.addEventListener('input', (e) => {
    const color = (e.target as HTMLInputElement).value;
    updateCustomColor(color);
  });
  
  customInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const color = customInput.value;
      if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
        setTextColor(color)(view.state, view.dispatch);
        hideColorDropdown();
      }
    }
  });
  
  colorPicker?.addEventListener('change', (e) => {
    const color = (e.target as HTMLInputElement).value;
    updateCustomColor(color);
    setTextColor(color)(view.state, view.dispatch);
  });
  
  // Initialize preview
  updateCustomColor(customInput.value);
}

function showColorDropdown(button: HTMLElement, view: any) {
  hideColorDropdown(); // Close any existing dropdown
  
  colorDropdown = createColorDropdown(view);
  document.body.appendChild(colorDropdown);
  
  // Position dropdown
  const buttonRect = button.getBoundingClientRect();
  colorDropdown.style.position = 'absolute';
  colorDropdown.style.top = `${buttonRect.bottom + 5}px`;
  colorDropdown.style.left = `${buttonRect.left}px`;
  colorDropdown.style.zIndex = '9999';
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}

function hideColorDropdown() {
  if (colorDropdown) {
    colorDropdown.remove();
    colorDropdown = null;
    document.removeEventListener('click', handleOutsideClick);
  }
}

function handleOutsideClick(e: Event) {
  if (colorDropdown && !colorDropdown.contains(e.target as Node)) {
    hideColorDropdown();
  }
}

export const textColorTool: Tool = {
  type: "button",
  id: "text_color",
  label: "A",
  title: "Text color",
  run: (view, button) => {
    showColorDropdown(button as HTMLElement, view);
  },
};