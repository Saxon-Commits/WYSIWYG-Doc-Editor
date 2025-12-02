import '../style.css'
import { Viewport } from './viewport/Viewport';
import { createDocument } from './model/DocumentModel';
import type { DocumentModel } from './model/DocumentModel';
import { EditorState } from './state/EditorState';
import { fontService } from './font/FontService';
import { InputManager } from './input/InputManager';
import { Toolbar } from './ui/Toolbar';
import { storageService } from './services/StorageService';

// Export mount function for React
export async function mountEditor(container: HTMLElement, docId?: string) {
    console.log('Mounting editor...');

    // Declare variables in outer scope for cleanup access
    let viewport: Viewport | undefined;
    let inputManager: InputManager | undefined;
    let toolbar: Toolbar | undefined;
    let animationFrameId: number | undefined;
    let toggleHandler: (() => void) | undefined;

    try {
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

        // 2. Load Document
        let doc: DocumentModel;
        try {
            if (docId) {
                const result = await storageService.load(docId);
                if (result) {
                    doc = result.doc;
                } else {
                    doc = createDocument();
                }
            } else {
                doc = createDocument();
            }
        } catch (error) {
            console.error('Error loading doc:', error);
            doc = createDocument();
        }

        // 3. Editor State
        const editorState = new EditorState();

        // 4. Viewport
        viewport = new Viewport(container, doc);
        let isDirty = true;

        viewport.onDocumentChange = () => {
            isDirty = true;
        };

        // 5. Input Manager
        inputManager = new InputManager(container, doc, editorState, () => {
            isDirty = true;
        });

        // 6. Toolbar
        toolbar = new Toolbar(container, doc, editorState, () => {
            isDirty = true;
            inputManager?.focus();
        }, (newDoc) => {
            doc = newDoc;
            if (viewport) viewport.setDocument(doc);
            if (inputManager) inputManager.setDocument(doc);
            if (toolbar) toolbar.setDocument(doc);
            editorState.selection = null;
            isDirty = true;
            inputManager?.focus();
        }, docId || undefined);

        // 7. Render Loop
        let lastBlinkTime = 0;
        let isCursorVisible = true;
        let currentPages: any[] = [];

        function renderLoop(timestamp: number) {
            if (!viewport || !inputManager) return;

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
                    const sel = editorState.selection.head;
                    let cursorX = 0;
                    let cursorY = 0;
                    let cursorHeight = 0;
                    let found = false;
                    let pageYOffset = 0;
                    const gap = 20;

                    for (const page of currentPages) {
                        for (const glyph of page.glyphs) {
                            if (glyph.source.paragraphIndex === sel.paragraphIndex &&
                                glyph.source.spanIndex === sel.spanIndex) {
                                if (glyph.source.charIndex === sel.charIndex) {
                                    cursorX = glyph.x;
                                    cursorY = glyph.y + pageYOffset;
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
                        inputManager.updateCursorPosition(
                            viewport.canvas.offsetLeft + cursorX,
                            viewport.canvas.offsetTop + cursorY
                        );
                    }
                }

                if (editorState.selectedImage) {
                    let yOffset = 0;
                    const gap = 20;
                    for (const page of currentPages) {
                        viewport.renderer.drawImageSelection(page, editorState.selectedImage, yOffset);
                        yOffset += page.height + gap;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(renderLoop);
        }

        animationFrameId = requestAnimationFrame(renderLoop);

        // Events
        viewport.onSelectionChange = (anchor, head) => {
            console.log('Selection changed', anchor, head);
            editorState.setSelection(anchor, head);
            isCursorVisible = true;
            lastBlinkTime = performance.now();
            inputManager?.focus();
            isDirty = true;
        };

        viewport.onMouseDown = (e, x, y, hitGlyph, layoutEngine) => {
            console.log('Viewport MouseDown', x, y, hitGlyph);
            inputManager?.handleMouseDown(e, x, y, hitGlyph, layoutEngine);
        };

        toggleHandler = () => {
            const current = viewport?.renderer.getDebugMode();
            if (viewport) viewport.renderer.setDebugMode(!current);
            isDirty = true;
        };
        window.addEventListener('toggle-margins', toggleHandler);

        console.log('Editor mounted successfully.');

        return () => {
            console.log('Cleaning up editor...');
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (toggleHandler) window.removeEventListener('toggle-margins', toggleHandler);
            toolbar?.destroy();
            inputManager?.destroy();
            viewport?.destroy();
            console.log('Editor cleanup complete.');
        };

    } catch (e) {
        console.error('Error mounting editor:', e);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (toggleHandler) window.removeEventListener('toggle-margins', toggleHandler);
        toolbar?.destroy();
        inputManager?.destroy();
        viewport?.destroy();
        console.error('Partial cleanup performed due to error.');
        throw e; // Re-throw the error to indicate mount failure
    }
}
