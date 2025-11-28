import type { DocumentModel, Paragraph } from '../model/DocumentModel';
import { fontService } from '../font/FontService';

export interface RenderGlyph {
    char: string;
    x: number;
    y: number;
    fontFamily: string;
    fontSize: number;
}

export interface RenderPage {
    pageNumber: number;
    glyphs: RenderGlyph[];
    width: number;
    height: number;
}

export interface PageConstraints {
    width: number;
    height: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
}

export type LayoutItem =
    | { type: 'BOX'; width: number; char: string }
    | { type: 'GLUE'; width: number; stretch: number; shrink: number; originalChar: string }
    | { type: 'PENALTY'; width: number; cost: number; flagged: boolean };

export class LayoutEngine {
    constructor() { }

    layout(document: DocumentModel, constraints: PageConstraints): RenderPage[] {
        const pages: RenderPage[] = [];
        let currentPage: RenderPage = this.createPage(1, constraints);
        let currentY = constraints.marginTop;

        // We'll assume a single column layout for now
        const maxWidth = constraints.width - constraints.marginLeft - constraints.marginRight;

        for (const section of document.sections) {
            for (const node of section.children) {
                if (node.type === 'paragraph') {
                    const result = this.layoutParagraph(node, maxWidth, currentY, constraints);

                    // Check if we need a new page (simple check for now)
                    if (result.endY > constraints.height - constraints.marginBottom) {
                        // In a real implementation we'd handle page breaks better
                        // For now, just push what we have and start a new page
                        // This is a simplification
                    }

                    currentPage.glyphs.push(...result.glyphs);
                    currentY = result.endY + 20; // Paragraph spacing
                }
            }
        }

        pages.push(currentPage);
        return pages;
    }

    private createPage(pageNumber: number, constraints: PageConstraints): RenderPage {
        return {
            pageNumber,
            glyphs: [],
            width: constraints.width,
            height: constraints.height,
        };
    }

    private tokenizeParagraph(paragraph: Paragraph): LayoutItem[] {
        const items: LayoutItem[] = [];

        for (const span of paragraph.children) {
            const { fontFamily, fontSize } = span.style;
            const text = span.text;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                if (char === ' ') {
                    const width = fontService.getGlyphMetrics(fontFamily, ' ', fontSize);
                    items.push({
                        type: 'GLUE',
                        width,
                        stretch: width * 0.5,
                        shrink: width * 0.3,
                        originalChar: ' '
                    });
                } else {
                    const width = fontService.getGlyphMetrics(fontFamily, char, fontSize);
                    items.push({
                        type: 'BOX',
                        width,
                        char
                    });
                }
            }
        }

        // Add a finishing penalty to force a break at the end
        items.push({ type: 'GLUE', width: 0, stretch: 10000, shrink: 0, originalChar: '' });
        items.push({ type: 'PENALTY', width: 0, cost: -1000, flagged: true }); // Forced break

        return items;
    }

    private layoutParagraph(paragraph: Paragraph, maxWidth: number, startY: number, constraints: PageConstraints): { glyphs: RenderGlyph[], endY: number } {
        const items = this.tokenizeParagraph(paragraph);
        const glyphs: RenderGlyph[] = [];

        // Greedy Line Breaker
        let lineStart = 0;
        let currentY = startY;
        const lineHeight = 20; // Should be derived from font

        // We need to know the font style for rendering. 
        // Simplified: assuming uniform style for the whole paragraph for now, 
        // or taking it from the first span. 
        // In a robust implementation, LayoutItems would carry style info.
        const style = paragraph.children[0]?.style || { fontFamily: 'Roboto-Regular', fontSize: 16 };

        while (lineStart < items.length) {
            let currentWidth = 0;
            let totalStretch = 0;
            let totalShrink = 0;
            let bestBreak = -1;
            let minBadness = Infinity;
            let bestRatio = 0;

            // Find potential breakpoints
            for (let i = lineStart; i < items.length; i++) {
                const item = items[i];

                if (item.type === 'BOX') {
                    currentWidth += item.width;
                } else if (item.type === 'GLUE') {
                    // Break point is BEFORE the glue (or rather, we can break at glue)
                    // But usually we include the glue in the line if we don't break, 
                    // or discard it if we do. 
                    // Standard Knuth-Plass: potential break is at Glue or Penalty.

                    // Check if this is a valid breakpoint (simplified: any glue is a break opportunity)
                    // We calculate the line as if we break *after* the previous box and discard this glue?
                    // Or we include this glue?
                    // Let's assume we break *at* this glue. The glue itself is discarded at the break.

                    // Calculate badness if we break here
                    const adjustment = maxWidth - currentWidth;
                    let ratio = 0;

                    if (adjustment > 0) {
                        // Line is too short
                        ratio = totalStretch > 0 ? adjustment / totalStretch : 0; // Avoid Infinity
                        // If totalStretch is 0 and adjustment > 0, it's infinitely bad unless adjustment is 0
                        if (totalStretch === 0 && adjustment > 0) ratio = 1000; // Arbitrary high number
                    } else if (adjustment < 0) {
                        // Line is too long
                        ratio = totalShrink > 0 ? adjustment / totalShrink : 0;
                        if (totalShrink === 0 && adjustment < 0) ratio = -1000;
                    }

                    // Cap ratio for calculation stability? 
                    // Knuth-Plass usually limits ratio to [-1, infinity] (or some max stretch)

                    const badness = 100 * Math.pow(Math.abs(ratio), 3);

                    // If we are within feasible range (e.g. ratio >= -1)
                    if (ratio >= -1) {
                        if (badness < minBadness) {
                            minBadness = badness;
                            bestBreak = i;
                            bestRatio = ratio;
                        }
                    }

                    // Add glue width to current line for *continuation*
                    currentWidth += item.width;
                    totalStretch += item.stretch;
                    totalShrink += item.shrink;

                } else if (item.type === 'PENALTY') {
                    if (item.cost === -1000) {
                        // Forced break
                        bestBreak = i;
                        bestRatio = 0; // Last line usually has 0 ratio (left aligned) or we fill with infinite glue
                        // For the last line, we usually want natural width, so ratio 0.
                        // But if we used the infinite glue at the end, the ratio calculation handles it.
                        // Let's trust the infinite glue we added in tokenize.

                        // If we are at the penalty, we break.
                        break; // Stop looking for breaks
                    }
                }

                // If line is way too long, stop looking? (Optimization)
                if (currentWidth > maxWidth + 1000) break; // Safety break
            }

            if (bestBreak === -1) {
                // Could not find a good break, force break at next glue or end
                // Fallback: just find the next glue
                let found = false;
                for (let i = lineStart; i < items.length; i++) {
                    if (items[i].type === 'GLUE' || items[i].type === 'PENALTY') {
                        bestBreak = i;
                        found = true;
                        break;
                    }
                }
                if (!found) bestBreak = items.length; // Should not happen with forced penalty
            }

            // Render the line
            let x = constraints.marginLeft;

            for (let i = lineStart; i < bestBreak; i++) {
                const item = items[i];
                if (item.type === 'BOX') {
                    glyphs.push({
                        char: item.char,
                        x: x,
                        y: currentY,
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize
                    });
                    x += item.width;
                } else if (item.type === 'GLUE') {
                    // Apply adjustment
                    let adjustedWidth = item.width;
                    if (bestRatio > 0) {
                        adjustedWidth += item.stretch * bestRatio;
                    } else if (bestRatio < 0) {
                        adjustedWidth += item.shrink * bestRatio;
                    }
                    x += adjustedWidth;
                }
            }

            currentY += lineHeight;
            lineStart = bestBreak + 1; // Skip the glue/penalty we broke at
        }

        return { glyphs, endY: currentY };
    }
}
