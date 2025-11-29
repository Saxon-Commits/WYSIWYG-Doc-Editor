import { setParagraphAlignment, toggleStyle, applyStyle } from '../model/DocumentModel';
import type { DocumentModel } from '../model/DocumentModel';
import type { EditorState } from '../state/EditorState';

const fontOptions = [
    { label: 'Roboto', value: "'Roboto', sans-serif" },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
    { label: 'Merriweather', value: "'Merriweather', serif" },
    { label: 'Playfair Display', value: "'Playfair Display', serif" },
    { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
    { label: 'Arial', value: "'Arial', sans-serif" },
];

export class Toolbar {
    private element: HTMLElement;
    private documentModel: DocumentModel;
    private editorState: EditorState;
    private onUpdate: () => void;

    constructor(
        documentModel: DocumentModel,
        editorState: EditorState,
        onUpdate: () => void
    ) {
        this.documentModel = documentModel;
        this.editorState = editorState;
        this.onUpdate = onUpdate;
        this.element = document.createElement('div');
        this.element.className = 'editor-toolbar';
        this.setupButtons();
        // Insert before the app container or inside it
        const app = document.getElementById('app');
        if (app) {
            app.insertBefore(this.element, app.firstChild);
        }
    }

    private setupButtons() {
        // Font Selector
        const fontGroup = document.createElement('div');
        fontGroup.className = 'toolbar-group';

        const fontSelect = document.createElement('select');
        fontSelect.style.height = '28px'; // Match button height roughly

        fontOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            fontSelect.appendChild(option);
        });

        // Prevent focus loss on mousedown
        fontSelect.addEventListener('mousedown', () => {
            // We don't prevent default here because we need the dropdown to open
            // But we need to ensure we don't lose selection context?
            // Actually, clicking a select usually blurs the editor.
            // But we can handle the change event.
        });

        fontSelect.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            this.handleFontChange(value);
            // Refocus editor?
            // inputManager.focus() is not accessible here easily unless we pass it or expose it.
            // But onUpdate triggers render which might be enough if we handle focus there?
            // The user didn't ask for focus handling here specifically, but "Call e.preventDefault() to keep focus" was for buttons.
            // For select, we can't prevent default on mousedown or it won't open.
        });

        fontGroup.appendChild(fontSelect);
        this.element.appendChild(fontGroup);

        const groups = [
            [
                { label: 'B', action: () => this.toggleFormat('bold') },
                { label: 'I', action: () => this.toggleFormat('italic') },
                { label: 'U', action: () => this.toggleFormat('underline') },
            ],
            [
                { label: 'Left', action: () => this.align('left') },
                { label: 'Center', action: () => this.align('center') },
                { label: 'Right', action: () => this.align('right') },
                { label: 'Justify', action: () => this.align('justify') },
            ]
        ];

        groups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'toolbar-group';

            group.forEach(btn => {
                const button = document.createElement('button');
                button.textContent = btn.label;
                // CRITICAL: Prevent focus loss
                button.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (this.editorState.selection) {
                        btn.action();
                    }
                });
                groupDiv.appendChild(button);
            });

            this.element.appendChild(groupDiv);
        });
    }

    private handleFontChange(fontFamily: string) {
        if (!this.editorState.selection) return;
        applyStyle(this.documentModel, this.editorState.selection, { fontFamily });
        this.onUpdate();
    }

    private toggleFormat(prop: any) {
        if (!this.editorState.selection) return;
        toggleStyle(this.documentModel, this.editorState.selection, prop);
        this.onUpdate();
    }

    private align(alignment: 'left' | 'center' | 'right' | 'justify') {
        if (!this.editorState.selection) return;
        setParagraphAlignment(this.documentModel, this.editorState.selection, alignment);
        this.onUpdate();
    }
}
