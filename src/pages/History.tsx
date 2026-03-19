import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense, getCategories } from '../lib/db';
import type { Expense, Category } from '../types';
import { Trash2, Calendar, ShoppingBag, ChevronLeft, Edit3, CreditCard, Banknote, Landmark, ChevronRight, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getBillingPeriodRange, formatPeriodName } from '../lib/periods';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6', createdAt: 0 },
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const data = await getAllExpenses();
        const now = new Date();
        const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
        const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
        setPeriodRange(range);
        const filtered = data.filter(e => e.date >= range.start && e.date <= range.end);
        setExpenses(filtered);
        const cats = await getCategories();
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
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
        return new Date(timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Filtered expenses
    const filteredExpenses = expenses.filter(exp => {
        const matchSearch = !searchTerm || exp.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = !filterCategoryId || exp.categoryId === filterCategoryId;
        return matchSearch && matchCategory;
    });

    const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Group expenses by date
    const groupedByDate: Record<string, Expense[]> = {};
    filteredExpenses.forEach(exp => {
        const dateKey = formatDate(exp.date);
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(exp);
    });

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/')} className="btn-glass" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 900 }}>Historial</h1>
                </div>

                {/* Period Selector */}
                <div className="premium-card" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.8rem 1rem'
                }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Ciclo de Facturación
                        </p>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                            {formatPeriodName(periodRange.start, periodRange.end)}
                        </span>
                    </div>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Search + Filters */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar gastos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.7rem 0.7rem 0.7rem 2.5rem' }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category filter pills */}
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                    <button
                        onClick={() => setFilterCategoryId(null)}
                        className="category-pill"
                        style={{
                            background: !filterCategoryId ? 'var(--primary)' : 'var(--glass)',
                            color: !filterCategoryId ? 'white' : 'var(--text-secondary)',
                            border: !filterCategoryId ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            cursor: 'pointer', flexShrink: 0, fontSize: '0.7rem'
                        }}
                    >
                        Todas
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
                            className="category-pill"
                            style={{
                                background: filterCategoryId === cat.id ? cat.color : 'var(--glass)',
                                color: filterCategoryId === cat.id ? 'white' : 'var(--text-secondary)',
                                border: filterCategoryId === cat.id ? `1px solid ${cat.color}` : '1px solid var(--glass-border)',
                                cursor: 'pointer', flexShrink: 0, fontSize: '0.7rem'
                            }}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Total Summary */}
            {filteredExpenses.length > 0 && (
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.8rem 1rem', marginBottom: '1rem', borderRadius: 'var(--border-radius-md)',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)'
                }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ef4444' }}>
                        Total: {formatCurrency(totalFiltered)}
                    </span>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '5rem 0', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <ShoppingBag size={48} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>Sin registros</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {searchTerm || filterCategoryId ? 'No hay gastos que coincidan con tu búsqueda.' : 'No hay gastos en este periodo.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Object.entries(groupedByDate).map(([dateLabel, dateExpenses]) => (
                        <div key={dateLabel}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.2rem' }}>
                                {dateLabel}
                            </p>
                            <div className="premium-card" style={{ overflow: 'hidden' }}>
                                {dateExpenses.map((exp, idx) => {
                                    const category = categories.find(c => c.id === exp.categoryId) || { icon: '📦', color: '#6366f1', name: 'Otro' };
                                    const PayIcon = PAYMENT_ICON[exp.paymentMethod || 'efectivo'];

                                    return (
                                        <div
                                            key={exp.id}
                                            style={{
                                                padding: '1rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: idx < dateExpenses.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleEdit(exp.id)}
                                        >
                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                <div className="expense-icon-wrap" style={{ background: category.color + '18' }}>
                                                    {category.icon}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p className="truncate" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{exp.description}</p>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                        color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600
                                                    }}>
                                                        {PayIcon && <PayIcon size={11} />}
                                                        <span style={{ textTransform: 'capitalize' }}>{exp.paymentMethod || 'efectivo'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                                <p style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>
                                                    -{formatCurrency(exp.amount)}
                                                </p>
                                                <button
                                                    onClick={(e) => handleDelete(e, exp.id)}
                                                    style={{
                                                        background: 'none', border: 'none', color: 'var(--text-muted)',
                                                        cursor: 'pointer', padding: '0.3rem'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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
