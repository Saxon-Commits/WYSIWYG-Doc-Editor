import './style.css'
import { Viewport } from './core/viewport/Viewport';
import { createDocument, createParagraph, createSpan, createSection } from './core/model/DocumentModel';

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
// The Viewport class handles the LayoutEngine and CanvasRenderer internally for now.
// We might need to update Viewport to accept debug flag or just rely on its internal setup.
// Based on previous Viewport implementation, it creates LayoutEngine and Renderer.
// Let's check Viewport implementation to ensure it passes the debug flag if needed.
// For now, standard initialization.
new Viewport(app, doc);
