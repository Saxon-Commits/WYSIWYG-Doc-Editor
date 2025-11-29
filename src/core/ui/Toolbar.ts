import { setParagraphAlignment, toggleStyle, applyStyle, serializeDocument, deserializeDocument } from '../model/DocumentModel';
import type { DocumentModel } from '../model/DocumentModel';
import type { EditorState } from '../state/EditorState';

const fontOptions = [
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Open Sans', value: 'Open Sans' },
    { label: 'Merriweather', value: 'Merriweather' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'Roboto Mono', value: 'Roboto Mono' },
    { label: 'Montserrat', value: 'Montserrat' }
];

export class Toolbar {
    private element: HTMLElement;
    private documentModel: DocumentModel;
    private editorState: EditorState;
    private onUpdate: () => void;
    private onLoadDocument: (doc: DocumentModel) => void;

    constructor(
        documentModel: DocumentModel,
        editorState: EditorState,
        onUpdate: () => void,
        onLoadDocument: (doc: DocumentModel) => void
    ) {
        this.documentModel = documentModel;
        this.editorState = editorState;
        this.onUpdate = onUpdate;
        this.onLoadDocument = onLoadDocument;
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
            ],
            [
                { label: 'Save', action: () => this.saveDocument() },
                { label: 'Load', action: () => this.loadDocument() },
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
                    // For Save/Load we might not need selection, but for others we do.
                    // Save/Load don't depend on selection, but we don't want to lose focus if user cancels or whatever.
                    // Actually, Load will reload the doc, so focus is reset.
                    btn.action();
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

    private saveDocument() {
        const json = serializeDocument(this.documentModel);
        console.log('Saved Document JSON:', json);
        localStorage.setItem('test_doc', json);
        alert('Document saved to localStorage!');
    }

    private loadDocument() {
        const json = localStorage.getItem('test_doc');
        if (!json) {
            alert('No saved document found in localStorage.');
            return;
        }
        const doc = deserializeDocument(json);
        console.log('Loaded Document:', doc);
        this.onLoadDocument(doc);
    }
}
