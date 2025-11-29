import opentype from 'opentype.js';

export class FontService {
    private fonts: Map<string, opentype.Font> = new Map();
    private activeFont: opentype.Font | null = null;

    // Load a font from a URL
    async loadFont(name: string, url: string): Promise<void> {
        // 1. Load into Browser (Canvas Renderer)
        // This ensures the browser knows what "Roboto Mono" is when we draw text
        const fontFace = new FontFace(name, `url(${url})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        // 2. Load into Opentype.js (Layout Engine)
        return new Promise((resolve) => {
            opentype.load(url, (err, font) => {
                if (err) {
                    console.error('Font could not be loaded: ' + err);
                    // Don't reject, just warn, so app doesn't crash entirely
                    resolve();
                } else if (font) {
                    this.fonts.set(name, font);
                    this.activeFont = font;
                    resolve();
                }
            });
        });
    }

    private getFont(fontFamily: string): opentype.Font | null {
        // Fallback to active font if specific family not found
        return this.fonts.get(fontFamily) || this.activeFont;
    }

    getGlyphMetrics(fontFamily: string, char: string, fontSize: number): number {
        const font = this.getFont(fontFamily);
        if (!font) return fontSize / 2; // Fallback width

        const glyph = font.charToGlyph(char);
        const unitsPerEm = font.unitsPerEm;
        const advanceWidth = glyph.advanceWidth || 0;

        // Formula: (GlyphUnits / HeadUnits) * FontSize
        return (advanceWidth / unitsPerEm) * fontSize;
    }

    getKerning(fontFamily: string, leftChar: string, rightChar: string, fontSize: number): number {
        const font = this.getFont(fontFamily);
        if (!font) return 0;

        const leftGlyph = font.charToGlyph(leftChar);
        const rightGlyph = font.charToGlyph(rightChar);

        const kerning = font.getKerningValue(leftGlyph, rightGlyph);
        return (kerning / font.unitsPerEm) * fontSize;
    }

    getVerticalMetrics(fontFamily: string, fontSize: number): { ascender: number; descender: number; height: number } {
        const font = this.getFont(fontFamily);
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
