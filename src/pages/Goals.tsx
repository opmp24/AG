import React, { useEffect, useState } from 'react';
import { Target, Plus, X, Pencil, Trash2, CheckCircle2, ChevronLeft, TrendingUp } from 'lucide-react';
import { getAllSavingGoals, saveSavingGoal, deleteSavingGoal } from '../lib/db';
import type { SavingGoal } from '../types';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const ICON_OPTIONS = ['🎯', '🏠', '🚗', '✈️', '🎓', '🏥', '🎁', '📱', '💻', '🚲', '🏝️', '💍', '🍼', '🎸', '💰'];
const COLOR_OPTIONS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#ef4444', '#84cc16', '#06b6d4'];

const Goals: React.FC = () => {
    const navigate = useNavigate();
    const { preferences } = useApp();
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [color, setColor] = useState('#10b981');

    const loadData = async () => {
        const items = await getAllSavingGoals();
        setGoals(items);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const goal: SavingGoal = {
            id: editingGoal?.id || uuidv4(),
            name,
            targetAmount: Number(targetAmount),
            currentAmount: Number(currentAmount),
            icon,
            color,
            deadline: editingGoal?.deadline,
            createdAt: editingGoal?.createdAt || Date.now()
        };
        await saveSavingGoal(goal);
        setShowModal(false);
        resetForm();
        loadData();
    };

    const handleEdit = (goal: SavingGoal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setCurrentAmount(goal.currentAmount.toString());
        setIcon(goal.icon);
        setColor(goal.color);
        setShowModal(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`¿Quieres eliminar la meta "${name}"?`)) {
            await deleteSavingGoal(id);
            loadData();
        }
    };

    const resetForm = () => {
        setEditingGoal(null);
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setIcon('🎯');
        setColor('#10b981');
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
                        <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Metas de Ahorro</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Tus sueños están más cerca</p>
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
            ) : goals.length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Target size={48} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>¡Sin metas aún!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                        Define tu primer objetivo de ahorro para empezar a cumplir tus sueños.
                    </p>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
                        <Plus size={18} /> Crear mi primera meta
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {goals.map(goal => {
                        const percent = (goal.currentAmount / goal.targetAmount) * 100;
                        const isCompleted = percent >= 100;

                        return (
                            <div key={goal.id} className="premium-card" style={{ padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
                                {/* Background glow for completed goals */}
                                {isCompleted && (
                                    <div style={{ position: 'absolute', inset: 0, background: `${goal.color}10`, zIndex: 0 }} />
                                )}

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.85rem' }}>
                                            <div style={{
                                                width: '46px', height: '46px', borderRadius: '14px',
                                                background: `${goal.color}20`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.6rem'
                                            }}>
                                                {goal.icon}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{goal.name}</h3>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                    {isCompleted ? '¡Meta cumplida! 🎉' : `${formatCurrency(goal.targetAmount - goal.currentAmount)} para completar`}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            <button onClick={() => handleEdit(goal)} className="btn-glass" style={{ padding: '0.4rem' }}><Pencil size={12} /></button>
                                            <button onClick={() => handleDelete(goal.id, goal.name)} className="btn-glass" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <div className="progress-bar-bg" style={{ height: '8px' }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${Math.min(percent, 100)}%`,
                                                background: goal.color,
                                                boxShadow: `0 0 10px ${goal.color}60`
                                            }}></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>
                                            <span style={{ color: goal.color }}>{formatCurrency(goal.currentAmount)}</span>
                                            <span style={{ opacity: 0.4, margin: '0 0.3rem', fontSize: '0.7rem' }}>de</span>
                                            <span style={{ opacity: 0.8 }}>{formatCurrency(goal.targetAmount)}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: goal.color }}>{Math.round(percent)}%</span>
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
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label"><Target size={14} /> Nombre de la meta</label>
                                <input
                                    type="text" className="form-input" placeholder="Ej: Viaje a Japón, Fondo de Emergencia..."
                                    value={name} onChange={(e) => setName(e.target.value)} required autoFocus
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label"><TrendingUp size={14} /> Objetivo</label>
                                    <input
                                        type="number" className="form-input" placeholder="500000"
                                        value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Ahorrado</label>
                                    <input
                                        type="number" className="form-input" placeholder="0"
                                        value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Icono</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', padding: '0.3rem' }}>
                                    {ICON_OPTIONS.map(i => (
                                        <button
                                            key={i} type="button" onClick={() => setIcon(i)}
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
                                <label className="form-label">Color</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                    {COLOR_OPTIONS.map(c => (
                                        <button
                                            key={c} type="button" onClick={() => setColor(c)}
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
                                <CheckCircle2 size={18} /> {editingGoal ? 'Guardar Cambios' : 'Comenzar Meta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
