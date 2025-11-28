import glyphTableData from './glyph-table.json';

export interface GlyphMetrics {
    advanceWidth: number;
}

export interface FontMetrics {
    unitsPerEm: number;
    ascender: number;
    descender: number;
}

export class FontService {
    private glyphTable: any;

    constructor() {
        this.glyphTable = glyphTableData;
    }

    getGlyphMetrics(fontFamily: string, char: string, fontSize: number): number {
        const font = this.glyphTable.fonts[fontFamily];
        if (!font) {
            console.warn(`Font family ${fontFamily} not found, using default metrics.`);
            return 10; // Fallback width
        }

        const glyph = font.glyphs[char] || font.glyphs['default'];
        const unitsPerEm = font.unitsPerEm;

        // Calculate width in pixels: (advanceWidth / unitsPerEm) * fontSize
        return (glyph.advanceWidth / unitsPerEm) * fontSize;
    }

    getKerning(fontFamily: string, leftChar: string, rightChar: string, fontSize: number): number {
        const font = this.glyphTable.fonts[fontFamily];
        if (!font || !font.kerning) return 0;

        const leftKern = font.kerning[leftChar];
        if (leftKern && leftKern[rightChar]) {
            const unitsPerEm = font.unitsPerEm;
            return (leftKern[rightChar] / unitsPerEm) * fontSize;
        }
        return 0;
    }

    getLineHeight(fontSize: number): number {
        // Simple heuristic for now: 1.2 * fontSize
        return fontSize * 1.2;
    }
}

export const fontService = new FontService();
