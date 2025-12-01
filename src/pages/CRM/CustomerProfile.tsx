import React from 'react';
import { Mail, Phone, MapPin, Sparkles, CreditCard, Globe, Facebook, Instagram } from 'lucide-react';

interface CustomerProfileProps {
    customer: {
        name: string;
        company: string;
        email: string;
        phone: string;
        address: string;
        website: string;
        totalBilled: string;
        totalPaid: string;
        facebook?: string;
        instagram?: string;
    };
    onEdit: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, onEdit }) => {
    return (
        <div style={{ height: '100%', background: 'white', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Profile</h2>
                <button
                    onClick={onEdit}
                    style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                    Edit
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#DBEAFE',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '600',
                    marginBottom: '16px'
                }}>
                    {customer.name.charAt(0)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>{customer.name}</h3>
                <p style={{ color: '#64748B' }}>{customer.company}</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="Total Billed" value={customer.totalBilled} />
                <StatCard label="Total Paid" value={customer.totalPaid} color="#166534" />
            </div>

            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase' }}>Contact Info</h4>
                <ContactItem icon={<Mail size={16} />} text={customer.email} />
                <ContactItem icon={<Phone size={16} />} text={customer.phone} />
                <ContactItem icon={<Globe size={16} />} text={customer.website} />
                <ContactItem icon={<MapPin size={16} />} text={customer.address} />
                {customer.facebook && <ContactItem icon={<Facebook size={16} />} text={customer.facebook} />}
                {customer.instagram && <ContactItem icon={<Instagram size={16} />} text={customer.instagram} />}
            </div>

            <div style={{ marginTop: 'auto' }}>
                <button style={{
                    width: '100%',
                    padding: '12px',
                    background: '#EFF6FF',
                    color: '#3B82F6',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '24px'
                }}>
                    <CreditCard size={18} />
                    Setup Direct Debit
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#4F46E5',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        cursor: 'pointer'
                    }}>
                        <Sparkles size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color = '#1E293B' }: { label: string, value: string, color?: string }) => (
    <div style={{ flex: 1, background: '#F8FAFC', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color }}>{value}</div>
    </div>
);

const ContactItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#334155', fontSize: '14px' }}>
        <div style={{ color: '#94A3B8' }}>{icon}</div>
        <span>{text}</span>
    </div>
);
