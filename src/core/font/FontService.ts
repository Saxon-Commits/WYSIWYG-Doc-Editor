import opentype from 'opentype.js';

export class FontService {
    // Key format: "Family-Weight-Style" (e.g. "Roboto-700-italic")
    private fonts: Map<string, opentype.Font> = new Map();
    private activeFont: opentype.Font | null = null;

    async loadFont(name: string, url: string, options: { weight?: string, style?: string } = {}): Promise<void> {
        const weight = options.weight || '400';
        const style = options.style || 'normal';

        // 1. Load into Browser (Visuals)
        const fontFace = new FontFace(name, `url(${url})`, { weight, style });
        await fontFace.load();
        document.fonts.add(fontFace);

        // 2. Load into Opentype (Math)
        return new Promise((resolve) => {
            opentype.load(url, (err, font) => {
                if (err) {
                    console.error('Font could not be loaded: ' + err);
                    resolve();
                } else if (font) {
                    const key = `${name}-${weight}-${style}`;
                    this.fonts.set(key, font);
                    if (!this.activeFont) this.activeFont = font; // Default fallback
                    resolve();
                }
            });
        });
    }

    private getFont(fontFamily: string, bold?: boolean, italic?: boolean): opentype.Font | null {
        const weight = bold ? '700' : '400';
        const style = italic ? 'italic' : 'normal';
        const key = `${fontFamily}-${weight}-${style}`;

        // Try specific variant, then fallback to Regular, then active
        return this.fonts.get(key)
            || this.fonts.get(`${fontFamily}-400-normal`)
            || this.activeFont;
    }

    getGlyphMetrics(fontFamily: string, char: string, fontSize: number, bold?: boolean, italic?: boolean): number {
        const font = this.getFont(fontFamily, bold, italic);
        if (!font) return fontSize / 2;

        const glyph = font.charToGlyph(char);
        const unitsPerEm = font.unitsPerEm;
        const advanceWidth = glyph.advanceWidth || 0;
        return (advanceWidth / unitsPerEm) * fontSize;
    }

    getKerning(fontFamily: string, leftChar: string, rightChar: string, fontSize: number, bold?: boolean, italic?: boolean): number {
        const font = this.getFont(fontFamily, bold, italic);
        if (!font) return 0;

        const leftGlyph = font.charToGlyph(leftChar);
        const rightGlyph = font.charToGlyph(rightChar);
        return (font.getKerningValue(leftGlyph, rightGlyph) / font.unitsPerEm) * fontSize;
    }

    getVerticalMetrics(fontFamily: string, fontSize: number, bold?: boolean, italic?: boolean): { ascender: number; descender: number; height: number } {
        const font = this.getFont(fontFamily, bold, italic);
        if (!font) return { ascender: fontSize * 0.8, descender: -fontSize * 0.2, height: fontSize };

        const scale = fontSize / font.unitsPerEm;
        return {
            ascender: font.ascender * scale,
            descender: font.descender * scale,
            height: (font.ascender - font.descender) * scale
        };
    }

    getLineHeight(fontSize: number): number {
        return fontSize * 1.2;
    }
}

export const fontService = new FontService();
