import type { RenderPage } from '../layout/LayoutEngine';

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private dpr: number;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = context;
        this.dpr = window.devicePixelRatio || 1;
    }

    renderPage(page: RenderPage, debug: boolean = false) {
        this.resizeCanvas(page.width, page.height);
        this.clear();
        this.drawBackground(page.width, page.height);

        if (debug) {
            this.drawDebugMargins(page.width, page.height);
        }

        this.drawGlyphs(page);
    }

    private resizeCanvas(width: number, height: number) {
        // Handle high DPI displays
        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }

    private clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawBackground(width: number, height: number) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);

        // Draw page border for visualization
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(0, 0, width, height);
    }

    private drawDebugMargins(width: number, height: number) {
        // Assuming margins are 50 for now, ideally passed in or derived
        const margin = 50;
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    }

    private drawGlyphs(page: RenderPage) {
        this.ctx.fillStyle = '#000000';
        this.ctx.textBaseline = 'alphabetic';

        for (const glyph of page.glyphs) {
            this.ctx.font = `${glyph.fontSize}px ${glyph.fontFamily}`;
            this.ctx.fillText(glyph.char, glyph.x, glyph.y);
        }
    }
}
