import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, Save, X, Calendar, Tag, AlignLeft, CreditCard, Banknote, Landmark, Wand2, Plus, Edit } from 'lucide-react';
import { saveExpense, getExpenseById, getCategories } from '../lib/db';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '../types';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981' },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899' },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1' },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6' },
];

const PAYMENT_METHODS = [
    { id: 'efectivo', name: 'Efectivo', icon: Banknote, color: '#10b981' },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: '#3b82f6' },
    { id: 'transferencia', name: 'Transfer', icon: Landmark, color: '#6366f1' },
];

const ExpenseForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { preferences } = useApp();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('1');
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isMagic, setIsMagic] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const dbCategories = await getCategories();
            setCategories(dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES as Category[]);

            if (id) {
                const expense = await getExpenseById(id as string);
                if (expense) {
                    setAmount(expense.amount.toString());
                    setDescription(expense.description);
                    setCategoryId(expense.categoryId);
                    setPaymentMethod(expense.paymentMethod || 'efectivo');
                    setDate(new Date(expense.date).toISOString().split('T')[0]);
                }
            } else {
                const queryAmount = searchParams.get('amount');
                const queryMerchant = searchParams.get('merchant');
                const querySource = searchParams.get('source');

                if (queryAmount) setAmount(queryAmount);
                if (queryMerchant) setDescription(queryMerchant);
                if (querySource === 'notification') {
                    setIsMagic(true);
                    setPaymentMethod('tarjeta');
                }
            }
        }
        fetchData();
    }, [id, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        setIsSaving(true);
        const selectedDate = new Date(date);
        const now = new Date();
        if (selectedDate.toDateString() === now.toDateString()) {
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        } else {
            selectedDate.setHours(12, 0, 0);
        }

        const expenseData = {
            id: id || uuidv4(),
            amount: Number(amount),
            currency: preferences.currency,
            description,
            categoryId,
            paymentMethod,
            date: selectedDate.getTime(),
            updatedAt: Date.now(),
            createdAt: Date.now(),
            source: isMagic ? 'notification' as const : 'manual' as const
        };

        await saveExpense(expenseData);
        setIsSaving(false);
        navigate('/');
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '14px', color: 'white' }}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{id ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
                    {isMagic && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Wand2 size={12} /> DETECTADO DESDE NOTIFICACIÓN</p>}
                </div>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="premium-card" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)', border: isMagic ? '2px solid var(--primary)' : '2px solid rgba(255, 255, 255, 0.1)' }}>
                    <label className="form-label" style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.8rem' }}>Monto</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, opacity: 0.5, marginRight: '0.5rem' }}>{preferences.currency === 'CLP' ? '$' : preferences.currency}</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            className="form-input"
                            style={{ background: 'transparent', border: 'none', fontSize: '3.5rem', fontWeight: 900, textAlign: 'center', width: '100%', color: 'white', padding: 0 }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label"><AlignLeft size={16} color="var(--primary)" /> Descripción / Comercio</label>
                        <input type="text" className="form-input" style={{ background: 'rgba(0,0,0,0.2)' }} value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Calendar size={16} color="var(--primary)" /> Fecha del Gasto</label>
                        <input type="date" className="form-input" style={{ background: 'rgba(0,0,0,0.2)' }} value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>

                    <div>
                        <label className="form-label">Método de Pago</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {PAYMENT_METHODS.map(m => (
                                <button
                                    key={m.id} type="button"
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className={`premium-card ${paymentMethod === m.id ? 'active' : ''}`}
                                    style={{
                                        padding: '0.8rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                        background: paymentMethod === m.id ? m.color : 'rgba(255,255,255,0.03)',
                                        border: paymentMethod === m.id ? '2px solid white' : '1px solid var(--glass-border)',
                                        opacity: paymentMethod === m.id ? 1 : 0.8
                                    }}
                                >
                                    <m.icon size={20} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <label className="form-label" style={{ margin: 0 }}><Tag size={16} color="var(--primary)" /> Categoría</label>
                            <Link to="/categories" style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800, textDecoration: 'none' }}>
                                <Edit size={12} /> GESTIONAR
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id} type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`premium-card ${categoryId === cat.id ? 'active' : ''}`}
                                    style={{
                                        padding: '0.8rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                        background: categoryId === cat.id ? cat.color : 'rgba(255,255,255,0.03)',
                                        border: categoryId === cat.id ? '2px solid white' : '1px solid var(--glass-border)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 900, textAlign: 'center', color: categoryId === cat.id ? 'white' : 'var(--text-secondary)' }}>{cat.name.toUpperCase()}</span>
                                </button>
                            ))}
                            <Link
                                to="/categories"
                                className="premium-card"
                                style={{ padding: '0.8rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)', textDecoration: 'none' }}
                            >
                                <Plus size={20} color="var(--primary)" />
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)' }}>AÑADIR</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ flex: 1, padding: '1.2rem', borderRadius: '18px' }}><X size={20} /> Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={isSaving} style={{ flex: 2, padding: '1.2rem', borderRadius: '18px', background: 'var(--primary)' }}>
                        {isSaving ? 'Guardando...' : <><Save size={20} /> {id ? 'Actualizar' : 'Guardar'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
