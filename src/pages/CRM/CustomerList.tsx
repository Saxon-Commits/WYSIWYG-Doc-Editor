import React, { useState } from 'react';
import { Search, Plus, Wand2 } from 'lucide-react';
import { LeadWizard } from './LeadWizard/LeadWizard';

interface Customer {
    id: string;
    name: string;
    company: string;
}

interface CustomerListProps {
    customers: Customer[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAddClick: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, selectedId, onSelect, onAddClick }) => {
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #E2E8F0', background: 'white' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', margin: 0 }}>Contacts</h2>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <Wand2 size={14} />
                        Lead Wizard
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onAddClick}
                        style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            width: '100%'
                        }}>
                        <Plus size={16} />
                        Add Customer
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                {customers.map(customer => (
                    <div
                        key={customer.id}
                        onClick={() => onSelect(customer.id)}
                        style={{
                            padding: '16px 20px',
                            cursor: 'pointer',
                            background: selectedId === customer.id ? '#EFF6FF' : 'transparent',
                            borderLeft: selectedId === customer.id ? '3px solid #3B82F6' : '3px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontWeight: '500', color: '#1E293B', marginBottom: '4px' }}>{customer.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>{customer.company}</div>
                    </div>
                ))}
            </div>

            <LeadWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
        </div>
    );
};
