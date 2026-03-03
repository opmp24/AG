import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, X, DollarSign, Calendar, Tag, AlignLeft } from 'lucide-react';
import { saveExpense, getExpenseById } from '../lib/db';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981' },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899' },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1' },
];

const ExpenseForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { preferences } = useApp();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('1');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            async function loadExpense() {
                const expense = await getExpenseById(id as string);
                if (expense) {
                    setAmount(expense.amount.toString());
                    setDescription(expense.description);
                    setCategoryId(expense.categoryId);
                    setDate(new Date(expense.date).toISOString().split('T')[0]);
                }
            }
            loadExpense();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        setIsSaving(true);
        const expenseData = {
            id: id || uuidv4(),
            amount: Number(amount),
            currency: preferences.currency,
            description,
            categoryId,
            date: new Date(date).getTime(),
            updatedAt: Date.now(),
            createdAt: Date.now(),
            source: 'manual' as const
        };

        await saveExpense(expenseData);
        setIsSaving(false);
        navigate('/');
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '14px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                    {id ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h1>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Monto Prominente */}
                <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '2px solid rgba(99, 102, 241, 0.3)' }}>
                    <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Monto del Gasto</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{preferences.currency === 'CLP' ? '$' : preferences.currency}</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            className="form-input"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '3.5rem',
                                fontWeight: 900,
                                textAlign: 'center',
                                width: '100%',
                                padding: 0,
                                color: 'white'
                            }}
                            placeholder="0"
                            autoFocus
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="premium-card" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlignLeft size={16} color="var(--primary)" /> Descripción
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="¿En qué gastaste?"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} color="var(--primary)" /> Fecha
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Tag size={16} color="var(--primary)" /> Categoría
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {DEFAULT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`premium-card ${categoryId === cat.id ? 'active' : ''}`}
                                    style={{
                                        padding: '0.8rem 0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        background: categoryId === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                        border: categoryId === cat.id ? '2px solid white' : '1px solid var(--glass-border)',
                                        transition: 'all 0.2s ease',
                                        opacity: categoryId === cat.id ? 1 : 0.7
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '1.2rem', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px solid var(--glass-border)' }}
                    >
                        <X size={20} /> Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSaving}
                        style={{ flex: 2, padding: '1.2rem', borderRadius: '18px', fontSize: '1.1rem', background: 'var(--primary)', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)' }}
                    >
                        {isSaving ? 'Guardando...' : <><Save size={20} /> Guardar Gasto</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;
