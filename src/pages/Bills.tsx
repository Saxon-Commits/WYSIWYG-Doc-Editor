import React from 'react';
import { Receipt, CreditCard, Plus, MoreVertical, AlertCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Bill {
    id: string;
    payee: string;
    amount: string;
    dueDate: string;
    status: 'Due' | 'Overdue';
    days: number; // days due or overdue
    category: string;
}

interface PaidItem {
    id: string;
    payee: string;
    amount: string;
    date: string;
    type: 'Bill' | 'Expense';
    category: string;
    status: 'Paid';
}

const MOCK_UNPAID_BILLS: Bill[] = [
    { id: '1', payee: 'Adobe Creative Cloud', amount: '$54.99', dueDate: 'Oct 25, 2024', status: 'Overdue', days: 2, category: 'Software' },
    { id: '2', payee: 'WeWork Office Rent', amount: '$1,200.00', dueDate: 'Nov 01, 2024', status: 'Due', days: 5, category: 'Rent' },
    { id: '3', payee: 'Xero Subscription', amount: '$60.00', dueDate: 'Nov 03, 2024', status: 'Due', days: 7, category: 'Software' },
];

const MOCK_PAID_HISTORY: PaidItem[] = [
    { id: '1', payee: 'Apple Store', amount: '$2,499.00', date: 'Oct 20, 2024', type: 'Expense', category: 'Equipment', status: 'Paid' },
    { id: '2', payee: 'Uber Trip', amount: '$24.50', date: 'Oct 18, 2024', type: 'Expense', category: 'Travel', status: 'Paid' },
    { id: '3', payee: 'Internet Bill', amount: '$99.00', date: 'Oct 15, 2024', type: 'Bill', category: 'Utilities', status: 'Paid' },
    { id: '4', payee: 'Client Lunch', amount: '$125.00', date: 'Oct 12, 2024', type: 'Expense', category: 'Meals', status: 'Paid' },
];

const MOCK_CHART_DATA = [
    { month: 'May', income: 4000, expenses: 2400 },
    { month: 'Jun', income: 3000, expenses: 1398 },
    { month: 'Jul', income: 2000, expenses: 9800 },
    { month: 'Aug', income: 2780, expenses: 3908 },
    { month: 'Sep', income: 1890, expenses: 4800 },
    { month: 'Oct', income: 2390, expenses: 3800 },
    { month: 'Nov', income: 3490, expenses: 4300 },
];

export const Bills: React.FC = () => {
    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Add New Section */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                <CreateCard icon={<CreditCard size={20} />} title="Add Expense" description="Log a new expense" />
                <CreateCard icon={<Receipt size={20} />} title="Add Bill" description="Track a new bill" />
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Financial Overview Chart */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px' }}>Financial Overview</h2>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Line
                                    type="linear"
                                    dataKey="income"
                                    stroke="#16A34A"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    name="Income"
                                />
                                <Line
                                    type="linear"
                                    dataKey="expenses"
                                    stroke="#DC2626"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    name="Expenses"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placeholder for Second Chart */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94A3B8' }}>
                    <div style={{ marginBottom: '12px', padding: '16px', background: '#F1F5F9', borderRadius: '50%' }}>
                        <Plus size={24} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Add another chart</span>
                </div>
            </div>

            {/* Panels Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Unpaid Bills Panel */}
                <Section title="Unpaid Bills">
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', height: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>PAYEE</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>STATUS</th>
                                    <th style={{ padding: '12px 20px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_UNPAID_BILLS.map(bill => (
                                    <tr key={bill.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>
                                            {bill.payee}
                                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 'normal' }}>{bill.category}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>{bill.amount}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <StatusBadge status={bill.status} days={bill.days} />
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
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

                {/* Paid Expenses & Bills Panel */}
                <Section title="Paid Expenses & Bills">
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', height: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>PAYEE</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>AMOUNT</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: '600', color: '#64748B' }}>DATE</th>
                                    <th style={{ padding: '12px 20px', width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_PAID_HISTORY.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 20px', fontWeight: '500', color: '#1E293B' }}>
                                            {item.payee}
                                            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 'normal' }}>{item.category}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', color: '#1E293B' }}>{item.amount}</td>
                                        <td style={{ padding: '16px 20px', color: '#64748B' }}>{item.date}</td>
                                        <td style={{ padding: '16px 20px' }}>
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

const CreateCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <button style={{
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
        minWidth: '160px'
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

const StatusBadge = ({ status, days }: { status: 'Due' | 'Overdue', days: number }) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    let icon = null;
    let text = '';

    if (status === 'Overdue') {
        bg = '#FEE2E2';
        color = '#991B1B';
        icon = <AlertCircle size={12} />;
        text = `Overdue ${days} days`;
    } else {
        bg = '#FFEDD5';
        color = '#9A3412';
        icon = <Clock size={12} />;
        text = `Due in ${days} days`;
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
            {text}
        </span>
    );
};
