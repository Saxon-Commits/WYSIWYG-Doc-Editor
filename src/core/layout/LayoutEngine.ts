import type { DocumentModel, Paragraph } from '../model/DocumentModel';
import { fontService } from '../font/FontService';
import type { CursorPosition } from '../state/EditorState';

export interface RenderGlyph {
    char: string;
    x: number;
    y: number;
    width: number; // Added width
    fontFamily: string;
    fontSize: number;
    // Metadata for hit testing
    source: {
        paragraphIndex: number;
        spanIndex: number;
        charIndex: number;
    };
}

// ... (RenderPage, PageConstraints, LayoutItem types remain the same)

// Inside LayoutEngine class, layoutParagraph method:

// 3. Render the Line


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
    | { type: 'BOX'; width: number; char: string; source: { paragraphIndex: number; spanIndex: number; charIndex: number } }
    | { type: 'GLUE'; width: number; stretch: number; shrink: number; originalChar: string; source: { paragraphIndex: number; spanIndex: number; charIndex: number } }
    | { type: 'PENALTY'; width: number; cost: number; flagged: boolean };

export class LayoutEngine {
    private lastPages: RenderPage[] = [];

    constructor() { }

    layout(document: DocumentModel, constraints: PageConstraints): RenderPage[] {
        const pages: RenderPage[] = [];
        let currentPage: RenderPage = this.createPage(1, constraints);

        const defaultStyle = { fontFamily: 'Roboto-Regular', fontSize: 16 };
        const metrics = fontService.getVerticalMetrics(defaultStyle.fontFamily, defaultStyle.fontSize);

        let currentY = constraints.marginTop + metrics.ascender;
        const maxWidth = constraints.width - constraints.marginLeft - constraints.marginRight;

        let currentParagraphIndex = 0;
        let currentSpanIndex = 0;
        let currentCharIndex = 0;

        const section = document.sections[0]; // Assume single section

        while (currentParagraphIndex < section.children.length) {
            const paragraph = section.children[currentParagraphIndex];

            // Layout the paragraph (or partial paragraph)
            const result = this.layoutParagraph(
                paragraph,
                currentParagraphIndex,
                maxWidth,
                currentY,
                constraints,
                currentSpanIndex,
                currentCharIndex
            );

            // Add glyphs to current page
            currentPage.glyphs.push(...result.glyphs);
            currentY = result.endY;

            if (!result.completed) {
                // Paragraph didn't fit, move to next page
                pages.push(currentPage);
                currentPage = this.createPage(pages.length + 1, constraints);
                currentY = constraints.marginTop + metrics.ascender;

                // Resume from where we left off
                if (result.nextStart) {
                    currentSpanIndex = result.nextStart.spanIndex;
                    currentCharIndex = result.nextStart.charIndex;
                }
                // Don't increment paragraphIndex, we continue the same paragraph
            } else {
                // Paragraph finished
                currentParagraphIndex++;
                currentSpanIndex = 0;
                currentCharIndex = 0;
                currentY += 20; // Paragraph spacing
            }
        }

        pages.push(currentPage);
        this.lastPages = pages;
        return pages;
    }

    hitTest(x: number, y: number): CursorPosition | null {
        if (this.lastPages.length === 0) return null;

        const pageHeight = this.lastPages[0].height;
        const GAP = 20; // Must match CanvasRenderer
        const totalHeight = pageHeight + GAP;

        // 1. Determine which page was clicked
        const pageIndex = Math.floor(y / totalHeight);

        // Safety check: is this a valid page?
        if (pageIndex < 0 || pageIndex >= this.lastPages.length) return null;

        const page = this.lastPages[pageIndex];

        // 2. Convert Global Y to Local Page Y
        // We subtract the total height of previous pages + gaps
        let localY = y - (pageIndex * totalHeight);

        // Check if click is in the gap (optional, or just clamp)
        if (localY > pageHeight) return null;

        // 3. Find the Line & Glyph (Existing Logic using localY)
        let closestGlyph: RenderGlyph | null = null;
        let minDist = Infinity;

        for (const glyph of page.glyphs) {
            // Note: Use localY here!
            const width = fontService.getGlyphMetrics(glyph.fontFamily, glyph.char, glyph.fontSize);
            const dx = glyph.x + (width / 2) - x;
            const dy = glyph.y - (glyph.fontSize / 3) - localY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closestGlyph = glyph;
            }
        }

        if (closestGlyph) {
            const width = fontService.getGlyphMetrics(closestGlyph.fontFamily, closestGlyph.char, closestGlyph.fontSize);
            const centerX = closestGlyph.x + width / 2;

            let charIndex = closestGlyph.source.charIndex;

            if (x > centerX) {
                charIndex++;
            }

            return {
                paragraphIndex: closestGlyph.source.paragraphIndex,
                spanIndex: closestGlyph.source.spanIndex,
                charIndex: charIndex
            };
        }

        return null;
    }

    private createPage(pageNumber: number, constraints: PageConstraints): RenderPage {
        return {
            pageNumber,
            glyphs: [],
            width: constraints.width,
            height: constraints.height,
        };
    }

    private tokenizeParagraph(paragraph: Paragraph, paragraphIndex: number): LayoutItem[] {
        const items: LayoutItem[] = [];

        let spanIndex = 0;
        for (const span of paragraph.children) {
            const { fontFamily, fontSize } = span.style;
            const text = span.text;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const source = { paragraphIndex, spanIndex, charIndex: i };

                if (char === ' ') {
                    const width = fontService.getGlyphMetrics(fontFamily, ' ', fontSize);
                    items.push({
                        type: 'GLUE',
                        width,
                        stretch: width * 0.5,
                        shrink: width * 0.3,
                        originalChar: ' ',
                        source
                    });
                } else {
                    const width = fontService.getGlyphMetrics(fontFamily, char, fontSize);
                    items.push({
                        type: 'BOX',
                        width,
                        char,
                        source
                    });
                }
            }
            spanIndex++;
        }

        // FIX: Handle empty paragraphs (Ghost Box)
        if (items.length === 0) {
            // Use style of first span or default
            // const style = paragraph.children[0]?.style || { fontFamily: 'Roboto-Regular', fontSize: 16 };
            // Actually we don't need style here, as we hardcode width 0 and char ''
            // But wait, if we want correct line height later, we might need it?
            // The ghost box has width 0.
            // But layoutParagraph uses style for line height?
            // layoutParagraph gets style from paragraph.children[0].
            // If paragraph has no children, layoutParagraph uses default.
            // So we don't need to do anything here except push the item.
            // The user said: "Note: Ensure you use the style of the first span (even if empty) to generate this item so line height is calculated correctly."
            // But tokenizeParagraph returns LayoutItems. LayoutItems don't have style.
            // LayoutItems have width.
            // LayoutParagraph calculates line height based on paragraph.children[0].style.
            // If paragraph.children is empty, layoutParagraph uses default style.
            // So we just need to push the item.

            items.push({
                type: 'BOX',
                width: 0,
                char: '',
                source: { paragraphIndex, spanIndex: 0, charIndex: 0 }
            });
        }

        // Add a finishing penalty to force a break at the end
        items.push({ type: 'GLUE', width: 0, stretch: 10000, shrink: 0, originalChar: '', source: { paragraphIndex, spanIndex: -1, charIndex: -1 } });
        items.push({ type: 'PENALTY', width: 0, cost: -1000, flagged: true }); // Forced break

        return items;
    }

    private layoutParagraph(
        paragraph: Paragraph,
        paragraphIndex: number,
        maxWidth: number,
        startY: number,
        constraints: PageConstraints,
        startSpanIndex: number = 0,
        startCharIndex: number = 0
    ): { glyphs: RenderGlyph[], endY: number, completed: boolean, nextStart?: { spanIndex: number, charIndex: number } } {
        const items = this.tokenizeParagraph(paragraph, paragraphIndex);
        const glyphs: RenderGlyph[] = [];

        // Font styles (simplified for now)
        const style = paragraph.children[0]?.style || { fontFamily: 'Roboto-Regular', fontSize: 16 };
        const lineHeight = fontService.getLineHeight(style.fontSize);

        let currentY = startY;

        // Find start item
        let lineStart = 0;
        if (startSpanIndex > 0 || startCharIndex > 0) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type !== 'PENALTY' && item.source.spanIndex === startSpanIndex && item.source.charIndex === startCharIndex) {
                    lineStart = i;
                    break;
                }
            }
        }

        while (lineStart < items.length) {
            // Check vertical space BEFORE rendering the line
            // Check for page overflow (Strict Baseline Check)
            // If the baseline of the CURRENT line is past the bottom margin, break.
            if (currentY > constraints.height - constraints.marginBottom) {
                // Overflow!
                // We need to return the current position as the start for the next page
                // But we need to be careful: lineStart points to the beginning of the line we *wanted* to render.
                // So we return that.

                // Safety check: if lineStart is out of bounds or points to the very end
                if (lineStart >= items.length) break;

                const item = items[lineStart];

                if (item.type === 'PENALTY') {
                    lineStart++;
                    continue;
                }

                return {
                    glyphs,
                    endY: currentY,
                    completed: false,
                    nextStart: {
                        spanIndex: item.source.spanIndex,
                        charIndex: item.source.charIndex
                    }
                };
            }

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

                // FIX: Ignore sentinel items (spanIndex -1)
                if (item.type !== 'PENALTY' && item.source.spanIndex === -1) continue;

                if (item.type === 'BOX') {
                    glyphs.push({
                        char: item.char,
                        x: x,
                        y: currentY,
                        width: item.width,
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        source: item.source
                    });
                    x += item.width;
                } else if (item.type === 'GLUE') {
                    let adjustedWidth = item.width;
                    if (ratio !== 0) {
                        if (ratio > 0) adjustedWidth += item.stretch * ratio;
                        else adjustedWidth += item.shrink * ratio;
                    }

                    // Render GLUE as invisible glyph for cursor positioning
                    glyphs.push({
                        char: ' ',
                        x: x,
                        y: currentY,
                        width: adjustedWidth,
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        source: item.source
                    });

                    x += adjustedWidth;
                }
            }

            // Move to next line
            currentY += lineHeight;
            lineStart = breakIndex + 1; // Skip the glue/break item

            // Safety break to prevent infinite loops if logic fails
            if (lineStart <= lineStart - 1) break;
        }

        return { glyphs, endY: currentY, completed: true };
    }
}
