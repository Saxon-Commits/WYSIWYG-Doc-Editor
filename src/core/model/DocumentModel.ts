export interface Style {
    fontFamily: string;
    fontSize: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
}

export interface Span {
    type: 'span';
    text: string;
    style: Style;
}

export interface Paragraph {
    type: 'paragraph';
    children: Span[];
    style?: Style; // Fallback style
    alignment?: 'left' | 'center' | 'right' | 'justify';
    listType?: 'bullet' | 'number' | 'check';
    checked?: boolean;
    lineSpacing?: number; // Multiplier (e.g., 1.0, 1.5, 2.0)
}

export interface Section {
    type: 'section';
    children: Paragraph[];
}

export interface DocumentModel {
    sections: Section[];
}

// Factory functions for easier creation
export const createSpan = (text: string, style: Style): Span => ({
    type: 'span',
    text,
    style,
});

export function createDocument(sections: Section[] = []): DocumentModel {
    if (sections.length === 0) {
        return {
            sections: [{
                type: 'section',
                children: [createParagraph()]
            }]
        };
    }
    return { sections };
}

export function createParagraph(text: string = '', style: Style = { fontFamily: 'Roboto-Regular', fontSize: 16 }): Paragraph {
    return {
        type: 'paragraph',
        children: [createSpan(text, style)],
        alignment: 'left'
    };
}

export function setParagraphAlignment(document: DocumentModel, selection: Selection, alignment: 'left' | 'center' | 'right' | 'justify'): void {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];

    for (let i = start.paragraphIndex; i <= end.paragraphIndex; i++) {
        const paragraph = section.children[i];
        paragraph.alignment = alignment;
    }
}

export function setParagraphSpacing(document: DocumentModel, selection: Selection, spacing: number): void {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];

    for (let i = start.paragraphIndex; i <= end.paragraphIndex; i++) {
        const paragraph = section.children[i];
        paragraph.lineSpacing = spacing;
    }
}

export function toggleList(document: DocumentModel, selection: Selection, listType: 'bullet' | 'number' | 'check'): void {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];

    for (let i = start.paragraphIndex; i <= end.paragraphIndex; i++) {
        const paragraph = section.children[i];

        if (paragraph.listType === listType) {
            // Toggle off
            delete paragraph.listType;
            delete paragraph.checked;
        } else {
            // Toggle on (or switch type)
            paragraph.listType = listType;
            if (listType === 'check') {
                paragraph.checked = false;
            } else {
                delete paragraph.checked;
            }
        }
    }
}
export function createSection(children: Paragraph[] = []): Section {
    return {
        type: 'section',
        children
    };
}

import type { Selection } from '../state/EditorState';

export function getRangeText(document: DocumentModel, selection: Selection): string {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];
    let text = '';

    for (let p = start.paragraphIndex; p <= end.paragraphIndex; p++) {
        const paragraph = section.children[p];
        let paraText = '';

        // Collect text from spans
        for (let s = 0; s < paragraph.children.length; s++) {
            const span = paragraph.children[s];
            let spanText = span.text;

            // If this is the start paragraph, slice from start char
            if (p === start.paragraphIndex && s === start.spanIndex) {
                spanText = spanText.substring(start.charIndex);
            } else if (p === start.paragraphIndex && s < start.spanIndex) {
                spanText = ''; // Skip spans before start
            }

            // If this is the end paragraph, slice to end char
            if (p === end.paragraphIndex && s === end.spanIndex) {
                // If start and end are in same span, we already sliced start.
                // But wait, if same span, we need to slice the ORIGINAL text?
                // No, if same span, we want substring(start, end).
                // My logic above sliced start.
                // Let's refine.

                if (p === start.paragraphIndex && s === start.spanIndex) {
                    // Same span
                    spanText = span.text.substring(start.charIndex, end.charIndex);
                } else {
                    spanText = spanText.substring(0, end.charIndex);
                }
            } else if (p === end.paragraphIndex && s > end.spanIndex) {
                spanText = ''; // Skip spans after end
            }

            paraText += spanText;
        }

        text += paraText;
        if (p < end.paragraphIndex) {
            text += '\n';
        }
    }
    return text;
}

export function deleteRange(document: DocumentModel, selection: Selection): void {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];

    // 1. Collapse logic: if start == end, do nothing
    if (start.paragraphIndex === end.paragraphIndex &&
        start.spanIndex === end.spanIndex &&
        start.charIndex === end.charIndex) {
        return;
    }

    const startPara = section.children[start.paragraphIndex];
    const endPara = section.children[end.paragraphIndex];
    const startSpan = startPara.children[start.spanIndex];
    const endSpan = endPara.children[end.spanIndex];

    // 2. Single Span Case
    if (start.paragraphIndex === end.paragraphIndex && start.spanIndex === end.spanIndex) {
        const before = startSpan.text.substring(0, start.charIndex);
        const after = startSpan.text.substring(end.charIndex);
        startSpan.text = before + after;

        // Update cursor
        selection.head = { ...start };
        selection.anchor = { ...start };
        return;
    }

    // 3. Multi-Span / Multi-Para Case

    // A. Truncate Start Span
    startSpan.text = startSpan.text.substring(0, start.charIndex);

    // B. Truncate End Span (keep tail)
    const endSpanTail = endSpan.text.substring(end.charIndex);
    // We will append this tail to the start span (or a new span at end of start para)
    // Actually, we usually merge the END paragraph into the START paragraph.

    // C. Remove intermediate spans in start paragraph
    startPara.children = startPara.children.slice(0, start.spanIndex + 1);

    // D. Remove intermediate paragraphs
    // We need to remove paragraphs between start and end (exclusive)
    // And remove start of end paragraph.

    // Collect remaining spans from end paragraph
    const endParaRemainingSpans = endPara.children.slice(end.spanIndex);
    // Update the first remaining span (which was the end span)
    endParaRemainingSpans[0].text = endSpanTail;

    // E. Merge end paragraph content into start paragraph
    startPara.children.push(...endParaRemainingSpans);

    // F. Remove paragraphs from start+1 to end (inclusive)
    const deleteCount = end.paragraphIndex - start.paragraphIndex;
    section.children.splice(start.paragraphIndex + 1, deleteCount);

    // Update cursor
    selection.head = { ...start };
    selection.anchor = { ...start };
}

// Helper to sort selection (duplicated from EditorState for now, or move to shared util)
function getSortedSelection(selection: Selection) {
    const { anchor, head } = selection;
    let isAnchorBefore = false;
    if (anchor.paragraphIndex < head.paragraphIndex) isAnchorBefore = true;
    else if (anchor.paragraphIndex === head.paragraphIndex) {
        if (anchor.spanIndex < head.spanIndex) isAnchorBefore = true;
        else if (anchor.spanIndex === head.spanIndex) {
            if (anchor.charIndex < head.charIndex) isAnchorBefore = true;
        }
    }
    return isAnchorBefore ? { start: anchor, end: head } : { start: head, end: anchor };
}

export function insertText(document: DocumentModel, selection: Selection, text: string): void {
    const cursor = selection.head;
    const paragraph = document.sections[0].children[cursor.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[cursor.spanIndex];
    if (!span) return;

    const before = span.text.substring(0, cursor.charIndex);
    const after = span.text.substring(cursor.charIndex);

    span.text = before + text + after;
    cursor.charIndex += text.length;
    selection.anchor = { ...cursor };
}

export function insertFragment(document: DocumentModel, selection: Selection, paragraphs: Paragraph[]): void {
    if (paragraphs.length === 0) return;

    const cursor = selection.head;
    const section = document.sections[0];

    // Case 1: Single Paragraph Paste
    if (paragraphs.length === 1) {
        const para = paragraphs[0];
        const targetPara = section.children[cursor.paragraphIndex];
        const targetSpan = targetPara.children[cursor.spanIndex];

        // Split current span
        const beforeText = targetSpan.text.substring(0, cursor.charIndex);
        const afterText = targetSpan.text.substring(cursor.charIndex);

        targetSpan.text = beforeText;

        // Insert new spans
        // We need to clone to avoid reference issues
        const newSpans = para.children.map(s => ({ ...s }));

        // Create span for after text
        const afterSpan = createSpan(afterText, targetSpan.style);

        // Insert: [CurrentSpan(before)] ...[NewSpans]... [AfterSpan] ...[Rest]
        targetPara.children.splice(cursor.spanIndex + 1, 0, ...newSpans, afterSpan);

        // Update cursor
        cursor.spanIndex += newSpans.length;
        cursor.charIndex = 0; // At start of afterSpan
        selection.anchor = { ...cursor };
        return;
    }

    // Case 2: Multi-Paragraph Paste
    // 1. Split current paragraph at cursor
    splitParagraph(document, selection);
    // Cursor is now at start of the second half (the "after" part)

    const beforeParaIndex = cursor.paragraphIndex - 1;
    const afterParaIndex = cursor.paragraphIndex;

    const beforePara = section.children[beforeParaIndex];
    // The afterPara will be appended to the last new paragraph
    const afterPara = section.children[afterParaIndex];

    // 2. Append first new paragraph's content to beforePara
    const firstNew = paragraphs[0];
    beforePara.children.push(...firstNew.children.map(s => ({ ...s })));

    // 3. Insert middle paragraphs
    const middleParas = paragraphs.slice(1, paragraphs.length - 1).map(p => ({ ...p, children: p.children.map(s => ({ ...s })) }));
    section.children.splice(afterParaIndex, 0, ...middleParas);

    // 4. Prepend last new paragraph's content to afterPara
    const lastNew = paragraphs[paragraphs.length - 1];
    const lastNewSpans = lastNew.children.map(s => ({ ...s }));
    afterPara.children.unshift(...lastNewSpans);

    // Update cursor
    // Cursor should be after the inserted content in afterPara
    // which is at index: lastNewSpans.length
    cursor.paragraphIndex = afterParaIndex + middleParas.length;
    cursor.spanIndex = lastNewSpans.length;
    cursor.charIndex = 0;

    selection.anchor = { ...cursor };
}

export function deleteText(document: DocumentModel, selection: Selection, direction: 'forward' | 'backward'): void {
    // Check if range
    const { start, end } = getSortedSelection(selection);
    const isRange = start.paragraphIndex !== end.paragraphIndex ||
        start.spanIndex !== end.spanIndex ||
        start.charIndex !== end.charIndex;

    if (isRange) {
        deleteRange(document, selection);
        return;
    }

    const section = document.sections[0];
    if (!section) return;

    // Use head for deletion point
    const cursor = selection.head;
    const paragraph = section.children[cursor.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[cursor.spanIndex];
    if (!span) return;

    if (direction === 'backward') {
        if (cursor.charIndex > 0) {
            // Simple deletion within span
            const before = span.text.substring(0, cursor.charIndex - 1);
            const after = span.text.substring(cursor.charIndex);
            span.text = before + after;
            cursor.charIndex--;
        } else if (cursor.spanIndex > 0) {
            // Merge with previous span (simplified)
            // For now, just move cursor to end of previous span
            cursor.spanIndex--;
            const prevSpan = paragraph.children[cursor.spanIndex];
            cursor.charIndex = prevSpan.text.length;
            // Recursive call to delete last char of prev span? 
            // Or just let next backspace handle it? 
            // User wants backspace to delete.
            // If we are at start of span, we need to merge or delete from prev span.
            // Let's just delete from prev span text.
            const before = prevSpan.text.substring(0, prevSpan.text.length - 1);
            prevSpan.text = before;
            cursor.charIndex = prevSpan.text.length;
        } else if (cursor.paragraphIndex > 0) {
            // Merge Paragraphs
            const prevParagraph = section.children[cursor.paragraphIndex - 1];
            const oldParagraphIndex = cursor.paragraphIndex;

            // Move all spans from current paragraph to previous
            const spansToMove = paragraph.children;

            // Update cursor to end of prev paragraph
            // We need to know the span index in the NEW merged paragraph
            // It will be prevParagraph.children.length + (current span index)
            // But we are at 0,0 of current paragraph.
            // So cursor will be at end of last span of prev paragraph?
            // Or we append a new span?
            // Let's append spans.

            // const lastPrevSpanIndex = prevParagraph.children.length - 1; // Unused
            // const lastPrevSpan = prevParagraph.children[lastPrevSpanIndex]; // Unused
            const insertionSpanIndex = prevParagraph.children.length; // Start of moved spans

            // Actually, if we merge, we might merge the first moved span with the last prev span if styles match.
            // For simplicity, just append for now.

            prevParagraph.children = [...prevParagraph.children, ...spansToMove];

            // Remove old paragraph
            section.children.splice(oldParagraphIndex, 1);

            // Update cursor
            cursor.paragraphIndex--;
            cursor.spanIndex = insertionSpanIndex; // Point to start of moved content
            cursor.charIndex = 0;

            // If we want to be at the END of the previous content, that's where we are (start of moved content).
            // But wait, if we backspaced at start of paragraph, we didn't delete any char, just merged.
            // That's correct behavior.
        }
    } else {
        // Forward delete
        if (cursor.charIndex < span.text.length) {
            const before = span.text.substring(0, cursor.charIndex);
            const after = span.text.substring(cursor.charIndex + 1);
            span.text = before + after;
        } else if (cursor.paragraphIndex < section.children.length - 1) {
            // Merge Next Paragraph
            const nextParagraph = section.children[cursor.paragraphIndex + 1];
            paragraph.children = [...paragraph.children, ...nextParagraph.children];
            section.children.splice(cursor.paragraphIndex + 1, 1);
        }
    }

    // Sync anchor
    selection.anchor = { ...cursor };
}

export function splitParagraph(document: DocumentModel, selection: Selection): void {
    const section = document.sections[0];
    if (!section) return;

    const cursor = selection.head;
    const paragraph = section.children[cursor.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[cursor.spanIndex];
    if (!span) return;

    // 1. Split the current span
    const beforeText = span.text.substring(0, cursor.charIndex);
    const afterText = span.text.substring(cursor.charIndex);

    span.text = beforeText;

    // 2. Create new span for the second part
    const newSpan = createSpan(afterText, span.style);

    // 3. Collect all subsequent spans in the current paragraph
    const subsequentSpans = paragraph.children.slice(cursor.spanIndex + 1);

    // 4. Create new paragraph with the new span and subsequent spans
    const newParagraph: Paragraph = {
        type: 'paragraph',
        children: [newSpan, ...subsequentSpans],
        alignment: paragraph.alignment, // Preserve alignment
        listType: paragraph.listType, // Preserve list type
        checked: paragraph.listType === 'check' ? false : undefined // Reset checked for new item
    };

    // 5. Remove moved spans from original paragraph
    paragraph.children = paragraph.children.slice(0, cursor.spanIndex + 1);

    // 6. Insert new paragraph into section
    section.children.splice(cursor.paragraphIndex + 1, 0, newParagraph);

    // 7. Update selection to start of new paragraph
    cursor.paragraphIndex++;
    cursor.spanIndex = 0;
    cursor.charIndex = 0;

    // Sync anchor
    selection.anchor = { ...cursor };
}

// Internal helper to split a span at a specific index
function splitSpan(paragraph: Paragraph, spanIndex: number, charIndex: number): void {
    const span = paragraph.children[spanIndex];
    if (!span) return;

    // If split point is at boundaries, no need to split
    if (charIndex <= 0 || charIndex >= span.text.length) return;

    const leftText = span.text.substring(0, charIndex);
    const rightText = span.text.substring(charIndex);

    const leftSpan = createSpan(leftText, { ...span.style });
    const rightSpan = createSpan(rightText, { ...span.style });

    // Replace original span with two new spans
    paragraph.children.splice(spanIndex, 1, leftSpan, rightSpan);
}

export function applyStyle(document: DocumentModel, selection: Selection, styleChange: Partial<Style>): void {
    const { start, end } = getSortedSelection(selection);
    const section = document.sections[0];

    // 1. Normalize Start
    // If start is in middle of span, split it.
    // We need to be careful because splitting changes indices.
    // But since we process from start to end, it should be manageable.

    // Start Paragraph
    const startPara = section.children[start.paragraphIndex];
    if (start.charIndex > 0 && start.charIndex < startPara.children[start.spanIndex].text.length) {
        splitSpan(startPara, start.spanIndex, start.charIndex);
        // After split, the "selection start" is now at the beginning of the NEXT span (the right half).
        // So we increment spanIndex and reset charIndex to 0.
        start.spanIndex++;
        start.charIndex = 0;

        // If start and end were in the same span, we need to adjust end as well.
        if (start.paragraphIndex === end.paragraphIndex && start.spanIndex - 1 === end.spanIndex) {
            // This logic is tricky. If start==end originally, we don't apply style usually (unless it's a collapsed cursor style, which is handled differently).
            // If it's a range within one span:
            // Span: "Hello World"
            // Range: "llo" (2 to 5)
            // Split at 2: "He", "llo World"
            // Start becomes: Span 1 (index 1), char 0.
            // End was: Span 0, char 5.
            // But Span 0 is gone.
            // End should be: Span 1, char (5-2) = 3.
            end.spanIndex++;
            end.charIndex -= (startPara.children[start.spanIndex - 1].text.length); // length of "He"
        }
    }

    // 2. Normalize End
    // If end is in middle of span, split it.
    const endPara = section.children[end.paragraphIndex];
    if (end.charIndex > 0 && end.charIndex < endPara.children[end.spanIndex].text.length) {
        splitSpan(endPara, end.spanIndex, end.charIndex);
        // After split, the "selection end" is at the end of the LEFT span.
        // So we don't need to change indices, effectively.
        // The span at end.spanIndex is now the one we want to style.
        // The one after it is outside.
    }

    // 3. Apply Style
    for (let p = start.paragraphIndex; p <= end.paragraphIndex; p++) {
        const paragraph = section.children[p];

        let startS = 0;
        let endS = paragraph.children.length - 1;

        if (p === start.paragraphIndex) {
            startS = start.spanIndex;
        }
        if (p === end.paragraphIndex) {
            endS = end.spanIndex;
            // If end char index is 0, we exclude this span (it's the start of the next unselected part)
            // UNLESS it's an empty span (placeholder) where we want to apply style
            if (end.charIndex === 0 && p === end.paragraphIndex) {
                const span = paragraph.children[end.spanIndex];
                if (span.text.length > 0) {
                    endS = end.spanIndex - 1;
                }
            }
        }

        for (let s = startS; s <= endS; s++) {
            const span = paragraph.children[s];
            span.style = { ...span.style, ...styleChange };
        }
    }
}

import type { CursorPosition } from '../state/EditorState';

// Helper to get style at a specific point
export function getStyleAtPosition(document: DocumentModel, position: CursorPosition): Style {
    const section = document.sections[0];
    const paragraph = section.children[position.paragraphIndex];
    const span = paragraph.children[position.spanIndex];
    return span.style;
}

// The Toggle Function
export function toggleStyle(document: DocumentModel, selection: Selection, property: keyof Style): void {
    const { start } = getSortedSelection(selection);
    const currentStyle = getStyleAtPosition(document, start);

    // Determine target value (invert current)
    // Coerce to boolean for toggles (bold, italic, underline)
    const currentValue = !!currentStyle[property];
    const newValue = !currentValue;

    // Apply the new forced value across the whole selection
    applyStyle(document, selection, { [property]: newValue });
}

export function serializeDocument(document: DocumentModel): string {
    return JSON.stringify(document);
}

export function deserializeDocument(json: string): DocumentModel {
    try {
        const doc = JSON.parse(json);
        // Basic validation
        if (!doc || !Array.isArray(doc.sections)) {
            throw new Error('Invalid document format');
        }
        return doc as DocumentModel;
    } catch (e) {
        console.error('Failed to deserialize document', e);
        // Return empty doc on failure
        return createDocument();
    }
}
