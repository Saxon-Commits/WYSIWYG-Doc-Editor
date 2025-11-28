export interface Selection {
    startPage: number;
    startOffset: number; // Global index or paragraph-relative index?
    // Let's use a "Path" approach for accuracy in a tree structure
    paragraphIndex: number;
    spanIndex: number;
    charIndex: number;
}

export class EditorState {
    selection: Selection | null = null;

    setSelection(sel: Selection) {
        this.selection = sel;
    }
}
