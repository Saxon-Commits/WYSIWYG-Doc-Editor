import React, { useState } from 'react';
import { X, ChevronRight, Check, Mail, ExternalLink, Copy, Search, Plus, User, Building } from 'lucide-react';

interface LeadWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'customer' | 'documents' | 'details' | 'review' | 'send';

export const LeadWizard: React.FC<LeadWizardProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('customer');
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

    if (!isOpen) return null;

    const steps: Step[] = ['customer', 'documents', 'details', 'review', 'send'];
    const currentStepIndex = steps.indexOf(step);

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setStep(steps[currentStepIndex + 1]);
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setStep(steps[currentStepIndex - 1]);
        }
    };

    const handleClose = () => {
        setStep('customer');
        setSelectedCustomer(null);
        setSelectedDocs([]);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                width: '800px',
                height: '650px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#F8FAFC'
                }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: 0 }}>New Lead Wizard</h2>
                    </div>
                    <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
                    {steps.map((s, i) => (
                        <div key={s} style={{
                            flex: 1,
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: i <= currentStepIndex ? '#3B82F6' : '#94A3B8',
                            borderBottom: i === currentStepIndex ? '2px solid #3B82F6' : '2px solid transparent',
                            background: i < currentStepIndex ? '#EFF6FF' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: i < currentStepIndex ? '#3B82F6' : (i === currentStepIndex ? '#3B82F6' : '#E2E8F0'),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px'
                            }}>
                                {i < currentStepIndex ? <Check size={12} /> : i + 1}
                            </div>
                            <span style={{ textTransform: 'capitalize' }}>{s}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {step === 'customer' && (
                        <StepCustomer
                            selected={selectedCustomer}
                            onSelect={setSelectedCustomer}
                        />
                    )}
                    {step === 'documents' && (
                        <StepDocuments
                            selected={selectedDocs}
                            onSelect={(docs) => setSelectedDocs(docs)}
                        />
                    )}
                    {step === 'details' && (
                        <StepDetails selectedDocs={selectedDocs} />
                    )}
                    {step === 'review' && (
                        <StepReview
                            customer={selectedCustomer}
                            docs={selectedDocs}
                        />
                    )}
                    {step === 'send' && (
                        <StepSend docs={selectedDocs} />
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: '#F8FAFC'
                }}>
                    {step !== 'send' ? (
                        <button
                            onClick={prevStep}
                            disabled={currentStepIndex === 0}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                background: 'white',
                                color: currentStepIndex === 0 ? '#CBD5E1' : '#475569',
                                cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Back
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    <button
                        onClick={step === 'send' ? handleClose : nextStep}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: step === 'send' ? '#166534' : '#3B82F6',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {step === 'review' ? 'Create & Continue' : step === 'send' ? 'Done' : 'Next'}
                        {step !== 'send' && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const StepCustomer = ({ selected, onSelect }: { selected: string | null, onSelect: (id: string) => void }) => {
    const [mode, setMode] = useState<'select' | 'create'>('select');
    const [searchQuery, setSearchQuery] = useState('');
    const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '' });

    const MOCK_CUSTOMERS = [
        { id: '1', name: 'Jason', company: 'TechFlow Inc' },
        { id: '2', name: 'Nabil', company: 'Creative Solutions' },
        { id: '3', name: 'Saxon Hughes', company: 'Hughes Enterprises' },
        { id: '4', name: 'Sarah Miller', company: 'Miller Design' },
    ];

    const filteredCustomers = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        if (newCustomer.name) {
            // In a real app, this would save to DB. For now, we just select the name.
            onSelect(newCustomer.name);
        }
    };

    if (mode === 'create') {
        return (
            <div>
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={() => setMode('select')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: 0
                        }}
                    >
                        ← Back to Select
                    </button>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1E293B' }}>Create New Customer</h3>
                <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>Enter the details for the new lead.</p>

                <div style={{ display: 'grid', gap: '16px', maxWidth: '400px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="e.g. John Doe"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>Company Name</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                value={newCustomer.company}
                                onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })}
                                placeholder="e.g. Acme Corp"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="email"
                                value={newCustomer.email}
                                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="e.g. john@example.com"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={!newCustomer.name}
                        style={{
                            marginTop: '8px',
                            background: newCustomer.name ? '#3B82F6' : '#94A3B8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px',
                            fontWeight: '500',
                            cursor: newCustomer.name ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s'
                        }}
                    >
                        Create & Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#1E293B' }}>Select Customer</h3>

                <div style={{ marginBottom: '8px', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', marginBottom: '8px', flex: 1, minHeight: 0 }}>
                {filteredCustomers.map(c => (
                    <div
                        key={c.id}
                        onClick={() => onSelect(c.name)}
                        style={{
                            padding: '8px 12px',
                            border: selected === c.name ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: selected === c.name ? '#EFF6FF' : 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '13px' }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{c.company}</div>
                        </div>
                        {selected === c.name && <Check size={14} color="#3B82F6" />}
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px', flexShrink: 0 }}>
                <button
                    onClick={() => setMode('create')}
                    style={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#1E293B',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    <Plus size={14} />
                    Create New Customer
                </button>
            </div>
        </div>
    );
};

const StepDocuments = ({ selected, onSelect }: { selected: string[], onSelect: (docs: string[]) => void }) => {
    const toggle = (doc: string) => {
        if (selected.includes(doc)) onSelect(selected.filter(d => d !== doc));
        else onSelect([...selected, doc]);
    };

    return (
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Documents</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {['Invoice', 'Quote', 'Proposal', 'Contract'].map(doc => (
                    <div
                        key={doc}
                        onClick={() => toggle(doc)}
                        style={{
                            padding: '24px',
                            border: selected.includes(doc) ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: selected.includes(doc) ? '#EFF6FF' : 'white',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{doc}</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>Create a new {doc.toLowerCase()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StepDetails = ({ selectedDocs }: { selectedDocs: string[] }) => (
    <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Document Details</h3>
        {selectedDocs.length === 0 && <p style={{ color: '#64748B' }}>No documents selected.</p>}
        {selectedDocs.map(doc => (
            <div key={doc} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>{doc} Details</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <input type="date" style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                    <input type="text" placeholder="Notes..." style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                </div>
            </div>
        ))}
    </div>
);

const StepReview = ({ customer, docs }: { customer: string | null, docs: string[] }) => (
    <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Review</h3>
        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Customer</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{customer || 'None selected'}</div>
            </div>
            <div>
                <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>Documents to Create</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {docs.map(doc => (
                        <span key={doc} style={{ background: 'white', padding: '4px 12px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '14px' }}>{doc}</span>
                    ))}
                    {docs.length === 0 && <span style={{ color: '#94A3B8' }}>None</span>}
                </div>
            </div>
        </div>
    </div>
);

const StepSend = ({ docs: _docs }: { docs: string[] }) => {
    const docUrl = "https://invoicy.crm/doc/1023"; // Mock URL
    const subject = "New Document from InvoicyCRM";
    const body = `Hi there,\n\nPlease find your document attached or view it online here:\n📄 View Document: ${docUrl}\n\nThanks!`;

    const openEmail = (service: 'gmail' | 'outlook' | 'default') => {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        let url = '';
        if (service === 'gmail') {
            url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`;
        } else if (service === 'outlook') {
            url = `https://outlook.office.com/mail/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}`;
        } else {
            url = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        }

        window.open(url, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(docUrl).then(() => {
            alert('Document URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
            }}>
                <Check size={32} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#1E293B' }}>Success!</h3>
            <p style={{ color: '#64748B', marginBottom: '32px' }}>Your documents have been created. How would you like to send them?</p>

            <div style={{ display: 'grid', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                <button
                    onClick={() => openEmail('gmail')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#1E293B',
                        transition: 'all 0.2s'
                    }}
                >
                    <Mail size={20} color="#EA4335" />
                    Open in Gmail
                </button>

                <button
                    onClick={() => openEmail('outlook')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#1E293B'
                    }}
                >
                    <Mail size={20} color="#0078D4" />
                    Open in Outlook
                </button>

                <button
                    onClick={() => openEmail('default')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#1E293B'
                    }}
                >
                    <ExternalLink size={20} color="#64748B" />
                    Default Mail Client
                </button>
            </div>

            <div style={{ marginTop: '32px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '400px', margin: '32px auto 0 auto' }}>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                    {docUrl}
                </div>
                <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6' }}>
                    <Copy size={16} />
                </button>
            </div>
        </div>
    );
};
