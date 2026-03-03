import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Bell, PieChart as PieIcon, Sparkles, ChevronRight, BarChart3, ChevronLeft, Calendar, LayoutGrid, AlertCircle, Clock } from 'lucide-react';
import { getAllExpenses, getAllScheduledExpenses } from '../lib/db';
import type { Expense, ScheduledExpense } from '../types';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { parseBankNotification } from '../lib/parser';
import { getBillingPeriodRange, formatPeriodName } from '../lib/periods';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CATEGORY_MAP: Record<string, { icon: string, color: string, name: string }> = {
    '1': { name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    '2': { name: 'Vivienda', icon: '🏠', color: '#3b82f6' },
    '3': { name: 'Transporte', icon: '🚗', color: '#10b981' },
    '4': { name: 'Ocio', icon: '🍿', color: '#f59e0b' },
    '5': { name: 'Salud', icon: '⚕️', color: '#ec4899' },
    '6': { name: 'Otros', icon: '📦', color: '#6366f1' },
    '7': { name: 'Pagos', icon: '💸', color: '#8b5cf6' },
};

const Dashboard: React.FC = () => {
    const { preferences, user } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Period state
    const [periodOffset, setPeriodOffset] = useState(0);
    const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>([]);
    const [comparisonData, setComparisonData] = useState<{ labels: string[], totals: number[] }>({ labels: [], totals: [] });
    const [periodRange, setPeriodRange] = useState({ start: 0, end: 0 });

    // Pending State
    const [pendingTotal, setPendingTotal] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const loadData = async () => {
        try {
            const expenses = await getAllExpenses();
            const scheduled = await getAllScheduledExpenses();

            // Pending summary
            setPendingCount(scheduled.length);
            setPendingTotal(scheduled.reduce((sum, i) => sum + i.amount, 0));

            const now = new Date();
            const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
            const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
            setPeriodRange(range);

            const monthExpenses = expenses.filter(e => e.date >= range.start && e.date <= range.end);
            setCurrentMonthExpenses(monthExpenses);

            // History chart
            const periodTotals: number[] = [];
            const labels: string[] = [];
            for (let i = 5; i >= 0; i--) {
                const pastRefDate = new Date(now.getFullYear(), now.getMonth() - i + periodOffset, now.getDate());
                const pastRange = getBillingPeriodRange(pastRefDate, preferences.billingCycleStartDay || 1);
                const total = expenses.filter(e => e.date >= pastRange.start && e.date <= pastRange.end).reduce((sum, e) => sum + e.amount, 0);
                periodTotals.push(total);
                labels.push(new Date(pastRange.start).toLocaleDateString('es-ES', { month: 'short' }));
            }
            setComparisonData({ labels, totals: periodTotals });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [periodOffset, preferences.billingCycleStartDay, preferences.currency]);

    const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetUsedPercent = (preferences.monthlyBudget || 0) > 0 ? (totalSpentThisMonth / preferences.monthlyBudget) * 100 : 0;

    const breakdownMap: Record<string, number> = {};
    currentMonthExpenses.forEach(exp => {
        breakdownMap[exp.categoryId] = (breakdownMap[exp.categoryId] || 0) + exp.amount;
    });

    const categoryBreakdown = Object.entries(breakdownMap).map(([id, amount]) => {
        const catInfo = CATEGORY_MAP[id] || { name: 'Otro', icon: '📦', color: '#6366f1' };
        return { name: catInfo.name, color: catInfo.color, total: amount, percent: totalSpentThisMonth > 0 ? (amount / totalSpentThisMonth) * 100 : 0 };
    }).sort((a, b) => b.total - a.total);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    const handleSmartPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const data = parseBankNotification(text);
            if (data && data.amount > 0) {
                navigate(`/add?amount=${data.amount}&merchant=${encodeURIComponent(data.merchant)}&source=notification`);
            } else { alert('No se detectó el monto.'); }
        } catch (err) { alert('Habilita el pegado.'); }
    };

    const pieData = {
        labels: categoryBreakdown.map(c => c.name),
        datasets: [{ data: categoryBreakdown.map(c => c.total), backgroundColor: categoryBreakdown.map(c => c.color), borderWidth: 0 }]
    };

    const barData = {
        labels: comparisonData.labels,
        datasets: [{
            label: 'Gastos',
            data: comparisonData.totals,
            backgroundColor: comparisonData.totals.map((v, i) => i === 5 ? 'var(--primary)' : 'rgba(99, 102, 241, 0.3)'),
            borderRadius: 8
        }]
    };

    if (loading) return <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=HogarSafe"} style={{ width: '45px', height: '45px', borderRadius: '15px', border: '2px solid var(--primary)' }} />
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800 }}>Día de Cierre: {preferences.billingCycleStartDay}</span>
                        <h1 style={{ fontSize: '1rem', fontWeight: 900 }}>{formatPeriodName(periodRange.start, periodRange.end)}</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)} className="btn-glass" style={{ padding: '0.4rem' }}><ChevronLeft size={18} /></button>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)} className="btn-glass" style={{ padding: '0.4rem' }}><ChevronRight size={18} /></button>
                </div>
            </header>

            {/* Smart Paste Bar */}
            <div className="premium-card clickable" onClick={handleSmartPaste} style={{ marginBottom: '1.2rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
                <Sparkles size={18} color="var(--primary)" />
                <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 800 }}>Pegado Mágico de Notificación</span>
                <ChevronRight size={14} color="var(--primary)" />
            </div>

            {/* Main Balance */}
            <div className="premium-card gradient-bg" style={{ padding: '2rem', color: 'white', marginBottom: '1.5rem', borderRadius: '25px' }}>
                <p style={{ opacity: 0.8, fontWeight: 700, fontSize: '0.85rem' }}>Gastado este Ciclo</p>
                <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '1rem' }}>{formatCurrency(totalSpentThisMonth)}</h2>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                    <div style={{ width: `${Math.min(budgetUsedPercent, 100)}%`, height: '100%', background: budgetUsedPercent > 90 ? '#ff6b6b' : 'white', borderRadius: '10px' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>
                    <span>Presupuesto: {formatCurrency(preferences.monthlyBudget)}</span>
                    <span>{Math.round(budgetUsedPercent)}%</span>
                </div>
            </div>

            {/* Pending Payments Widget */}
            {pendingCount > 0 && (
                <div className="premium-card clickable" onClick={() => navigate('/scheduled')} style={{ marginBottom: '1.5rem', border: '1px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)', padding: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ background: 'var(--warning)', padding: '0.5rem', borderRadius: '10px' }}><Clock size={18} color="black" /></div>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 900 }}>{pendingCount} Pagos Pendientes</h4>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total a pagar: {formatCurrency(pendingTotal)}</p>
                            </div>
                        </div>
                        <ChevronRight size={20} color="var(--warning)" />
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div style={{ display: 'grid', gap: '1.2rem', marginBottom: '2rem' }}>
                <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1.2rem' }}>Distribución de Gastos</h3>
                    {totalSpentThisMonth > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '110px' }}><Doughnut data={pieData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} /></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {categoryBreakdown.slice(0, 3).map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800 }}>
                                        <span>{c.name}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{Math.round(c.percent)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Sin datos aún</p>}
                </div>

                <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '1.2rem' }}>Comparativa de Períodos</h3>
                    <div style={{ height: '140px' }}><Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 10, weight: 800 } } } } }} /></div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Actividad del Ciclo</h3>
                <Link to="/history" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>Ver todo</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {currentMonthExpenses.slice(0, 4).map((exp, i) => {
                    const cat = CATEGORY_MAP[exp.categoryId] || { icon: '📦', color: '#6366f1' };
                    return (
                        <div key={exp.id || i} className="premium-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.1rem', padding: '0.4rem', background: 'var(--glass)', borderRadius: '10px' }}>{cat.icon}</div>
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>{exp.description}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p style={{ color: '#ff4d4d', fontWeight: 900, fontSize: '0.95rem' }}>- {formatCurrency(exp.amount)}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default Dashboard;
