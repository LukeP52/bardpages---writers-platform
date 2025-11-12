// Debug script to test selection behavior
// Run in browser console when the issue occurs

console.log('=== Selection Debug Script ===');

// Check if there's a current selection
function checkSelection() {
  const selection = window.getSelection();
  console.log('Window selection:', {
    toString: selection.toString(),
    rangeCount: selection.rangeCount,
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset
  });
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    console.log('Range:', {
      collapsed: range.collapsed,
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      text: range.toString()
    });
  }
}

// Check Quill selection
function checkQuillSelection() {
  // Look for Quill instances
  const quillElements = document.querySelectorAll('.ql-editor');
  console.log('Found Quill editors:', quillElements.length);
  
  quillElements.forEach((element, index) => {
    console.log(`Editor ${index}:`, {
      hasFocus: element === document.activeElement,
      innerHTML: element.innerHTML.substring(0, 100) + '...'
    });
  });
  
  // Try to access Quill instance from global scope if available
  if (window.quill) {
    const quillSelection = window.quill.getSelection();
    console.log('Quill selection:', quillSelection);
  }
}

// Check for modal interference
function checkModalState() {
  const modals = document.querySelectorAll('[class*="modal"], [class*="fixed"], [class*="z-50"]');
  console.log('Found potential modals:', modals.length);
  
  modals.forEach((modal, index) => {
    console.log(`Modal ${index}:`, {
      className: modal.className,
      isVisible: modal.offsetParent !== null,
      zIndex: window.getComputedStyle(modal).zIndex
    });
  });
}

// Run all checks
console.log('--- Current Selection State ---');
checkSelection();
checkQuillSelection();
checkModalState();

// Monitor selection changes
document.addEventListener('selectionchange', () => {
  console.log('Selection changed!');
  checkSelection();
});

console.log('Debug script loaded. Selection changes will be logged.');