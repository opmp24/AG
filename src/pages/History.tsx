import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense } from '../lib/db';
import type { Expense } from '../types';
import { Trash2, Calendar, ShoppingBag, ChevronLeft, Edit3, CreditCard, Banknote, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const CATEGORY_MAP: Record<string, { icon: string, color: string, name: string }> = {
    '1': { name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    '2': { name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    '3': { name: 'Transporte', icon: '🚗', color: '#10b981' },
    '4': { name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    '5': { name: 'Salud', icon: '⚕️', color: '#ec4899' },
    '6': { name: 'Otros', icon: '📦', color: '#6366f1' },
};

const PAYMENT_ICON: Record<string, any> = {
    'efectivo': Banknote,
    'tarjeta': CreditCard,
    'transferencia': Landmark
};

const History: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const { preferences } = useApp();
    const navigate = useNavigate();

    const loadData = async () => {
        const data = await getAllExpenses();
        setExpenses(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('¿Deseas eliminar permanentemente este registro?')) {
            await deleteExpense(id);
            loadData();
        }
    };

    const handleEdit = (id: string) => {
        navigate(`/edit/${id}`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Hoy';
        if (days === 1) return 'Ayer';
        if (days < 7) return d.toLocaleDateString('es-ES', { weekday: 'long' });
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Mi Actividad</h1>
            </header>

            {loading ? (
                <div style={{ padding: '5rem 0', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cargando movimientos...</p>
                </div>
            ) : expenses.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                    <ShoppingBag size={64} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sin gastos</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Aún no has registrado ningún gasto en tu billetera segura.</p>
                    <button onClick={() => navigate('/add')} className="btn-primary" style={{ width: '100%' }}>Comenzar a registrar</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {expenses.map((exp, idx) => {
                        const category = CATEGORY_MAP[exp.categoryId] || CATEGORY_MAP['6'];
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
                                        width: '48px',
                                        height: '48px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem'
                                    }}>
                                        {category.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>{exp.description}</p>
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
                                    <p style={{ fontWeight: 900, color: '#ff6b6b', fontSize: '1.1rem' }}>- {formatCurrency(exp.amount)}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(exp.id); }}
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                border: 'none',
                                                padding: '0.5rem',
                                                borderRadius: '10px',
                                                color: 'var(--primary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, exp.id)}
                                            style={{
                                                background: 'rgba(255, 77, 77, 0.1)',
                                                border: 'none',
                                                padding: '0.5rem',
                                                borderRadius: '10px',
                                                color: '#ff6b6b',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
