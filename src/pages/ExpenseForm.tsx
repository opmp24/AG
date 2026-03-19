import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, Save, X, Calendar, Tag, AlignLeft, CreditCard, Banknote, Landmark, Wand2, Plus, Edit } from 'lucide-react';
import { saveExpense, getExpenseById, getCategories } from '../lib/db';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '../types';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6', createdAt: 0 },
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
    const { preferences, updatePreferences } = useApp();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('1');
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isMagic, setIsMagic] = useState(false);
    const [savedAnim, setSavedAnim] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const dbCategories = await getCategories();
            setCategories(dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES);

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

                // Autocategorización inteligente
                if (queryMerchant && preferences.autoCategorization?.[queryMerchant.toLowerCase()]) {
                    setCategoryId(preferences.autoCategorization[queryMerchant.toLowerCase()]);
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

        // Update auto-categorization learning
        const currentLearning = preferences.autoCategorization || {};
        const merchantKey = description.toLowerCase().trim();
        if (currentLearning[merchantKey] !== categoryId) {
            updatePreferences({
                autoCategorization: {
                    ...currentLearning,
                    [merchantKey]: categoryId
                }
            });
        }

        setIsSaving(false);
        setSavedAnim(true);
        setTimeout(() => navigate('/'), 600);
    };

    const selectedCategory = categories.find(c => c.id === categoryId);

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => navigate(-1)} className="btn-glass" style={{ padding: '0.6rem' }}>
                    <ChevronLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 900 }}>{id ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
                    {isMagic && (
                        <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Wand2 size={11} /> DETECTADO DESDE NOTIFICACIÓN
                        </p>
                    )}
                </div>
            </header>

            {/* Saved Animation Overlay */}
            {savedAnim && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>¡Guardado!</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Amount Card */}
                <div className="premium-card" style={{
                    padding: '2rem', textAlign: 'center',
                    background: isMagic ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-dark)',
                    border: isMagic ? '2px solid var(--primary)' : '1px solid var(--glass-border)'
                }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Monto
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, opacity: 0.4, marginRight: '0.3rem' }}>
                            {preferences.currency === 'CLP' ? '$' : preferences.currency}
                        </span>
                        <input
                            type="number"
                            inputMode="decimal"
                            className="form-input"
                            style={{
                                background: 'transparent', border: 'none', fontSize: '3rem', fontWeight: 900,
                                textAlign: 'center', width: '100%', color: 'var(--text-primary)', padding: 0,
                                boxShadow: 'none'
                            }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            required
                            autoFocus={!id}
                        />
                    </div>
                </div>

                {/* Details Card */}
                <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {/* Description */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><AlignLeft size={14} color="var(--primary)" /> Descripción</label>
                        <input
                            type="text"
                            className="form-input"
                            style={{ background: 'rgba(0,0,0,0.15)' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Supermercado, Almuerzo..."
                            required
                        />
                    </div>

                    {/* Date */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><Calendar size={14} color="var(--primary)" /> Fecha</label>
                        <input
                            type="date"
                            className="form-input"
                            style={{ background: 'rgba(0,0,0,0.15)' }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="form-label">Método de Pago</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {PAYMENT_METHODS.map(m => (
                                <button
                                    key={m.id} type="button"
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className="premium-card"
                                    style={{
                                        padding: '0.7rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                        background: paymentMethod === m.id ? m.color : 'var(--glass)',
                                        border: paymentMethod === m.id ? '2px solid white' : '1px solid var(--glass-border)',
                                        color: paymentMethod === m.id ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <m.icon size={18} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <label className="form-label" style={{ margin: 0 }}><Tag size={14} color="var(--primary)" /> Categoría</label>
                            <Link to="/categories" style={{
                                fontSize: '0.65rem', color: 'var(--primary)', display: 'flex',
                                alignItems: 'center', gap: '0.2rem', fontWeight: 800, textDecoration: 'none'
                            }}>
                                <Edit size={10} /> GESTIONAR
                            </Link>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id} type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className="premium-card"
                                    style={{
                                        padding: '0.65rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                        background: categoryId === cat.id ? cat.color : 'var(--glass)',
                                        border: categoryId === cat.id ? '2px solid white' : '1px solid var(--glass-border)',
                                        transition: 'all 0.2s', cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                                    <span style={{
                                        fontSize: '0.58rem', fontWeight: 900, textAlign: 'center',
                                        color: categoryId === cat.id ? 'white' : 'var(--text-secondary)',
                                        textTransform: 'uppercase'
                                    }}>{cat.name}</span>
                                </button>
                            ))}
                            <Link
                                to="/categories"
                                className="premium-card"
                                style={{
                                    padding: '0.65rem 0.2rem', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                    background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed var(--primary)',
                                    textDecoration: 'none', cursor: 'pointer'
                                }}
                            >
                                <Plus size={18} color="var(--primary)" />
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--primary)' }}>AÑADIR</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '16px' }}>
                        <X size={18} /> Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving || !amount || !description}
                        style={{ flex: 2, padding: '1rem', borderRadius: '16px' }}
                    >
                        {isSaving ? 'Guardando...' : <><Save size={18} /> {id ? 'Actualizar' : 'Guardar'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
