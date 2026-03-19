import React, { Suspense, lazy } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home, History as HistoryIcon, Plus, Settings, CalendarClock, LayoutGrid, Target } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'));
const Profile = lazy(() => import('./pages/Profile'));
const Categories = lazy(() => import('./pages/Categories'));
const Goals = lazy(() => import('./pages/Goals'));
const Scheduled = lazy(() => import('./pages/Scheduled'));

const LoadingFallback = () => (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
    </div>
);

const AppContent: React.FC = () => {
    const { user, preferences } = useApp();
    const location = useLocation();

    // No navigation on Add/Edit pages for a cleaner focus
    const showNav = !location.pathname.startsWith('/add') && !location.pathname.startsWith('/edit');

    // Themes are handled by classes on the container
    const themeClass = `theme-${preferences.theme || 'dark'}`;

    return (
        <div className={`app-shell ${themeClass}`}>
            <div id="root">
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/add" element={<ExpenseForm />} />
                        <Route path="/edit/:id" element={<ExpenseForm />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/metas" element={<Goals />} />
                        <Route path="/scheduled" element={<Scheduled />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>

                {showNav && (
                    <nav className="bottom-nav animate-fade-in">
                        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                            <Home size={22} />
                            <span>INICIO</span>
                        </NavLink>
                        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <HistoryIcon size={22} />
                            <span>HISTORIAL</span>
                        </NavLink>
                        
                        <div className="fab-container">
                            <NavLink to="/add" className="fab-button">
                                <Plus size={32} />
                            </NavLink>
                        </div>

                        <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <LayoutGrid size={22} />
                            <span>SOBRES</span>
                        </NavLink>
                        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Settings size={22} />
                            <span>AJUSTES</span>
                        </NavLink>
                    </nav>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
