import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserPreferences, ThemeMode, CurrencyCode } from '../types';

interface AppContextType {
    user: UserProfile | null;
    preferences: UserPreferences;
    isAuthenticated: boolean;
    login: (profile: UserProfile) => void;
    logout: () => void;
    updatePreferences: (prefs: Partial<UserPreferences>) => void;
    isOnline: boolean;
    deferredPrompt: any;
    installPwa: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'system',
    currency: 'ARS',
    language: 'es',
    biometricEnabled: false,
    notificationsEnabled: true,
    monthlyBudget: 0,
    budgetAlertThreshold: 80,
    billingCycleStartDay: 1,
    profileId: ''
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Cargar sesión local si existe
        const savedUser = localStorage.getItem('hs_user');
        const savedPrefs = localStorage.getItem('hs_prefs');

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedPrefs) setPreferences(JSON.parse(savedPrefs));

        // Listeners de conexión
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        // PWA Install listener global
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const login = (profile: UserProfile) => {
        setUser(profile);
        localStorage.setItem('hs_user', JSON.stringify(profile));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('hs_user');
        localStorage.removeItem('hs_token');
    };

    const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
        const updated = { ...preferences, ...newPrefs };
        setPreferences(updated);
        localStorage.setItem('hs_prefs', JSON.stringify(updated));
    };

    const installPwa = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    return (
        <AppContext.Provider value={{
            user,
            preferences,
            isAuthenticated: !!user,
            login,
            logout,
            updatePreferences,
            isOnline,
            deferredPrompt,
            installPwa
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp debe usarse dentro de AppProvider');
    return context;
};
