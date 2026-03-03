import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowUpCircle, Bell } from 'lucide-react';
import { getAllExpenses } from '../lib/db';
import type { Expense, DashboardStats } from '../types';
import { useApp } from '../context/AppContext';

const Dashboard: React.FC = () => {
    const { preferences } = useApp();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const expenses = await getAllExpenses();

                // Calcular estadísticas del mes actual
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

                const monthlyExpenses = expenses.filter(e => e.date >= startOfMonth);
                const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

                // Simulación de balance basado en presupuesto
                const balance = preferences.monthlyBudget - totalSpent;

                setStats({
                    currentBalance: balance > 0 ? balance : 0,
                    totalSpentMonth: totalSpent,
                    totalSpentToday: expenses.filter(e => {
                        const d = new Date(e.date);
                        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
                    }).reduce((sum, e) => sum + e.amount, 0),
                    budgetUsedPercent: preferences.monthlyBudget > 0 ? (totalSpent / preferences.monthlyBudget) * 100 : 0,
                    categoryBreakdown: [], // Se llenaría con lógica de agregación
                    recentExpenses: expenses.slice(0, 5),
                    dailyTrend: []
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [preferences.monthlyBudget]);

    if (loading) return <div style={{ padding: '2rem' }}>Cargando datos seguros...</div>;

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hola, bienvenido</h2>
                    <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Mi HogarSafe</h1>
                </div>
                <button className="premium-card" style={{ padding: '0.8rem', borderRadius: '15px' }}>
                    <Bell size={20} />
                </button>
            </header>

            {/* Tarjeta de Balance Principal */}
            <div className="premium-card gradient-bg" style={{ padding: '2rem', color: 'white' }}>
                <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>Gastado este mes</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
                    {preferences.currency} {stats?.totalSpentMonth.toLocaleString()}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                        <Wallet size={14} style={{ marginRight: '5px' }} />
                        Presupuesto: {preferences.monthlyBudget}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="premium-card">
                    <TrendingUp size={20} color="var(--success)" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Hoy</p>
                    <p style={{ fontWeight: 700 }}>{preferences.currency} {stats?.totalSpentToday}</p>
                </div>
                <div className="premium-card">
                    <ArrowUpCircle size={20} color="var(--warning)" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Presupuesto</p>
                    <p style={{ fontWeight: 700 }}>{stats?.budgetUsedPercent.toFixed(1)}%</p>
                </div>
            </div>

            <section>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Movimientos Recientes</h3>
                {stats?.recentExpenses.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay gastos registrados aún.</p>
                ) : (
                    stats?.recentExpenses.map(expense => (
                        <div key={expense.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--glass)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                                    💳
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{expense.description}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p style={{ fontWeight: 700, color: 'var(--danger)' }}>- {expense.amount}</p>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};

export default Dashboard;
