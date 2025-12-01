export class ClipboardUtils {
    static parseHtmlContent(html: string): any[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const paragraphs: any[] = [];

        // Helper to convert DOM style to our Style object
        const getStyle = (node: HTMLElement, parentStyle: any = { fontFamily: 'Roboto', fontSize: 16 }) => {
            const style: any = { ...parentStyle };

            // Map tags to styles
            if (node.tagName === 'B' || node.tagName === 'STRONG') style.bold = true;
            if (node.tagName === 'I' || node.tagName === 'EM') style.italic = true;
            if (node.tagName === 'U') style.underline = true;

            // Headings
            if (node.tagName === 'H1') { style.fontSize = 32; style.bold = true; }
            if (node.tagName === 'H2') { style.fontSize = 24; style.bold = true; }
            if (node.tagName === 'H3') { style.fontSize = 18; style.bold = true; }

            return style;
        };

        // Recursive function to process nodes
        const processNode = (node: Node, currentParagraph: any, currentStyle: any) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (text) {
                    currentParagraph.children.push({
                        type: 'span',
                        text: text,
                        style: { ...currentStyle }
                    });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                const newStyle = getStyle(element, currentStyle);

                // Block elements start new paragraphs
                const isBlock = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(element.tagName);

                if (isBlock) {
                    // If we were building a paragraph and it has content, push it
                    if (currentParagraph.children.length > 0) {
                        paragraphs.push(currentParagraph);
                    }

                    // Start new paragraph
                    const newPara: any = {
                        type: 'paragraph',
                        children: [],
                        alignment: 'left'
                    };

                    // List detection
                    if (element.tagName === 'LI') {
                        const parent = element.parentElement;
                        if (parent) {
                            if (parent.tagName === 'UL') newPara.listType = 'bullet';
                            if (parent.tagName === 'OL') newPara.listType = 'number';

                            // Check for task list (GitHub style or similar)
                            // Often represented as <li class="task-list-item"><input type="checkbox">...</li>
                            if (element.className.includes('task-list-item') || element.querySelector('input[type="checkbox"]')) {
                                newPara.listType = 'check';
                                const input = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
                                newPara.checked = input ? input.checked : false;
                            }
                        }
                    }

                    // Process children
                    element.childNodes.forEach(child => processNode(child, newPara, newStyle));

                    // Push this paragraph if it has content
                    if (newPara.children.length > 0) {
                        paragraphs.push(newPara);
                        // Reset currentParagraph for subsequent inline nodes (though usually block ends it)
                        // We create a new empty one just in case
                        currentParagraph = { type: 'paragraph', children: [], alignment: 'left' };
                    }
                } else if (element.tagName === 'BR') {
                    // Force break? For now, maybe just treat as newline char if we supported it, 
                    // or split paragraph. Let's split.
                    if (currentParagraph.children.length > 0) {
                        paragraphs.push(currentParagraph);
                    }
                    currentParagraph = { type: 'paragraph', children: [], alignment: 'left' };
                } else {
                    // Inline element
                    element.childNodes.forEach(child => processNode(child, currentParagraph, newStyle));
                }
            }
        };

        // Start processing body children
        doc.body.childNodes.forEach(child => {
            const para = { type: 'paragraph', children: [], alignment: 'left' };
            processNode(child, para, { fontFamily: 'Roboto', fontSize: 16 });
            if (para.children.length > 0) {
                paragraphs.push(para);
            }
        });

        return paragraphs;
    }
}
