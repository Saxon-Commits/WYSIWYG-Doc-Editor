export interface CursorPosition {
    paragraphIndex: number;
    spanIndex: number;
    charIndex: number;
}

export interface Selection {
    anchor: CursorPosition;
    head: CursorPosition;
}

export class EditorState {
    selection: Selection | null = null;
    selectedImage: string | null = null;

    setSelection(anchor: CursorPosition, head: CursorPosition) {
        this.selection = { anchor, head };
        this.selectedImage = null; // Clear image selection when text is selected
    }

    selectImage(id: string) {
        this.selectedImage = id;
        this.selection = null; // Clear text selection when image is selected
    }

    // Helper to get start/end regardless of drag direction
    getSortedSelection(): { start: CursorPosition, end: CursorPosition } | null {
        if (!this.selection) return null;
        const { anchor, head } = this.selection;

        // Compare logic: Para -> Span -> Char
        let isAnchorBefore = false;
        if (anchor.paragraphIndex < head.paragraphIndex) isAnchorBefore = true;
        else if (anchor.paragraphIndex === head.paragraphIndex) {
            if (anchor.spanIndex < head.spanIndex) isAnchorBefore = true;
            else if (anchor.spanIndex === head.spanIndex) {
                if (anchor.charIndex < head.charIndex) isAnchorBefore = true;
            }
        }

        return isAnchorBefore
            ? { start: anchor, end: head }
            : { start: head, end: anchor };
    }
}
