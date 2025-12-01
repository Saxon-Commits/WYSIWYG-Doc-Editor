import React, { useState } from 'react';
import { CustomerList } from './CustomerList';
import { CustomerWorkspace } from './CustomerDocuments';
import { CustomerProfile } from './CustomerProfile';
import { CustomerModal } from './CustomerModal';

// Mock Data
const MOCK_CUSTOMERS = [
    { id: '1', name: 'Jason', company: "Wilson's Seafood", email: 'jason@wilsons.com', phone: '(02) 9555 1234', address: '123 Fish Market Rd, Pyrmont NSW 2009', website: 'wilsonsseafood.com', totalBilled: '$12,450', totalPaid: '$10,000', facebook: 'Wilson\'s Seafood', instagram: '@wilsonsseafood' },
    { id: '2', name: 'Nabil', company: 'Tanta Meats', email: 'tantameats@gmail.com', phone: '(02) 9564 3738', address: '12 Hathern St, Leichhardt NSW 2040', website: 'tantameats.com.au', totalBilled: '$0.00', totalPaid: '$0.00', facebook: 'Tanta Meats', instagram: '@tantameats' },
    { id: '3', name: 'Saxon Hughes', company: 'Mercer Labs', email: 'saxon@mercerlabs.com', phone: '0400 123 456', address: 'Level 1, 100 George St, Sydney NSW 2000', website: 'mercerlabs.com', totalBilled: '$45,000', totalPaid: '$45,000', facebook: 'Saxon Kaige', instagram: '@saxonkaige' },
];

const MOCK_DOCUMENTS = {
    '1': [
        { id: '101', number: 'INV-001', date: '01/11/2025', total: '$2,450.00', status: 'Paid' as const },
        { id: '102', number: 'INV-002', date: '15/11/2025', total: '$10,000.00', status: 'Sent' as const },
        { id: '103', number: 'QTE-001', date: '20/11/2025', total: '$5,000.00', status: 'Draft' as const },
        { id: '104', number: 'INV-003', date: '22/11/2025', total: '$1,200.00', status: 'Sent' as const },
        { id: '105', number: 'PRO-001', date: '25/11/2025', total: '$15,000.00', status: 'Draft' as const },
        { id: '106', number: 'INV-004', date: '28/11/2025', total: '$3,400.00', status: 'Paid' as const },
    ],
    '2': [
        { id: 'd3', number: 'PRO-234395', date: '30/11/2025', total: '$0.00', status: 'Draft' as const },
    ],
    '3': [],
};

export const CRM: React.FC = () => {
    const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
    const [selectedId, setSelectedId] = useState<string>('2'); // Default to Nabil
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const handleAddClick = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (customer: any) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = (customerData: any) => {
        if (editingCustomer) {
            // Update existing
            setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...customerData } : c));
        } else {
            // Add new
            const newCustomer = {
                id: Date.now().toString(),
                ...customerData,
                totalBilled: '$0.00',
                totalPaid: '$0.00'
            };
            setCustomers(prev => [...prev, newCustomer]);
            setSelectedId(newCustomer.id);
        }
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const selectedCustomer = customers.find(c => c.id === selectedId);
    const documents = selectedId ? (MOCK_DOCUMENTS as any)[selectedId] || [] : [];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: isFullScreen ? '1fr' : '300px 350px 1fr',
            height: 'calc(100vh - 64px - 48px)', // Adjust for header and padding
            gap: '24px',
            width: '100%',
            transition: 'grid-template-columns 0.3s ease'
        }}>
            {/* Left Column: List */}
            {!isFullScreen && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <CustomerList
                        customers={customers}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAddClick={handleAddClick}
                    />
                </div>
            )}

            {/* Middle Column: Profile */}
            {!isFullScreen && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {selectedCustomer && (
                        <CustomerProfile
                            customer={selectedCustomer}
                            onEdit={() => handleEditClick(selectedCustomer)}
                        />
                    )}
                </div>
            )}

            {/* Right Column: Documents & Workspace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflow: 'hidden' }}>
                {/* Workspace Panel (now includes Documents) */}
                <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    {selectedCustomer ? (
                        <CustomerWorkspace
                            customerName={selectedCustomer.name}
                            documents={documents}
                            isFullScreen={isFullScreen}
                            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                        />
                    ) : (
                        <div style={{ padding: '20px', background: 'white', height: '100%' }}>Select a customer</div>
                    )}
                </div>
            </div>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCustomer}
                initialData={editingCustomer}
            />
        </div>
    );
};
