import { insertText, deleteText, splitParagraph } from '../model/DocumentModel';
import type { DocumentModel } from '../model/DocumentModel';
import { EditorState } from '../state/EditorState';

export class InputManager {
    private textarea: HTMLTextAreaElement;
    private documentModel: DocumentModel;
    private editorState: EditorState;
    private onUpdate: () => void;

    constructor(documentModel: DocumentModel, editorState: EditorState, onUpdate: () => void) {
        this.documentModel = documentModel;
        this.editorState = editorState;
        this.onUpdate = onUpdate;

        this.textarea = document.createElement('textarea');
        this.setupTextarea();
        this.attachEventListeners();
    }

    private setupTextarea() {
        this.textarea.style.position = 'absolute';
        // Keep opacity 0, but ensure it's technically "on screen"
        this.textarea.style.opacity = '0';
        this.textarea.style.pointerEvents = 'none';
        this.textarea.style.zIndex = '0'; // Change from -1 to 0 just to be safe
        this.textarea.style.width = '1px';
        this.textarea.style.height = '1px';

        // Improve mobile keyboard support
        this.textarea.setAttribute('autocorrect', 'off');
        this.textarea.setAttribute('autocapitalize', 'off');
        this.textarea.setAttribute('spellcheck', 'false');

        document.body.appendChild(this.textarea);
    }

    private attachEventListeners() {
        this.textarea.addEventListener('input', (e) => {
            const target = e.target as HTMLTextAreaElement;
            const text = target.value;

            if (this.editorState.selection && text.length > 0) {
                insertText(this.documentModel, this.editorState.selection, text);

                // Move cursor forward
                this.editorState.selection.charIndex += text.length;

                this.onUpdate();
            }

            // Clear textarea
            target.value = '';
        });

        this.textarea.addEventListener('keydown', (e) => {
            if (!this.editorState.selection) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                splitParagraph(this.documentModel, this.editorState.selection);
                this.onUpdate();
            } else if (e.key === 'Backspace') {
                deleteText(this.documentModel, this.editorState.selection, 'backward');
                // Cursor movement is now handled entirely by deleteText
                this.onUpdate();
            } else if (e.key === 'Delete') {
                deleteText(this.documentModel, this.editorState.selection, 'forward');
                this.onUpdate();
            } else if (e.key === 'ArrowLeft') {
                // Case 1: Middle of paragraph
                if (this.editorState.selection.charIndex > 0) {
                    this.editorState.selection.charIndex--;
                    this.onUpdate();
                }
                // Case 2: Start of paragraph (Go to end of previous)
                else if (this.editorState.selection.paragraphIndex > 0) {
                    const prevIndex = this.editorState.selection.paragraphIndex - 1;
                    const prevParagraph = this.documentModel.sections[0].children[prevIndex];
                    // Assume single span for now
                    const lastSpan = prevParagraph.children[prevParagraph.children.length - 1];

                    this.editorState.selection.paragraphIndex = prevIndex;
                    this.editorState.selection.spanIndex = prevParagraph.children.length - 1;
                    this.editorState.selection.charIndex = lastSpan.text.length;
                    this.onUpdate();
                }
            } else if (e.key === 'ArrowRight') {
                // Get current context
                const section = this.documentModel.sections[0];
                const paragraph = section.children[this.editorState.selection.paragraphIndex];
                const span = paragraph.children[this.editorState.selection.spanIndex];

                // Case 1: Middle of paragraph
                if (this.editorState.selection.charIndex < span.text.length) {
                    this.editorState.selection.charIndex++;
                    this.onUpdate();
                }
                // Case 2: End of paragraph (Go to start of next)
                else if (this.editorState.selection.paragraphIndex < section.children.length - 1) {
                    this.editorState.selection.paragraphIndex++;
                    this.editorState.selection.spanIndex = 0;
                    this.editorState.selection.charIndex = 0;
                    this.onUpdate();
                }
            }
        });

        // Keep focus
        this.textarea.addEventListener('blur', () => {
            // Optional: re-focus if we want to force it, but better to let user click canvas
        });
    }

    public focus() {
        this.textarea.focus();
    }

    public updateCursorPosition(x: number, y: number) {
        this.textarea.style.left = `${x}px`;
        this.textarea.style.top = `${y}px`;
    }
}
