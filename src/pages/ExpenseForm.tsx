import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Tag, Calendar, DollarSign } from 'lucide-react';
import { saveExpense } from '../lib/db';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentación', icon: '🍎' },
    { id: '2', name: 'Servicios', icon: '🔌' },
    { id: '3', name: 'Transporte', icon: '🚗' },
    { id: '4', name: 'Ocio', icon: '🎬' },
    { id: '5', name: 'Salud', icon: '💊' },
];

const ExpenseForm: React.FC = () => {
    const navigate = useNavigate();
    const { preferences } = useApp();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        categoryId: '1',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return;

        setLoading(true);
        try {
            await saveExpense({
                id: uuidv4(),
                amount: Number(formData.amount),
                currency: preferences.currency,
                description: formData.description,
                categoryId: formData.categoryId,
                date: new Date(formData.date).getTime(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                source: 'manual'
            });
            navigate('/');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="premium-card" style={{ padding: '0.6rem', borderRadius: '12px', marginBottom: 0 }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Gasto</h1>
            </header>

            <form onSubmit={handleSubmit}>
                <div className="premium-card" style={{ padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Monto del gasto</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{preferences.currency}</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                autoFocus
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '3rem',
                                    fontWeight: 800,
                                    width: '180px',
                                    textAlign: 'center',
                                    outline: 'none',
                                    color: 'white'
                                }}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Tag size={14} style={{ marginRight: '5px' }} /> Descripción</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="¿En qué gastaste?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Categoría</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {DEFAULT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                    style={{
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        border: `1px solid ${formData.categoryId === cat.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                                        background: formData.categoryId === cat.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--glass)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        transition: '0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                    <span style={{ fontSize: '0.7rem', color: formData.categoryId === cat.id ? 'var(--primary)' : 'var(--text-secondary)' }}>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Calendar size={14} style={{ marginRight: '5px' }} /> Fecha</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', fontSize: '1.1rem' }}
                >
                    {loading ? 'Guardando...' : <><Check size={20} /> Guardar Gasto</>}
                </button>
            </form>
        </div>
    );
};

export default ExpenseForm;
