import { insertText, deleteText } from '../model/DocumentModel';
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
        this.textarea.style.opacity = '0';
        this.textarea.style.pointerEvents = 'none';
        this.textarea.style.zIndex = '-1';
        this.textarea.style.width = '1px';
        this.textarea.style.height = '1px';

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

            if (e.key === 'Backspace') {
                deleteText(this.documentModel, this.editorState.selection, 'backward');

                // Move cursor backward
                if (this.editorState.selection.charIndex > 0) {
                    this.editorState.selection.charIndex--;
                }

                this.onUpdate();
            } else if (e.key === 'Delete') {
                deleteText(this.documentModel, this.editorState.selection, 'forward');
                this.onUpdate();
            } else if (e.key === 'ArrowLeft') {
                if (this.editorState.selection.charIndex > 0) {
                    this.editorState.selection.charIndex--;
                    this.onUpdate();
                }
            } else if (e.key === 'ArrowRight') {
                // We need to know the max length of the current span to limit this
                // For now, let's just increment and rely on visual feedback or bounds checking later
                this.editorState.selection.charIndex++;
                this.onUpdate();
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
