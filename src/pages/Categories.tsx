import React, { useEffect, useState } from 'react';
import { PieChart as PieIcon, Plus, X, Tag, Palette, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, getAllExpenses, reassignExpenses } from '../lib/db';
import type { Category } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CATEGORIES_DATA = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981' },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899' },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1' },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6' },
];

const ICON_OPTIONS = ['🍎', '🏠', '🚗', '🍿', '⚕️', '📦', '🛒', '🔌', '🎬', '💊', '👕', '🎮', '✈️', '🐶', '🎁', '🏦', '📱', '🏋️', '📚', '🍕'];
const COLOR_OPTIONS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#475569', '#f97316', '#84cc16', '#d946ef'];

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📦');
    const [color, setColor] = useState('#6366f1');
    const [monthlyLimit, setMonthlyLimit] = useState('');
    const [isLimitActive, setIsLimitActive] = useState(true);
    const { preferences } = useApp();

    const loadData = async () => {
        let items = await getCategories();
        if (items.length === 0) {
            for (const cat of DEFAULT_CATEGORIES_DATA) {
                await saveCategory({ ...cat, createdAt: Date.now() });
            }
            items = await getCategories();
        }
        setCategories(items);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const newCat: Category = {
            id: editingCategory?.id || uuidv4(),
            name,
            icon,
            color,
            monthlyLimit: monthlyLimit ? Number(monthlyLimit) : undefined,
            isLimitActive,
            createdAt: editingCategory?.createdAt || Date.now()
        };
        await saveCategory(newCat);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color);
        setMonthlyLimit(cat.monthlyLimit?.toString() || '');
        setIsLimitActive(cat.isLimitActive !== false);
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        const expenses = await getAllExpenses();
        const associatedCount = expenses.filter(e => e.categoryId === id).length;

        if (associatedCount > 0) {
            const proceed = window.confirm(
                `¡Atención! La categoría "${name}" tiene ${associatedCount} gastos asociados.\n\n` +
                `Si la eliminas, estos gastos se reasignarán automáticamente a la categoría "Otros".\n\n` +
                `¿Deseas continuar?`
            );
            if (proceed) {
                await reassignExpenses(id, '6'); 
                await deleteCategory(id);
                loadData();
            }
        } else {
            if (window.confirm(`¿Quieres eliminar la categoría "${name}"?`)) {
                await deleteCategory(id);
                loadData();
            }
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setName('');
        setIcon('📦');
        setColor('#6366f1');
        setMonthlyLimit('');
        setIsLimitActive(true);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency, maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/')} className="btn-glass" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Mini-presupuestos</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Asigna límites a tus categorías</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                ) : (
                    categories.map(cat => (
                        <div
                            key={cat.id}
                            className="premium-card clickable"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderLeft: `6px solid ${cat.color}`
                            }}
                            onClick={() => handleEdit(cat)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '14px',
                                    background: `${cat.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.4rem'
                                }}>
                                    {cat.icon}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'block' }}>{cat.name}</span>
                                    {cat.monthlyLimit ? (
                                        <p style={{ fontSize: '0.65rem', color: isLimitActive ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 700 }}>
                                            {cat.isLimitActive === false ? '⏸️ Límite en pausa' : `Límite: ${formatCurrency(cat.monthlyLimit)}`}
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>Sin límite asignado</p>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {cat.id !== '6' && cat.id !== '7' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }}
                                        style={{ background: 'transparent', border: 'none', color: '#ff6b6b', opacity: 0.4, cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1.25rem'
                }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '1.8rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label"><Tag size={14} /> Nombre</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ej: Gimnasio, Mascotas..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label"><PieIcon size={14} /> Presupuesto Mensual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Ej: 50000"
                                        value={monthlyLimit}
                                        onChange={(e) => setMonthlyLimit(e.target.value)}
                                        style={{ paddingLeft: '2.5rem' }}
                                    />
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontWeight: 900 }}>$</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.75rem', gap: '0.6rem', padding: '0.5rem', background: 'var(--glass)', borderRadius: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="limit-active"
                                        checked={isLimitActive}
                                        onChange={(e) => setIsLimitActive(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                    />
                                    <label htmlFor="limit-active" style={{ fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Activar alerta de presupuesto</label>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Icono</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', padding: '0.3rem' }}>
                                    {ICON_OPTIONS.map(i => (
                                        <button
                                            key={i} type="button"
                                            onClick={() => setIcon(i)}
                                            style={{
                                                fontSize: '1.3rem', padding: '0.6rem', borderRadius: '12px', 
                                                border: icon === i ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                                background: icon === i ? 'var(--primary)20' : 'transparent', cursor: 'pointer'
                                            }}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label"><Palette size={14} /> Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c} type="button"
                                            onClick={() => setColor(c)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '10px', background: c, 
                                                border: color === c ? '3px solid white' : 'none', cursor: 'pointer',
                                                boxShadow: color === c ? `0 0 12px ${c}80` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>
                                <CheckCircle2 size={18} /> Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
