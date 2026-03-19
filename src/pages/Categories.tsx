import React, { useEffect, useState } from 'react';
import { LayoutGrid, Plus, X, Pencil, Trash2, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, getAllExpenses } from '../lib/db';
import type { Category, Expense } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const ICON_OPTIONS = ['🍎', '🏠', '🚗', '🍿', '⚕️', '📦', '💸', '🏫', '🛒', '🍔', '🍺', '💼', '💻', '🚲', '🐶', '🎁', '🎾', '✈️', '💄', '📱'];
const COLOR_OPTIONS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#84cc16', '#fb7185'];

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const { preferences } = useApp();
    const [categories, setCategories] = useState<Category[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📦');
    const [color, setColor] = useState('#6366f1');
    const [limit, setLimit] = useState('');
    const [isLimitActive, setIsLimitActive] = useState(true);

    const loadData = async () => {
        const [cats, exps] = await Promise.all([getCategories(), getAllExpenses()]);
        setCategories(cats);
        setExpenses(exps);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const category: Category = {
            id: editingCategory?.id || uuidv4(),
            name,
            icon,
            color,
            monthlyLimit: limit ? Number(limit) : undefined,
            isLimitActive,
            createdAt: editingCategory?.createdAt || Date.now()
        };
        await saveCategory(category);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color);
        setLimit((cat as any).monthlyLimit?.toString() || '');
        setIsLimitActive((cat as any).isLimitActive !== false);
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Quieres eliminar la categoría "${name}"? Los gastos asociados se moverán a "Otros".`)) {
            await deleteCategory(id);
            loadData();
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setName('');
        setIcon('📦');
        setColor('#6366f1');
        setLimit('');
        setIsLimitActive(true);
    };

    const getSpentInCategory = (id: string) => {
        return expenses.filter(e => e.categoryId === id).reduce((sum, e) => sum + e.amount, 0);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency, maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/')} className="btn-glass" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Micro-presupuestos</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Tus sobres de dinero</p>
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

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {categories.map(cat => {
                        const spent = getSpentInCategory(cat.id);
                        const limitVal = (cat as any).monthlyLimit;
                        const hasLimit = limitVal && limitVal > 0 && (cat as any).isLimitActive !== false;
                        const percent = hasLimit ? (spent / limitVal) * 100 : 0;

                        return (
                            <div key={cat.id} className="premium-card clickable" onClick={() => handleEdit(cat)} style={{ padding: '1.2rem', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '14px',
                                            background: `${cat.color}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}>
                                            {cat.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{cat.name}</h3>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                Total gastado: {formatCurrency(spent)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(cat); }} className="btn-glass" style={{ padding: '0.4rem' }}><Pencil size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }} className="btn-glass" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                                    </div>
                                </div>

                                {hasLimit && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 800 }}>
                                            <span style={{ color: percent > 100 ? '#ef4444' : 'var(--text-secondary)' }}>
                                                {formatCurrency(limitVal - spent)} {percent > 100 ? 'sobre-gastado' : 'restante'}
                                            </span>
                                            <span>{Math.round(percent)}%</span>
                                        </div>
                                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${Math.min(percent, 100)}%`,
                                                background: percent > 100 ? '#ef4444' : cat.color
                                            }}></div>
                                        </div>
                                    </>
                                )}
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
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{editingCategory ? 'Editar Micro-presupuesto' : 'Nuevo Micro-presupuesto'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label"><LayoutGrid size={14} /> Nombre de la categoría</label>
                                <input
                                    type="text" className="form-input" placeholder="Ej: Supermercado, Apps..."
                                    value={name} onChange={(e) => setName(e.target.value)} required autoFocus
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}><AlertCircle size={14} /> Presupuesto mensual</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isLimitActive} onChange={(e) => setIsLimitActive(e.target.checked)} />
                                        ACTIVAR LÍMITE
                                    </label>
                                </div>
                                <input
                                    type="number" className="form-input" placeholder="0"
                                    value={limit} onChange={(e) => setLimit(e.target.value)}
                                    disabled={!isLimitActive}
                                />
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 600 }}>Si activas un límite, te avisaremos cuando estés por alcanzarlo.</p>
                            </div>

                            <div>
                                <label className="form-label">Icono</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', padding: '0.3rem' }}>
                                    {ICON_OPTIONS.map(i => (
                                        <button
                                            key={i} type="button" onClick={() => setIcon(i)}
                                            style={{
                                                fontSize: '1.4rem', padding: '0.6rem', borderRadius: '12px',
                                                border: icon === i ? `2.5px solid ${color}` : '1.5px solid var(--glass-border)',
                                                background: icon === i ? color + '15' : 'transparent', cursor: 'pointer'
                                            }}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>
                                <CheckCircle2 size={18} /> {editingCategory ? 'Guardar Cambios' : 'Crear Micro-presupuesto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
