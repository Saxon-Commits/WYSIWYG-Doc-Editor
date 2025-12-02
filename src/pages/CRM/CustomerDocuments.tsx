import React from 'react';
import { Mail, Phone, FileEdit, FilePlus, FileText, FileSignature, MessageSquare, Send, Calendar, CheckCircle, Receipt, Archive, Heart } from 'lucide-react';
import { TasksView } from './Workspace/TasksView';

interface Document {
    id: string;
    number: string;
    date: string;
    total: string;
    status: 'Draft' | 'Sent' | 'Paid';
}

interface CustomerDocumentsProps {
    customerName: string;
    documents: Document[];
}

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const CustomerDocuments: React.FC<CustomerDocumentsProps> = ({ customerName, documents }) => {
    const navigate = useNavigate();

    const handleCreateDocument = () => {
        const newDocId = crypto.randomUUID();
        navigate(`/editor/${newDocId}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', margin: 0 }}>Documents for {customerName}</h2>
                <button
                    onClick={handleCreateDocument}
                    style={{
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={16} />
                    Create Document
                </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                        <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textAlign: 'left' }}>
                            <th style={{ padding: '12px 20px', fontWeight: '600' }}>NUMBER</th>
                            <th style={{ padding: '12px 20px', fontWeight: '600' }}>DATE</th>
                            <th style={{ padding: '12px 20px', fontWeight: '600' }}>TOTAL</th>
                            <th style={{ padding: '12px 20px', fontWeight: '600' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>{doc.number}</td>
                                <td style={{ padding: '16px 20px', color: '#64748B' }}>{doc.date}</td>
                                <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>{doc.total}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        background: doc.status === 'Paid' ? '#DCFCE7' : doc.status === 'Sent' ? '#DBEAFE' : '#F1F5F9',
                                        color: doc.status === 'Paid' ? '#166534' : doc.status === 'Sent' ? '#1E40AF' : '#475569'
                                    }}>
                                        {doc.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

import { Maximize2, Minimize2 } from 'lucide-react';

interface CustomerWorkspaceProps extends CustomerDocumentsProps {
    isFullScreen?: boolean;
    onToggleFullScreen?: () => void;
}

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({ customerName, documents, isFullScreen, onToggleFullScreen }) => {
    const [mainTab, setMainTab] = React.useState<'workspace' | 'documents'>('workspace');
    const [currentStep, setCurrentStep] = React.useState('Inquiry');
    const steps = ['Inquiry', 'Proposal', 'Deposit Paid', 'Tasks', 'Delivery', 'Done'];

    const renderContent = () => {
        switch (currentStep) {
            case 'Inquiry':
                return (
                    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Inquiry Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <ActionButton icon={<Mail size={20} />} title="Send Inquiry Email" description="Send a template email to the client" />
                            <ActionButton icon={<Phone size={20} />} title="Call Client" description="Log a call with the client" />
                            <ActionButton icon={<FileEdit size={20} />} title="Draft Inquiry Email" description="Draft an email for later" />
                        </div>
                    </div>
                );
            case 'Proposal':
                return (
                    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Proposal Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <ActionButton icon={<FilePlus size={20} />} title="Create Proposal" description="Start a new proposal for this client" />
                            <ActionButton icon={<FileText size={20} />} title="Create Quote" description="Generate a price quote" />
                            <ActionButton icon={<FileSignature size={20} />} title="Create Contract" description="Draft a legal contract" />
                        </div>
                    </div>
                );
            case 'Deposit Paid':
                return (
                    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Deposit Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <ActionButton icon={<FileText size={20} />} title="Create Onboarding Doc" description="Generate onboarding documents" />
                        </div>
                    </div>
                );
            case 'Tasks':
                return <TasksView />;
            case 'Delivery':
                return (
                    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Delivery Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <ActionButton icon={<Send size={20} />} title="Email Client" description="Email files to client" />
                            <ActionButton icon={<Calendar size={20} />} title="Book Video Call" description="Book a handover meeting" />
                            <ActionButton icon={<CheckCircle size={20} />} title="Mark as Delivered" description="Update project status" />
                        </div>
                    </div>
                );
            case 'Done':
                return (
                    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Done Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <ActionButton icon={<Receipt size={20} />} title="Send Final Invoice" description="Invoice for remaining balance" />
                            <ActionButton icon={<Archive size={20} />} title="Archive Project" description="Move to completed projects" />
                            <ActionButton icon={<Heart size={20} />} title="Send Thank You Email" description="Express gratitude to client" />
                            <ActionButton icon={<MessageSquare size={20} />} title="Request Review" description="Ask for a Google or Facebook review" />
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            border: '2px dashed #CBD5E1',
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            color: '#64748B',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box'
                        }}>
                            <p style={{ margin: 0, fontWeight: '500' }}>{currentStep} Content</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>This step is not yet implemented.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
            <div style={{ padding: '0 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <button
                        onClick={() => setMainTab('workspace')}
                        style={{
                            padding: '10px 0 4px 0', // Adjusted padding
                            background: 'none',
                            border: 'none',
                            borderBottom: mainTab === 'workspace' ? '2px solid #3B82F6' : '2px solid transparent',
                            color: mainTab === 'workspace' ? '#3B82F6' : '#64748B',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginBottom: '6px' // Space between blue line and container border
                        }}
                    >
                        Workspace
                    </button>
                    <button
                        onClick={() => setMainTab('documents')}
                        style={{
                            padding: '10px 0 4px 0', // Adjusted padding
                            background: 'none',
                            border: 'none',
                            borderBottom: mainTab === 'documents' ? '2px solid #3B82F6' : '2px solid transparent',
                            color: mainTab === 'documents' ? '#3B82F6' : '#64748B',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            marginBottom: '6px' // Space between blue line and container border
                        }}
                    >
                        Documents
                    </button>
                </div>
                {onToggleFullScreen && (
                    <button
                        onClick={onToggleFullScreen}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                )}
            </div>

            {mainTab === 'workspace' ? (
                <>
                    {/* Status Bar */}
                    <div style={{ display: 'flex', background: '#F8FAFC', padding: '0 4px' }}>
                        {steps.map((step, index) => {
                            const isActive = step === currentStep;
                            const isCompleted = steps.indexOf(currentStep) > index;

                            return (
                                <div
                                    key={step}
                                    onClick={() => setCurrentStep(step)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px 8px 24px', // Reduced padding
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: isActive ? 'white' : isCompleted ? '#059669' : '#64748B',
                                        background: isActive ? '#3B82F6' : isCompleted ? '#D1FAE5' : '#F1F5F9',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)',
                                        marginLeft: index === 0 ? '0' : '-16px',
                                        zIndex: steps.length - index,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {step}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {renderContent()}
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textAlign: 'left' }}>
                                <th style={{ padding: '12px 20px', fontWeight: '600' }}>NUMBER</th>
                                <th style={{ padding: '12px 20px', fontWeight: '600' }}>DATE</th>
                                <th style={{ padding: '12px 20px', fontWeight: '600' }}>TOTAL</th>
                                <th style={{ padding: '12px 20px', fontWeight: '600' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>{doc.number}</td>
                                    <td style={{ padding: '16px 20px', color: '#64748B' }}>{doc.date}</td>
                                    <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>{doc.total}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: doc.status === 'Paid' ? '#DCFCE7' : doc.status === 'Sent' ? '#DBEAFE' : '#F1F5F9',
                                            color: doc.status === 'Paid' ? '#166534' : doc.status === 'Sent' ? '#1E40AF' : '#475569'
                                        }}>
                                            {doc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ActionButton = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <button style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '16px',
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        }}
    >
        <div style={{ color: '#3B82F6', marginBottom: '12px' }}>{icon}</div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748B' }}>{description}</div>
    </button>
);
