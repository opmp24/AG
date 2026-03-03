import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowUpCircle, Bell, Plus, MoreHorizontal, User as UserIcon } from 'lucide-react';
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
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.1rem' }}>Cifrando tu información...</p>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=HogarSafe"}
                            alt="Profile"
                            style={{ width: '55px', height: '55px', borderRadius: '20px', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                        />
                        {user && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: 'var(--success)', borderRadius: '50%', border: '2px solid var(--card-dark)' }}></div>}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Hola, <span style={{ color: 'white', fontWeight: 800 }}>{user?.name.split(' ')[0]}</span> 👋</h2>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Mi Billetera</h1>
                        <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.8 }}>VERSION 1.2.0-PATCH</p>
                    </div>
                </div>
                <button className="premium-card interactive-card" style={{ padding: '0.9rem', borderRadius: '20px', margin: 0, position: 'relative', background: 'rgba(255, 255, 255, 0.08)', border: '2px solid var(--glass-border)' }}>
                    <Bell size={24} color="white" />
                    <span style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--card-dark)' }}></span>
                </button>
            </header>

            {/* Tarjeta Visual de Balance */}
            <div className="premium-card gradient-bg" style={{ padding: '2.8rem 2rem', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '2.5rem', borderRadius: '32px' }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ opacity: 0.9, fontSize: '1rem', fontWeight: 600, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} /> Gasto de {new Date().toLocaleString('es-ES', { month: 'long' })}
                    </p>
                    <h2 style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        {formatCurrency(stats?.totalSpentMonth || 0)}
                    </h2>

                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(stats?.budgetUsedPercent || 0, 100)}%`,
                                height: '100%',
                                background: (stats?.budgetUsedPercent || 0) > 90 ? '#ff6b6b' : '#34d399',
                                transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                            }}></div>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                            {Math.round(stats?.budgetUsedPercent || 0)}%
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>
                        <span>Límite Mensual</span>
                        <span>{formatCurrency(preferences.monthlyBudget || 0)}</span>
                    </div>
                </div>
            </div>

            {/* Mini Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.8rem' }}>
                <div className="premium-card" style={{ padding: '1.5rem', borderBottom: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <div style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={22} color="var(--success)" />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 800, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Saldo</span>
                    </div>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900 }}>{formatCurrency(stats?.currentBalance || 0)}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 600 }}>Disponible hoy</p>
                </div>
                <div className="premium-card" style={{ padding: '1.5rem', borderBottom: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <div style={{ width: '42px', height: '42px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={22} color="var(--warning)" />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 800, padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Hoy</span>
                    </div>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900 }}>{formatCurrency(stats?.totalSpentToday || 0)}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 600 }}>Gastado</p>
                </div>
            </div>

            {/* Lista de Movimientos */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Últimos Movimientos</h3>
                    <Link to="/history" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>Ver Historial</Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {stats?.recentExpenses.length === 0 ? (
                        <div className="premium-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ width: '60px', height: '60px', background: 'var(--glass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Plus color="var(--text-secondary)" size={30} />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Tu historial está vacío.</p>
                            <Link to="/add" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', padding: '0.8rem 1.5rem' }}>
                                Registrar Gasto
                            </Link>
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
                                    padding: '1.2rem 1.5rem',
                                    animationDelay: `${idx * 0.1}s`,
                                    background: 'rgba(255, 255, 255, 0.04)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.4rem',
                                        boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                                    }}>
                                        💳
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '1rem' }}>{expense.description}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, color: '#ff6b6b', fontSize: '1.15rem' }}>- {formatCurrency(expense.amount)}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Confirmado</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
