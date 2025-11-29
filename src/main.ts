import './style.css'
import { Viewport } from './core/viewport/Viewport';
import { createDocument, createParagraph, createSection } from './core/model/DocumentModel';
import { EditorState } from './core/state/EditorState';
import { fontService } from './core/font/FontService';
import { InputManager } from './core/input/InputManager';
import { Toolbar } from './core/ui/Toolbar';

const app = document.querySelector<HTMLDivElement>('#app')!;

// Sample text for testing justification
const sampleText = 'The Knuth-Plass algorithm is a line-breaking algorithm designed for the TeX typesetting system. It optimizes the aesthetic quality of line breaks by minimizing the "badness" of the paragraph as a whole, rather than just line by line. This results in more even spacing and fewer hyphens.';

async function initApp() {
  // Load Open Sans from the public folder
  await fontService.loadFont('Open Sans', '/OpenSans.ttf');

  // Create a sample document
  const doc = createDocument([
    createSection([
      createParagraph(sampleText, {
        fontFamily: 'Open Sans',
        fontSize: 16,
      }),
    ]),
  ]);

  // Initialize the viewport
  const viewport = new Viewport(app, doc);

  // Initialize Editor State
  const editorState = new EditorState();

  // Initialize Input Manager
  let isDirty = true; // Initial layout needed

  const inputManager = new InputManager(doc, editorState, () => {
    isDirty = true;
    // Reset blink on input
    isCursorVisible = true;
    lastBlinkTime = performance.now();
  });

  // Initialize Toolbar
  new Toolbar(doc, editorState, () => {
    isDirty = true;
    inputManager.focus(); // Ensure focus remains
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

          pageYOffset += page.height + gap;
        }

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
}

initApp();
