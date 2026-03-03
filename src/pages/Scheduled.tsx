import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2, CheckCircle, Clock, AlertCircle, Tag, CreditCard, Banknote, Landmark, X, ChevronLeft, Save, Edit, Edit3 } from 'lucide-react';
import { getAllScheduledExpenses, saveScheduledExpense, deleteScheduledExpense, saveExpense, getCategories } from '../lib/db';
import type { ScheduledExpense, Category } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, Link } from 'react-router-dom';

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

const Scheduled: React.FC = () => {
    const [scheduled, setScheduled] = useState<ScheduledExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { preferences } = useApp();
    const navigate = useNavigate();

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
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
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES as Category[]);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const item: ScheduledExpense = {
            id: editingId || uuidv4(),
            amount: Number(amount),
            currency: preferences.currency,
            description,
            categoryId,
            dueDate: new Date(dueDate).getTime(),
            paymentMethod,
            status: 'pending',
            createdAt: Date.now()
        };
        await saveScheduledExpense(item);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleMarkAsPaid = async (item: ScheduledExpense) => {
        if (window.confirm(`¿Confirmas que ya pagaste "${item.description}"? Se guardará en tus gastos de hoy.`)) {
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
            await deleteScheduledExpense(item.id);
            loadData();
        }
    };

    const handleEdit = (item: ScheduledExpense) => {
        setEditingId(item.id);
        setAmount(item.amount.toString());
        setDescription(item.description);
        setCategoryId(item.categoryId);
        setDueDate(new Date(item.dueDate).toISOString().split('T')[0]);
        setPaymentMethod(item.paymentMethod as any);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Borrar este compromiso de pago?')) {
            await deleteScheduledExpense(id);
            loadData();
        }
    };

    const resetForm = () => {
        setEditingId(null);
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
                <button className="fab-button" style={{ width: '45px', height: '45px', margin: 0 }} onClick={() => { resetForm(); setShowModal(true); }}>
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
                        const catInfo = categories.find(c => c.id === item.categoryId) || { icon: '📦', color: '#6366f1' };
                        const isOverdue = item.dueDate < Date.now();
                        const MethodIcon = PAYMENT_METHODS.find(m => m.id === item.paymentMethod)?.icon || CreditCard;

                        return (
                            <div key={item.id} className="premium-card interactive-card" style={{ padding: '1.2rem', borderLeft: `5px solid ${isOverdue ? '#ff4d4d' : catInfo.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }} onClick={() => handleEdit(item)}>
                                        <div style={{ fontSize: '1.5rem', width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {catInfo.icon}
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
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                            <MethodIcon size={12} /> {item.paymentMethod}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', background: 'var(--success)', borderRadius: '10px' }}
                                        onClick={() => handleMarkAsPaid(item)}
                                    >
                                        <CheckCircle size={16} /> Pagado
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: 'none' }}
                                        onClick={() => handleEdit(item)}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '0.6rem', borderRadius: '10px', color: '#ff4d4d', border: 'none', background: 'rgba(255, 77, 77, 0.1)' }}
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

            {/* Modal para Nuevo/Editar Pendiente */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '450px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{editingId ? 'Editar Compromiso' : 'Nuevo Compromiso'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group" style={{ textAlign: 'center' }}>
                                <label className="form-label">Monto</label>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, opacity: 0.5 }}>$</span>
                                    <input type="number" className="form-input" style={{ background: 'transparent', border: 'none', fontSize: '2.5rem', fontWeight: 900, color: 'var(--warning)', textAlign: 'center', width: '200px' }} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <input type="text" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ej: Pago de Arriendo" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fecha de Vencimiento</label>
                                <input type="date" className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                            </div>

                            <div>
                                <label className="form-label">Método de Pago</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                    {PAYMENT_METHODS.map(m => (
                                        <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id as any)}
                                            className={`premium-card ${paymentMethod === m.id ? 'active' : ''}`}
                                            style={{
                                                padding: '0.6rem 0.3rem', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                                background: paymentMethod === m.id ? m.color : 'rgba(255,255,255,0.03)',
                                                border: paymentMethod === m.id ? '2px solid white' : '1px solid var(--glass-border)',
                                                color: paymentMethod === m.id ? 'white' : 'var(--text-secondary)'
                                            }}>
                                            <m.icon size={18} /> {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Categoría</label>
                                    <Link to="/categories" style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>+ GESTIONAR</Link>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {categories.map(cat => (
                                        <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                                            className={`premium-card ${categoryId === cat.id ? 'active' : ''}`}
                                            style={{
                                                padding: '0.6rem 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                                background: categoryId === cat.id ? cat.color : 'rgba(255,255,255,0.03)',
                                                border: categoryId === cat.id ? '2px solid white' : '1px solid var(--glass-border)'
                                            }}>
                                            <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', color: categoryId === cat.id ? 'white' : 'var(--text-secondary)' }}>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" style={{ background: 'var(--warning)', color: 'black', fontWeight: 900, marginTop: '1rem', height: '55px' }}>
                                <Save size={20} /> {editingId ? 'Actualizar Compromiso' : 'Registrar Compromiso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scheduled;
