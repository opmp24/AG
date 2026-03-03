import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, List, Settings, PieChart } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "912408221896-g1r1uaf336q56sqt9tb3ko3f3knqeh9i.apps.googleusercontent.com";

// Lazy loading para optimizar rendimiento de PWA
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'));
const History = lazy(() => import('./pages/History'));
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));

const AppContent: React.FC = () => {
    const { isAuthenticated } = useApp();

    if (!isAuthenticated) {
        return (
            <Suspense fallback={<div>Cargando...</div>}>
                <Routes>
                    <Route path="/login" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <div className="app-shell">
            <main className="content">
                <Suspense fallback={<div>Cargando vista...</div>}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/add" element={<ExpenseForm />} />
                        <Route path="/edit/:id" element={<ExpenseForm />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/settings" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </main>

            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={24} />
                    <span>Inicio</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <List size={24} />
                    <span>Historial</span>
                </NavLink>

                <div className="fab-container">
                    <NavLink to="/add" className="fab-button">
                        <Plus size={32} />
                    </NavLink>
                </div>

                <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PieChart size={24} />
                    <span>Categorías</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={24} />
                    <span>Ajustes</span>
                </NavLink>
            </nav>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AppProvider>
                <Router>
                    <AppContent />
                </Router>
            </AppProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
