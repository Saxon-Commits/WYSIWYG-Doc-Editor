import React, { useEffect, useRef } from 'react';
import { mountEditor } from '../core/mount';
import { useParams } from 'react-router-dom';

export const EditorWrapper: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        let isMounted = true;
        let cleanupFn: (() => void) | undefined;

        const init = async () => {
            if (containerRef.current) {
                // Mount the editor
                const cleanup = await mountEditor(containerRef.current, id);
                if (isMounted) {
                    if (typeof cleanup === 'function') {
                        cleanupFn = cleanup;
                    }
                } else {
                    // Component unmounted while loading, clean up immediately
                    if (typeof cleanup === 'function') {
                        cleanup();
                    }
                }
            }
        };

        init();

        return () => {
            isMounted = false;
            if (cleanupFn) {
                cleanupFn();
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [id]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#e0e0e0', position: 'relative', paddingBottom: '50vh' }} />;
};
