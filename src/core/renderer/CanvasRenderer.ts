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

    drawCursor(x: number, y: number, height: number, visible: boolean) {
        if (!visible) return;

        this.ctx.fillStyle = '#000000';
        // Draw cursor. Y is baseline, so we draw up from Y? 
        // Usually Y passed to fillText is baseline.
        // If height is passed, we assume we want to draw from baseline up?
        // Or is Y the top?
        // In LayoutEngine, y is baseline (because we used ascender offset).
        // So we should draw from y - ascender (top) to y + descender (bottom)?
        // The user said: "Cursor Height = fontService.getHeight(...)".
        // And "Cursor Y = glyph.y".
        // If glyph.y is baseline, and we want to draw a bar of 'height', 
        // we usually want it centered on the line or from top to bottom.
        // Let's assume we draw from (y - height + descender) roughly?
        // Or simpler: The user said "Cursor Y = glyph.y".
        // If I draw at Y, and height is 20, do I go down or up?
        // Standard canvas coords: Y increases downwards.
        // If I draw rect at (x, y, 2, height), it goes DOWN.
        // But glyph.y is baseline. Text is above Y.
        // So I should probably draw at (x, y - ascender, 2, height).
        // But I don't have ascender here easily.
        // Let's look at the user request again.
        // "Cursor Y = glyph.y. Cursor Height = fontService.getHeight(...)."
        // If I follow strictly: draw at y.
        // But if y is baseline, drawing down will be in the descender/margin area.
        // I'll assume I need to adjust Y to be the top of the line.
        // Wait, the user said: "Cursor Y = glyph.y".
        // Maybe I should just draw it and see.
        // Actually, looking at previous step: "Start at margin + ascender so the top of the text touches the margin".
        // So Y is baseline.
        // If I draw at Y, it goes down. That's wrong for the main body of text.
        // I should draw from (y - ascender).
        // However, the user didn't say "calculate top".
        // I will implement `drawCursor` to take `y` as the TOP of the cursor, or `y` as the baseline?
        // "It should draw a vertical line (width 2px) at (x, y)."
        // If I pass `glyph.y` as `y`, and `glyph.y` is baseline...
        // I will assume the caller (main.ts) will calculate the correct Top Y.
        // So `drawCursor` just draws a rect at x, y with height.

        this.ctx.fillRect(x, y, 2, height);
    }
}
