import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense } from '../lib/db';
import type { Expense } from '../types';
import { Trash2, TrendingDown } from 'lucide-react';

const History: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        const data = await getAllExpenses();
        setExpenses(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este gasto?')) {
            await deleteExpense(id);
            loadData();
        }
    };

    return (
        <div className="animate-slide-up" style={{ padding: '1.5rem' }}>
            <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>Historial</h1>

            {loading ? (
                <p>Cargando historial...</p>
            ) : expenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <TrendingDown size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No hay movimientos registrados.</p>
                </div>
            ) : (
                expenses.map(exp => (
                    <div key={exp.id} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontWeight: 600 }}>{exp.description}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--danger)' }}>- {exp.amount}</p>
                            <button onClick={() => handleDelete(exp.id)} style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default History;
