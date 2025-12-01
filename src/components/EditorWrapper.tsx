import React, { useEffect, useRef } from 'react';
import { mountEditor } from '../main';
import { useParams } from 'react-router-dom';

export const EditorWrapper: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { id } = useParams<{ id: string }>();
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Mount the editor
            const init = async () => {
                cleanupRef.current = await mountEditor(containerRef.current!, id);
            };
            init();
        }

        return () => {
            // Cleanup on unmount
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [id]);

    return <div ref={containerRef} style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />;
};
