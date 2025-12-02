import React from 'react';
import { FileText, FilePlus, Receipt, FileSignature, File, Plus, MoreVertical, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Quote {
    id: string;
    title: string;
    client: string;
    amount: string;
    status: 'Pending' | 'Approved' | 'Draft';
    date: string;
}

interface Invoice {
    id: string;
    number: string;
    client: string;
    amount: string;
    status: 'Paid' | 'Due' | 'Draft';
    dueDate?: string;
    date: string;
}

interface Document {
    id: string;
    title: string;
    type: 'Proposal' | 'Contract' | 'Onboarding' | 'Document';
    client?: string;
    date: string;
}

const MOCK_QUOTES: Quote[] = [
    { id: '1', title: 'Website Redesign Quote', client: 'Acme Corp', amount: '$5,000', status: 'Pending', date: 'Oct 24, 2024' },
    { id: '2', title: 'SEO Package Quote', client: 'TechStart Inc', amount: '$1,200', status: 'Approved', date: 'Oct 20, 2024' },
    { id: '3', title: 'Maintenance Retainer', client: 'Global Systems', amount: '$800/mo', status: 'Draft', date: 'Oct 28, 2024' },
];

const MOCK_INVOICES: Invoice[] = [
    { id: '1', number: 'INV-2024-001', client: 'Acme Corp', amount: '$2,500', status: 'Paid', date: 'Oct 01, 2024' },
    { id: '2', number: 'INV-2024-002', client: 'TechStart Inc', amount: '$1,200', status: 'Due', dueDate: 'Due in 3 days', date: 'Oct 15, 2024' },
    { id: '3', number: 'INV-2024-003', client: 'Global Systems', amount: '$800', status: 'Draft', date: 'Oct 28, 2024' },
];

const MOCK_DOCUMENTS: Document[] = [
    { id: '1', title: 'Project Proposal - Acme Corp', type: 'Proposal', client: 'Acme Corp', date: 'Oct 22, 2024' },
    { id: '2', title: 'Service Agreement', type: 'Contract', client: 'TechStart Inc', date: 'Oct 18, 2024' },
    { id: '3', title: 'Client Onboarding Checklist', type: 'Onboarding', client: 'Global Systems', date: 'Oct 25, 2024' },
    { id: '4', title: 'Meeting Notes', type: 'Document', date: 'Oct 27, 2024' },
];

import { useNavigate } from 'react-router-dom';

export const Files: React.FC = () => {
    const navigate = useNavigate();

    const handleCreateDocument = () => {
        const newDocId = crypto.randomUUID();
        navigate(`/editor/${newDocId}`);
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                <CreateCard icon={<Receipt size={20} />} title="Invoice" description="New invoice" onClick={handleCreateDocument} />
                <CreateCard icon={<FileText size={20} />} title="Quote" description="New quote" onClick={handleCreateDocument} />
                <CreateCard icon={<FileSignature size={20} />} title="Contract" description="New contract" onClick={handleCreateDocument} />
                <CreateCard icon={<FilePlus size={20} />} title="Proposal" description="New proposal" onClick={handleCreateDocument} />
                <CreateCard icon={<FileText size={20} />} title="Onboarding" description="New doc" onClick={handleCreateDocument} />
                <CreateCard icon={<Plus size={20} />} title="Blank" description="New file" onClick={handleCreateDocument} />
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                <Section title="Quotes">
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>TITLE</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>CLIENT</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>STATUS</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>DATE</th>
                                    <th style={{ padding: '12px 24px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_QUOTES.map(quote => (
                                    <tr key={quote.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '500', color: '#1E293B' }}>{quote.title}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{quote.client}</td>
                                        <td style={{ padding: '16px 24px', color: '#1E293B' }}>{quote.amount}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <StatusBadge status={quote.status} />
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{quote.date}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section title="Invoices">
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>NUMBER</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>CLIENT</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>STATUS</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>DATE</th>
                                    <th style={{ padding: '12px 24px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_INVOICES.map(invoice => (
                                    <tr key={invoice.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '500', color: '#1E293B' }}>{invoice.number}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{invoice.client}</td>
                                        <td style={{ padding: '16px 24px', color: '#1E293B' }}>{invoice.amount}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <StatusBadge status={invoice.status} text={invoice.dueDate} />
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{invoice.date}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section title="Other Documents">
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>TITLE</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>TYPE</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>CLIENT</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>DATE</th>
                                    <th style={{ padding: '12px 24px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_DOCUMENTS.map(doc => (
                                    <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '500', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText size={16} color="#64748B" />
                                            {doc.title}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{doc.type}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{doc.client || '-'}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>{doc.date}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </div>
        </div>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '12px' }}>{title}</h2>
        {children}
    </div>
);

const CreateCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick?: () => void }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            height: 'auto',
            minWidth: '120px',
            flex: 1
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{ color: '#3B82F6', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748B' }}>{description}</div>
    </button>
);

const StatusBadge = ({ status, text }: { status: string, text?: string }) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    let icon = null;

    switch (status) {
        case 'Paid':
        case 'Approved':
            bg = '#DCFCE7';
            color = '#166534';
            icon = <CheckCircle size={12} />;
            break;
        case 'Pending':
            bg = '#FEF9C3';
            color = '#854D0E';
            icon = <Clock size={12} />;
            break;
        case 'Due':
            bg = '#FEE2E2';
            color = '#991B1B';
            icon = <AlertCircle size={12} />;
            break;
        default:
            break;
    }

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            background: bg,
            color: color
        }}>
            {icon}
            {text || status}
        </span>
    );
};
