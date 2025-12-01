import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, FileText, CreditCard, Calendar as CalendarIcon, ArrowRight, TrendingUp, Clock, MoreVertical } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

// Mock Data
const RECENT_LEADS = [
    { id: '1', name: 'Sarah Miller', company: 'Miller Design', status: 'New Lead', time: '2h ago' },
    { id: '2', name: 'TechFlow Inc', company: 'TechFlow', status: 'Proposal', time: '5h ago' },
    { id: '3', name: 'John Smith', company: 'JS Consulting', status: 'Negotiation', time: '1d ago' },
];

const RECENT_DOCS = [
    { id: '1', title: 'Website Redesign Proposal', type: 'Proposal', date: 'Today, 10:23 AM' },
    { id: '2', title: 'Invoice #1023 - Acme Corp', type: 'Invoice', date: 'Yesterday, 4:15 PM' },
    { id: '3', title: 'Service Agreement v2', type: 'Contract', date: 'Oct 24, 2024' },
];

const UPCOMING_EVENTS = [
    { id: '1', title: 'Client Meeting: TechFlow', time: 'Today, 2:00 PM', type: 'meeting' },
    { id: '2', title: 'Project Handover', time: 'Tomorrow, 10:00 AM', type: 'deadline' },
    { id: '3', title: 'Weekly Team Sync', time: 'Wed, 9:00 AM', type: 'internal' },
];

const MINI_CHART_DATA = [
    { value: 2400 }, { value: 1398 }, { value: 9800 }, { value: 3908 }, { value: 4800 }, { value: 3800 }, { value: 4300 }
];

export const Dashboard: React.FC = () => {
    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <QuickAction to="/files" icon={<FileText size={20} />} label="New Document" color="blue" />
                <QuickAction to="/crm" icon={<Users size={20} />} label="Add Customer" color="indigo" />
                <QuickAction to="/bills" icon={<CreditCard size={20} />} label="Add Bill" color="emerald" />
                <QuickAction to="/calendar" icon={<CalendarIcon size={20} />} label="Add Event" color="orange" />
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>

                {/* CRM Snapshot */}
                <DashboardCard title="Recent Activity" link="/crm" linkText="View CRM">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {RECENT_LEADS.map(lead => (
                            <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: '600', fontSize: '12px' }}>
                                        {lead.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{lead.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{lead.company}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#3B82F6' }}>{lead.status}</div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{lead.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* Financial Snapshot */}
                <DashboardCard title="Financial Overview" link="/bills" linkText="View Finances">
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Total Revenue (Nov)</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B' }}>$12,450.00</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>
                                <TrendingUp size={12} />
                                <span>+12.5% vs last month</span>
                            </div>
                        </div>
                        <div style={{ width: '120px', height: '60px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={MINI_CHART_DATA}>
                                    <Line type="monotone" dataKey="value" stroke="#16A34A" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Unpaid Bills</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#DC2626' }}>$1,254.99</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>3 invoices overdue</div>
                        </div>
                        <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Pending Invoices</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#F59E0B' }}>$4,500.00</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>2 drafts</div>
                        </div>
                    </div>
                </DashboardCard>

                {/* Files Snapshot */}
                <DashboardCard title="Recent Documents" link="/files" linkText="All Files">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {RECENT_DOCS.map(doc => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', transition: 'background 0.2s' }}>
                                <div style={{ color: '#3B82F6' }}><FileText size={18} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{doc.title}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{doc.type} • {doc.date}</div>
                                </div>
                                <button style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* Calendar Snapshot */}
                <DashboardCard title="Upcoming Events" link="/calendar" linkText="View Calendar">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {UPCOMING_EVENTS.map(event => (
                            <div key={event.id} style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px', paddingTop: '2px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#EF4444', textTransform: 'uppercase' }}>NOV</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>24</div>
                                </div>
                                <div style={{ flex: 1, paddingLeft: '12px', borderLeft: '2px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{event.title}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                        <Clock size={12} />
                                        <span>{event.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

            </div>
        </div>
    );
};

const QuickAction = ({ to, icon, label, color }: { to: string, icon: React.ReactNode, label: string, color: string }) => {
    const colors: Record<string, string> = {
        blue: '#EFF6FF',
        indigo: '#EEF2FF',
        emerald: '#ECFDF5',
        orange: '#FFF7ED',
        textBlue: '#1D4ED8',
        textIndigo: '#4338CA',
        textEmerald: '#047857',
        textOrange: '#C2410C'
    };

    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
            }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: colors[color],
                    color: colors[`text${color.charAt(0).toUpperCase() + color.slice(1)}`],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{label}</span>
            </div>
        </Link>
    );
};

const DashboardCard = ({ title, link, linkText, children }: { title: string, link: string, linkText: string, children: React.ReactNode }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', margin: 0 }}>{title}</h2>
            <Link to={link} style={{ fontSize: '13px', fontWeight: '500', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {linkText}
                <ArrowRight size={14} />
            </Link>
        </div>
        {children}
    </div>
);
