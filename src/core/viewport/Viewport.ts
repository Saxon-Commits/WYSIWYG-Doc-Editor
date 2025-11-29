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

    private setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent focus loss
            const { x, y } = this.getMousePos(e);
            const position = this.layoutEngine.hitTest(x, y);

            if (position) {
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

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.anchorPosition = null;
        });
    }

    public onSelectionChange: ((anchor: any, head: any) => void) | null = null;

    private getMousePos(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    render() {
        const pages = this.layoutEngine.layout(this.document, this.pageConstraints);
        this.renderer.renderDocument(pages);
    }
}
