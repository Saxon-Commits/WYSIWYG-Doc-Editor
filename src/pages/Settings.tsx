import React, { useState } from 'react';
import { Building, Plug, Palette, Save, Upload, Check, CreditCard, Calendar, Lock, Shield, Trash2, User } from 'lucide-react';

type SettingsSection = 'general' | 'integrations' | 'appearance' | 'security';

export const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return <GeneralSettings />;
            case 'integrations':
                return <IntegrationsSettings />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'security':
                return <SecuritySettings />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {/* Sidebar */}
            <div style={{ width: '240px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', padding: '24px 0' }}>
                <div style={{ padding: '0 24px 16px', fontSize: '18px', fontWeight: '600', color: '#1E293B' }}>Settings</div>
                <nav>
                    <SettingsNavItem
                        icon={<Building size={18} />}
                        label="Company Profile"
                        active={activeSection === 'general'}
                        onClick={() => setActiveSection('general')}
                    />
                    <SettingsNavItem
                        icon={<Plug size={18} />}
                        label="Integrations"
                        active={activeSection === 'integrations'}
                        onClick={() => setActiveSection('integrations')}
                    />
                    <SettingsNavItem
                        icon={<Palette size={18} />}
                        label="Appearance"
                        active={activeSection === 'appearance'}
                        onClick={() => setActiveSection('appearance')}
                    />
                    <SettingsNavItem
                        icon={<Shield size={18} />}
                        label="Security"
                        active={activeSection === 'security'}
                        onClick={() => setActiveSection('security')}
                    />
                </nav>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

const SettingsNavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: active ? 'white' : 'transparent',
            border: 'none',
            borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
            color: active ? '#3B82F6' : '#64748B',
            fontWeight: active ? '600' : '500',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
        }}
    >
        {icon}
        {label}
    </button>
);

const GeneralSettings = () => (
    <div style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Company Profile</h2>

        {/* Logo Upload */}
        <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>Company Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #CBD5E1' }}>
                    <Building size={24} color="#94A3B8" />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                    <Upload size={14} />
                    Upload Logo
                </button>
            </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
            <FormInput label="Company Name" placeholder="e.g. Acme Corp" defaultValue="InvoicyCRM" />
            <FormInput label="ABN / Tax ID" placeholder="e.g. 12 345 678 901" />
            <FormInput label="Contact Email" placeholder="contact@company.com" type="email" />
            <FormInput label="Phone" placeholder="+61 400 000 000" type="tel" />
            <FormInput label="Website" placeholder="https://company.com" type="url" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Address</label>
                <textarea
                    rows={3}
                    placeholder="123 Business St, City, State, ZIP"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                />
            </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>
                <Save size={16} />
                Save Changes
            </button>
        </div>
    </div>
);

const IntegrationsSettings = () => (
    <div style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Integrations</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            <IntegrationCard
                icon={<Calendar size={24} color="#EA4335" />}
                name="Google Calendar"
                description="Sync tasks and events with your Google Calendar."
                connected={true}
            />
            <IntegrationCard
                icon={<CreditCard size={24} color="#635BFF" />}
                name="Stripe"
                description="Accept payments directly on your invoices."
                connected={false}
            />
            <IntegrationCard
                icon={<div style={{ fontWeight: 'bold', color: '#3ECF8E' }}>S</div>}
                name="Supabase"
                description="Database and authentication provider."
                connected={true}
                locked={true}
            />
        </div>
    </div>
);

const AppearanceSettings = () => (
    <div style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Appearance</h2>

        <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Theme</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
                <ThemeOption label="Light" color="#F8FAFC" active={true} />
                <ThemeOption label="Dark" color="#1E293B" active={false} />
            </div>
        </div>

        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Accent Color</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
                <ColorOption color="#3B82F6" active={true} /> {/* Blue */}
                <ColorOption color="#8B5CF6" active={false} /> {/* Purple */}
                <ColorOption color="#10B981" active={false} /> {/* Green */}
                <ColorOption color="#F59E0B" active={false} /> {/* Orange */}
                <ColorOption color="#EF4444" active={false} /> {/* Red */}
            </div>
        </div>
    </div>
);

const SecuritySettings = () => (
    <div style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1E293B', marginBottom: '24px' }}>Security & Account</h2>

        {/* Account Details */}
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Account Details</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
                <FormInput label="Full Name" placeholder="Your Name" defaultValue="Saxon Kaige" icon={<User size={16} />} />
                <FormInput label="Email Address" placeholder="you@example.com" defaultValue="saxon@invoicy.com" type="email" icon={<Building size={16} />} />
            </div>
        </div>

        {/* Security Actions */}
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Login & Security</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white' }}>
                    <div>
                        <div style={{ fontWeight: '500', color: '#1E293B', marginBottom: '4px' }}>Password</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>Last changed 3 months ago</div>
                    </div>
                    <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={14} />
                        Reset Password
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white' }}>
                    <div>
                        <div style={{ fontWeight: '500', color: '#1E293B', marginBottom: '4px' }}>Two-Factor Authentication</div>
                        <div style={{ fontSize: '13px', color: '#64748B' }}>Add an extra layer of security to your account</div>
                    </div>
                    <button style={{ padding: '8px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', color: '#166534', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={14} />
                        Enable 2FA
                    </button>
                </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#EF4444', marginBottom: '16px' }}>Danger Zone</h3>
            <div style={{ padding: '16px', border: '1px solid #FECACA', borderRadius: '8px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontWeight: '500', color: '#991B1B', marginBottom: '4px' }}>Delete Account</div>
                    <div style={{ fontSize: '13px', color: '#B91C1C' }}>Permanently delete your account and all data</div>
                </div>
                <button style={{ padding: '8px 16px', background: '#EF4444', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={14} />
                    Delete Account
                </button>
            </div>
        </div>
    </div>
);

const FormInput = ({ label, placeholder, type = "text", defaultValue, icon }: { label: string, placeholder: string, type?: string, defaultValue?: string, icon?: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {icon && <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>{icon}</div>}
            <input
                type={type}
                placeholder={placeholder}
                defaultValue={defaultValue}
                style={{
                    padding: icon ? '10px 10px 10px 36px' : '10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}
            />
        </div>
    </div>
);

const IntegrationCard = ({ icon, name, description, connected, locked }: { icon: React.ReactNode, name: string, description: string, connected: boolean, locked?: boolean }) => (
    <div style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            {locked ? (
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', background: '#F1F5F9', padding: '4px 8px', borderRadius: '12px' }}>Core</span>
            ) : (
                <div style={{ position: 'relative', width: '36px', height: '20px', background: connected ? '#3B82F6' : '#E2E8F0', borderRadius: '10px', transition: 'all 0.2s', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: '2px', left: connected ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} />
                </div>
            )}
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>{name}</h3>
        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>{description}</p>
    </div>
);

const ThemeOption = ({ label, color, active }: { label: string, color: string, active: boolean }) => (
    <div style={{ cursor: 'pointer' }}>
        <div style={{ width: '120px', height: '80px', background: color, borderRadius: '8px', border: active ? '2px solid #3B82F6' : '1px solid #E2E8F0', marginBottom: '8px', position: 'relative' }}>
            {active && <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#3B82F6', borderRadius: '50%', padding: '2px' }}><Check size={12} color="white" /></div>}
        </div>
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '500', color: active ? '#3B82F6' : '#64748B' }}>{label}</div>
    </div>
);

const ColorOption = ({ color, active }: { color: string, active: boolean }) => (
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: active ? '2px solid white' : 'none', boxShadow: active ? `0 0 0 2px ${color}` : 'none' }}>
        {active && <Check size={16} color="white" />}
    </div>
);
