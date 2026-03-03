import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, CheckCircle, Clock, AlertCircle, Tag, CreditCard, Banknote, Landmark, X, ChevronLeft, Save } from 'lucide-react';
import { getAllScheduledExpenses, saveScheduledExpense, deleteScheduledExpense, saveExpense, getCategories } from '../lib/db';
import type { ScheduledExpense, Category } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const CATEGORY_MAP: Record<string, { icon: string, color: string, name: string }> = {
    '1': { name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    '2': { name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    '3': { name: 'Transporte', icon: '🚗', color: '#10b981' },
    '4': { name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    '5': { name: 'Salud', icon: '⚕️', color: '#ec4899' },
    '6': { name: 'Otros', icon: '📦', color: '#6366f1' },
};

const PAYMENT_METHODS = [
    { id: 'efectivo', name: 'Efectivo', icon: Banknote, color: '#10b981' },
    { id: 'tarjeta', name: 'Tarjeta', icon: CreditCard, color: '#3b82f6' },
    { id: 'transferencia', name: 'Transfer', icon: Landmark, color: '#6366f1' },
];

const Scheduled: React.FC = () => {
    const [scheduled, setScheduled] = useState<ScheduledExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { preferences } = useApp();
    const navigate = useNavigate();

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('1');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [categories, setCategories] = useState<Category[]>([]);

    const loadData = async () => {
        const items = await getAllScheduledExpenses();
        setScheduled(items);
        const cats = await getCategories();
        if (cats.length > 0) setCategories(cats);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: ScheduledExpense = {
            id: uuidv4(),
            amount: Number(amount),
            currency: preferences.currency,
            description,
            categoryId,
            dueDate: new Date(dueDate).getTime(),
            paymentMethod,
            status: 'pending',
            createdAt: Date.now()
        };
        await saveScheduledExpense(newItem);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleMarkAsPaid = async (item: ScheduledExpense) => {
        if (window.confirm(`¿Confirmas que ya pagaste "${item.description}"? Se guardará en tus gastos de hoy.`)) {
            // 1. Guardar como gasto real
            await saveExpense({
                id: uuidv4(),
                amount: item.amount,
                currency: item.currency,
                description: item.description,
                categoryId: item.categoryId,
                date: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                source: 'manual',
                paymentMethod: item.paymentMethod
            });
            // 2. Eliminar de programados (o marcar como pagado)
            await deleteScheduledExpense(item.id);
            loadData();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Borrar este compromiso de pago?')) {
            await deleteScheduledExpense(id);
            loadData();
        }
    };

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setCategoryId('1');
        setDueDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('efectivo');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency }).format(val);
    };

    const totalPending = scheduled.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '12px', color: 'white' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 900 }}>Compromisos</h1>
                </div>
                <button className="fab-button" style={{ width: '45px', height: '45px', margin: 0 }} onClick={() => setShowModal(true)}>
                    <Plus size={24} />
                </button>
            </header>

            {/* Resumen de Pendientes */}
            <div className="premium-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 22, 36, 1) 100%)', border: '1px solid var(--warning)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total por Pagar</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{formatCurrency(totalPending)}</h2>
                    </div>
                    <div style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '15px' }}>
                        <Clock size={28} color="var(--warning)" />
                    </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.8rem', fontWeight: 600 }}>Tienes {scheduled.length} pagos próximos que requieren tu atención.</p>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</p>
            ) : scheduled.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <CheckCircle size={50} style={{ color: 'var(--success)', opacity: 0.3, marginBottom: '1.5rem' }} />
                    <h3 style={{ fontWeight: 800 }}>¡Todo al día!</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No tienes pagos pendientes registrados.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {scheduled.map(item => {
                        const cat = CATEGORY_MAP[item.categoryId] || { icon: '📦', color: '#6366f1' };
                        const isOverdue = item.dueDate < Date.now();

                        return (
                            <div key={item.id} className="premium-card interactive-card" style={{ padding: '1.2rem', borderLeft: `5px solid ${isOverdue ? '#ff4d4d' : cat.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ fontSize: '1.5rem', width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{item.description}</h4>
                                            <p style={{ fontSize: '0.75rem', color: isOverdue ? '#ff4d4d' : 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                                                Vence: {new Date(item.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>{formatCurrency(item.amount)}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{item.paymentMethod}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'var(--success)', borderRadius: '10px' }}
                                        onClick={() => handleMarkAsPaid(item)}
                                    >
                                        <CheckCircle size={16} /> Marcar como Pagado
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '0.6rem', borderRadius: '10px', color: '#ff4d4d' }}
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal para Nuevo Pendiente */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Nuevo Pago Programado</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Monto</label>
                                <input type="number" className="form-input" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--warning)' }} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <input type="text" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha de Vencimiento</label>
                                <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className="form-label">Método de Pago Sugerido</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {PAYMENT_METHODS.map(m => (
                                        <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id as any)} className={`premium-card ${paymentMethod === m.id ? 'active' : ''}`} style={{ padding: '0.5rem', fontSize: '0.7rem', background: paymentMethod === m.id ? m.color : 'rgba(255,255,255,0.03)', border: paymentMethod === m.id ? '2px solid white' : '1px solid transparent' }}>
                                            <m.icon size={16} /> {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="btn-primary" type="submit" style={{ background: 'var(--warning)', color: 'black', fontWeight: 900 }}>
                                <Save size={20} /> Registrar Compromiso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scheduled;
