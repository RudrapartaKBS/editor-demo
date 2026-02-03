import type { Tool } from "../../../core/types";
import { setHighlight } from "../../../commands/marks";

// Preset highlight colors
const HIGHLIGHT_PRESETS = [
  // Row 1: Classic highlights
  ['#FFFF00', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0'],
  // Row 2: Pastels
  ['#FCE4EC', '#F3E5F5', '#EDE7F6', '#E8EAF6', '#E3F2FD', '#E0F2F1', '#E8F5E8', '#FFF3E0'],
  // Row 3: Medium tones
  ['#F8BBD9', '#E1BEE7', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2DFDB', '#C8E6C9', '#FFE0B2'],
  // Row 4: Vibrant highlights
  ['#FF80AB', '#CE93D8', '#9FA8DA', '#90CAF9', '#81D4FA', '#80CBC4', '#A5D6A7', '#FFCC02'],
  // Row 5: Deep highlights
  ['#FF4081', '#BA68C8', '#7986CB', '#64B5F6', '#4FC3F7', '#4DB6AC', '#81C784', '#FFB74D'],
  // Row 6: Rich colors
  ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#FF9800']
];

let highlightDropdown: HTMLElement | null = null;

function createHighlightDropdown(view: any, currentColor?: string) {
  const dropdown = document.createElement('div');
  dropdown.className = 'myeditor-color-dropdown';
  dropdown.innerHTML = `
    <div class="color-dropdown-header">
      <span class="color-dropdown-title">Highlight Color</span>
    </div>
    
    <!-- Remove Highlight Option -->
    <div class="color-remove-section">
      <button class="color-remove-btn" data-color="">
        <span class="remove-icon">🚫</span>
        Remove highlight
      </button>
    </div>
    
    <!-- Preset Colors -->
    <div class="color-presets-section">
      <div class="color-section-label">PRESETS</div>
      <div class="color-presets-grid">
        ${HIGHLIGHT_PRESETS.map(row => 
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
        <input type="text" class="custom-color-input" placeholder="#FFFF00" value="${currentColor || '#FFFF00'}">
        <input type="color" class="custom-color-picker" value="${currentColor || '#FFFF00'}">
      </div>
    </div>
  `;
  
  // Add event listeners
  setupHighlightDropdownEvents(dropdown, view);
  
  return dropdown;
}

function setupHighlightDropdownEvents(dropdown: HTMLElement, view: any) {
  // Remove highlight button
  const removeBtn = dropdown.querySelector('.color-remove-btn');
  removeBtn?.addEventListener('click', () => {
    setHighlight(null)(view.state, view.dispatch);
    hideHighlightDropdown();
  });
  
  // Preset color buttons
  const presetBtns = dropdown.querySelectorAll('.color-preset');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = (e.target as HTMLElement).dataset.color;
      if (color) {
        setHighlight(color)(view.state, view.dispatch);
        hideHighlightDropdown();
      }
    });
  });
  
  // Custom color input
  const customInput = dropdown.querySelector('.custom-color-input') as HTMLInputElement;
  const colorPicker = dropdown.querySelector('.custom-color-picker') as HTMLInputElement;
  const preview = dropdown.querySelector('.custom-color-preview') as HTMLElement;
  
  function updateCustomHighlight(color: string) {
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      customInput.value = color;
      colorPicker.value = color;
      preview.style.backgroundColor = color;
    }
  }
  
  customInput?.addEventListener('input', (e) => {
    const color = (e.target as HTMLInputElement).value;
    updateCustomHighlight(color);
  });
  
  customInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const color = customInput.value;
      if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
        setHighlight(color)(view.state, view.dispatch);
        hideHighlightDropdown();
      }
    }
  });
  
  colorPicker?.addEventListener('change', (e) => {
    const color = (e.target as HTMLInputElement).value;
    updateCustomHighlight(color);
    setHighlight(color)(view.state, view.dispatch);
  });
  
  // Initialize preview
  updateCustomHighlight(customInput.value);
}

function showHighlightDropdown(button: HTMLElement, view: any) {
  hideHighlightDropdown(); // Close any existing dropdown
  
  highlightDropdown = createHighlightDropdown(view);
  document.body.appendChild(highlightDropdown);
  
  // Position dropdown
  const buttonRect = button.getBoundingClientRect();
  highlightDropdown.style.position = 'absolute';
  highlightDropdown.style.top = `${buttonRect.bottom + 5}px`;
  highlightDropdown.style.left = `${buttonRect.left}px`;
  highlightDropdown.style.zIndex = '9999';
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', handleHighlightOutsideClick);
  }, 100);
}

function hideHighlightDropdown() {
  if (highlightDropdown) {
    highlightDropdown.remove();
    highlightDropdown = null;
    document.removeEventListener('click', handleHighlightOutsideClick);
  }
}

function handleHighlightOutsideClick(e: Event) {
  if (highlightDropdown && !highlightDropdown.contains(e.target as Node)) {
    hideHighlightDropdown();
  }
}

export const highlightTool: Tool = {
  type: "button",
  id: "highlight",
  label: "🖍️",
  title: "Highlight text",
  run: (view, button) => {
    showHighlightDropdown(button as HTMLElement, view);
  },
};