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

    setSelection(anchor: CursorPosition, head: CursorPosition) {
        this.selection = { anchor, head };
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
