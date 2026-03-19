import React, { useEffect, useState } from 'react';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { getAllExpenses, getCategories } from '../lib/db';
import type { Expense, Category } from '../types';
import { useApp } from '../context/AppContext';
import { getBillingPeriodRange, formatPeriodName } from '../lib/periods';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
];

const History: React.FC = () => {
    const { preferences } = useApp();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodOffset, setPeriodOffset] = useState(0);
    const [periodRange, setPeriodRange] = useState({ start: 0, end: 0 });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const loadData = async () => {
        const [exp, cats] = await Promise.all([getAllExpenses(), getCategories()]);
        
        const now = new Date();
        const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
        const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
        setPeriodRange(range);

        setExpenses(exp.filter(e => e.date >= range.start && e.date <= range.end));
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [periodOffset, preferences.billingCycleStartDay]);

    const filteredExpenses = expenses
        .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(e => !selectedCategory || e.categoryId === selectedCategory)
        .sort((a, b) => b.date - a.date);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency, maximumFractionDigits: 0 }).format(amount);
    };

    const formatShortDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const groupedExpenses = filteredExpenses.reduce((groups, exp) => {
        const date = new Date(exp.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!groups[date]) groups[date] = [];
        groups[date].push(exp);
        return groups;
    }, {} as Record<string, Expense[]>);

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Historial</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Tus gastos en el tiempo</p>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)} className="btn-glass" style={{ padding: '0.4rem' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)} className="btn-glass" style={{ padding: '0.4rem' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            <div className="premium-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--glass)', padding: '0.6rem 0.9rem', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                        type="text" placeholder="Buscar por comercio..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', width: '100%', fontWeight: 600 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        style={{
                            fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderRadius: '100px', border: !selectedCategory ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            background: !selectedCategory ? 'var(--primary)15' : 'transparent', color: !selectedCategory ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer'
                        }}
                    >
                        TODOS
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderRadius: '100px',
                                border: selectedCategory === cat.id ? `1.5px solid ${cat.color}` : '1px solid var(--glass-border)',
                                background: selectedCategory === cat.id ? `${cat.color}15` : 'transparent', color: selectedCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer'
                            }}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.name.toUpperCase()}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)05' }}>
                <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Filtrado</p>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Registros</p>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{filteredExpenses.length}</h3>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
            ) : filteredExpenses.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</p>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.3rem' }}>Sin resultados</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No encontramos gastos para estos filtros.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(groupedExpenses).map(([dateLabel, items]) => (
                        <div key={dateLabel}>
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.75rem', letterSpacing: '0.05em', paddingLeft: '0.5rem' }}>{dateLabel}</h4>
                            <div className="premium-card" style={{ padding: '0 1rem' }}>
                                {items.map(exp => {
                                    const cat = categories.find(c => c.id === exp.categoryId) || { icon: '📦', color: '#6366f1' };
                                    return (
                                        <div key={exp.id} className="expense-item" onClick={() => navigate(`/edit/${exp.id}`)} style={{ cursor: 'pointer' }}>
                                            <div className="expense-icon-wrap" style={{ background: cat.color + '15' }}>{cat.icon}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="truncate" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{exp.description}</p>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(exp.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • {exp.paymentMethod}</p>
                                            </div>
                                            <p style={{ fontWeight: 900, fontSize: '0.95rem', color: '#ef4444', flexShrink: 0 }}>-{formatCurrency(exp.amount)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
