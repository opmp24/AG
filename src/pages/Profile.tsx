import React from 'react';
import { LogOut, Shield, Download, Upload, User, CreditCard, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const Profile: React.FC = () => {
    const { user, login, logout, isAuthenticated, preferences, updatePreferences } = useApp();

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

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem', paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Perfil</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Configura tu experiencia HogarSafe</p>
            </header>

            {!isAuthenticated ? (
                <div className="premium-card animate-fade-in" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(15, 17, 26, 0.9) 100%)' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <Shield size={40} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Privacidad Total</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                        Identifícate con Google para sincronizar tus preferencias.
                        <strong> Tus datos financieros jamás abandonarán este dispositivo.</strong>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2))' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap
                            theme="filled_blue"
                            shape="pill"
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
                            <CreditCard size={18} /> Finanzas y Moneda
                        </h3>
                        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Presupuesto Mensual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        style={{ paddingRight: '3rem', fontSize: '1.1rem', fontWeight: 700 }}
                                        value={preferences.monthlyBudget || ''}
                                        onChange={(e) => updatePreferences({ monthlyBudget: Number(e.target.value) })}
                                    />
                                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontWeight: 700 }}>
                                        {preferences.currency}
                                    </span>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontWeight: 600 }}>Moneda de Chile y más</label>
                                <select
                                    className="form-input"
                                    style={{ appearance: 'none', background: 'rgba(255, 255, 255, 0.05) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E") no-repeat right 1rem center' }}
                                    value={preferences.currency}
                                    onChange={(e) => updatePreferences({ currency: e.target.value as any })}
                                >
                                    <optgroup label="América Latina">
                                        <option value="CLP">Chilean Peso (CLP $)</option>
                                        <option value="ARS">Argentine Peso (ARS $)</option>
                                        <option value="MXN">Mexican Peso (MXN $)</option>
                                        <option value="BRL">Real Brasileño (BRL R$)</option>
                                        <option value="COP">Peso Colombiano (COP $)</option>
                                        <option value="PEN">Sol Peruano (PEN S/)</option>
                                    </optgroup>
                                    <optgroup label="Global">
                                        <option value="USD">US Dollar (USD $)</option>
                                        <option value="EUR">Euro (EUR €)</option>
                                        <option value="GBP">British Pound (GBP £)</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} /> Seguridad de Datos
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Download size={22} color="var(--primary)" />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Respaldar</span>
                            </button>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', cursor: 'pointer' }}>
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
                            marginTop: '2rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            boxShadow: 'none',
                            padding: '1.2rem',
                            borderRadius: '18px',
                            fontWeight: 700
                        }}
                    >
                        <LogOut size={20} style={{ marginRight: '8px' }} /> Cerrar Sesión
                    </button>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '1rem', opacity: 0.6 }}>
                        HogarSafe v1.0.0 • Encriptación Local AES-256
                    </p>
                </div>
            )}
        </div>
    );
};

export default Profile;
