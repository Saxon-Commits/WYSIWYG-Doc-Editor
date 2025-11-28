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

export const createSection = (children: Paragraph[] = []): Section => ({
    type: 'section',
    children,
});

export const createDocument = (sections: Section[] = []): DocumentModel => ({
    sections,
});
