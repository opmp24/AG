import React, { useState } from 'react';
import { LogOut, Shield, Download, Upload, CreditCard, CheckCircle2, User as UserIcon, Lock, Database, Globe, Smartphone, Heart, Wand2, Plus, Calendar, Save, FileText, AlertCircle, ShoppingCart, TrendingDown } from 'lucide-react';
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

    // Bulk Import State
    const [bulkText, setBulkText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ count: number, total: number } | null>(null);

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

    const handleBulkImport = async () => {
        if (!bulkText.trim()) return;
        setImporting(true);
        try {
            const detections = parseBulkBankMovements(bulkText);
            if (detections.length === 0) {
                alert('No se detectaron gastos válidos. El lector ignora automáticamente abonos y transferencias de ingreso.');
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
                    {isAuthenticated ? 'Ajustes' : 'Bienvenido a HogarSafe'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>
                    {isAuthenticated ? 'Configura tu periodo y preferencias' : 'La app de finanzas que respeta tu privacidad'}
                </p>
            </header>

            {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="premium-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 17, 26, 1) 100%)', border: '2px solid var(--primary)', borderRadius: '35px' }}>
                        <div style={{ width: '90px', height: '90px', background: 'var(--primary)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', boxShadow: '0 15px 35px rgba(99, 102, 241, 0.5)' }}>
                            <Shield size={45} color="white" />
                        </div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1.2rem' }}>Privacidad Real</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 12px 25px rgba(99, 102, 241, 0.4))' }}>
                            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => { }} useOneTap={false} theme="filled_blue" shape="pill" size="large" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Profile Header */}
                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderLeft: '5px solid var(--primary)' }}>
                        <img src={user?.avatar} style={{ width: '70px', height: '70px', borderRadius: '22px', border: '3px solid var(--primary)' }} />
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
                        </div>
                    </div>

                    {/* PERIODO Y PRESUPUESTO */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Calendar size={20} className="gradient-text" /> Ciclo de Facturación
                        </h3>
                        <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Día de inicio del mes</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number" min="1" max="31"
                                        className="form-input"
                                        value={tempCycle}
                                        onChange={(e) => setTempCycle(e.target.value)}
                                        style={{ fontSize: '1.2rem', fontWeight: 800 }}
                                    />
                                    <span style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>de cada mes</span>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ej: Si pones 28, tu mes financiero irá desde el 28 al 27 del mes siguiente.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Presupuesto Mensual</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={tempBudget}
                                    onChange={(e) => setTempBudget(e.target.value)}
                                    style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}
                                />
                            </div>

                            <button className="btn-primary" onClick={handleSavePreferences} disabled={saveStatus === 'saving'}>
                                {saveStatus === 'saved' ? <><CheckCircle2 size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Configuración</>}
                            </button>
                        </div>
                    </section>

                    {/* CARGA MASIVA */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingDown size={20} color="var(--primary)" /> Importar Cartola de Banco
                        </h3>
                        <div className="premium-card" style={{ padding: '2rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Copia líneas de tu cartola y pégalas abajo. Se extraerá la descripción real y el monto de cargo. **Ignoraremos abonos automáticamente.**
                            </p>
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                className="form-input"
                                placeholder="03/03/2026	Transferencia enviada a Servipag	30.000..."
                                style={{ minHeight: '120px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', whiteSpace: 'pre' }}
                            />

                            {importResult && (
                                <div className="animate-fade-in" style={{ margin: '1rem 0', padding: '1.2rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '15px', border: '1px solid var(--success)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)' }}>¡Importación Finalizada!</p>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Se detectaron {importResult.count} cargos genuinos.</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>${importResult.total.toLocaleString()}</p>
                                            <p style={{ fontSize: '0.6rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase' }}>Total Gastos</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setImportResult(null)} style={{ marginTop: '0.5rem', fontSize: '0.7rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline' }}>Cerrar aviso</button>
                                </div>
                            )}

                            <button
                                className="btn-secondary"
                                style={{ width: '100%', marginTop: '1rem', height: '55px', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                onClick={handleBulkImport}
                                disabled={importing || !bulkText}
                            >
                                {importing ? 'Procesando...' : <><FileText size={20} /> Procesar {bulkText.split('\n').filter(l => l.trim()).length} Líneas</>}
                            </button>
                        </div>
                    </section>

                    {/* Respaldo y Simulador */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button className="premium-card interactive-card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <Download size={20} color="var(--primary)" />
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>Respaldar (.json)</p>
                        </button>
                        <button className="premium-card interactive-card" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--warning)' }} onClick={() => {
                            const text = "03/03/2026	Transferencia enviada a Servipag	3.206\n01/03/2026	COMPRA MALL PLAZA VESPUCIO	Titular	$5.899	01/01	$5.899\n01/03/2026	COMPRA PC FACTORY PLAZA VES	Titular	$12.590	01/01	$12.590\n02/03/2026	Transferencia recibida de JUAN PEREZ	500.000";
                            setBulkText(text);
                        }}>
                            <Wand2 size={20} color="var(--warning)" />
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.5rem' }}>Cargar Ejemplo Real</p>
                        </button>
                    </div>

                    <button className="btn-danger" onClick={logout} style={{ marginTop: '1rem', height: '55px' }}>
                        <LogOut size={20} /> Cerrar Sesión Segura
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;
