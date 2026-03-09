import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, List, Settings, PieChart, CalendarCheck, Target } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "912408221896-g1r1uaf336q56sqt9tb3ko3f3knqeh9i.apps.googleusercontent.com";

// Lazy loading para optimizar rendimiento de PWA
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'));
const History = lazy(() => import('./pages/History'));
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));
const Scheduled = lazy(() => import('./pages/Scheduled'));
const Goals = lazy(() => import('./pages/Goals'));

const AppContent: React.FC = () => {
    const { isAuthenticated, preferences } = useApp();

    if (!isAuthenticated) {
        return (
            <div className={`theme-${preferences.theme}`} style={{ minHeight: '100vh', background: 'var(--background)' }}>
                <Suspense fallback={<div>Cargando...</div>}>
                    <Routes>
                        <Route path="/login" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Suspense>
            </div>
        );
    }

    return (
        <div className={`app-shell theme-${preferences.theme}`}>
            <main className="content">
                <Suspense fallback={<div>Cargando vista...</div>}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/add" element={<ExpenseForm />} />
                        <Route path="/edit/:id" element={<ExpenseForm />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/scheduled" element={<Scheduled />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/settings" element={<Profile />} />
                        <Route path="/metas" element={<Goals />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </main>

            <nav className="bottom-nav" style={{ padding: '0 0.5rem 1.5rem 0.5rem' }}>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Inicio</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <List size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Historial</span>
                </NavLink>
                <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PieChart size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Mini $</span>
                </NavLink>

                <div className="fab-container">
                    <NavLink to="/add" className="fab-button" style={{ width: '55px', height: '55px', borderRadius: '18px' }}>
                        <Plus size={28} />
                    </NavLink>
                </div>

                <NavLink to="/metas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Target size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Metas</span>
                </NavLink>
                <NavLink to="/scheduled" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CalendarCheck size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Pagos</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={22} />
                    <span style={{ fontSize: '0.65rem' }}>Ajustes</span>
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
