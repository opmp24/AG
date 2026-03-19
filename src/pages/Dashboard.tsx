import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, ChevronLeft, Clock, AlertTriangle, Eye, EyeOff, Zap } from 'lucide-react';
import { getAllExpenses, getAllScheduledExpenses, getCategories, getAllSavingGoals } from '../lib/db';
import type { Expense, Category, SavingGoal } from '../types';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { getBillingPeriodRange, formatPeriodName } from '../lib/periods';

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444', createdAt: 0 },
    { id: '2', name: 'Vivienda', icon: '🏠', color: '#3b82f6', createdAt: 0 },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#10b981', createdAt: 0 },
    { id: '4', name: 'Ocio', icon: '🍿', color: '#f59e0b', createdAt: 0 },
    { id: '5', name: 'Salud', icon: '⚕️', color: '#ec4899', createdAt: 0 },
    { id: '6', name: 'Otros', icon: '📦', color: '#6366f1', createdAt: 0 },
    { id: '7', name: 'Pagos', icon: '💸', color: '#8b5cf6', createdAt: 0 },
];

const Dashboard: React.FC = () => {
    const { preferences, user } = useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showBalance, setShowBalance] = useState(true);

    // Data state
    const [periodOffset, setPeriodOffset] = useState(0);
    const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>([]);
    const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
    const [periodRange, setPeriodRange] = useState({ start: 0, end: 0 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);

    const loadData = async () => {
        try {
            const [expenses, scheduled, cats, goals] = await Promise.all([
                getAllExpenses(),
                getAllScheduledExpenses(),
                getCategories(),
                getAllSavingGoals()
            ]);

            setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
            setSavingGoals(goals);
            setPendingCount(scheduled.length);
            setPendingTotal(scheduled.reduce((sum, i) => sum + i.amount, 0));

            const now = new Date();
            const referenceDate = new Date(now.getFullYear(), now.getMonth() + periodOffset, now.getDate());
            const range = getBillingPeriodRange(referenceDate, preferences.billingCycleStartDay || 1);
            setPeriodRange(range);

            const monthExpenses = expenses.filter(e => e.date >= range.start && e.date <= range.end);
            setCurrentMonthExpenses(monthExpenses);

            // Today's expenses
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            setTodayExpenses(
                expenses.filter(e => e.date >= todayStart.getTime() && e.date <= todayEnd.getTime())
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [periodOffset, preferences.billingCycleStartDay, preferences.currency]);

    // Calculations
    const totalSpentThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalToday = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = preferences.monthlyBudget || 0;
    const available = Math.max(0, budget - totalSpentThisMonth - pendingTotal);
    const budgetUsedPercent = budget > 0 ? (totalSpentThisMonth / budget) * 100 : 0;
    const isOverBudget = budget > 0 && (totalSpentThisMonth + pendingTotal) > budget;
    const isNearLimit = !isOverBudget && budget > 0 && budgetUsedPercent >= (preferences.budgetAlertThreshold || 80);

    // Category breakdown (top categories)
    const breakdownMap: Record<string, number> = {};
    currentMonthExpenses.forEach(exp => {
        breakdownMap[exp.categoryId] = (breakdownMap[exp.categoryId] || 0) + exp.amount;
    });

    const categoryBreakdown = Object.entries(breakdownMap)
        .map(([id, amount]) => {
            const catInfo = categories.find(c => c.id === id) || { name: 'Otro', icon: '📦', color: '#6366f1', monthlyLimit: undefined };
            return {
                id,
                name: catInfo.name,
                color: catInfo.color,
                icon: catInfo.icon,
                total: amount,
                limit: (catInfo as any).monthlyLimit,
                isLimitActive: (catInfo as any).isLimitActive !== false,
                percent: totalSpentThisMonth > 0 ? (amount / totalSpentThisMonth) * 100 : 0
            };
        })
        .sort((a, b) => b.total - a.total);

    // Overspent categories
    const overspentCategories = categoryBreakdown.filter(c => c.limit && c.isLimitActive && c.total > c.limit);

    // Recent expenses (last 5)
    const recentExpenses = currentMonthExpenses.slice(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: preferences.currency,
            maximumFractionDigits: preferences.currency === 'CLP' ? 0 : 2
        }).format(amount);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const formatShortDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>

            {/* === HEADER === */}
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                        src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Gastop"}
                        alt="avatar"
                        style={{ width: '42px', height: '42px', borderRadius: '14px', border: '2px solid var(--primary)' }}
                    />
                    <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            Hola, {user?.name?.split(' ')[0] || 'Usuario'} 👋
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                            {formatPeriodName(periodRange.start, periodRange.end)}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => setPeriodOffset(periodOffset - 1)} className="btn-glass" style={{ padding: '0.4rem' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPeriodOffset(periodOffset + 1)} className="btn-glass" style={{ padding: '0.4rem' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </header>

            {/* === CRITICAL ALERT === */}
            {isOverBudget && (
                <div className="animate-fade-in" style={{
                    marginBottom: '1rem', padding: '1rem', borderRadius: 'var(--border-radius-md)',
                    background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>Presupuesto excedido</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Superaste tu límite por {formatCurrency(totalSpentThisMonth + pendingTotal - budget)}
                        </p>
                    </div>
                </div>
            )}

            {isNearLimit && (
                <div className="animate-fade-in" style={{
                    marginBottom: '1rem', padding: '1rem', borderRadius: 'var(--border-radius-md)',
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                        Has usado el {Math.round(budgetUsedPercent)}% de tu presupuesto
                    </p>
                </div>
            )}

            {/* === MAIN BALANCE CARD === */}
            <div className={`today-banner ${isOverBudget ? 'over-budget' : ''}`} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Gastado este ciclo
                        </p>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1, marginTop: '0.2rem' }}>
                            {showBalance ? formatCurrency(totalSpentThisMonth) : '••••••'}
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowBalance(!showBalance)}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '0.5rem', color: 'white', cursor: 'pointer' }}
                    >
                        {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Progress Bar */}
                {budget > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div className="progress-bar-bg" style={{ height: '6px', background: 'rgba(255,255,255,0.15)' }}>
                            <div className="progress-bar-fill" style={{
                                width: `${Math.min(budgetUsedPercent, 100)}%`,
                                background: budgetUsedPercent > 90 ? '#fbbf24' : 'white'
                            }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.65rem', fontWeight: 700, opacity: 0.8 }}>
                            <span>Presupuesto: {showBalance ? formatCurrency(budget) : '••••'}</span>
                            <span>{Math.round(budgetUsedPercent)}%</span>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: pendingCount > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.6rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.7rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.15rem' }}>HOY</p>
                        <p style={{ fontSize: '1rem', fontWeight: 900 }}>{showBalance ? formatCurrency(totalToday) : '••••'}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.7rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.15rem' }}>DISPONIBLE</p>
                        <p style={{ fontSize: '1rem', fontWeight: 900, color: available > 0 ? '#a7f3d0' : '#fca5a5' }}>
                            {showBalance ? formatCurrency(available) : '••••'}
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <div
                            onClick={() => navigate('/scheduled')}
                            style={{ background: 'rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '0.7rem', textAlign: 'center', cursor: 'pointer' }}
                        >
                            <p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.15rem' }}>PENDIENTES</p>
                            <p style={{ fontSize: '1rem', fontWeight: 900, color: '#fcd34d' }}>
                                {showBalance ? formatCurrency(pendingTotal) : '••••'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* === TODAY'S EXPENSES === */}
            {todayExpenses.length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>📅 Gastos de Hoy</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {todayExpenses.length} {todayExpenses.length === 1 ? 'gasto' : 'gastos'}
                        </span>
                    </div>
                    <div>
                        {todayExpenses.slice(0, 4).map(exp => {
                            const cat = categories.find(c => c.id === exp.categoryId) || { icon: '📦', color: '#6366f1', name: 'Otro' };
                            return (
                                <div key={exp.id} className="expense-item" onClick={() => navigate(`/edit/${exp.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="expense-icon-wrap" style={{ background: cat.color + '18' }}>
                                        {cat.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="truncate" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{exp.description}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatTime(exp.date)}</p>
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ef4444', flexShrink: 0 }}>
                                        -{showBalance ? formatCurrency(exp.amount) : '••••'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === CATEGORY BREAKDOWN === */}
            {categoryBreakdown.length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>📊 ¿En qué gastas más?</h3>
                        <Link to="/history" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>
                            Ver todo →
                        </Link>
                    </div>

                    {/* Top categories with visual bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {categoryBreakdown.slice(0, 5).map((cat, idx) => (
                            <div key={cat.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{cat.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                                            {showBalance ? formatCurrency(cat.total) : '••••'}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                                            {Math.round(cat.percent)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="progress-bar-bg" style={{ height: '4px' }}>
                                    <div className="progress-bar-fill" style={{
                                        width: `${cat.percent}%`,
                                        background: cat.color
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === MICRO-BUDGET ALERTS (only overspent) === */}
            {overspentCategories.length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.8rem', color: '#ef4444' }}>
                        ⚠️ Sobrepasaste límites
                    </h3>
                    {overspentCategories.map(c => {
                        const overAmount = c.total - c.limit!;
                        const percent = Math.min((c.total / c.limit!) * 100, 100);
                        return (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
                                <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.name}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>+{formatCurrency(overAmount)}</span>
                                    </div>
                                    <div className="progress-bar-bg" style={{ height: '4px', marginTop: '0.3rem' }}>
                                        <div className="progress-bar-fill" style={{ width: `${percent}%`, background: '#ef4444' }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Link to="/categories" style={{
                        display: 'block', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800,
                        color: 'var(--primary)', marginTop: '0.5rem', textDecoration: 'none'
                    }}>
                        Gestionar Micro-presupuestos →
                    </Link>
                </div>
            )}

            {/* === ACTIVE MICRO-BUDGETS PREVIEW === */}
            {categoryBreakdown.filter(c => c.limit && c.isLimitActive && c.total <= c.limit).length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>💰 Micro-presupuestos</h3>
                        <Link to="/categories" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>
                            Gestionar →
                        </Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        {categoryBreakdown.filter(c => c.limit && c.isLimitActive && c.total <= c.limit).slice(0, 3).map(c => {
                            const percent = (c.total / c.limit!) * 100;
                            return (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                    <span style={{ fontSize: '1rem' }}>{c.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.name}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                {showBalance ? `${formatCurrency(c.total)} / ${formatCurrency(c.limit!)}` : '••••'}
                                            </span>
                                        </div>
                                        <div className="progress-bar-bg" style={{ height: '4px' }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${percent}%`,
                                                background: percent > 80 ? '#f59e0b' : c.color
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === SAVING GOALS PREVIEW === */}
            {savingGoals.length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>🎯 Metas de Ahorro</h3>
                        <Link to="/metas" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>
                            Ver todas →
                        </Link>
                    </div>
                    {savingGoals.slice(0, 2).map(goal => {
                        const goalPercent = (goal.currentAmount / goal.targetAmount) * 100;
                        return (
                            <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.4rem 0' }}>
                                <span style={{ fontSize: '1.1rem' }}>{goal.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{goal.name}</span>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--success)' }}>
                                            {Math.round(goalPercent)}%
                                        </span>
                                    </div>
                                    <div className="progress-bar-bg" style={{ height: '4px' }}>
                                        <div className="progress-bar-fill" style={{
                                            width: `${Math.min(goalPercent, 100)}%`,
                                            background: goal.color
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* === RECENT ACTIVITY === */}
            {recentExpenses.length > 0 && (
                <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>🕒 Últimos Gastos</h3>
                        <Link to="/history" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>
                            Historial →
                        </Link>
                    </div>
                    <div>
                        {recentExpenses.map(exp => {
                            const cat = categories.find(c => c.id === exp.categoryId) || { icon: '📦', color: '#6366f1', name: 'Otro' };
                            return (
                                <div key={exp.id} className="expense-item" onClick={() => navigate(`/edit/${exp.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="expense-icon-wrap" style={{ background: cat.color + '18' }}>
                                        {cat.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="truncate" style={{ fontWeight: 700, fontSize: '0.8rem' }}>{exp.description}</p>
                                        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {formatShortDate(exp.date)}
                                        </p>
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ef4444', flexShrink: 0 }}>
                                        -{showBalance ? formatCurrency(exp.amount) : '••••'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* === EMPTY STATE === */}
            {currentMonthExpenses.length === 0 && !loading && (
                <div className="premium-card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sin gastos este ciclo</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Empieza a registrar tus gastos para tener visibilidad de tus finanzas
                    </p>
                    <Link to="/add" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                        <Zap size={18} /> Registrar primer gasto
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
