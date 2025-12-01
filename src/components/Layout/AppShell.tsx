import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Receipt,
    Calendar,
    Settings,
    Moon,
    Plus,
    Bell,
    Search
} from 'lucide-react';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#F3F4F6' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                backgroundColor: '#0F172A',
                color: '#94A3B8',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 0'
            }}>
                {/* Logo */}
                <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <FileText size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>InvoicyCRM</span>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '0 12px' }}>
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/')} />
                    <NavItem to="/crm" icon={<Users size={20} />} label="CRM" active={isActive('/crm')} />
                    <NavItem to="/files" icon={<FileText size={20} />} label="Files" active={isActive('/files')} />
                    <NavItem to="/bills" icon={<Receipt size={20} />} label="Bills & Expenses" active={isActive('/bills')} />
                    <NavItem to="/calendar" icon={<Calendar size={20} />} label="Calendar" active={isActive('/calendar')} />
                </nav>

                {/* Bottom Actions */}
                <div style={{ padding: '0 12px' }}>
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" active={isActive('/settings')} />
                    <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <Moon size={20} />
                        <span>Dark Mode</span>
                    </div>

                    <div style={{ marginTop: '20px', padding: '0 12px' }}>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                            © 2024 InvoicyCRM<br />All rights reserved.
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Bar */}
                <header style={{
                    height: '64px',
                    background: '#0F172A',
                    borderBottom: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 32px',
                    color: 'white'
                }}>
                    <div style={{ flex: 1 }}></div>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            style={{
                                background: '#1E293B',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '8px 12px 8px 36px',
                                color: 'white',
                                fontSize: '14px',
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}></div>
                </header>

                {/* Page Content */}
                <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            color: active ? 'white' : '#94A3B8',
            background: active ? '#3B82F6' : 'transparent',
            textDecoration: 'none',
            marginBottom: '4px',
            transition: 'all 0.2s'
        }}
    >
        {icon}
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
    </Link>
);

const IconButton = ({ icon }: { icon: React.ReactNode }) => (
    <button style={{
        background: '#1E293B',
        border: 'none',
        color: '#94A3B8',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    }}>
        {icon}
    </button>
);
