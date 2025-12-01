import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CRM } from './pages/CRM/CRM';
import { Settings } from './pages/Settings';
import { EditorPage } from './pages/EditorPage';
import { Calendar } from './pages/Calendar';
import { Files } from './pages/Files';
import { Bills } from './pages/Bills';
import { AppShell } from './components/Layout/AppShell';

function App() {
    return (
        <Router>
            <AppShell>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/editor/:id" element={<EditorPage />} />
                </Routes>
            </AppShell>
        </Router>
    );
}

export default App;
