import type { DocumentModel, Paragraph, Style } from '../model/DocumentModel';
import { fontService } from '../font/FontService';
import type { CursorPosition } from '../state/EditorState';

export interface RenderGlyph {
    type?: 'text' | 'checkbox_checked' | 'checkbox_unchecked';
    char: string;
    x: number;
    y: number;
    width: number; // Added width
    fontFamily: string;
    fontSize: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    // Metadata for hit testing
    source: {
        paragraphIndex: number;
        spanIndex: number;
        charIndex: number;
    };
}

// ... (RenderPage, PageConstraints, LayoutItem types remain the same)


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

// Types for Knuth-Plass
type LayoutItem =
    | { type: 'BOX'; width: number; char: string; style: Style; source: { paragraphIndex: number; spanIndex: number; charIndex: number } }
    | { type: 'GLUE'; width: number; stretch: number; shrink: number; originalChar: string; style: Style; source: { paragraphIndex: number; spanIndex: number; charIndex: number } }
    | { type: 'PENALTY'; width: number; cost: number; flagged: boolean };

export class LayoutEngine {
    private lastPages: RenderPage[] = [];

    constructor() { }

    layout(document: DocumentModel, constraints: PageConstraints): RenderPage[] {
        const pages: RenderPage[] = [];
        let currentPage: RenderPage = this.createPage(1, constraints);

        const defaultStyle = { fontFamily: 'Roboto-Regular', fontSize: 16 };
        const metrics = fontService.getVerticalMetrics(defaultStyle.fontFamily, defaultStyle.fontSize);

        let currentY = constraints.marginTop;
        const maxWidth = constraints.width - constraints.marginLeft - constraints.marginRight;

        const section = document.sections[0]; // Assume single section

        let currentListIndex = 1;

        for (let i = 0; i < section.children.length; i++) {
            const paragraph = section.children[i];

            // Reset list index if not a numbered list
            if (paragraph.listType !== 'number') {
                currentListIndex = 1;
            }

            let startSpanIndex = 0;
            let startCharIndex = 0;
            let completed = false;

            while (!completed) {
                const result = this.layoutParagraph(
                    paragraph,
                    i,
                    maxWidth,
                    currentY,
                    constraints,
                    startSpanIndex,
                    startCharIndex,
                    currentListIndex
                );

                // Add glyphs to current page
                // Note: layoutParagraph now returns glyphs with absolute Y for the page (relative to page top)
                // But wait, the provided layoutParagraph uses currentY which starts at marginTop + ascender.
                // So the Y is already correct for the page.
                // However, we need to adjust for the fact that RenderGlyph usually expects Y to be baseline.
                // The new layoutParagraph sets y: currentY.
                // And currentY is incremented by lineHeight.
                // So it seems correct.

                currentPage.glyphs.push(...result.glyphs);
                currentY = result.endY;

                if (result.completed) {
                    completed = true;
                    // Paragraph spacing - Reduced from 20 to 10
                    currentY += 10;

                    if (paragraph.listType === 'number') {
                        currentListIndex++;
                    }
                } else {
                    // Overflow
                    pages.push(currentPage);
                    currentPage = this.createPage(pages.length + 1, constraints);
                    currentY = constraints.marginTop + metrics.ascender;

                    if (result.nextStart) {
                        startSpanIndex = result.nextStart.spanIndex;
                        startCharIndex = result.nextStart.charIndex;
                    } else {
                        // Should not happen if not completed
                        completed = true;
                    }
                }
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
            const width = glyph.width; // Use pre-calculated width
            const dx = glyph.x + (width / 2) - x;
            const dy = glyph.y - (glyph.fontSize / 3) - localY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closestGlyph = glyph;
            }
        }

        if (closestGlyph) {
            const width = closestGlyph.width;
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
            const style = span.style;
            const text = span.text;

            if (text.length === 0) {
                // Handle empty span (Ghost Box)
                items.push({
                    type: 'BOX',
                    width: 0,
                    char: '',
                    style,
                    source: { paragraphIndex, spanIndex, charIndex: 0 }
                });
            } else {
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const source = { paragraphIndex, spanIndex, charIndex: i };

                    if (char === ' ') {
                        const width = fontService.getGlyphMetrics(style.fontFamily, ' ', style.fontSize, style.bold, style.italic);
                        items.push({
                            type: 'GLUE',
                            width,
                            stretch: width * 0.5,
                            shrink: width * 0.3,
                            originalChar: ' ',
                            style: style,
                            source
                        });
                    } else {
                        const width = fontService.getGlyphMetrics(style.fontFamily, char, style.fontSize, style.bold, style.italic);
                        items.push({
                            type: 'BOX',
                            width,
                            char,
                            style: style,
                            source
                        });
                    }
                }
            }
            spanIndex++;
        }

        // Add a finishing penalty to force a break at the end
        items.push({ type: 'GLUE', width: 0, stretch: 10000, shrink: 0, originalChar: '', style: { fontFamily: 'Roboto-Regular', fontSize: 16 }, source: { paragraphIndex, spanIndex: -1, charIndex: -1 } });
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
        startCharIndex: number = 0,
        listIndex: number = 1 // Added listIndex
    ): { glyphs: RenderGlyph[], endY: number, completed: boolean, nextStart?: { spanIndex: number, charIndex: number } } {
        const items = this.tokenizeParagraph(paragraph, paragraphIndex);
        const glyphs: RenderGlyph[] = [];

        const style = paragraph.children[0]?.style || { fontFamily: 'Roboto-Regular', fontSize: 16 };
        // We will calculate line height dynamically based on max font size in line
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

        // List Handling
        const listType = paragraph.listType;
        // Indentation for the text content
        const listPadding = listType ? 40 : 0;
        // Indentation for the marker itself relative to margin
        const markerOffset = listType ? 15 : 0;

        const align = paragraph.alignment || 'left';

        // Adjust max width for list indentation
        const effectiveMaxWidth = maxWidth - listPadding;

        while (lineStart < items.length) {
            // -- 1. Height Calculation --
            // Scan ahead to find line height (max ascender/descender in the line)
            // Ideally we do this after finding the break, but for now we assume standard height or calc later.
            // Let's use a base line height for the overflow check to be safe.
            const spacingMultiplier = paragraph.lineSpacing || 1.15; // Default to 1.15 like Google Docs
            const baseLineHeight = fontService.getLineHeight(style.fontSize) * spacingMultiplier;

            // -- 2. Overflow Check --
            if (currentY + baseLineHeight > constraints.height - constraints.marginBottom) {
                if (lineStart >= items.length) break;
                const item = items[lineStart];
                // Safety check for PENALTY which doesn't have source
                if (item.type === 'PENALTY') {
                    // Should not happen as lineStart shouldn't point to penalty usually, or we skip it
                    // If it does, just break or skip
                    break;
                }

                return {
                    glyphs,
                    endY: currentY,
                    completed: false,
                    nextStart: { spanIndex: item.source.spanIndex, charIndex: item.source.charIndex }
                };
            }

            // -- 3. Line Breaking (Knuth-Plass / First Fit) --
            let currentWidth = 0;
            let totalStretch = 0;
            let totalShrink = 0;
            let breakIndex = -1;
            let forcedBreak = false;

            // Scan to find break point
            for (let i = lineStart; i < items.length; i++) {
                const item = items[i];
                if (item.type === 'BOX') {
                    currentWidth += item.width;
                } else if (item.type === 'GLUE') {
                    breakIndex = i; // Potential break
                    currentWidth += item.width;
                    totalStretch += item.stretch;
                    totalShrink += item.shrink;
                } else if (item.type === 'PENALTY' && item.flagged) {
                    breakIndex = i;
                    forcedBreak = true;
                    break;
                }

                // Use effectiveMaxWidth here to prevent overflow
                if (currentWidth > effectiveMaxWidth) {
                    if (breakIndex !== -1) {
                        forcedBreak = true;
                    } else {
                        breakIndex = i; // Force break at char
                        forcedBreak = true;
                    }
                    break;
                }
            }

            if (!forcedBreak) {
                breakIndex = items.length;
            }

            // -- 4. Calculate Alignment & Ratio --
            // Calculate width of the ACTUAL content we are keeping
            let usedWidth = 0;
            let lineStretch = 0;
            let lineShrink = 0;
            let maxAscender = 0;
            let maxDescender = 0;

            for (let j = lineStart; j < breakIndex; j++) {
                const item = items[j];
                // Metrics for line height
                if (item.type === 'BOX' || item.type === 'GLUE') {
                    if (item.style) {
                        const m = fontService.getVerticalMetrics(item.style.fontFamily, item.style.fontSize, item.style.bold, item.style.italic);
                        maxAscender = Math.max(maxAscender, m.ascender);
                        maxDescender = Math.min(maxDescender, m.descender);
                    }
                }

                if (item.type === 'BOX') {
                    usedWidth += item.width;
                } else if (item.type === 'GLUE') {
                    // Don't include trailing glue in usedWidth for alignment calculation
                    // But we do need it for justification math if it's inside the line
                    // For simplicity: include all, subtract trailing later? 
                    // Better: Just sum it up.
                    usedWidth += item.width;
                    lineStretch += item.stretch;
                    lineShrink += item.shrink;
                }
            }

            // Default height if empty
            if (maxAscender === 0) {
                const m = fontService.getVerticalMetrics(style.fontFamily, style.fontSize);
                maxAscender = m.ascender;
                maxDescender = m.descender;
            }

            // Trim trailing glue width for Alignment calculation
            let visualWidth = usedWidth;
            if (breakIndex > lineStart && items[breakIndex - 1].type === 'GLUE') {
                visualWidth -= items[breakIndex - 1].width;
            }

            // Use effectiveMaxWidth for alignment calculation
            const difference = effectiveMaxWidth - visualWidth;
            let ratio = 0;

            // Logic: Only Justify if enabled AND not the last line (unless forced)
            const breakItem = items[breakIndex];
            const isLastLine = breakIndex === items.length || (breakItem?.type === 'PENALTY' && breakItem.flagged);

            if (align === 'justify' && !isLastLine) {
                if (difference > 0) ratio = lineStretch > 0 ? difference / lineStretch : 0;
                else ratio = lineShrink > 0 ? difference / lineShrink : 0;

                // Safety clamp
                if (ratio < -1) ratio = -1;
                if (ratio > 5) ratio = 5;
            } else {
                // Left, Center, Right -> No stretching (except shrinking overflow)
                if (difference < 0) {
                    ratio = lineShrink > 0 ? difference / lineShrink : 0;
                }
            }

            // -- 5. Calculate Start X --
            let x = constraints.marginLeft + listPadding;

            if (align === 'center') {
                x += Math.max(0, difference / 2);
            } else if (align === 'right') {
                x += Math.max(0, difference);
            }

            // Calculate Baseline
            // currentY is now the TOP of the line box.
            // Baseline is top + ascender.
            const baselineY = currentY + maxAscender;

            // Render List Marker (Only on first line of paragraph)
            if (lineStart === 0 && listType) {
                let markerChar = '•';
                let glyphType: 'text' | 'checkbox_checked' | 'checkbox_unchecked' = 'text';

                if (listType === 'number') {
                    markerChar = `${listIndex}.`;
                } else if (listType === 'check') {
                    markerChar = ''; // No text char for checkbox
                    glyphType = paragraph.checked ? 'checkbox_checked' : 'checkbox_unchecked';
                }

                glyphs.push({
                    type: glyphType,
                    char: markerChar,
                    x: constraints.marginLeft + markerOffset, // Draw at indented position
                    y: baselineY,
                    width: 20, // Approx width
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    color: '#000000',
                    source: { paragraphIndex, spanIndex: -1, charIndex: -1 }, // Special source
                });
            }

            // -- 6. Render Loop --
            let maxFontSize = 0;
            for (let j = lineStart; j < breakIndex; j++) {
                const item = items[j];
                if (item.type === 'BOX' || item.type === 'GLUE') {
                    if (item.style) {
                        maxFontSize = Math.max(maxFontSize, item.style.fontSize);
                    }
                }

                if (item.type === 'PENALTY') continue;
                if (item.source.spanIndex === -1) continue;

                if (item.type === 'BOX') {
                    glyphs.push({
                        char: item.char,
                        x: x,
                        y: baselineY,
                        width: item.width,
                        fontFamily: item.style?.fontFamily || style.fontFamily,
                        fontSize: item.style?.fontSize || style.fontSize,
                        bold: item.style?.bold,
                        italic: item.style?.italic,
                        color: item.style?.color,
                        underline: item.style?.underline,
                        source: item.source
                    });
                    x += item.width;
                } else if (item.type === 'GLUE') {
                    let adjustedWidth = item.width;
                    // Only apply ratio if we are justifying
                    if (align === 'justify' || ratio < 0) {
                        if (ratio > 0) adjustedWidth += item.stretch * ratio;
                        else adjustedWidth += item.shrink * ratio;
                    }

                    glyphs.push({
                        char: ' ',
                        x: x,
                        y: baselineY,
                        width: adjustedWidth,
                        fontFamily: item.style?.fontFamily || style.fontFamily,
                        fontSize: item.style?.fontSize || style.fontSize,
                        source: item.source
                    });
                    x += adjustedWidth;
                }
            }

            if (maxFontSize === 0) maxFontSize = style.fontSize;

            // Advance Y
            // Use maxFontSize as base for line height to allow tighter spacing (like CSS line-height)
            const lineHeight = maxFontSize * spacingMultiplier;
            currentY += lineHeight;
            lineStart = breakIndex + 1;

            // Infinite loop guard
            if (lineStart <= lineStart - 1) break;
        }

        return { glyphs, endY: currentY, completed: true };
    }
}
