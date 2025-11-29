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
    const page = currentPages[0];
    viewport.renderer.renderPage(page, true); // Debug mode on

    // Draw Cursor
    if (editorState.selection) {
      const sel = editorState.selection;
      let cursorX = 0;
      let cursorY = 0;
      let cursorHeight = 0;
      let found = false;

      // Find the glyph corresponding to the selection
      for (const glyph of page.glyphs) {
        if (glyph.source.paragraphIndex === sel.paragraphIndex &&
          glyph.source.spanIndex === sel.spanIndex) {

          if (glyph.source.charIndex === sel.charIndex) {
            // Cursor is before this char
            cursorX = glyph.x;
            cursorY = glyph.y;
            // Height: use font metrics
            const metrics = fontService.getVerticalMetrics(glyph.fontFamily, glyph.fontSize);
            cursorHeight = metrics.height;
            // Adjust Y to be top
            cursorY -= metrics.ascender;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        // Check if it's after the last char
        // We look for charIndex - 1
        for (const glyph of page.glyphs) {
          if (glyph.source.paragraphIndex === sel.paragraphIndex &&
            glyph.source.spanIndex === sel.spanIndex &&
            glyph.source.charIndex === sel.charIndex - 1) {

            // Cursor is after this char
            const width = fontService.getGlyphMetrics(glyph.fontFamily, glyph.char, glyph.fontSize);
            cursorX = glyph.x + width;

            cursorY = glyph.y;
            const metrics = fontService.getVerticalMetrics(glyph.fontFamily, glyph.fontSize);
            cursorHeight = metrics.height;
            cursorY -= metrics.ascender;
            found = true;
            break;
          }
        }
      }

      // Fallback for empty paragraph or start
      if (!found && sel.charIndex === 0) {
        // Start of paragraph
        for (const glyph of page.glyphs) {
          if (glyph.source.paragraphIndex === sel.paragraphIndex) {
            cursorX = glyph.x;
            cursorY = glyph.y;
            const metrics = fontService.getVerticalMetrics(glyph.fontFamily, glyph.fontSize);
            cursorHeight = metrics.height;
            cursorY -= metrics.ascender;
            found = true;
            break;
          }
        }
      }

      if (found) {
        viewport.renderer.drawCursor(cursorX, cursorY, cursorHeight, isCursorVisible);

        // Update hidden textarea position
        // We need to convert canvas coordinates to screen coordinates if canvas is not at 0,0
        // But InputManager sets position absolute on body.
        // Canvas is in #app.
        // We should add canvas offset.
        const rect = viewport.canvas.getBoundingClientRect();
        inputManager.updateCursorPosition(rect.left + cursorX, rect.top + cursorY);
      }
    }
  }

  requestAnimationFrame(actualRenderLoop);
}

requestAnimationFrame(actualRenderLoop);

// Add hit testing
viewport.canvas.addEventListener('mousedown', (event) => {
  // CRITICAL FIX: Prevent the default browser behavior.
  // This stops the browser from "blurring" our hidden textarea 
  // immediately after we try to focus it.
  event.preventDefault();

  const rect = viewport.canvas.getBoundingClientRect();

  // Account for border/padding if necessary, but clientX/rect is usually fine
  const logicalX = event.clientX - rect.left;
  const logicalY = event.clientY - rect.top;

  const selection = viewport.layoutEngine.hitTest(logicalX, logicalY);

  if (selection) {
    editorState.setSelection(selection);

    // Reset blink state so cursor is visible immediately on click
    isCursorVisible = true;
    lastBlinkTime = performance.now();

    // Focus the hidden input so the user can type
    inputManager.focus();

    // Debug log to confirm focus is held
    console.log('Selection set & Input focused');
  }
});
