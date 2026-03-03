import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Bell, PieChart as PieIcon, Sparkles, ChevronRight, BarChart3, ChevronLeft, Calendar, LayoutGrid } from 'lucide-react';
import { getAllExpenses } from '../lib/db';
import type { Expense } from '../types';
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
};

const Dashboard: React.FC = () => {
    const { preferences, user } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Period state (now using offset of periods)
    const [periodOffset, setPeriodOffset] = useState(0);
    const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [comparisonData, setComparisonData] = useState<{ labels: string[], totals: number[] }>({ labels: [], totals: [] });
    const [periodRange, setPeriodRange] = useState({ start: 0, end: 0 });

    const loadData = async () => {
        try {
            const expenses = await getAllExpenses();
            setAllExpenses(expenses);

            // Calcular el rango del período basado en el offset y el día de inicio
            const now = new Date();
            const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
            const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
            setPeriodRange(range);

            const monthExpenses = expenses.filter(e => e.date >= range.start && e.date <= range.end);
            setCurrentMonthExpenses(monthExpenses);

            // Comparación de los últimos 6 períodos de facturación
            const periodTotals: number[] = [];
            const labels: string[] = [];

            for (let i = 5; i >= 0; i--) {
                const pastRefDate = new Date(now.getFullYear(), now.getMonth() - i + periodOffset, now.getDate());
                const pastRange = getBillingPeriodRange(pastRefDate, preferences.billingCycleStartDay || 1);

                const total = expenses
                    .filter(e => e.date >= pastRange.start && e.date <= pastRange.end)
                    .reduce((sum, e) => sum + e.amount, 0);

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
        return {
            name: catInfo.name,
            color: catInfo.color,
            total: amount,
            percent: totalSpentThisMonth > 0 ? (amount / totalSpentThisMonth) * 100 : 0
        };
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
            if (!text) return alert('¡Copia la notificación primero!');
            const data = parseBankNotification(text);
            if (data && data.amount > 0) {
                navigate(`/add?amount=${data.amount}&merchant=${encodeURIComponent(data.merchant)}&source=notification`);
            } else {
                alert('No se detectó el monto. Copia el mensaje completo del banco.');
            }
        } catch (err) { alert('Habilita el permiso de pegado en tu navegador.'); }
    };

    const pieData = {
        labels: categoryBreakdown.map(c => c.name),
        datasets: [{
            data: categoryBreakdown.map(c => c.total),
            backgroundColor: categoryBreakdown.map(c => c.color),
            borderWidth: 0, hoverOffset: 4
        }]
    };

    const barData = {
        labels: comparisonData.labels,
        datasets: [{
            label: 'Gastos',
            data: comparisonData.totals,
            backgroundColor: comparisonData.totals.map((v, i) => i === 5 ? 'var(--primary)' : 'rgba(99, 102, 241, 0.3)'),
            borderRadius: 8,
            borderSkipped: false,
        }]
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header con Ciclo de Facturación */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=HogarSafe"} style={{ width: '45px', height: '45px', borderRadius: '15px', border: '2px solid var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cierre el día {preferences.billingCycleStartDay}</span>
                        <h1 style={{ fontSize: '1rem', fontWeight: 900 }}>{formatPeriodName(periodRange.start, periodRange.end)}</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)} style={{ background: 'var(--glass)', border: 'none', padding: '0.5rem', borderRadius: '10px', color: 'white' }}><ChevronLeft size={20} /></button>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)} style={{ background: 'var(--glass)', border: 'none', padding: '0.5rem', borderRadius: '10px', color: 'white' }}><ChevronRight size={20} /></button>
                </div>
            </header>

            {/* Smart Magic Bar */}
            <div className="premium-card clickable" onClick={handleSmartPaste} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
                <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '10px' }}><Sparkles size={18} color="white" /></div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800 }}>Detección de Portapapeles</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Haz pegado mágico de un gasto copiado</p>
                </div>
                <ChevronRight size={16} color="var(--primary)" />
            </div>

            {/* Balance Card */}
            <div className="premium-card gradient-bg" style={{ borderRadius: '25px', padding: '2rem', color: 'white', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ opacity: 0.8, fontWeight: 600 }}>Gasto en este Período</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{formatCurrency(totalSpentThisMonth)}</h2>
                    <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', height: '8px', borderRadius: '10px' }}>
                        <div style={{ width: `${Math.min(budgetUsedPercent, 100)}%`, height: '100%', background: budgetUsedPercent > 90 ? '#ff6b6b' : 'white', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>Límite: {formatCurrency(preferences.monthlyBudget)}</span>
                        <span>{Math.round(budgetUsedPercent)}%</span>
                    </div>
                </div>
            </div>

            {/* Dos Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* 1. Distribución Categorías */}
                <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><PieIcon size={18} color="var(--primary)" /> Gastos por Categoría</h3>
                    {totalSpentThisMonth === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin gastos registrados en el ciclo</p>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '130px', height: '130px' }}>
                                <Doughnut data={pieData} options={{ cutout: '65%', plugins: { legend: { display: false } } }} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {categoryBreakdown.slice(0, 4).map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.color }}></div>
                                            <span>{c.name}</span>
                                        </div>
                                        <span style={{ color: 'var(--text-secondary)' }}>{Math.round(c.percent)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Comparativo de Períodos */}
                <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><BarChart3 size={18} color="var(--primary)" /> Comparativa de Ciclos</h3>
                    <div style={{ height: '170px' }}>
                        <Bar
                            data={barData}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { display: false },
                                    x: { grid: { display: false }, ticks: { font: { size: 11, weight: 800 }, color: 'var(--text-secondary)' } }
                                }
                            }}
                        />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', fontWeight: 600 }}>Gasto histórico por períodos de facturación</p>
                </div>
            </div>

            {/* Recientes */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Actividad del Ciclo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {currentMonthExpenses.slice(0, 5).map((exp, i) => {
                    const cat = CATEGORY_MAP[exp.categoryId] || { icon: '📦', color: '#6366f1' };
                    return (
                        <div key={exp.id || i} className="premium-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.2rem', padding: '0.5rem', background: 'var(--glass)', borderRadius: '12px' }}>{cat.icon}</div>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{exp.description}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p style={{ color: '#ff6b6b', fontWeight: 900 }}>- {formatCurrency(exp.amount)}</p>
                        </div>
                    )
                })}
                <Link to="/history" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, marginTop: '1rem' }}>Ver Historial Detallado</Link>
            </div>
        </div>
    );
};

export default Dashboard;
