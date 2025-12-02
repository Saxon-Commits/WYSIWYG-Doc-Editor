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

export interface Image {
    type: 'image';
    src: string;
    width: number;
    height: number;
    alt?: string;
    id: string;
}

export type InlineNode = Span | Image;

export interface Paragraph {
    type: 'paragraph';
    children: InlineNode[];
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
            const node = paragraph.children[s];
            if (node.type !== 'span') continue; // Skip images for text extraction

            let spanText = node.text;

            // If this is the start paragraph, slice from start char
            if (p === start.paragraphIndex && s === start.spanIndex) {
                spanText = spanText.substring(start.charIndex);
            } else if (p === start.paragraphIndex && s < start.spanIndex) {
                spanText = ''; // Skip spans before start
            }

            // If this is the end paragraph, slice to end char
            if (p === end.paragraphIndex && s === end.spanIndex) {
                if (p === start.paragraphIndex && s === start.spanIndex) {
                    // Same span
                    spanText = node.text.substring(start.charIndex, end.charIndex);
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
    const startNode = startPara.children[start.spanIndex];
    const endNode = endPara.children[end.spanIndex];

    // 2. Single Node Case
    if (start.paragraphIndex === end.paragraphIndex && start.spanIndex === end.spanIndex) {
        if (startNode.type === 'span') {
            const before = startNode.text.substring(0, start.charIndex);
            const after = startNode.text.substring(end.charIndex);
            startNode.text = before + after;
        } else {
            // It's an image or other node. If we are deleting range inside it?
            // Usually range over image means we delete the image.
            // But here start==end span index.
            // If charIndex diff covers the image (e.g. 0 to 1), delete it.
            // For now, if it's an image, just remove it if range covers it?
            // Or do nothing if it's a point selection?
            if (start.charIndex !== end.charIndex) {
                startPara.children.splice(start.spanIndex, 1);
            }
        }

        // Update cursor
        selection.head = { ...start };
        selection.anchor = { ...start };
        return;
    }

    // 3. Multi-Node / Multi-Para Case

    // A. Truncate Start Node
    if (startNode.type === 'span') {
        startNode.text = startNode.text.substring(0, start.charIndex);
    }

    // B. Truncate End Node (keep tail)
    let endNodeTail: InlineNode | null = null;
    if (endNode.type === 'span') {
        const text = endNode.text.substring(end.charIndex);
        endNodeTail = createSpan(text, endNode.style);
    } else {
        // If end is image, and we are deleting FROM it, do we keep it?
        // If charIndex > 0, we keep it?
        // Simplified: If end is image, we delete it unless charIndex is 0 (which means we are before it, so it's part of "after" content)
        // Actually, if charIndex == 0, we include it in the "tail" to be moved.
        if (end.charIndex === 0) {
            endNodeTail = endNode;
        }
    }

    // C. Remove intermediate nodes in start paragraph
    startPara.children = startPara.children.slice(0, start.spanIndex + 1);

    // D. Remove intermediate paragraphs
    // ...

    // Collect remaining nodes from end paragraph
    // We start from end.spanIndex + 1, because endNode was split/handled.
    // BUT if endNodeTail exists, we need to add it.
    const endParaRemainingNodes = endPara.children.slice(end.spanIndex + 1);

    if (endNodeTail) {
        endParaRemainingNodes.unshift(endNodeTail);
    }

    // E. Merge end paragraph content into start paragraph
    startPara.children.push(...endParaRemainingNodes);

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

export const createImage = (src: string, width: number, height: number, alt?: string): Image => ({
    type: 'image',
    src,
    width,
    height,
    alt,
    id: crypto.randomUUID()
});

export function insertImage(document: DocumentModel, selection: Selection, src: string, width: number, height: number): void {
    const cursor = selection.head;
    const paragraph = document.sections[0].children[cursor.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[cursor.spanIndex];

    // We can only split spans, not images. 
    // If cursor is on an image, we should probably insert after it?
    // For now, assume cursor is always in a span or at boundary.
    if (!span || span.type !== 'span') {
        // If we are at the end of paragraph or between nodes, logic is needed.
        // Simplified: Insert at end if span is missing/invalid for now
        const image = createImage(src, width, height);
        paragraph.children.splice(cursor.spanIndex + 1, 0, image);
        return;
    }

    // Split current span
    const before = span.text.substring(0, cursor.charIndex);
    const after = span.text.substring(cursor.charIndex);

    span.text = before;

    const image = createImage(src, width, height);
    const afterSpan = createSpan(after, span.style);

    // Insert: [Span(before)] [Image] [Span(after)]
    paragraph.children.splice(cursor.spanIndex + 1, 0, image, afterSpan);

    // Update cursor to be after the image (start of afterSpan)
    cursor.spanIndex += 2;
    cursor.charIndex = 0;
    selection.anchor = { ...cursor };
}

export function insertText(document: DocumentModel, selection: Selection, text: string): void {
    const cursor = selection.head;
    const paragraph = document.sections[0].children[cursor.paragraphIndex];
    if (!paragraph) return;

    const node = paragraph.children[cursor.spanIndex];
    // Guard against inserting text into non-text node
    if (!node || node.type !== 'span') return;

    const before = node.text.substring(0, cursor.charIndex);
    const after = node.text.substring(cursor.charIndex);

    node.text = before + text + after;
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
        const targetNode = targetPara.children[cursor.spanIndex];

        if (targetNode && targetNode.type === 'span') {
            // Split current span
            const beforeText = targetNode.text.substring(0, cursor.charIndex);
            const afterText = targetNode.text.substring(cursor.charIndex);

            targetNode.text = beforeText;

            // Insert new spans
            const newSpans = para.children.map(s => ({ ...s }));

            // Create span for after text
            const afterSpan = createSpan(afterText, targetNode.style);

            // Insert: [CurrentSpan(before)] ...[NewSpans]... [AfterSpan] ...[Rest]
            targetPara.children.splice(cursor.spanIndex + 1, 0, ...newSpans, afterSpan);

            // Update cursor
            cursor.spanIndex += newSpans.length;
            cursor.charIndex = 0; // At start of afterSpan
            selection.anchor = { ...cursor };
            return;
        } else {
            // Target is image or undefined (end of para).
            // Just insert at cursor position.
            const newSpans = para.children.map(s => ({ ...s }));
            // If cursor.spanIndex points to an image, and charIndex is 0, insert before?
            // If charIndex is 1?
            // Simplified: Insert at spanIndex + 1 if we are "after" the node.
            // But cursor logic for image is tricky.
            // Assume insert at splice index.
            targetPara.children.splice(cursor.spanIndex, 0, ...newSpans);
            cursor.spanIndex += newSpans.length;
            selection.anchor = { ...cursor };
            return;
        }
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

    const node = paragraph.children[cursor.spanIndex];
    if (!node) return;

    if (direction === 'backward') {
        if (node.type === 'span' && cursor.charIndex > 0) {
            // Simple deletion within span
            const before = node.text.substring(0, cursor.charIndex - 1);
            const after = node.text.substring(cursor.charIndex);
            node.text = before + after;
            cursor.charIndex--;
        } else if (cursor.spanIndex > 0) {
            // Merge with previous node
            cursor.spanIndex--;
            const prevNode = paragraph.children[cursor.spanIndex];

            if (prevNode.type === 'span') {
                cursor.charIndex = prevNode.text.length;
                const before = prevNode.text.substring(0, prevNode.text.length - 1);
                prevNode.text = before;
                cursor.charIndex = prevNode.text.length;
            } else {
                // Previous node is image. Delete it?
                // Yes, backspace after image deletes image.
                paragraph.children.splice(cursor.spanIndex, 1);
                // Cursor is now at start of the node that WAS after the image (which is `node`).
                // So spanIndex stays same (but shifted because we removed one).
                // Wait, we decremented spanIndex to point to image.
                // We removed image at spanIndex.
                // Now spanIndex points to `node`.
                // charIndex should be 0.
                cursor.charIndex = 0;
            }
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
        if (node.type === 'span' && cursor.charIndex < node.text.length) {
            const before = node.text.substring(0, cursor.charIndex);
            const after = node.text.substring(cursor.charIndex + 1);
            node.text = before + after;
        } else if (node.type !== 'span') {
            // Delete image if cursor is before it?
            // If cursor is on image (index 0), delete it.
            paragraph.children.splice(cursor.spanIndex, 1);
            // Cursor stays same.
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

    const node = paragraph.children[cursor.spanIndex];
    if (!node) return;

    if (node.type !== 'span') {
        // If it's an image, we can't split it.
        // If cursor is at 0, we split before.
        // If cursor is at 1 (or >0), we split after.
        // For now, assume we just move the image to the new paragraph if cursor is 0?
        // Or if cursor is after, we move subsequent things.

        // Simplified: If on image, just split AFTER the image.
        const subsequentNodes = paragraph.children.slice(cursor.spanIndex + 1);
        const newParagraph: Paragraph = {
            type: 'paragraph',
            children: subsequentNodes,
            alignment: paragraph.alignment,
            listType: paragraph.listType,
            checked: paragraph.listType === 'check' ? false : undefined
        };

        paragraph.children = paragraph.children.slice(0, cursor.spanIndex + 1);
        section.children.splice(cursor.paragraphIndex + 1, 0, newParagraph);

        cursor.paragraphIndex++;
        cursor.spanIndex = 0;
        cursor.charIndex = 0;
        selection.anchor = { ...cursor };
        return;
    }

    // 1. Split the current span
    const beforeText = node.text.substring(0, cursor.charIndex);
    const afterText = node.text.substring(cursor.charIndex);

    node.text = beforeText;

    // 2. Create new span for the second part
    const newSpan = createSpan(afterText, node.style);

    // 3. Collect all subsequent spans in the current paragraph
    const subsequentNodes = paragraph.children.slice(cursor.spanIndex + 1);

    // 4. Create new paragraph with the new span and subsequent spans
    const newParagraph: Paragraph = {
        type: 'paragraph',
        children: [newSpan, ...subsequentNodes],
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
    const node = paragraph.children[spanIndex];
    if (!node || node.type !== 'span') return;

    // If split point is at boundaries, no need to split
    if (charIndex <= 0 || charIndex >= node.text.length) return;

    const leftText = node.text.substring(0, charIndex);
    const rightText = node.text.substring(charIndex);

    const leftSpan = createSpan(leftText, { ...node.style });
    const rightSpan = createSpan(rightText, { ...node.style });

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
    const startNode = startPara.children[start.spanIndex];
    if (startNode && startNode.type === 'span' && start.charIndex > 0 && start.charIndex < startNode.text.length) {
        splitSpan(startPara, start.spanIndex, start.charIndex);
        // After split, the "selection start" is now at the beginning of the NEXT span (the right half).
        // So we increment spanIndex and reset charIndex to 0.
        start.spanIndex++;
        start.charIndex = 0;

        // If start and end were in the same span, we need to adjust end as well.
        if (start.paragraphIndex === end.paragraphIndex && start.spanIndex - 1 === end.spanIndex) {
            // ... logic ...
            end.spanIndex++;
            const prevNode = startPara.children[start.spanIndex - 1];
            if (prevNode.type === 'span') {
                end.charIndex -= prevNode.text.length;
            }
        }
    }

    // 2. Normalize End
    // If end is in middle of span, split it.
    // 2. Normalize End
    // If end is in middle of span, split it.
    const endPara = section.children[end.paragraphIndex];
    const endNode = endPara.children[end.spanIndex];
    if (endNode && endNode.type === 'span' && end.charIndex > 0 && end.charIndex < endNode.text.length) {
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
                if (span.type !== 'span' || span.text.length > 0) {
                    endS = end.spanIndex - 1;
                }
            }
        }

        for (let s = startS; s <= endS; s++) {
            const node = paragraph.children[s];
            if (node.type === 'span') {
                node.style = { ...node.style, ...styleChange };
            }
        }
    }
}

import type { CursorPosition } from '../state/EditorState';

// Helper to get style at a specific point
export function getStyleAtPosition(document: DocumentModel, position: CursorPosition): Style {
    const section = document.sections[0];
    const paragraph = section.children[position.paragraphIndex];
    const span = paragraph.children[position.spanIndex];
    if (span && span.type === 'span') {
        return span.style;
    }
    return { fontFamily: 'Roboto-Regular', fontSize: 16 }; // Default style for non-text nodes
}

// The Toggle Function
export function toggleStyle(document: DocumentModel, selection: Selection, property: keyof Style): void {
    const { start } = getSortedSelection(selection);
    const currentStyle = getStyleAtPosition(document, start);

    // Determine target value (invert current)
    // Coerce to boolean for toggles (bold, italic, underline)
    const currentValue = !!(currentStyle && currentStyle[property]);
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

export function resizeImage(document: DocumentModel, id: string, width: number, height: number): void {
    for (const section of document.sections) {
        for (const paragraph of section.children) {
            for (const node of paragraph.children) {
                if (node.type === 'image' && node.id === id) {
                    node.width = width;
                    node.height = height;
                    return;
                }
            }
        }
    }
}

export function moveImage(document: DocumentModel, id: string, targetSelection: Selection): void {
    // 1. Find and remove the image
    let imageNode: Image | null = null;
    let sourceParagraph: Paragraph | null = null;
    let sourceSpanIndex = -1;

    for (const section of document.sections) {
        for (const paragraph of section.children) {
            for (let i = 0; i < paragraph.children.length; i++) {
                const node = paragraph.children[i];
                if (node.type === 'image' && node.id === id) {
                    imageNode = node;
                    sourceParagraph = paragraph;
                    sourceSpanIndex = i;
                    break;
                }
            }
            if (imageNode) break;
        }
        if (imageNode) break;
    }

    if (!imageNode || !sourceParagraph) return;

    // Remove from source
    sourceParagraph.children.splice(sourceSpanIndex, 1);

    // 2. Insert at target
    // Use insertImage logic but with existing node
    const cursor = targetSelection.head;
    const targetSection = document.sections[0]; // Assume single section for now
    const targetParagraph = targetSection.children[cursor.paragraphIndex];

    if (!targetParagraph) return; // Should not happen

    const span = targetParagraph.children[cursor.spanIndex];

    if (!span || span.type !== 'span') {
        // Insert at end or specific index if not a span
        targetParagraph.children.splice(cursor.spanIndex + 1, 0, imageNode);
        return;
    }

    // Split span
    const before = span.text.substring(0, cursor.charIndex);
    const after = span.text.substring(cursor.charIndex);

    span.text = before;
    const afterSpan = createSpan(after, span.style);

    targetParagraph.children.splice(cursor.spanIndex + 1, 0, imageNode, afterSpan);
}
