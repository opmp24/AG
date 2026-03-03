import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowUpCircle, Bell, Plus, MoreHorizontal } from 'lucide-react';
import { getAllExpenses } from '../lib/db';
import type { Expense, DashboardStats } from '../types';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { preferences, user } = useApp();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const expenses = await getAllExpenses();

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

                const monthlyExpenses = expenses.filter(e => e.date >= startOfMonth);
                const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

                const balance = (preferences.monthlyBudget || 0) - totalSpent;

                setStats({
                    currentBalance: balance > 0 ? balance : 0,
                    totalSpentMonth: totalSpent,
                    totalSpentToday: expenses.filter(e => {
                        const d = new Date(e.date);
                        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).reduce((sum, e) => sum + e.amount, 0),
                    budgetUsedPercent: (preferences.monthlyBudget || 0) > 0 ? (totalSpent / (preferences.monthlyBudget || 1)) * 100 : 0,
                    categoryBreakdown: [],
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sincronizando tus finanzas...</p>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                        src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=HogarSafe"}
                        alt="Profile"
                        style={{ width: '45px', height: '45px', borderRadius: '15px', objectFit: 'cover', border: '2px solid rgba(99, 102, 241, 0.2)' }}
                    />
                    <div>
                        <h2 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hola, {user?.name.split(' ')[0]} 👋</h2>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Mi Billetera</h1>
                    </div>
                </div>
                <button className="premium-card" style={{ padding: '0.75rem', borderRadius: '16px', margin: 0, position: 'relative' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--card-dark)' }}></span>
                </button>
            </header>

            {/* Tarjeta Visual de Balance */}
            <div className="premium-card gradient-bg" style={{ padding: '2.5rem 1.75rem', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ opacity: 0.9, fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.5rem' }}>Gastado este mes ({new Date().toLocaleString('es-ES', { month: 'long' })})</p>
                    <h2 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0' }}>
                        {formatCurrency(stats?.totalSpentMonth || 0)}
                    </h2>

                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(stats?.budgetUsedPercent || 0, 100)}%`,
                                height: '100%',
                                background: (stats?.budgetUsedPercent || 0) > 90 ? '#fca5a5' : 'white',
                                transition: 'width 1s ease-out'
                            }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {Math.round(stats?.budgetUsedPercent || 0)}%
                        </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        Presupuesto: {formatCurrency(preferences.monthlyBudget || 0)}
                    </p>
                </div>
            </div>

            {/* Mini Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div className="premium-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={18} color="var(--success)" />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px' }}>Saldo</span>
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(stats?.currentBalance || 0)}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Disponible hoy</p>
                </div>
                <div className="premium-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} color="var(--warning)" />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 700, padding: '2px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px' }}>Hoy</span>
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(stats?.totalSpentToday || 0)}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Gasto diario</p>
                </div>
            </div>

            {/* Lista de Movimientos */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Actividad Reciente</h3>
                    <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Ver todo</Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stats?.recentExpenses.length === 0 ? (
                        <div className="premium-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', opacity: 0.8 }}>
                            <div style={{ width: '50px', height: '50px', background: 'var(--glass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <MoreHorizontal color="var(--text-secondary)" />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aún no has registrado gastos.</p>
                            <Link to="/add" className="gradient-text" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', display: 'block' }}>¡Comienza aquí!</Link>
                        </div>
                    ) : (
                        stats?.recentExpenses.map((expense, idx) => (
                            <div
                                key={expense.id || idx}
                                className="premium-card animate-fade-in"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem 1.25rem',
                                    animationDelay: `${idx * 0.1}s`
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        background: 'var(--glass)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem'
                                    }}>
                                        💳
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{expense.description}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1rem' }}>- {formatCurrency(expense.amount)}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
