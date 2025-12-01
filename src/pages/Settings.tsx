import React from 'react';
import { Link } from 'react-router-dom';

export const Settings: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Settings</h1>
            <Link to="/">Back to Dashboard</Link>
            <p>User Settings coming soon...</p>
        </div>
    );
};
