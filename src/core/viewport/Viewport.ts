import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { LayoutEngine } from '../layout/LayoutEngine';
import type { PageConstraints } from '../layout/LayoutEngine';
import type { DocumentModel } from '../model/DocumentModel';

export class Viewport {
    public renderer: CanvasRenderer;
    public layoutEngine: LayoutEngine;
    public canvas: HTMLCanvasElement;
    private document: DocumentModel;
    public pageConstraints: PageConstraints;

    constructor(container: HTMLElement, document: DocumentModel) {
        this.canvas = window.document.createElement('canvas');
        container.appendChild(this.canvas);

        this.renderer = new CanvasRenderer(this.canvas);
        this.layoutEngine = new LayoutEngine();
        this.document = document;

        // A4 size roughly at 96 DPI
        this.pageConstraints = {
            width: 794,
            height: 1123,
            marginTop: 50,
            marginBottom: 50,
            marginLeft: 50,
            marginRight: 50,
        };

        this.setupEventListeners();
        this.render();
    }

    private isDragging = false;
    private anchorPosition: any = null; // Store anchor for drag

    public onMouseDown: ((e: MouseEvent, x: number, y: number, hitGlyph: any, layoutEngine?: LayoutEngine) => void) | null = null;

    private setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            const { x, y } = this.getMousePos(e);

            // 1. Check for specific glyph hit (e.g. image)
            const glyph = this.layoutEngine.getGlyphAt(x, y);
            if (this.onMouseDown) {
                this.onMouseDown(e, x, y, glyph, this.layoutEngine);
            }

            // 2. Standard Text Selection Logic
            const position = this.layoutEngine.hitTest(x, y);

            if (position) {
                // Checkbox Toggle Logic
                if (position.spanIndex === -1) {
                    const section = this.document.sections[0];
                    const paragraph = section.children[position.paragraphIndex];
                    if (paragraph.listType === 'check') {
                        paragraph.checked = !paragraph.checked;
                        if (this.onDocumentChange) {
                            this.onDocumentChange();
                        }
                        return; // Stop selection change
                    }
                }

                this.isDragging = true;
                this.anchorPosition = position;
                if (this.onSelectionChange) {
                    this.onSelectionChange(position, position);
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.anchorPosition) return;

            const { x, y } = this.getMousePos(e);
            const position = this.layoutEngine.hitTest(x, y);

            if (position) {
                if (this.onSelectionChange) {
                    this.onSelectionChange(this.anchorPosition, position);
                }
            }
        });

        window.addEventListener('mouseup', this.handleWindowMouseUp);
    }

    public onSelectionChange: ((anchor: any, head: any) => void) | null = null;
    public onDocumentChange: (() => void) | null = null;

    private getMousePos(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    render() {
        const pages = this.layoutEngine.layout(this.document, this.pageConstraints);
        this.renderer.renderDocument(pages, this.pageConstraints);
    }

    public setDocument(document: DocumentModel) {
        this.document = document;
        this.render();
    }

    private handleWindowMouseUp = () => {
        this.isDragging = false;
        this.anchorPosition = null;
    };

    public destroy() {
        window.removeEventListener('mouseup', this.handleWindowMouseUp);
        // Canvas is removed by caller (mount.ts) or we can do it here
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
