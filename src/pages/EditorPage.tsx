import React from 'react';
import { EditorWrapper } from '../components/EditorWrapper';
import { Link } from 'react-router-dom';

export const EditorPage: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
                <Link to="/">Back to Dashboard</Link>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <EditorWrapper />
            </div>
        </div>
    );
};
