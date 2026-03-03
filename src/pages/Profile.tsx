import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Download, Upload, CreditCard, CheckCircle2, User as UserIcon, Lock, Database, Globe, Smartphone, Heart, Wand2, Plus, Calendar, Save, FileText, AlertCircle, ShoppingCart, TrendingDown, ChevronRight, Share, Box, PieChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { parseBulkBankMovements } from '../lib/parser';
import { saveExpense } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

const Profile: React.FC = () => {
    const { user, login, logout, isAuthenticated, preferences, updatePreferences } = useApp();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [tempBudget, setTempBudget] = useState(preferences.monthlyBudget.toString());
    const [tempCycle, setTempCycle] = useState((preferences.billingCycleStartDay || 1).toString());

    // PWA Install state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Bulk Import State
    const [bulkText, setBulkText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ count: number, total: number } | null>(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleGoogleSuccess = (credentialResponse: any) => {
        if (credentialResponse.credential) {
            const decoded: any = jwtDecode(credentialResponse.credential);
            login({ id: decoded.sub, email: decoded.email, name: decoded.name, avatar: decoded.picture });
        }
    };

    const handleSavePreferences = () => {
        setSaveStatus('saving');
        updatePreferences({
            monthlyBudget: Number(tempBudget),
            billingCycleStartDay: Number(tempCycle)
        });
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        }
    };

    const handleBulkImport = async () => {
        if (!bulkText.trim()) return;
        setImporting(true);
        try {
            const detections = parseBulkBankMovements(bulkText);
            if (detections.length === 0) {
                alert('No se detectaron gastos válidos.');
                return;
            }

            let totalImportedAmount = 0;
            for (const item of detections) {
                await saveExpense({
                    id: uuidv4(),
                    amount: item.amount,
                    currency: preferences.currency,
                    description: item.merchant,
                    categoryId: item.categoryId || '6',
                    date: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    source: 'notification',
                    paymentMethod: item.paymentMethod || 'tarjeta'
                });
                totalImportedAmount += item.amount;
            }

            setImportResult({ count: detections.length, total: totalImportedAmount });
            setBulkText('');
        } catch (err) {
            console.error(err);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
                    {isAuthenticated ? 'Ajustes' : 'Tu Hogar, Tus Cuentas'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
                    {isAuthenticated ? 'Configura tu periodo y preferencias' : 'La app financiera que vive 100% en tu teléfono'}
                </p>
            </header>

            {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Tarjeta de Marketing */}
                    <div className="premium-card" style={{ padding: '2.5rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 17, 26, 1) 100%)', border: '1px solid var(--primary)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--primary)', padding: '0.8rem', borderRadius: '15px' }}><Shield color="white" size={24} /></div>
                                <div>
                                    <h3 style={{ fontWeight: 900, mb: '0.3rem' }}>Privacidad Total</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tus datos no salen de este dispositivo. Usamos Google solo para que tu sesión sea única y segura.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ background: '#ec4899', padding: '0.8rem', borderRadius: '15px' }}><PieChart color="white" size={24} /></div>
                                <div>
                                    <h3 style={{ fontWeight: 900, mb: '0.3rem' }}>Control Maestro</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categorías personalizables, gráficos históricos y presupuestos mensuales inteligentes.</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ background: '#f59e0b', padding: '0.8rem', borderRadius: '15px' }}><Smartphone color="white" size={24} /></div>
                                <div>
                                    <h3 style={{ fontWeight: 900, mb: '0.3rem' }}>App Instalable</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lleva HogarSafe en tu pantalla de inicio como una App real, sin ocupar espacio de memoria.</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '3rem', pt: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 700 }}>EMPEZAR AHORA</p>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => { }} useOneTap={false} theme="filled_blue" shape="pill" size="large" />
                            </div>
                        </div>
                    </div>

                    {/* Instrucciones de Instalación */}
                    <div className="premium-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Download size={20} color="var(--primary)" /> Instalar HogarSafe
                        </h3>

                        {/* Android / Chrome Desktop */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '0.8rem' }}>Android / PC Chrome:</p>
                            {deferredPrompt ? (
                                <button className="btn-primary" onClick={handleInstallClick} style={{ width: '100%', background: 'var(--primary)', height: '55px' }}>
                                    <Smartphone size={20} /> Instalar Aplicación Directo
                                </button>
                            ) : (
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Ve a los <b>3 puntos</b> de tu navegador y selecciona <b>"Instalar Aplicación"</b> para tener HogarSafe en tu menú.
                                </div>
                            )}
                        </div>

                        {/* iPhone */}
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '0.8rem' }}>iPhone (Safari):</p>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.8rem' }}>
                                <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>Pulsa el botón <b>Compartir</b> <Share size={14} style={{ display: 'inline' }} /> al final de Safari.</li>
                                    <li>Desliza hacia arriba y elige <b>"Agregar a inicio"</b>.</li>
                                    <li>¡Listo! Ya tienes HogarSafe como una App real.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* User Header */}
                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderLeft: '5px solid var(--primary)' }}>
                        <img src={user?.avatar} style={{ width: '70px', height: '70px', borderRadius: '22px', border: '3px solid var(--primary)' }} />
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
                        </div>
                    </div>

                    {/* Preferencias */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Calendar size={20} className="gradient-text" /> Ciclo de Facturación
                        </h3>
                        <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Día de inicio del mes</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" min="1" max="31" className="form-input" value={tempCycle} onChange={(e) => setTempCycle(e.target.value)} style={{ fontSize: '1.2rem', fontWeight: 800 }} />
                                    <span style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>de cada mes</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Presupuesto Mensual</label>
                                <input type="number" className="form-input" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }} />
                            </div>
                            <button className="btn-primary" onClick={handleSavePreferences} disabled={saveStatus === 'saving'}>
                                {saveStatus === 'saved' ? <><CheckCircle2 size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Configuración</>}
                            </button>
                        </div>
                    </section>

                    {/* Importador Inteligente */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingDown size={20} color="var(--primary)" /> Lector Bancario Inteligente
                        </h3>
                        <div className="premium-card" style={{ padding: '2rem' }}>
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                className="form-input"
                                placeholder="Pega aquí los movimientos de tu banco..."
                                style={{ minHeight: '120px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1rem' }}
                            />
                            {importResult && (
                                <div className="animate-fade-in" style={{ margin: '1rem 0', padding: '1.2rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '15px', border: '1px solid var(--success)' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)' }}>{importResult.count} Gastos Importados (${importResult.total.toLocaleString()})</p>
                                </div>
                            )}
                            <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem', height: '55px', color: 'var(--primary)' }} onClick={handleBulkImport} disabled={importing || !bulkText}>
                                {importing ? 'Procesando...' : <><FileText size={20} /> Procesar Movimientos</>}
                            </button>
                        </div>
                    </section>

                    <button className="btn-danger" onClick={logout} style={{ marginTop: '1rem', height: '55px' }}>
                        <LogOut size={20} /> Cerrar Sesión Segura
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;
