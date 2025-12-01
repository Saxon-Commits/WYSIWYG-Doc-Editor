import type { RenderPage } from '../layout/LayoutEngine';

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private dpr: number;
    private canvas: HTMLCanvasElement;
    private debugMode: boolean = true;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context');
        }
        this.ctx = context;
        this.dpr = window.devicePixelRatio || 1;
    }

    public setDebugMode(visible: boolean) {
        this.debugMode = visible;
    }

    public getDebugMode(): boolean {
        return this.debugMode;
    }

    renderDocument(pages: RenderPage[], constraints?: { marginTop: number, marginBottom: number, marginLeft: number, marginRight: number }) {
        if (pages.length === 0) return;

        const pageHeight = pages[0].height;
        const pageWidth = pages[0].width;
        const gap = 20; // Space between pages

        // Resize canvas to fit ALL pages
        const totalHeight = pages.length * (pageHeight + gap);
        this.resizeCanvas(pageWidth, totalHeight);
        this.clear();

        // Draw gray background for the "desk"
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let yOffset = 0;
        this.ctx.save(); // Save initial state (scale from resizeCanvas)

        for (const page of pages) {
            // Draw Page Background (Paper)
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, yOffset, pageWidth, pageHeight);

            // Draw Page Shadow (Optional polish)
            this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(0, yOffset, pageWidth, pageHeight);
            this.ctx.shadowBlur = 0;

            // Draw Margins (Debug)
            if (constraints) {
                this.drawDebugMargins(pageWidth, pageHeight, yOffset, constraints);
            }

            // Draw Glyphs relative to this page
            this.drawGlyphs(page, yOffset);

            yOffset += pageHeight + gap;
        }

        this.ctx.restore();
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



    // Updated drawDebugMargins method
    private drawDebugMargins(width: number, height: number, yOffset: number, constraints: { marginTop: number, marginBottom: number, marginLeft: number, marginRight: number }) {
        if (!this.debugMode) return;

        this.ctx.save();
        this.ctx.strokeStyle = '#ff0000'; // Red for visibility
        this.ctx.setLineDash([5, 5]);

        // Draw inner margin box
        const x = constraints.marginLeft;
        const y = yOffset + constraints.marginTop;
        const w = width - constraints.marginLeft - constraints.marginRight;
        const h = height - constraints.marginTop - constraints.marginBottom;

        this.ctx.strokeRect(x, y, w, h);
        this.ctx.restore();
    }

    // Updated drawGlyphs method
    private drawGlyphs(page: RenderPage, yOffset: number) {
        this.ctx.fillStyle = '#000000';
        this.ctx.textBaseline = 'alphabetic';

        for (const glyph of page.glyphs) {
            // Checkbox Rendering
            if (glyph.type === 'checkbox_unchecked' || glyph.type === 'checkbox_checked') {
                const size = glyph.fontSize * 0.8;
                const x = glyph.x;
                const y = glyph.y + yOffset - size; // y is baseline, draw up

                // Draw Box
                this.ctx.beginPath();
                this.ctx.rect(x, y, size, size);
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeStyle = '#555555';
                this.ctx.stroke();

                // Draw Checkmark if checked
                if (glyph.type === 'checkbox_checked') {
                    this.ctx.beginPath();
                    // Checkmark coordinates relative to box
                    this.ctx.moveTo(x + size * 0.2, y + size * 0.5);
                    this.ctx.lineTo(x + size * 0.45, y + size * 0.8);
                    this.ctx.lineTo(x + size * 0.8, y + size * 0.2);
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = '#0078d4'; // Blue check
                    this.ctx.stroke();
                }
                continue; // Skip text rendering for checkbox
            }

            // Construct font string
            const weight = glyph.bold ? 'bold ' : '';
            const style = glyph.italic ? 'italic ' : '';
            this.ctx.font = `${style}${weight}${glyph.fontSize}px "${glyph.fontFamily}"`;

            // Set Color
            this.ctx.fillStyle = glyph.color || '#000000';

            // Add yOffset to the glyph's local Y
            this.ctx.fillText(glyph.char, glyph.x, glyph.y + yOffset);

            // Render Underline
            if (glyph.underline) {
                const width = this.ctx.measureText(glyph.char).width;
                const underlineY = glyph.y + yOffset + (glyph.fontSize * 0.1); // Slightly below baseline

                this.ctx.beginPath();
                this.ctx.moveTo(glyph.x, underlineY);
                this.ctx.lineTo(glyph.x + width, underlineY);
                this.ctx.lineWidth = glyph.fontSize / 15;
                this.ctx.strokeStyle = glyph.color || '#000000';
                this.ctx.stroke();
            }
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

    drawSelection(page: RenderPage, selection: { start: any, end: any }, yOffset: number) {
        if (!selection) return;

        const { start, end } = selection;
        this.ctx.fillStyle = 'rgba(0, 120, 215, 0.3)';

        for (const glyph of page.glyphs) {
            // Check if glyph is within selection range
            // We need to compare paragraphIndex, spanIndex, charIndex

            const g = glyph.source;

            // Compare g >= start
            let afterStart = false;
            if (g.paragraphIndex > start.paragraphIndex) afterStart = true;
            else if (g.paragraphIndex === start.paragraphIndex) {
                if (g.spanIndex > start.spanIndex) afterStart = true;
                else if (g.spanIndex === start.spanIndex) {
                    if (g.charIndex >= start.charIndex) afterStart = true;
                }
            }

            // Compare g < end (exclusive of end char? usually selection is inclusive of start, exclusive of end?)
            // Actually, if I select "AB", start char is A, end char is B (or after B).
            // If I drag from A to B, start is A, end is B.
            // If I select char index 0 to 1, I selected char 0.
            // So we want g >= start AND g < end.

            let beforeEnd = false;
            if (g.paragraphIndex < end.paragraphIndex) beforeEnd = true;
            else if (g.paragraphIndex === end.paragraphIndex) {
                if (g.spanIndex < end.spanIndex) beforeEnd = true;
                else if (g.spanIndex === end.spanIndex) {
                    if (g.charIndex < end.charIndex) beforeEnd = true;
                }
            }

            if (afterStart && beforeEnd) {
                // Draw highlight
                // Use glyph width and font size for height
                // Height should probably be line height or font size?
                // Let's use font size for now, or pass line height if available.
                // We can approximate height with fontSize * 1.2 or similar.
                const height = glyph.fontSize * 1.2;
                const y = glyph.y + yOffset - (height * 0.8); // Adjust for baseline

                // We need exact width.
                // We don't have width in RenderGlyph?
                // We added it in previous steps! Let's check RenderGlyph definition in LayoutEngine.
                // Wait, I need to check if RenderGlyph has width.
                // I'll assume it does or I'll calculate it.
                // Looking at LayoutEngine.ts, RenderGlyph has: char, x, y, fontFamily, fontSize, source.
                // It does NOT have width.
                // I should probably add width to RenderGlyph in LayoutEngine or re-calculate it here.
                // Re-calculating is safer for now without modifying LayoutEngine again.
                // But wait, I modified LayoutEngine earlier to add width? 
                // Let's check LayoutEngine.ts content if I can.
                // I'll just use measureText here.
                this.ctx.font = `${glyph.fontSize}px "${glyph.fontFamily}"`;
                const width = this.ctx.measureText(glyph.char).width;

                this.ctx.fillRect(glyph.x, y, width, height);
            }
        }
    }
}
