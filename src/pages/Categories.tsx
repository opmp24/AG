import React from 'react';
import { PieChart, Plus } from 'lucide-react';

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentación', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Servicios', icon: '🔌', color: '#3b82f6' },
    { id: '3', name: 'Transporte', icon: '🚗', color: '#f59e0b' },
    { id: '4', name: 'Ocio', icon: '🎬', color: '#a855f7' },
    { id: '5', name: 'Salud', icon: '💊', color: '#10b981' },
];

const Categories: React.FC = () => {
    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Categorías</h1>
                <button className="premium-card" style={{ padding: '0.6rem', borderRadius: '12px', margin: 0 }}>
                    <Plus size={20} />
                </button>
            </header>

            <div className="premium-card">
                <div style={{ textAlign: 'center', padding: '1rem 0 2rem 0' }}>
                    <PieChart size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Distribución de gastos por categoría (Próximamente)</p>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Mis Categorías</h3>
                {DEFAULT_CATEGORIES.map(cat => (
                    <div key={cat.id} className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `${cat.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}>
                            {cat.icon}
                        </div>
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Categories;
