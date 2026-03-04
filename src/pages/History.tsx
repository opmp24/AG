import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense, getCategories } from '../lib/db';
import type { Expense, Category } from '../types';
import { Trash2, Calendar, ShoppingBag, ChevronLeft, Edit3, CreditCard, Banknote, Landmark, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getBillingPeriodRange, formatPeriodName } from '../lib/periods';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981' },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899' },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1' },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6' },
];

const PAYMENT_ICON: Record<string, any> = {
    'efectivo': Banknote,
    'tarjeta': CreditCard,
    'transferencia': Landmark
};

const History: React.FC = () => {
    const { preferences } = useApp();
    const navigate = useNavigate();

    const [periodOffset, setPeriodOffset] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodRange, setPeriodRange] = useState({ start: 0, end: 0 });

    const loadData = async () => {
        setLoading(true);
        const data = await getAllExpenses();

        // Calcular el rango del período basado en el offset y el día de inicio
        const now = new Date();
        const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
        const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
        setPeriodRange(range);

        const filtered = data.filter(e => e.date >= range.start && e.date <= range.end);
        setExpenses(filtered);
        const cats = await getCategories();
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES as Category[]);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [periodOffset, preferences.billingCycleStartDay]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('¿Deseas eliminar permanentemente este registro?')) {
            await deleteExpense(id);
            loadData();
        }
    };

    const handleEdit = (id: string) => { navigate(`/edit/${id}`); };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '12px', color: 'white' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 900 }}>Actividad</h1>
                </div>

                {/* Selector de Ciclo de Facturación */}
                <div className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)} style={{ background: 'transparent', border: 'none', color: 'white' }}><ChevronLeft /></button>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Ciclo de Facturación</p>
                        <span style={{ fontWeight: 900, fontSize: '1rem' }}>{formatPeriodName(periodRange.start, periodRange.end)}</span>
                    </div>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)} style={{ background: 'transparent', border: 'none', color: 'white' }}><ChevronRight /></button>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '5rem 0', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                </div>
            ) : expenses.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                    <ShoppingBag size={64} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sin registros</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay gastos en este periodo seleccionado.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {expenses.map((exp, idx) => {
                        const category = categories.find(c => c.id === exp.categoryId) || { icon: '📦', color: '#6366f1', name: 'Otro' };
                        const PayIcon = PAYMENT_ICON[exp.paymentMethod || 'efectivo'];

                        return (
                            <div
                                key={exp.id}
                                className="premium-card interactive-card animate-fade-in"
                                style={{
                                    padding: '1.2rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    animationDelay: `${idx * 0.05}s`,
                                    borderLeft: `4px solid ${category.color}`
                                }}
                                onClick={() => handleEdit(exp.id)}
                            >
                                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem'
                                    }}>
                                        {category.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '1rem' }}>{exp.description}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem', fontWeight: 600 }}>
                                            <Calendar size={12} />
                                            <span>{formatDate(exp.date)}</span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            {PayIcon && <PayIcon size={12} />}
                                            <span style={{ textTransform: 'capitalize' }}>{exp.paymentMethod || 'efectivo'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <p style={{ fontWeight: 900, color: '#ff4d4d', fontSize: '1.1rem' }}>- {formatCurrency(exp.amount)}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(exp.id); }} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)' }}><Edit3 size={16} /></button>
                                        <button onClick={(e) => handleDelete(e, exp.id)} style={{ background: 'rgba(255, 77, 77, 0.1)', border: 'none', padding: '0.5rem', borderRadius: '10px', color: '#ff4d4d' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default History;
