import { setParagraphAlignment, toggleStyle, applyStyle, deserializeDocument, toggleList, setParagraphSpacing, insertImage } from '../model/DocumentModel';
import type { DocumentModel, Style } from '../model/DocumentModel';
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
        container: HTMLElement,
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

        // Append to the specific container
        container.prepend(this.element);
    }

    public destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    private setupButtons() {
        // --- 1. Text Style Selector ---
        const styleGroup = document.createElement('div');
        styleGroup.className = 'toolbar-group';
        const styleSelect = document.createElement('select');
        styleSelect.style.height = '28px';
        const styles = [
            { label: 'Normal', value: 'normal' },
            { label: 'Heading 1', value: 'h1' },
            { label: 'Heading 2', value: 'h2' },
            { label: 'Heading 3', value: 'h3' }
        ];
        styles.forEach(s => {
            const option = document.createElement('option');
            option.value = s.value;
            option.textContent = s.label;
            styleSelect.appendChild(option);
        });
        styleSelect.addEventListener('change', (e) => {
            const val = (e.target as HTMLSelectElement).value;
            this.handleStyleChange(val);
        });
        styleGroup.appendChild(styleSelect);
        this.element.appendChild(styleGroup);

        // --- 5. List Buttons ---
        const listGroup = document.createElement('div');
        listGroup.className = 'toolbar-group';

        const bulletBtn = this.createButton('• List', () => this.toggleListType('bullet'));
        const numberBtn = this.createButton('1. List', () => this.toggleListType('number'));
        const checkBtn = this.createButton('☑ List', () => this.toggleListType('check'));

        listGroup.appendChild(bulletBtn);
        listGroup.appendChild(numberBtn);
        listGroup.appendChild(checkBtn);
        this.element.appendChild(listGroup);

        // --- 6. Spacing Selector ---
        const spacingGroup = document.createElement('div');
        spacingGroup.className = 'toolbar-group';
        const spacingSelect = document.createElement('select');
        spacingSelect.style.height = '28px';
        const spacings = [
            { label: 'Single', value: '1.0' },
            { label: '1.15', value: '1.15' },
            { label: '1.5', value: '1.5' },
            { label: 'Double', value: '2.0' }
        ];
        spacings.forEach(s => {
            const option = document.createElement('option');
            option.value = s.value;
            option.textContent = s.label;
            spacingSelect.appendChild(option);
        });
        spacingSelect.addEventListener('change', (e) => {
            const val = parseFloat((e.target as HTMLSelectElement).value);
            this.handleSpacingChange(val);
        });
        spacingGroup.appendChild(spacingSelect);
        this.element.appendChild(spacingGroup);

        // --- 7. Insert Group ---
        const insertGroup = document.createElement('div');
        insertGroup.className = 'toolbar-group';

        const imageBtn = this.createButton('🖼️ Image', () => this.triggerImageUpload());
        insertGroup.appendChild(imageBtn);
        this.element.appendChild(insertGroup);


        // --- 2. Font Family Selector ---
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

        fontSelect.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            this.handleFontChange(value);
        });

        fontGroup.appendChild(fontSelect);
        this.element.appendChild(fontGroup);

        // --- 3. Font Size Selector ---
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'toolbar-group';
        const sizeSelect = document.createElement('select');
        sizeSelect.style.height = '28px';
        const sizes = [12, 14, 16, 18, 24, 30, 36, 48, 60, 72];
        sizes.forEach(s => {
            const option = document.createElement('option');
            option.value = s.toString();
            option.textContent = s.toString();
            if (s === 16) option.selected = true;
            sizeSelect.appendChild(option);
        });
        sizeSelect.addEventListener('change', (e) => {
            const val = parseInt((e.target as HTMLSelectElement).value);
            this.handleFontSizeChange(val);
        });
        sizeGroup.appendChild(sizeSelect);
        this.element.appendChild(sizeGroup);

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
                { label: 'Margins', action: () => this.toggleMargins() }, // New Margin Toggle
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
                    btn.action();
                });
                groupDiv.appendChild(button);
            });

            this.element.appendChild(groupDiv);
        });
    }

    private triggerImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                this.handleImageFile(file);
            }
        };
        input.click();
    }

    private handleImageFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
                const img = new Image();
                img.onload = () => {
                    let width = img.naturalWidth;
                    let height = img.naturalHeight;
                    const MAX_WIDTH = 500;
                    if (width > MAX_WIDTH) {
                        const ratio = MAX_WIDTH / width;
                        width = MAX_WIDTH;
                        height = height * ratio;
                    }

                    if (this.editorState.selection) {
                        insertImage(this.documentModel, this.editorState.selection, src, width, height);
                        this.onUpdate();
                    }
                };
                img.src = src;
            }
        };
        reader.readAsDataURL(file);
    }

    private handleFontChange(fontFamily: string) {
        if (!this.editorState.selection) return;
        applyStyle(this.documentModel, this.editorState.selection, { fontFamily });
        this.onUpdate();
    }

    private handleFontSizeChange(fontSize: number) {
        if (!this.editorState.selection) return;
        applyStyle(this.documentModel, this.editorState.selection, { fontSize });
        this.onUpdate();
    }

    private handleStyleChange(value: string) {
        if (!this.editorState.selection) return;

        let style: Partial<Style> = {};
        if (value === 'h1') { style = { fontSize: 32, bold: true }; }
        else if (value === 'h2') { style = { fontSize: 24, bold: true }; }
        else if (value === 'h3') { style = { fontSize: 20, bold: true }; }
        else if (value === 'normal') { style = { fontSize: 16, bold: false }; }

        // Expand selection to whole paragraph for headings/normal block style
        const { anchor, head } = this.editorState.selection;
        // We want to apply this to all paragraphs in the selection range
        // So we don't need to manually change selection, applyStyle iterates paragraphs.
        // BUT, applyStyle splits spans based on selection.
        // If we want the WHOLE paragraph to change, we should select the whole paragraph.

        // Let's create a temporary selection that covers the full paragraphs
        // Actually, applyStyle iterates from start.paragraphIndex to end.paragraphIndex.
        // But it respects start.spanIndex/charIndex.
        // To force whole paragraph, we should set start to 0,0,0 of startPara and end to end of endPara.

        const section = this.documentModel.sections[0];
        // Find start/end paragraphs
        const p1 = Math.min(anchor.paragraphIndex, head.paragraphIndex);
        const p2 = Math.max(anchor.paragraphIndex, head.paragraphIndex);

        const lastPara = section.children[p2];
        const lastSpanIdx = lastPara.children.length - 1;
        const lastSpan = lastPara.children[lastSpanIdx];

        const fullSelection = {
            anchor: { paragraphIndex: p1, spanIndex: 0, charIndex: 0 },
            head: { paragraphIndex: p2, spanIndex: lastSpanIdx, charIndex: lastSpan.type === 'span' ? lastSpan.text.length : 1 }
        };

        applyStyle(this.documentModel, fullSelection, style);
        this.onUpdate();
    }

    private toggleMargins() {
        // Dispatch a custom event or use a callback if we had one.
        // Since we don't have direct access to renderer here, we can emit an event on window
        window.dispatchEvent(new CustomEvent('toggle-margins'));
    }

    private toggleFormat(prop: any) {
        if (!this.editorState.selection) return;
        toggleStyle(this.documentModel, this.editorState.selection, prop);
        this.onUpdate();
    }

    private toggleListType(type: 'bullet' | 'number' | 'check') {
        if (!this.editorState.selection) return;
        toggleList(this.documentModel, this.editorState.selection, type);
        this.onUpdate();
    }

    private handleSpacingChange(spacing: number) {
        console.log('handleSpacingChange called with:', spacing);
        console.log('Current Selection:', this.editorState.selection);

        if (!this.editorState.selection) {
            console.warn('No selection active, aborting spacing change.');
            return;
        }
        setParagraphSpacing(this.documentModel, this.editorState.selection, spacing);
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
        // Or better: Show a list?
        // Let's just ask for ID for simplicity or rely on URL loading.
        const id = prompt("Enter Document ID to load:");
        if (id) {
            const result = await storageService.load(id);
            if (result) {
                this.currentDocId = id;
                this.onLoadDocument(result.doc);
                // Update URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', id);
                window.history.pushState({}, '', newUrl);
            } else {
                alert('Document not found');
            }
        }
    }

    private createButton(label: string, action: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = label;
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            action();
        });
        return button;
    }


    public setDocument(document: DocumentModel) {
        this.documentModel = document;
    }
}
