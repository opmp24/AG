import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Bell, MoreHorizontal, User as UserIcon, PieChart as PieIcon } from 'lucide-react';
import { getAllExpenses } from '../lib/db';
import type { Expense, DashboardStats } from '../types';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_MAP: Record<string, { icon: string, color: string, name: string }> = {
    '1': { name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    '2': { name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    '3': { name: 'Transporte', icon: '🚗', color: '#10b981' },
    '4': { name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    '5': { name: 'Salud', icon: '⚕️', color: '#ec4899' },
    '6': { name: 'Otros', icon: '📦', color: '#6366f1' },
};

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

                // Agrupar por categoría
                const breakdownMap: Record<string, number> = {};
                monthlyExpenses.forEach(exp => {
                    breakdownMap[exp.categoryId] = (breakdownMap[exp.categoryId] || 0) + exp.amount;
                });

                const categoryBreakdown = Object.entries(breakdownMap).map(([id, amount]) => {
                    const catInfo = CATEGORY_MAP[id] || CATEGORY_MAP['6'];
                    return {
                        categoryId: id,
                        categoryName: catInfo.name,
                        categoryColor: catInfo.color,
                        categoryIcon: catInfo.icon,
                        total: amount,
                        percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                    };
                }).sort((a, b) => b.total - a.total);

                const balance = (preferences.monthlyBudget || 0) - totalSpent;

                setStats({
                    currentBalance: balance > 0 ? balance : 0,
                    totalSpentMonth: totalSpent,
                    totalSpentToday: expenses.filter(e => {
                        const d = new Date(e.date);
                        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).reduce((sum, e) => sum + e.amount, 0),
                    budgetUsedPercent: (preferences.monthlyBudget || 0) > 0 ? (totalSpent / (preferences.monthlyBudget || 1)) * 100 : 0,
                    categoryBreakdown,
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
    }, [preferences.monthlyBudget, preferences.currency]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    const chartData = {
        labels: stats?.categoryBreakdown.map(c => c.categoryName) || [],
        datasets: [{
            data: stats?.categoryBreakdown.map(c => c.total) || [],
            backgroundColor: stats?.categoryBreakdown.map(c => c.categoryColor) || [],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.1rem' }}>Cargando finanzas...</p>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=HogarSafe"}
                            alt="Profile"
                            style={{ width: '50px', height: '50px', borderRadius: '18px', objectFit: 'cover', border: '2px solid var(--primary)' }}
                        />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cerrar sesión en ajustes</h2>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Hola, {user?.name.split(' ')[0]}</h1>
                        <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>VERSION 1.3.0-CHART</p>
                    </div>
                </div>
                <button className="premium-card interactive-card" style={{ padding: '0.8rem', borderRadius: '18px', margin: 0 }}>
                    <Bell size={22} color="white" />
                </button>
            </header>

            {/* Resumen de Balance */}
            <div className="premium-card gradient-bg" style={{ padding: '2.5rem 2rem', color: 'white', position: 'relative', overflow: 'hidden', marginBottom: '2rem', borderRadius: '30px' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ opacity: 0.9, fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Gasto Mensual</p>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', margin: '0' }}>{formatCurrency(stats?.totalSpentMonth || 0)}</h2>

                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min(stats?.budgetUsedPercent || 0, 100)}%`,
                                height: '100%',
                                background: (stats?.budgetUsedPercent || 0) > 90 ? '#ff4d4d' : 'white',
                                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}></div>
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 900 }}>{Math.round(stats?.budgetUsedPercent || 0)}%</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.8rem' }}>Presupuesto: {formatCurrency(preferences.monthlyBudget || 0)}</p>
                </div>
            </div>

            {/* Dos tarjetas de Mini Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2.5rem' }}>
                <div className="premium-card" style={{ padding: '1.2rem', borderBottom: '3px solid var(--success)' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                        <Wallet size={18} color="var(--success)" />
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(stats?.currentBalance || 0)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo Restante</p>
                </div>
                <div className="premium-card" style={{ padding: '1.2rem', borderBottom: '3px solid var(--warning)' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                        <TrendingUp size={18} color="var(--warning)" />
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(stats?.totalSpentToday || 0)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Gasto de Hoy</p>
                </div>
            </div>

            {/* Gráfico de Distribución */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Distribución</h3>
                    <PieIcon size={20} color="var(--primary)" />
                </div>

                <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {stats?.totalSpentMonth === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No hay gastos este mes para graficar.</p>
                    ) : (
                        <div style={{ width: '220px', height: '220px' }}>
                            <Doughnut
                                data={chartData}
                                options={{
                                    cutout: '70%',
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {stats?.categoryBreakdown.map((cat, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: cat.categoryColor }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.categoryName}</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{formatCurrency(cat.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recientes */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Actividad Reciente</h3>
                    <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>Ver todo</Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {stats?.recentExpenses.map((exp, idx) => {
                        const cat = CATEGORY_MAP[exp.categoryId] || CATEGORY_MAP['6'];
                        return (
                            <div key={exp.id || idx} className="premium-card animate-fade-in" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.description}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{new Date(exp.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 800, color: '#ff6b6b' }}>- {formatCurrency(exp.amount)}</p>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
