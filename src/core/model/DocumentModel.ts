export interface Style {
    fontFamily: string;
    fontSize: number;
    bold?: boolean;
    italic?: boolean;
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

export const createParagraph = (children: Span[] = [], style?: Style): Paragraph => ({
    type: 'paragraph',
    children,
    style,
});

export function createSection(children: Paragraph[] = []): Section {
    return {
        type: 'section',
        children
    };
}

import type { Selection } from '../state/EditorState';

export function insertText(document: DocumentModel, selection: Selection, text: string): void {
    // Simplified implementation: find the span and insert text
    // We assume selection.paragraphIndex maps to the first section's paragraphs for now
    // In a real app, we'd need to traverse sections or have a flat paragraph list or use IDs

    // For now, let's assume single section
    const section = document.sections[0];
    if (!section) return;

    const paragraph = section.children[selection.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[selection.spanIndex];
    if (!span) return;

    const before = span.text.substring(0, selection.charIndex);
    const after = span.text.substring(selection.charIndex);

    span.text = before + text + after;
}

export function deleteText(document: DocumentModel, selection: Selection, direction: 'backward' | 'forward'): void {
    const section = document.sections[0];
    if (!section) return;

    const paragraph = section.children[selection.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[selection.spanIndex];
    if (!span) return;

    if (direction === 'backward') {
        if (selection.charIndex > 0) {
            // Simple delete: Remove char and move cursor back
            const before = span.text.substring(0, selection.charIndex - 1);
            const after = span.text.substring(selection.charIndex);
            span.text = before + after;
            selection.charIndex--;
        } else {
            // Merge Paragraphs: If at start of paragraph (and not the first one)
            if (selection.spanIndex === 0 && selection.paragraphIndex > 0) {
                const prevParagraphIndex = selection.paragraphIndex - 1;
                const prevParagraph = section.children[prevParagraphIndex];

                // We want the cursor to be at the end of the previous paragraph's content
                const newSpanIndex = prevParagraph.children.length - 1;
                const lastSpan = prevParagraph.children[newSpanIndex];
                const newCharIndex = lastSpan.text.length;

                // Move all spans from current paragraph to previous paragraph
                prevParagraph.children.push(...paragraph.children);

                // Remove the current paragraph
                section.children.splice(selection.paragraphIndex, 1);

                // Update Selection to the merge point
                selection.paragraphIndex = prevParagraphIndex;
                selection.spanIndex = newSpanIndex;
                selection.charIndex = newCharIndex;
            }
        }
    } else {
        // Forward delete (Delete key)
        if (selection.charIndex < span.text.length) {
            const before = span.text.substring(0, selection.charIndex);
            const after = span.text.substring(selection.charIndex + 1);
            span.text = before + after;
            // Cursor stays in place for forward delete
        } else {
            // Forward Merge: If at end of paragraph, pull the NEXT paragraph into this one
            const section = document.sections[0];
            if (selection.paragraphIndex < section.children.length - 1) {
                const nextParaIndex = selection.paragraphIndex + 1;
                const nextParagraph = section.children[nextParaIndex];

                // Move children from next to current
                paragraph.children.push(...nextParagraph.children);

                // Remove next paragraph
                section.children.splice(nextParaIndex, 1);

                // Cursor stays in place (at the join point)
            }
        }
    }
}

export function splitParagraph(document: DocumentModel, selection: Selection): void {
    const section = document.sections[0];
    if (!section) return;

    const paragraph = section.children[selection.paragraphIndex];
    if (!paragraph) return;

    const span = paragraph.children[selection.spanIndex];
    if (!span) return;

    // 1. Split the current span
    const beforeText = span.text.substring(0, selection.charIndex);
    const afterText = span.text.substring(selection.charIndex);

    span.text = beforeText;

    // 2. Create new span for the second part
    const newSpan = createSpan(afterText, span.style);

    // 3. Collect all subsequent spans in the current paragraph
    const subsequentSpans = paragraph.children.slice(selection.spanIndex + 1);

    // 4. Create new paragraph with the new span and subsequent spans
    const newParagraph = createParagraph([newSpan, ...subsequentSpans]);

    // 5. Remove moved spans from original paragraph
    paragraph.children = paragraph.children.slice(0, selection.spanIndex + 1);

    // 6. Insert new paragraph into section
    section.children.splice(selection.paragraphIndex + 1, 0, newParagraph);

    // 7. Update selection to start of new paragraph
    selection.paragraphIndex++;
    selection.spanIndex = 0;
    selection.charIndex = 0;
}

export const createDocument = (sections: Section[] = []): DocumentModel => ({
    sections,
});
