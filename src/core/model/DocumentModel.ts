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
            const before = span.text.substring(0, selection.charIndex - 1);
            const after = span.text.substring(selection.charIndex);
            span.text = before + after;
        }
        // Else: handle merging with previous span or paragraph (not implemented yet)
    } else {
        if (selection.charIndex < span.text.length) {
            const before = span.text.substring(0, selection.charIndex);
            const after = span.text.substring(selection.charIndex + 1);
            span.text = before + after;
        }
        // Else: handle merging with next span or paragraph
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
