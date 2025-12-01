import React from 'react';
import { TasksView } from './CRM/Workspace/TasksView';

export const Calendar: React.FC = () => {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <TasksView initialView="month" />
        </div>
    );
};
