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

        // Font styles (simplified for now)
        const style = paragraph.children[0]?.style || { fontFamily: 'Roboto-Regular', fontSize: 16 };
        const lineHeight = fontService.getLineHeight(style.fontSize);

        let currentY = startY;
        let lineStart = 0;

        while (lineStart < items.length) {
            let currentWidth = 0;
            let totalStretch = 0;
            let totalShrink = 0;

            let breakIndex = -1;
            let forcedBreak = false;

            // 1. Scan forward to find where the line MUST break
            for (let i = lineStart; i < items.length; i++) {
                const item = items[i];

                if (item.type === 'BOX') {
                    currentWidth += item.width;
                } else if (item.type === 'GLUE') {
                    // This is a valid break point. Record it.
                    // But first, adding the glue width to the calculation (usually we don't count glue at the end, but for measuring we track it)
                    // For the break decision, we look at the width BEFORE this glue.
                    breakIndex = i;

                    currentWidth += item.width;
                    totalStretch += item.stretch;
                    totalShrink += item.shrink;
                } else if (item.type === 'PENALTY' && item.flagged) {
                    breakIndex = i;
                    forcedBreak = true;
                    break; // Hard stop
                }

                // CHECK: Did we overflow?
                if (currentWidth > maxWidth) {
                    // If we have a previous break point, use it.
                    if (breakIndex !== -1) {
                        forcedBreak = true;
                        // We found the limit. breakIndex holds the index of the LAST GLUE that fit.
                        // However, if the current item is the one that broke the camel's back, 
                        // and breakIndex == i, we might want to break *here*.

                        // If the current item is BOX, and we are over width, we must go back to the previous GLUE (breakIndex).
                        // If breakIndex is actually 'i' (we are at a glue), we break here.
                    } else {
                        // The single word is wider than the line (emergency case)
                        breakIndex = i;
                        forcedBreak = true;
                    }
                    break;
                }
            }

            // If we reached the end of the paragraph without overflowing
            if (!forcedBreak) {
                breakIndex = items.length;
            }

            // 2. Calculate Ratio for the chosen break
            // We need to sum up the width of the content we actually decided to keep [lineStart ... breakIndex]
            // And exclude the trailing glue if it's a glue break.

            let usedWidth = 0;
            let usedStretch = 0;
            let usedShrink = 0;

            // Refine the loop to calculate exact metrics for the chosen range
            // We exclude the item at 'breakIndex' if it is GLUE (it becomes invisible newline)
            for (let j = lineStart; j < breakIndex; j++) {
                const item = items[j];
                if (item.type === 'BOX') {
                    usedWidth += item.width;
                } else if (item.type === 'GLUE') {
                    usedWidth += item.width;
                    usedStretch += item.stretch;
                    usedShrink += item.shrink;
                }
            }

            const difference = maxWidth - usedWidth;
            let ratio = 0;

            if (difference > 0) {
                // Stretch (unless it's the last line of paragraph, then 0)
                const breakItem = items[breakIndex];
                if (breakIndex !== items.length && (breakItem.type !== 'PENALTY' || !breakItem.flagged)) {
                    ratio = usedStretch > 0 ? difference / usedStretch : 0;
                }
            } else {
                // Shrink
                ratio = usedShrink > 0 ? difference / usedShrink : 0;
            }

            // Safety clamp for rendering (don't explode the glyphs)
            if (ratio < -1) ratio = -1;
            if (ratio > 5) ratio = 5; // Prevent massive gaps on forced breaks

            // 3. Render the Line
            let x = constraints.marginLeft;

            for (let j = lineStart; j < breakIndex; j++) {
                const item = items[j];

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
                    let adjustedWidth = item.width;
                    if (ratio !== 0) {
                        if (ratio > 0) adjustedWidth += item.stretch * ratio;
                        else adjustedWidth += item.shrink * ratio;
                    }
                    x += adjustedWidth;
                }
            }

            // Move to next line
            currentY += lineHeight;
            lineStart = breakIndex + 1; // Skip the glue/break item

            // Safety break to prevent infinite loops if logic fails
            if (lineStart <= lineStart - 1) break;
        }

        return { glyphs, endY: currentY };
    }
}
