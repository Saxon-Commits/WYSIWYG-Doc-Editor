import '../style.css'
import { Viewport } from './viewport/Viewport';
import { createDocument, createParagraph, createSection } from './model/DocumentModel';
import type { DocumentModel } from './model/DocumentModel';
import { EditorState } from './state/EditorState';
import { fontService } from './font/FontService';
import { InputManager } from './input/InputManager';
import { Toolbar } from './ui/Toolbar';
import { storageService, supabase } from './services/StorageService';

// Export mount function for React
export async function mountEditor(container: HTMLElement, docId?: string) {
    const sampleText = 'Start typing your document...';
    // 1. Load Fonts
    await Promise.all([
        // Roboto
        fontService.loadFont('Roboto', '/Roboto-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Roboto', '/Roboto-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Roboto', '/Roboto-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Roboto', '/Roboto-BoldItalic.ttf', { weight: '700', style: 'italic' }),

        // Open Sans
        fontService.loadFont('Open Sans', '/OpenSans-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Open Sans', '/OpenSans-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Open Sans', '/OpenSans-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Open Sans', '/OpenSans-BoldItalic.ttf', { weight: '700', style: 'italic' }),

        // Merriweather
        fontService.loadFont('Merriweather', '/Merriweather-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Merriweather', '/Merriweather-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Merriweather', '/Merriweather-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Merriweather', '/Merriweather-BoldItalic.ttf', { weight: '700', style: 'italic' }),

        // Playfair Display
        fontService.loadFont('Playfair Display', '/PlayfairDisplay-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Playfair Display', '/PlayfairDisplay-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Playfair Display', '/PlayfairDisplay-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Playfair Display', '/PlayfairDisplay-BoldItalic.ttf', { weight: '700', style: 'italic' }),

        // Roboto Mono
        fontService.loadFont('Roboto Mono', '/RobotoMono-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Roboto Mono', '/RobotoMono-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Roboto Mono', '/RobotoMono-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Roboto Mono', '/RobotoMono-BoldItalic.ttf', { weight: '700', style: 'italic' }),

        // Montserrat
        fontService.loadFont('Montserrat', '/Montserrat-Regular.ttf', { weight: '400', style: 'normal' }),
        fontService.loadFont('Montserrat', '/Montserrat-Bold.ttf', { weight: '700', style: 'normal' }),
        fontService.loadFont('Montserrat', '/Montserrat-Italic.ttf', { weight: '400', style: 'italic' }),
        fontService.loadFont('Montserrat', '/Montserrat-BoldItalic.ttf', { weight: '700', style: 'italic' }),
    ]);

    // 2. Load Document (Cloud or Default)
    let doc: DocumentModel;

    if (docId) {
        console.log('Loading doc:', docId);
        const result = await storageService.load(docId);
        if (result) {
            doc = result.doc;
            console.log('Loaded document from cloud:', result.title);
        } else {
            doc = createDocument([
                createSection([
                    createParagraph('Document not found or error loading.', {
                        fontFamily: 'Roboto',
                        fontSize: 16,
                    }),
                ]),
            ]);
        }
    } else {
        doc = createDocument([
            createSection([
                createParagraph(sampleText, {
                    fontFamily: 'Merriweather',
                    fontSize: 16,
                })
            ])
        ]);
    }

    // 3. Initialize App Components
    const viewport = new Viewport(container, doc);
    const editorState = new EditorState();
    let isDirty = true;

    viewport.onDocumentChange = () => {
        isDirty = true;
    };

    const inputManager = new InputManager(container, doc, editorState, () => {
        isDirty = true;
        lastBlinkTime = performance.now();
        isCursorVisible = true;
    });

    const toolbar = new Toolbar(container, doc, editorState, () => {
        isDirty = true;
        inputManager.focus();
    }, (newDoc) => {
        // Handle Load (if triggered internally)
        doc = newDoc;
        viewport.setDocument(doc);
        inputManager.setDocument(doc);
        toolbar.setDocument(doc); // Fix toolbar reference
        editorState.selection = null;
        isDirty = true;
        inputManager.focus();
    }, docId || undefined);

    // 4. Render Loop
    let lastBlinkTime = 0;
    let isCursorVisible = true;
    let currentPages: any[] = [];
    let animationFrameId: number;

    function renderLoop(timestamp: number) {
        if (timestamp - lastBlinkTime > 500) {
            isCursorVisible = !isCursorVisible;
            lastBlinkTime = timestamp;
        }

        if (isDirty) {
            currentPages = viewport.layoutEngine.layout(doc, viewport.pageConstraints);
            isDirty = false;
        }

        if (currentPages.length > 0) {
            viewport.renderer.renderDocument(currentPages, viewport.pageConstraints);

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

                // Draw Cursor
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
                    // Use offset relative to container (EditorWrapper)
                    inputManager.updateCursorPosition(
                        viewport.canvas.offsetLeft + cursorX,
                        viewport.canvas.offsetTop + cursorY
                    );
                }
            }
        }
        animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    // Selection Handler
    viewport.onSelectionChange = (anchor, head) => {
        editorState.setSelection(anchor, head);
        isCursorVisible = true;
        lastBlinkTime = performance.now();
        inputManager.focus();
        isDirty = true;
    };

    // Listen for margin toggle from Toolbar
    const toggleHandler = () => {
        // Toggle state
        const current = viewport.renderer.getDebugMode();
        viewport.renderer.setDebugMode(!current);
        isDirty = true; // Force re-render
    };
    window.addEventListener('toggle-margins', toggleHandler);

    // Return cleanup function
    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('toggle-margins', toggleHandler);
        toolbar.destroy();
        viewport.canvas.remove();
        // Clean up other listeners if needed
    };
}
