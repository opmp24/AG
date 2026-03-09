import React, { useState, useEffect } from 'react';
import { Heart, Plus, Edit2, X, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import type { SavingGoal } from '../types';
import { getAllSavingGoals, saveSavingGoal, deleteSavingGoal } from '../lib/db';

const Goals: React.FC = () => {
    const { preferences } = useApp();
    const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', icon: '💰', color: '#10b981' });

    useEffect(() => {
        const loadGoals = async () => {
            const goals = await getAllSavingGoals();
            setSavingGoals(goals);
        };
        loadGoals();
    }, []);

    const handleAddGoal = async () => {
        const goal: SavingGoal = {
            id: editingGoalId || uuidv4(),
            name: newGoal.name,
            targetAmount: Number(newGoal.target),
            currentAmount: Number(newGoal.current),
            icon: newGoal.icon,
            color: newGoal.color,
            createdAt: Date.now()
        };
        await saveSavingGoal(goal);
        if (editingGoalId) {
            setSavingGoals(savingGoals.map(g => g.id === editingGoalId ? goal : g));
        } else {
            setSavingGoals([...savingGoals, goal]);
        }
        setShowGoalModal(false);
        setNewGoal({ name: '', target: '', current: '', icon: '💰', color: '#10b981' });
        setEditingGoalId(null);
    };

    const handleEditGoal = (goal: SavingGoal) => {
        setNewGoal({
            name: goal.name,
            target: goal.targetAmount.toString(),
            current: goal.currentAmount.toString(),
            icon: goal.icon,
            color: goal.color
        });
        setEditingGoalId(goal.id);
        setShowGoalModal(true);
    };

    const handleDeleteGoal = async (id: string) => {
        if (window.confirm("¿Eliminar esta meta?")) {
            await deleteSavingGoal(id);
            setSavingGoals(savingGoals.filter(g => g.id !== id));
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                    Metas de Ahorro
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
                    Alcanza tus objetivos financieros
                </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savingGoals.map(goal => (
                    <div key={goal.id} className="premium-card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.5rem', background: 'var(--glass)', padding: '0.5rem', borderRadius: '12px' }}>{goal.icon}</div>
                            <div>
                                <p style={{ fontWeight: 800 }}>{goal.name}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Faltan: ${(goal.targetAmount - goal.currentAmount).toLocaleString()}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => handleEditGoal(goal)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteGoal(goal.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                    </div>
                ))}
                <button className="btn-secondary" style={{ borderStyle: 'dashed' }} onClick={() => setShowGoalModal(true)}>
                    <Plus size={20} /> Nueva Meta de Ahorro
                </button>
            </div>

            {/* Modal para Metas */}
            {showGoalModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                    <div className="premium-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Nueva Meta</h2>
                        <div className="form-group">
                            <label className="form-label">Nombre de la Meta</label>
                            <input type="text" className="form-input" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="Ej: Viaje a Japón" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Objetivo ($)</label>
                                <input type="number" className="form-input" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ahorrado ($)</label>
                                <input type="number" className="form-input" value={newGoal.current} onChange={e => setNewGoal({ ...newGoal, current: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowGoalModal(false)}>Cancelar</button>
                            <button className="btn-primary" style={{ flex: 2 }} onClick={handleAddGoal}>Crear Meta</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
