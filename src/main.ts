import './style.css'
import { Viewport } from './core/viewport/Viewport';
import { createDocument, createParagraph, createSpan, createSection } from './core/model/DocumentModel';
import { EditorState } from './core/state/EditorState';
import { fontService } from './core/font/FontService';
import { InputManager } from './core/input/InputManager';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Sample text for testing justification
const sampleText = 'The Knuth-Plass algorithm is a line-breaking algorithm designed for the TeX typesetting system. It optimizes the aesthetic quality of line breaks by minimizing the "badness" of the paragraph as a whole, rather than just line by line. This results in more even spacing and fewer hyphens.';

// Create a sample document
const doc = createDocument([
  createSection([
    createParagraph([
      createSpan(sampleText, {
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
      }),
    ]),
  ]),
]);

// Initialize the viewport
const viewport = new Viewport(app, doc);

// Initialize Editor State
const editorState = new EditorState();

// Initialize Input Manager
// We need a way to trigger a re-render when text changes.
// We can use a dirty flag or just rely on the render loop checking something?
// The user suggested: "On Render Loop: If the EditorState has changed (dirty flag), re-run layoutEngine.layout()".
// But InputManager modifies DocumentModel directly.
// Let's add a dirty flag to the render loop scope.
let isDirty = true; // Initial layout needed

const inputManager = new InputManager(doc, editorState, () => {
  isDirty = true;
  // Reset blink on input
  isCursorVisible = true;
  lastBlinkTime = performance.now();
});

// Render Loop State
let isCursorVisible = true;
let lastBlinkTime = 0;

let currentPages: any[] = [];

function actualRenderLoop(timestamp: number) {
  // Blink logic
  if (timestamp - lastBlinkTime > 500) {
    isCursorVisible = !isCursorVisible;
    lastBlinkTime = timestamp;
  }

  if (isDirty) {
    currentPages = viewport.layoutEngine.layout(doc, viewport.pageConstraints);
    isDirty = false;
  }

  if (currentPages.length > 0) {
    viewport.renderer.renderDocument(currentPages);

    // Draw Selection Highlight
    if (editorState.selection) {
      const sorted = editorState.getSortedSelection();
      if (sorted) {
        let yOffset = 0;
        const gap = 20;
        for (const page of currentPages) {
          viewport.renderer.drawSelection(page, sorted, yOffset);
          yOffset += page.height + gap;
        }
      }
    }

    // Draw Cursor
    if (editorState.selection) {
      // Use head for cursor position
      const sel = editorState.selection.head;
      let cursorX = 0;
      let cursorY = 0;
      let cursorHeight = 0;
      let found = false;
      let pageYOffset = 0;
      const gap = 20;

      // Iterate through pages to find the cursor
      for (const page of currentPages) {
        // Search glyphs in this page
        for (const glyph of page.glyphs) {
          if (glyph.source.paragraphIndex === sel.paragraphIndex &&
            glyph.source.spanIndex === sel.spanIndex) {

            if (glyph.source.charIndex === sel.charIndex) {
              // Cursor is before this char
              cursorX = glyph.x;
              cursorY = glyph.y + pageYOffset; // Add page offset
              const metrics = fontService.getVerticalMetrics(glyph.fontFamily, glyph.fontSize);
              cursorHeight = metrics.height;
              cursorY -= metrics.ascender;
              found = true;
              break;
            }
          }
        }

        if (found) break;

        // Check if it's after the last char in this page
        // This is tricky because the paragraph might continue on next page.
        // We need to check if the selection matches a glyph that is the *last* one before the cursor?
        // Or just check for charIndex - 1.

        for (const glyph of page.glyphs) {
          if (glyph.source.paragraphIndex === sel.paragraphIndex &&
            glyph.source.spanIndex === sel.spanIndex &&
            glyph.source.charIndex === sel.charIndex - 1) {

            // Cursor is after this char
            const width = fontService.getGlyphMetrics(glyph.fontFamily, glyph.char, glyph.fontSize);
            cursorX = glyph.x + width;
            cursorY = glyph.y + pageYOffset;
            const metrics = fontService.getVerticalMetrics(glyph.fontFamily, glyph.fontSize);
            cursorHeight = metrics.height;
            cursorY -= metrics.ascender;
            found = true;
            break;
          }
        }

        if (found) break;

        // Fallback for empty paragraph at start of page?
        // If selection is at start of paragraph, and paragraph starts on this page.
        // We need to know if the paragraph starts here.
        // We can check if we have any glyphs for this paragraph on this page.

        // Simplified: Check if we found it. If not, increment offset and try next page.
        pageYOffset += page.height + gap;
      }

      // Special case: Empty paragraph (Ghost Box)
      // The ghost box is a glyph with char ''.
      // It should be found by the first loop (charIndex === 0).

      if (found) {
        viewport.renderer.drawCursor(cursorX, cursorY, cursorHeight, isCursorVisible);

        // Update hidden textarea position
        const rect = viewport.canvas.getBoundingClientRect();
        inputManager.updateCursorPosition(rect.left + cursorX, rect.top + cursorY);
      }
    }
  }

  requestAnimationFrame(actualRenderLoop);
}

requestAnimationFrame(actualRenderLoop);

// Handle Selection Change from Viewport
viewport.onSelectionChange = (anchor, head) => {
  editorState.setSelection(anchor, head);
  isCursorVisible = true;
  lastBlinkTime = performance.now();
  inputManager.focus();
  isDirty = true; // Trigger re-render to show selection
};

// Remove old mousedown listener (it's now handled in Viewport)
// viewport.canvas.addEventListener('mousedown', ...) -> REMOVED
