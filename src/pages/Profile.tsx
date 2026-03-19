import React, { useState } from 'react';
import { Settings, LogOut, ChevronLeft, Moon, Sun, Palette, Globe, Calendar, DollarSign, Download, Upload, Trash2, Wand2, ShieldCheck, CreditCard, Landmark, CheckCircle2, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { exportData, importData, exportToCSV, clearAllData } from '../lib/db';
import { parseBulkMovements } from '../lib/parser';

const THEMES = [
    { id: 'dark', name: 'Noche', icon: Moon, color: '#111827' },
    { id: 'light', name: 'Día', icon: Sun, color: '#f9fafb' },
    { id: 'nature', name: 'Jungla', icon: Palette, color: '#064e3b' },
    { id: 'ocean', name: 'Océano', icon: Palette, color: '#0c4a6e' },
    { id: 'sunset', name: 'Ocaso', icon: Palette, color: '#701a1a' },
];

const CURRENCIES = ['CLP', 'USD', 'EUR', 'ARS', 'MXN', 'COP'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, preferences, updatePreferences, logout, login } = useApp();
    const [pastedText, setPastedText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState<{ count: number, total: number } | null>(null);

    const handleThemeChange = (theme: string) => {
        updatePreferences({ theme: theme as any });
    };

    const handleBulkImport = async () => {
        if (!pastedText.trim()) return;
        setImporting(true);
        try {
            const expenses = parseBulkMovements(pastedText);
            let total = 0;
            const links = expenses.map(e => ({ description: e.description, amount: e.amount }));
            for (const exp of expenses) {
                total += exp.amount;
            }
            setImportLinks(links);
            setImportStats({ count: expenses.length, total });
        } catch (err) {
            console.error(err);
        } finally {
            setImporting(false);
        }
    };

    const [importLinks, setImportLinks] = useState<any[]>([]);

    const handleExport = async () => {
        const data = await exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gastop-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const handleCSVExport = async () => {
        const csv = await exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gastos-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (await importData(content)) {
                alert('¡Datos importados con éxito!');
                window.location.reload();
            } else {
                alert('Error al importar. El archivo puede estar corrupto.');
            }
        };
        reader.readAsText(file);
    };

    const handleReset = async () => {
        if (window.confirm('¡ATENCIÓN! Se borrarán TODOS tus gastos, categorías y metas permanentemente. ¿Estás seguro?')) {
            await clearAllData();
            window.location.reload();
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.25rem', maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} className="btn-glass" style={{ padding: '0.6rem' }}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900 }}>Ajustes</h1>
            </header>

            {/* Profile Info */}
            <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <img
                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Gastop"}
                    alt="avatar"
                    style={{ width: '64px', height: '64px', borderRadius: '20px', border: '3px solid var(--primary)' }}
                />
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>{user?.name || 'Usuario Local'}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{user?.email || 'Datos guardados localmente'}</p>
                </div>
                <button onClick={logout} className="btn-glass" style={{ color: 'var(--danger)', padding: '0.7rem' }}>
                    <LogOut size={20} />
                </button>
            </div>

            {/* Main Settings Group */}
            <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Theme Selector */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Palette size={16} color="var(--primary)"/>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Estilo Visual</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                        {THEMES.map(t => (
                            <button
                                key={t.id} onClick={() => handleThemeChange(t.id)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.6rem 0', borderRadius: '12px',
                                    border: preferences.theme === t.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                    background: preferences.theme === t.id ? 'var(--primary)15' : 'var(--glass)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, color: preferences.theme === t.id ? 'var(--primary)' : 'var(--text-secondary)' }}>{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Billing & Currency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><Calendar size={14} /> Ciclo Mensual</label>
                        <select
                            className="form-input"
                            value={preferences.billingCycleStartDay}
                            onChange={(e) => updatePreferences({ billingCycleStartDay: Number(e.target.value) })}
                        >
                            {[...Array(28)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>Día {i + 1}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label"><DollarSign size={14} /> Moneda</label>
                        <select
                            className="form-input"
                            value={preferences.currency}
                            onChange={(e) => updatePreferences({ currency: e.target.value })}
                        >
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label"><Target size={14} /> Presupuesto Mensual Sugerido</label>
                    <input
                        type="number" className="form-input"
                        value={preferences.monthlyBudget || ''}
                        onChange={(e) => updatePreferences({ monthlyBudget: Number(e.target.value) })}
                        placeholder="Ej: 800000"
                    />
                </div>
            </div>

            {/* AI Assistant Reader */}
            <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--primary)', background: 'var(--primary)05' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '8px' }}>
                        <Wand2 size={16} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 900 }}>Smart Bank Reader</h3>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pega tu cartola bancaria para importar masivamente</p>
                    </div>
                </div>
                <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Pega aquí el texto de tus movimientos bancarios..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{ fontSize: '0.75rem', marginBottom: '0.8rem', background: 'rgba(0,0,0,0.1)' }}
                />
                <button
                    onClick={handleBulkImport}
                    disabled={importing || !pastedText.trim()}
                    className="btn-primary"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                >
                    {importing ? 'Analizando...' : <><Wand2 size={16} /> Analizar Movimientos</>}
                </button>

                {importStats && (
                    <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--primary)15', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <CheckCircle2 size={16} color="var(--primary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>¡{importStats.count} movimientos detectados!</span>
                        </div>
                        <p style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>Total analizado: <strong>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: preferences.currency }).format(importStats.total)}</strong></p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {importLinks.slice(0, 5).map((l, i) => (
                                <span key={i} style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--glass)', borderRadius: '4px' }}>
                                    {l.description}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Backup & Data */}
            <div className="premium-card" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                    <ShieldCheck size={16} color="var(--success)"/>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Seguridad y Datos</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button onClick={handleExport} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
                        <Download size={14} /> Respaldar JSON
                    </button>
                    <button onClick={handleCSVExport} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
                        <CreditCard size={14} /> Exportar Excel
                    </button>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                    <label className="btn-secondary" style={{ cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}>
                        <Upload size={14} /> Importar Respaldo
                        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                </div>

                <button onClick={handleReset} className="btn-danger" style={{ marginTop: '1.5rem', borderRadius: '12px', padding: '0.8rem', fontSize: '0.75rem' }}>
                    <Trash2 size={14} /> Borrar todos los datos
                </button>
            </div>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>
                Gastop v2.0 - Almacenamiento Local Cifrado (AES-GCM)
            </p>
        </div>
    );
};

export default Profile;
