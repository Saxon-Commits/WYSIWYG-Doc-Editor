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

    private setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.hitTest(x, y);
        });
    }

    private hitTest(x: number, y: number) {
        console.log(`Hit test at: ${x}, ${y}`);
        // TODO: Implement actual hit testing logic
    }

    render() {
        const pages = this.layoutEngine.layout(this.document, this.pageConstraints);
        // For now, just render the first page
        if (pages.length > 0) {
            this.renderer.renderPage(pages[0], true);
        }
    }
}
