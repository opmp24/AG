import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2, CheckCircle2, ChevronLeft, CalendarClock, Clock, Tag, CreditCard, Banknote, Landmark, AlertTriangle } from 'lucide-react';
import { getAllScheduledExpenses, saveScheduledExpense, deleteScheduledExpense, saveExpense, getCategories } from '../lib/db';
import type { ScheduledExpense, Category } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6', createdAt: 0 },
];

const Scheduled: React.FC = () => {
    const navigate = useNavigate();
    const { preferences } = useApp();
    const [scheduledItems, setScheduledItems] = useState<ScheduledExpense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingItem, setEditingItem] = useState<ScheduledExpense | null>(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('7'); // Default to 'Pagos'
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('transferencia');

    const loadData = async () => {
        const [items, cats] = await Promise.all([
            getAllScheduledExpenses(),
            getCategories()
        ]);
        setScheduledItems(items.sort((a, b) => a.dueDate - b.dueDate));
        setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const item: ScheduledExpense = {
            id: editingItem?.id || uuidv4(),
            description,
            amount: Number(amount),
            currency: preferences.currency, // Ya no falta
            categoryId,
            dueDate: new Date(dueDate).getTime(),
            paymentMethod,
            status: 'pending', // Añadido
            updatedAt: Date.now(),
            createdAt: editingItem?.createdAt || Date.now()
        };
        await saveScheduledExpense(item);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleMarkAsPaid = async (item: ScheduledExpense) => {
        const confirm = window.confirm(`¿Confirmas que ya pagaste "${item.description}" por ${formatCurrency(item.amount)}?`);
        if (confirm) {
            // 1. Create real expense
            await saveExpense({
                id: uuidv4(),
                amount: item.amount,
                currency: preferences.currency,
                description: item.description,
                categoryId: item.categoryId,
                paymentMethod: item.paymentMethod,
                date: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                source: 'manual'
            });
            // 2. Remove from scheduled
            await deleteScheduledExpense(item.id);
            loadData();
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Quieres eliminar el compromiso "${name}"?`)) {
            await deleteScheduledExpense(id);
            loadData();
        }
    };

    const handleEdit = (item: ScheduledExpense) => {
        setEditingItem(item);
        setDescription(item.description);
        setAmount(item.amount.toString());
        setCategoryId(item.categoryId);
        setDueDate(new Date(item.dueDate).toISOString().split('T')[0]);
        setPaymentMethod(item.paymentMethod || 'transferencia');
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setDescription('');
        setAmount('');
        setCategoryId('7');
        setDueDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('transferencia');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency, maximumFractionDigits: 0 }).format(val);
    };

    const formatShortDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const isOverdue = (timestamp: number) => {
        return timestamp < new Date().setHours(0,0,0,0);
    };

    const totalPrice = scheduledItems.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/')} className="btn-glass" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Compromisos</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Pagos próximos y recurrentes</p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="fab-button"
                    style={{ width: '45px', height: '45px' }}
                >
                    <Plus size={22} />
                </button>
            </header>

            {/* Total Pending Card */}
            {scheduledItems.length > 0 && (
                <div className="premium-card gradient-bg" style={{ padding: '1.2rem', marginBottom: '1.5rem', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.6rem', borderRadius: '12px' }}>
                            <CalendarClock size={22} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Por pagar este ciclo</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{formatCurrency(totalPrice)}</h2>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : scheduledItems.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Clock size={48} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>¡Todo al día!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                        No tienes pagos pendientes registrados.
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
                        <Plus size={18} /> Agregar compromiso
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {scheduledItems.map(item => {
                        const cat = categories.find(c => c.id === item.categoryId) || { icon: '📦', color: '#6366f1' };
                        const overdue = isOverdue(item.dueDate);

                        return (
                            <div key={item.id} className="premium-card" style={{
                                padding: '1rem', borderLeft: `5px solid ${overdue ? 'var(--danger)' : cat.color}`,
                                display: 'flex', alignItems: 'center', gap: '0.8rem'
                            }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: `${cat.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', flexShrink: 0
                                }}>
                                    {cat.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 className="truncate" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{item.description}</h3>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 900, color: overdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                                            {formatCurrency(item.amount)}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 800,
                                            color: overdue ? 'var(--danger)' : 'var(--text-secondary)',
                                            display: 'flex', alignItems: 'center', gap: '0.2rem'
                                        }}>
                                            {overdue ? <AlertTriangle size={10}/> : <Clock size={10}/>}
                                            Vence: {formatShortDate(item.dueDate)}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button onClick={() => handleEdit(item)} className="btn-glass" style={{ padding: '0.35rem' }}><Tag size={12} /></button>
                                            <button onClick={() => handleMarkAsPaid(item)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem', borderRadius: '8px' }}>
                                                PAGADO
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1.25rem'
                }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '1.8rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{editingItem ? 'Editar Compromiso' : 'Nuevo Compromiso'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Descripción</label>
                                <input
                                    type="text" className="form-input" placeholder="Ej: Arriendo, Luz, Internet..."
                                    value={description} onChange={(e) => setDescription(e.target.value)} required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Monto</label>
                                    <input
                                        type="number" className="form-input" placeholder="0"
                                        value={amount} onChange={(e) => setAmount(e.target.value)} required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Vencimiento</label>
                                    <input
                                        type="date" className="form-input"
                                        value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Método de Pago</label>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {[
                                        { id: 'efectivo', icon: Banknote },
                                        { id: 'tarjeta', icon: CreditCard },
                                        { id: 'transferencia', icon: Landmark }
                                    ].map(m => (
                                        <button
                                            key={m.id} type="button" onClick={() => setPaymentMethod(m.id as any)}
                                            style={{
                                                flex: 1, padding: '0.7rem', borderRadius: '12px',
                                                border: paymentMethod === m.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                                background: paymentMethod === m.id ? 'var(--primary)20' : 'transparent', cursor: 'pointer',
                                                display: 'flex', justifyContent: 'center', color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <m.icon size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Categoría</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                                                padding: '0.4rem 0.2rem', borderRadius: '10px',
                                                border: categoryId === cat.id ? `2px solid ${cat.color}` : '1px solid var(--glass-border)',
                                                background: categoryId === cat.id ? `${cat.color}15` : 'transparent', cursor: 'pointer'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                                {editingItem && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingItem.id, editingItem.description)}
                                        className="btn-danger"
                                        style={{ flex: 1, padding: '0.8rem' }}
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                                <button className="btn-primary" type="submit" style={{ flex: editingItem ? 3 : 1 }}>
                                    <CheckCircle2 size={18} /> {editingItem ? 'Actualizar' : 'Registrar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scheduled;
