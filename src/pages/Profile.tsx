import React, { useState } from 'react';
import { LogOut, Shield, Download, Upload, CreditCard, CheckCircle2, User as UserIcon } from 'lucide-react';
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
        <div className="animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Ajustes</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>Configura tu cuenta HogarSafe</p>
            </header>

            {!isAuthenticated ? (
                <div className="premium-card animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 17, 26, 1) 100%)', border: '2px solid var(--primary)' }}>
                    <div style={{ width: '90px', height: '90px', background: 'var(--primary)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)' }}>
                        <Shield size={45} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.2rem' }}>Autenticación Requerida</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.7', fontSize: '1.05rem' }}>
                        Inicia sesión con Google para sincronizar tus preferencias.
                        <br />
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Tus datos financieros nunca salen de este móvil.</span>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 12px 20px rgba(99, 102, 241, 0.3))' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap={false}
                            prompt="select_account"
                            theme="filled_blue"
                            shape="pill"
                            size="large"
                            text="signin_with"
                        />
                    </div>
                </div>
            ) : (
                <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* User Profile Info Card */}
                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.8rem', borderLeft: '5px solid var(--primary)' }}>
                        <div style={{ position: 'relative' }}>
                            <img src={user?.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '28px', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }} />
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--success)', width: '22px', height: '22px', borderRadius: '50%', border: '4px solid var(--card-dark)' }}></div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.2rem' }}>{user?.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <UserIcon size={14} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Settings Section */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CreditCard size={22} className="gradient-text" />
                            Configuración de Presupuesto
                        </h3>
                        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Tu Presupuesto Mensual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Ingresa monto..."
                                        style={{ paddingRight: '5rem', fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}
                                        value={tempBudget}
                                        onChange={(e) => setTempBudget(e.target.value)}
                                    />
                                    <span style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 900, fontSize: '1.1rem' }}>
                                        {preferences.currency}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Moneda de Visualización</label>
                                <select
                                    className="form-input"
                                    style={{
                                        fontWeight: 700,
                                        appearance: 'none',
                                        background: 'rgba(255, 255, 255, 0.08) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236366f1\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 1.2rem center',
                                        backgroundSize: '1.2rem'
                                    }}
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
                                    height: '60px',
                                    fontSize: '1.1rem',
                                    background: saveStatus === 'saved' ? 'var(--success)' : 'var(--primary)',
                                    boxShadow: saveStatus === 'saved' ? '0 10px 20px rgba(16, 185, 129, 0.3)' : '0 10px 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {saveStatus === 'idle' && 'Guardar Cambios'}
                                {saveStatus === 'saving' && 'Procesando...'}
                                {saveStatus === 'saved' && <><CheckCircle2 size={24} /> ¡Configuración Guardada!</>}
                            </button>
                        </div>
                    </section>

                    {/* Data Security Section */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Shield size={22} color="var(--success)" />
                            Respaldo de Seguridad
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                            <button className="premium-card interactive-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.8rem', cursor: 'pointer' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
                                    <Download size={26} color="var(--primary)" />
                                </div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Exportar</span>
                            </button>
                            <button className="premium-card interactive-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.8rem', cursor: 'pointer' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a855f7' }}>
                                    <Upload size={26} color="#a855f7" />
                                </div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Importar</span>
                            </button>
                        </div>
                    </section>

                    <button
                        className="btn-danger"
                        onClick={logout}
                        style={{
                            marginTop: '2rem',
                            height: '55px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontSize: '1rem'
                        }}
                    >
                        <LogOut size={20} /> Cerrar Sesión Segura
                    </button>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', opacity: 0.7 }}>
                        HogarSafe v1.1.0 • Cifrado Local AES-GCM 256-bit
                    </p>
                </div>
            )}
        </div>
    );
};

export default Profile;
