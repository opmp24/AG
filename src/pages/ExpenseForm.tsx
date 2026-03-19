import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, X, Trash2, Calendar, Tag, CreditCard, Banknote, Landmark, CheckCircle2 } from 'lucide-react';
import { saveExpense, getExpense, deleteExpense, getCategories } from '../lib/db';
import type { Expense, Category } from '../types';
import { useApp } from '../context/AppContext';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
];

const ExpenseForm: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { preferences } = useApp();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('6');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');

    useEffect(() => {
        const load = async () => {
            const cats = await getCategories();
            setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);

            if (id) {
                const exp = await getExpense(id);
                if (exp) {
                    setAmount(exp.amount.toString());
                    setDescription(exp.description);
                    setCategoryId(exp.categoryId);
                    setDate(new Date(exp.date).toISOString().split('T')[0]);
                    setPaymentMethod(exp.paymentMethod || 'efectivo');
                }
            } else {
                // Check for URL params (from magic paste)
                const urlAmount = searchParams.get('amount');
                const urlMerchant = searchParams.get('merchant');
                if (urlAmount) setAmount(urlAmount);
                if (urlMerchant) setDescription(urlMerchant);
            }
            setLoading(false);
        };
        load();
    }, [id, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const expense: Expense = {
            id: id || uuidv4(),
            amount: Number(amount),
            currency: preferences.currency,
            description,
            categoryId,
            date: new Date(date).getTime(),
            paymentMethod,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'manual'
        };

        await saveExpense(expense);
        setSuccess(true);
        setTimeout(() => navigate('/'), 800);
    };

    const handleDelete = async () => {
        if (id && window.confirm('¿Eliminar este gasto?')) {
            await deleteExpense(id);
            navigate('/');
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '500px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{id ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
                <button onClick={() => navigate(-1)} className="btn-glass"><X size={20} /></button>
            </header>

            <form onSubmit={handleSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Monto del gasto</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            required
                            style={{
                                background: 'transparent', border: 'none', borderBottom: '2px solid var(--glass-border)',
                                fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', width: '200px', textAlign: 'center', outline: 'none'
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><Tag size={14} /> ¿En qué gastaste?</label>
                        <input
                            type="text" className="form-input" placeholder="Ej: Supermercado, Cine, Almuerzo..."
                            value={description} onChange={(e) => setDescription(e.target.value)} required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label"><Calendar size={14} /> Fecha</label>
                            <input
                                type="date" className="form-input"
                                value={date} onChange={(e) => setDate(e.target.value)} required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Pago</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[
                                    { id: 'efectivo', icon: Banknote },
                                    { id: 'tarjeta', icon: CreditCard },
                                    { id: 'transferencia', icon: Landmark }
                                ].map(m => (
                                    <button
                                        key={m.id} type="button" onClick={() => setPaymentMethod(m.id as any)}
                                        style={{
                                            flex: 1, padding: '0.6rem', borderRadius: '10px',
                                            border: paymentMethod === m.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                            background: paymentMethod === m.id ? 'var(--primary)15' : 'transparent', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'center', color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-secondary)'
                                        }}
                                    >
                                        <m.icon size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Categoría</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.6rem 0.2rem', borderRadius: '12px',
                                        border: categoryId === cat.id ? `2px solid ${cat.color}` : '1px solid var(--glass-border)',
                                        background: categoryId === cat.id ? cat.color + '15' : 'transparent', cursor: 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: categoryId === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        {cat.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem' }}>
                    {id && (
                        <button type="button" onClick={handleDelete} className="btn-danger" style={{ flex: 1 }}>
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button type="submit" className="btn-primary" style={{ flex: 3 }} disabled={saving}>
                        {success ? <CheckCircle2 size={22} className="animate-fade-in" /> : <><Save size={20} /> Guardar Gasto</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
