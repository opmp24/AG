import React from 'react';
import { User, LogOut, Shield, Download, Upload, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Profile: React.FC = () => {
    const { user, login, logout, isAuthenticated, preferences, updatePreferences } = useApp();

    // Simulación de Google Login para propósitos de demostración
    // En producción se usaría @react-oauth/google
    const handleMockLogin = () => {
        login({
            id: 'google_123',
            email: 'usuario@ejemplo.com',
            name: 'Usuario HogarSafe',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky'
        });
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem' }}>
            <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>Perfil y Ajustes</h1>

            {!isAuthenticated ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <Shield size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                    <h2>Bienvenido a HogarSafe</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>
                        Tu privacidad es nuestra prioridad. Identifícate para sincronizar tus preferencias.
                        Tus datos financieros nunca saldrán de este dispositivo.
                    </p>
                    <button className="btn-primary" onClick={handleMockLogin} style={{ width: '100%' }}>
                        Continuar con Google
                    </button>
                </div>
            ) : (
                <>
                    <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <img src={user?.avatar} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                        <div>
                            <h2 style={{ fontSize: '1.2rem' }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user?.email}</p>
                        </div>
                    </div>

                    <section style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Configuración Financiera</h3>
                        <div className="premium-card">
                            <div className="form-group">
                                <label className="form-label">Presupuesto Mensual</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={preferences.monthlyBudget}
                                    onChange={(e) => updatePreferences({ monthlyBudget: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Moneda Principal</label>
                                <select
                                    className="form-input"
                                    value={preferences.currency}
                                    onChange={(e) => updatePreferences({ currency: e.target.value as any })}
                                >
                                    <option value="ARS">ARS ($)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="MXN">MXN ($)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section style={{ marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Seguridad y Datos</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={20} />
                                <span style={{ fontSize: '0.8rem' }}>Exportar</span>
                            </button>
                            <button className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Upload size={20} />
                                <span style={{ fontSize: '0.8rem' }}>Importar</span>
                            </button>
                        </div>
                    </section>

                    <button
                        className="btn-primary"
                        onClick={logout}
                        style={{ width: '100%', marginTop: '3rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}
                    >
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </>
            )}
        </div>
    );
};

export default Profile;
