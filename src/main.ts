import './style.css'
import { Viewport } from './core/viewport/Viewport';
import { createDocument, createParagraph, createSpan, createSection } from './core/model/DocumentModel';
import { EditorState } from './core/state/EditorState';
import { fontService } from './core/font/FontService';

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

// Render Loop State
let isCursorVisible = true;
let lastBlinkTime = 0;

function renderLoop(timestamp: number) {
  // Blink logic
  if (timestamp - lastBlinkTime > 500) {
    isCursorVisible = !isCursorVisible;
    lastBlinkTime = timestamp;
  }

  // Layout (ideally only when changed, but for now every frame is fine for small doc)
  const pages = viewport.layoutEngine.layout(doc, viewport.pageConstraints);

  if (pages.length > 0) {
    const page = pages[0];
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
            cursorX = glyph.x + width; // Use rendered width? Or metric width? 
            // Glyph doesn't store width, but we can calculate or use x difference if we had next glyph.
            // Using metric width is safer for now.
            // Wait, if justified, glue might be involved.
            // But we are looking at BOX glyphs usually.
            // If the last item was GLUE, we might have an issue.
            // But hitTest returns charIndex.

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
        // We need to find where the paragraph starts.
        // We can look for the first glyph of the paragraph.
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
      }
    }
  }

  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

// Add hit testing
viewport.canvas.addEventListener('mousedown', (event) => {
  const rect = viewport.canvas.getBoundingClientRect();

  // We need to account for DPR in hit test if the layout engine works in logical pixels
  const logicalX = event.clientX - rect.left;
  const logicalY = event.clientY - rect.top;

  const selection = viewport.layoutEngine.hitTest(logicalX, logicalY);

  if (selection) {
    editorState.setSelection(selection);
    // Reset blink
    isCursorVisible = true;
    lastBlinkTime = performance.now();
  }
});
