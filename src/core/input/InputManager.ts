import { insertText, deleteText, splitParagraph, getRangeText, deleteRange, toggleStyle, setParagraphAlignment, insertFragment, toggleList } from '../model/DocumentModel';
import type { DocumentModel } from '../model/DocumentModel';
import { EditorState } from '../state/EditorState';
import { ClipboardUtils } from '../utils/ClipboardUtils';

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
            if (!this.editorState.selection) return;

            const data = (e as InputEvent).data;

            // Check if range selection (start != end)
            const { anchor, head } = this.editorState.selection;
            const isRange = anchor.paragraphIndex !== head.paragraphIndex ||
                anchor.spanIndex !== head.spanIndex ||
                anchor.charIndex !== head.charIndex;

            if (isRange && data) {
                // If typing over a range, delete range first
                deleteRange(this.documentModel, this.editorState.selection);
            }

            if (data) {
                insertText(this.documentModel, this.editorState.selection, data);

                // Auto-List Formatting Logic
                if (data === ' ') {
                    const cursor = this.editorState.selection.head;
                    const section = this.documentModel.sections[0];
                    const paragraph = section.children[cursor.paragraphIndex];

                    // Get text up to cursor
                    // Simple check: assume single span for now or check first span
                    // Ideally we get full text of paragraph but checking first span is usually enough for start-of-line triggers
                    if (paragraph.children.length > 0) {
                        const firstSpan = paragraph.children[0];
                        const text = firstSpan.text;

                        // Check patterns
                        // 1. Bullet: "- "
                        if (text.startsWith('- ') && cursor.spanIndex === 0 && cursor.charIndex === 2) {
                            // Remove "- "
                            firstSpan.text = text.substring(2);
                            this.editorState.selection.head.charIndex -= 2;
                            this.editorState.selection.anchor.charIndex -= 2;
                            // Set List Type
                            toggleList(this.documentModel, this.editorState.selection, 'bullet');
                        }
                        // 2. Numbered: "1. "
                        else if (text.startsWith('1. ') && cursor.spanIndex === 0 && cursor.charIndex === 3) {
                            // Remove "1. "
                            firstSpan.text = text.substring(3);
                            this.editorState.selection.head.charIndex -= 3;
                            this.editorState.selection.anchor.charIndex -= 3;
                            // Set List Type
                            toggleList(this.documentModel, this.editorState.selection, 'number');
                        }
                        // 3. Checklist: "[] "
                        else if (text.startsWith('[] ') && cursor.spanIndex === 0 && cursor.charIndex === 3) {
                            // Remove "[] "
                            firstSpan.text = text.substring(3);
                            this.editorState.selection.head.charIndex -= 3;
                            this.editorState.selection.anchor.charIndex -= 3;
                            // Set List Type
                            toggleList(this.documentModel, this.editorState.selection, 'check');
                        }
                    }
                }
            } else {
                // Handle composition or other input types if needed
            }
            this.onUpdate();
        });

        this.textarea.addEventListener('keydown', (e) => {
            if (!this.editorState.selection) return;

            // Check for composition
            if (e.isComposing) return;

            // Handle Select All (Cmd+A or Ctrl+A)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();

                const section = this.documentModel.sections[0];
                if (section.children.length === 0) return;

                const lastParaIndex = section.children.length - 1;
                const lastPara = section.children[lastParaIndex];
                const lastSpanIndex = lastPara.children.length - 1;
                const lastSpan = lastPara.children[lastSpanIndex];

                // Select from start (0,0,0) to end of doc
                this.editorState.setSelection(
                    { paragraphIndex: 0, spanIndex: 0, charIndex: 0 },
                    { paragraphIndex: lastParaIndex, spanIndex: lastSpanIndex, charIndex: lastSpan.text.length }
                );

                this.onUpdate();
                return;
            }

            // Handle Bold (Cmd+B or Ctrl+B)
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                if (this.editorState.selection) {
                    toggleStyle(this.documentModel, this.editorState.selection, 'bold');
                    this.onUpdate();
                }
                return;
            }

            // Handle Italic (Cmd+I or Ctrl+I)
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                if (this.editorState.selection) {
                    toggleStyle(this.documentModel, this.editorState.selection, 'italic');
                    this.onUpdate();
                }
                return;
            }

            // Handle Underline (Cmd+U or Ctrl+U)
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                if (this.editorState.selection) {
                    toggleStyle(this.documentModel, this.editorState.selection, 'underline');
                    this.onUpdate();
                }
                return;
            }

            // --- Alignment Shortcuts ---
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {

                // Left Align (Cmd+Shift+L)
                if (e.code === 'KeyL') {
                    e.preventDefault();
                    console.log('Shortcut: Align Left'); // Debug to console
                    setParagraphAlignment(this.documentModel, this.editorState.selection, 'left');
                    this.onUpdate();
                    return;
                }

                // Center Align (Cmd+Shift+E)
                if (e.code === 'KeyE') {
                    e.preventDefault();
                    console.log('Shortcut: Align Center');
                    setParagraphAlignment(this.documentModel, this.editorState.selection, 'center');
                    this.onUpdate();
                    return;
                }

                // Right Align (Cmd+Shift+R)
                if (e.code === 'KeyR') {
                    e.preventDefault();
                    console.log('Shortcut: Align Right');
                    setParagraphAlignment(this.documentModel, this.editorState.selection, 'right');
                    this.onUpdate();
                    return;
                }

                // Justify (Cmd+Shift+J)
                if (e.code === 'KeyJ') {
                    e.preventDefault();
                    console.log('Shortcut: Justify');
                    setParagraphAlignment(this.documentModel, this.editorState.selection, 'justify');
                    this.onUpdate();
                    return;
                }
            }

            // Check if range selection
            const { anchor, head } = this.editorState.selection;
            const isRange = anchor.paragraphIndex !== head.paragraphIndex ||
                anchor.spanIndex !== head.spanIndex ||
                anchor.charIndex !== head.charIndex;

            if (e.key === 'Enter') {
                e.preventDefault();
                if (isRange) {
                    deleteRange(this.documentModel, this.editorState.selection);
                }

                // List Handling: If empty list item, exit list
                const cursor = this.editorState.selection.head;
                const section = this.documentModel.sections[0];
                const paragraph = section.children[cursor.paragraphIndex];

                // Check if paragraph is empty (single empty span)
                const isEmpty = paragraph.children.length === 1 && paragraph.children[0].text.length === 0;

                if (paragraph.listType && isEmpty) {
                    // Exit list mode
                    delete paragraph.listType;
                    delete paragraph.checked;
                    this.onUpdate();
                } else {
                    splitParagraph(this.documentModel, this.editorState.selection);
                    this.onUpdate();
                }
            } else if (e.key === 'Backspace') {
                if (isRange) {
                    deleteRange(this.documentModel, this.editorState.selection);
                } else {
                    // List Handling: If at start of list item, exit list
                    const cursor = this.editorState.selection.head;
                    const section = this.documentModel.sections[0];
                    const paragraph = section.children[cursor.paragraphIndex];

                    if (paragraph.listType && cursor.spanIndex === 0 && cursor.charIndex === 0) {
                        delete paragraph.listType;
                        delete paragraph.checked;
                    } else {
                        deleteText(this.documentModel, this.editorState.selection, 'backward');
                    }
                }
                this.onUpdate();
            } else if (e.key === 'Delete') {
                if (isRange) {
                    deleteRange(this.documentModel, this.editorState.selection);
                } else {
                    deleteText(this.documentModel, this.editorState.selection, 'forward');
                }
                this.onUpdate();
            } else if (e.key === 'ArrowLeft') {
                const cursor = this.editorState.selection.head;
                // Case 1: Middle of paragraph
                if (cursor.charIndex > 0) {
                    cursor.charIndex--;
                }
                // Case 2: Start of paragraph (Go to end of previous)
                else if (cursor.paragraphIndex > 0) {
                    const prevIndex = cursor.paragraphIndex - 1;
                    const prevParagraph = this.documentModel.sections[0].children[prevIndex];
                    // Assume single span for now
                    const lastSpan = prevParagraph.children[prevParagraph.children.length - 1];

                    cursor.paragraphIndex = prevIndex;
                    cursor.spanIndex = prevParagraph.children.length - 1;
                    cursor.charIndex = lastSpan.text.length;
                }

                // Sync anchor if shift not pressed (TODO: Handle shift for selection)
                // For now, always collapse selection on arrow keys
                this.editorState.selection.anchor = { ...cursor };
                this.onUpdate();
            } else if (e.key === 'ArrowRight') {
                const cursor = this.editorState.selection.head;
                // Get current context
                const section = this.documentModel.sections[0];
                const paragraph = section.children[cursor.paragraphIndex];
                const span = paragraph.children[cursor.spanIndex];

                // Case 1: Middle of paragraph
                if (cursor.charIndex < span.text.length) {
                    cursor.charIndex++;
                }
                // Case 2: End of paragraph (Go to start of next)
                else if (cursor.paragraphIndex < section.children.length - 1) {
                    cursor.paragraphIndex++;
                    cursor.spanIndex = 0;
                    cursor.charIndex = 0;
                }

                // Sync anchor
                this.editorState.selection.anchor = { ...cursor };
                this.onUpdate();
            }

            // Handle Copy/Cut/Paste via keyboard shortcuts if needed, 
            // but usually 'copy', 'cut', 'paste' events are better.
        });

        // Clipboard Events
        this.textarea.addEventListener('copy', (e) => {
            if (!this.editorState.selection) return;
            e.preventDefault();
            const text = getRangeText(this.documentModel, this.editorState.selection);
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', text);
            }
        });

        this.textarea.addEventListener('cut', (e) => {
            if (!this.editorState.selection) return;
            e.preventDefault();
            const text = getRangeText(this.documentModel, this.editorState.selection);
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', text);
            }
            deleteRange(this.documentModel, this.editorState.selection);
            this.onUpdate();
        });

        this.textarea.addEventListener('paste', (e) => {
            if (!this.editorState.selection) return;
            e.preventDefault();

            // Try HTML first
            const html = e.clipboardData?.getData('text/html');
            if (html) {
                const paragraphs = ClipboardUtils.parseHtmlContent(html);
                if (paragraphs.length > 0) {
                    // Check range
                    const { anchor, head } = this.editorState.selection;
                    const isRange = anchor.paragraphIndex !== head.paragraphIndex ||
                        anchor.spanIndex !== head.spanIndex ||
                        anchor.charIndex !== head.charIndex;

                    if (isRange) {
                        deleteRange(this.documentModel, this.editorState.selection);
                    }

                    insertFragment(this.documentModel, this.editorState.selection, paragraphs);
                    this.onUpdate();
                    return;
                }
            }

            // Fallback to plain text
            const text = e.clipboardData?.getData('text/plain');
            if (text) {
                // Check range
                const { anchor, head } = this.editorState.selection;
                const isRange = anchor.paragraphIndex !== head.paragraphIndex ||
                    anchor.spanIndex !== head.spanIndex ||
                    anchor.charIndex !== head.charIndex;

                if (isRange) {
                    deleteRange(this.documentModel, this.editorState.selection);
                }

                insertText(this.documentModel, this.editorState.selection, text);
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

    public setDocument(document: DocumentModel) {
        this.documentModel = document;
    }
}
