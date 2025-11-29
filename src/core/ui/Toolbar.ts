import { setParagraphAlignment, toggleStyle, applyStyle, deserializeDocument } from '../model/DocumentModel';
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

import { storageService } from '../services/StorageService';

// ... (keep existing imports)

export class Toolbar {
    private element: HTMLElement;
    private documentModel: DocumentModel;
    private editorState: EditorState;
    private onUpdate: () => void;
    private onLoadDocument: (doc: DocumentModel) => void;
    private currentDocId: string | null = null;

    constructor(
        documentModel: DocumentModel,
        editorState: EditorState,
        onUpdate: () => void,
        onLoadDocument: (doc: DocumentModel) => void,
        initialId?: string
    ) {
        this.documentModel = documentModel;
        this.editorState = editorState;
        this.onUpdate = onUpdate;
        this.onLoadDocument = onLoadDocument;
        this.currentDocId = initialId || null;
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

    private async saveDocument() {
        // Simple title prompt for now (can be a UI input later)
        const title = prompt("Document Title:", "My Document") || "Untitled";

        try {
            const id = await storageService.save(this.documentModel, title, this.currentDocId || undefined);
            this.currentDocId = id;

            // Update URL without reloading
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('id', id);
            window.history.pushState({}, '', newUrl);

            alert('Saved to Cloud!');
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        }
    }

    private async loadDocument() {
        // For now, maybe just prompt for an ID to load? 
        // Or keep the localStorage one as a backup?
        // The user request didn't specify changing the Load button behavior explicitly, 
        // but "Load Document from URL" implies loading happens on startup.
        // However, the user said "Update saveDocument" in Toolbar.
        // I will leave the Load button doing localStorage for now unless I should change it to prompt?
        // The user instruction said: "Update saveDocument: Call storageService.save..."
        // It didn't explicitly say "Update loadDocument button".
        // But it makes sense to have a way to load.
        // I'll keep the localStorage load for now as a dev tool, or maybe prompt for ID?
        // Let's stick to the explicit instructions: "Update saveDocument".
        // I will NOT change loadDocument button behavior unless asked, to avoid breaking existing workflow.
        // Wait, the user said "Load Document from URL" in the next section for main.ts.
        // So the Load button might be redundant or could be updated later.
        // I'll leave it as is (localStorage) to be safe, or maybe comment it out?
        // I'll leave it as is.

        const json = localStorage.getItem('test_doc');
        if (!json) {
            alert('No saved document found in localStorage.');
            return;
        }
        const doc = deserializeDocument(json);
        console.log('Loaded Document:', doc);
        this.onLoadDocument(doc);
    }

    public setDocument(document: DocumentModel) {
        this.documentModel = document;
    }
}
