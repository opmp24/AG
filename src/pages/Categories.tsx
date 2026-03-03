import React, { useEffect, useState } from 'react';
import { PieChart as PieIcon, Plus, X, Tag, Palette, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getCategories, saveCategory, deleteCategory, getAllExpenses, reassignExpenses } from '../lib/db';
import type { Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES_DATA = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981' },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899' },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1' },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6' },
];

const ICON_OPTIONS = ['🍎', '🏠', '🚗', '🍿', '⚕️', '📦', '🛒', '🔌', '🎬', '💊', '👕', '🎮', '✈️', '🐶', '🎁'];
const COLOR_OPTIONS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#475569'];

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📦');
    const [color, setColor] = useState('#6366f1');

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
                await reassignExpenses(id, '6'); // ID 6 es "Otros"
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
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 900 }}>Categorías</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Gestiona la clasificación de tu hogar</p>
                </div>
                <button
                    className="fab-button"
                    style={{ width: '48px', height: '48px', margin: 0 }}
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={24} />
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</p>
                ) : (
                    categories.map(cat => (
                        <div
                            key={cat.id}
                            className="premium-card interactive-card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1.2rem',
                                borderLeft: `5px solid ${cat.color}`
                            }}
                            onClick={() => handleEdit(cat)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '16px',
                                    background: `${cat.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem'
                                }}>
                                    {cat.icon}
                                </div>
                                <div>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{cat.name}</span>
                                    {cat.id === '6' && <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>GENERAL / REASIGNACIÓN</p>}
                                    {cat.id === '7' && <p style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 800 }}>PAGOS / FISCAL</p>}
                                </div>
                            </div>
                            {cat.id !== '6' && cat.id !== '7' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(cat.id, cat.name); }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff6b6b', opacity: 0.6, cursor: 'pointer' }}
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1.5rem'
                }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tag size={16} /> Nombre
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Alquiler, Gimnasio, etc..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="form-label">Icono</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                    {ICON_OPTIONS.map(i => (
                                        <button
                                            key={i} type="button"
                                            onClick={() => setIcon(i)}
                                            style={{
                                                fontSize: '1.5rem', padding: '0.5rem', borderRadius: '12px', border: icon === i ? '2px solid var(--primary)' : '1px solid transparent',
                                                background: icon === i ? 'rgba(99, 102, 241, 0.1)' : 'transparent', cursor: 'pointer'
                                            }}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Palette size={16} /> Color
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c} type="button"
                                            onClick={() => setColor(c)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: c, border: color === c ? '2px solid white' : 'none', cursor: 'pointer',
                                                boxShadow: color === c ? `0 0 10px ${c}` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button className="btn-primary" type="submit" style={{ marginTop: '1rem', width: '100%' }}>
                                <CheckCircle2 size={20} /> Guardar Categoría
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
