import React, { useState } from 'react';
import { LogOut, Shield, Download, Upload, CreditCard, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Profile: React.FC = () => {
    const { user, login, logout, isAuthenticated, preferences, updatePreferences } = useApp();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [tempBudget, setTempBudget] = useState(preferences.monthlyBudget.toString());

    const handleGoogleSuccess = (credentialResponse: any) => {
        if (credentialResponse.credential) {
            const decoded: any = jwtDecode(credentialResponse.credential);
            login({
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.picture
            });
        }
    };

    const handleSavePreferences = () => {
        setSaveStatus('saving');
        updatePreferences({
            monthlyBudget: Number(tempBudget)
        });

        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Perfil</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Gestiona tu cuenta y preferencias</p>
            </header>

            {!isAuthenticated ? (
                <div className="premium-card animate-fade-in" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 17, 26, 0.9) 100%)' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <Shield size={40} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Iniciar Sesión</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        Usa tu cuenta de Google para guardar tus preferencias de presupuesto y moneda.
                        <strong> Tus finanzas siempre se mantienen privadas en este dispositivo.</strong>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2))' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap={false} // Desactivamos OneTap para forzar el selector
                            prompt="select_account" // Forzamos a Google a pedir la cuenta
                            theme="filled_blue"
                            shape="pill"
                            text="signin_with"
                        />
                    </div>
                </div>
            ) : (
                <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.5rem' }}>
                        <div style={{ position: 'relative' }}>
                            <img src={user?.avatar} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '24px', objectFit: 'cover', border: '3px solid rgba(99, 102, 241, 0.3)' }} />
                            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--success)', width: '18px', height: '18px', borderRadius: '50%', border: '3px solid var(--card-dark)' }}></div>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
                        </div>
                    </div>

                    <section>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={18} /> Configuración de Presupuesto
                        </h3>
                        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Tu Presupuesto Mensual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Ingresa monto..."
                                        style={{ paddingRight: '4rem', fontSize: '1.1rem', fontWeight: 700 }}
                                        value={tempBudget}
                                        onChange={(e) => setTempBudget(e.target.value)}
                                    />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontWeight: 700 }}>
                                        {preferences.currency}
                                    </span>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Moneda Predeterminada</label>
                                <select
                                    className="form-input"
                                    style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.05) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 1rem center' }}
                                    value={preferences.currency}
                                    onChange={(e) => updatePreferences({ currency: e.target.value as any })}
                                >
                                    <optgroup label="América Latina">
                                        <option value="CLP">Chile / Peso (CLP $)</option>
                                        <option value="ARS">Argentina / Peso (ARS $)</option>
                                        <option value="MXN">México / Peso (MXN $)</option>
                                        <option value="BRL">Brasil / Real (BRL R$)</option>
                                        <option value="COP">Colombia / Peso (COP $)</option>
                                        <option value="PEN">Perú / Sol (PEN S/)</option>
                                    </optgroup>
                                    <optgroup label="Global">
                                        <option value="USD">EE.UU. / Dólar (USD $)</option>
                                        <option value="EUR">Europa / Euro (EUR €)</option>
                                        <option value="GBP">Reino Unido / Libra (GBP £)</option>
                                    </optgroup>
                                </select>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleSavePreferences}
                                disabled={saveStatus === 'saving'}
                                style={{
                                    width: '100%',
                                    background: saveStatus === 'saved' ? 'var(--success)' : 'var(--primary)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {saveStatus === 'idle' && 'Guardar Presupuesto'}
                                {saveStatus === 'saving' && 'Guardando...'}
                                {saveStatus === 'saved' && <><CheckCircle2 size={18} /> ¡Guardado!</>}
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} /> Seguridad de Datos
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.2rem', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Download size={22} color="var(--primary)" />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Respaldar</span>
                            </button>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.2rem', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Upload size={22} color="#a855f7" />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Importar</span>
                            </button>
                        </div>
                    </section>

                    <button
                        className="btn-primary"
                        onClick={logout}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            background: 'rgba(239, 68, 68, 0.05)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            boxShadow: 'none',
                            padding: '1rem',
                            borderRadius: '16px',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}
                    >
                        <LogOut size={18} style={{ marginRight: '8px' }} /> Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;
