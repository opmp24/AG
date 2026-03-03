// ============================================================
// HogarSafe - Type Definitions
// All TypeScript interfaces and types for the application
// ============================================================

/** Supported currencies */
export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'CLP' | 'MXN' | 'COP' | 'PEN' | 'UYU' | 'GBP';

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Expense category */
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isDefault?: boolean;
    createdAt: number;
}

/** Financial expense record */
export interface Expense {
    id: string;
    amount: number;
    currency: CurrencyCode;
    description: string;
    categoryId: string;
    date: number; // Unix timestamp
    createdAt: number;
    updatedAt: number;
    source: 'manual' | 'notification';
    paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia';
    merchant?: string;
    notes?: string;
    tags?: string[];
}

/** Monthly budget configuration */
export interface Budget {
    id: string;
    month: number; // 1-12
    year: number;
    amount: number;
    currency: CurrencyCode;
    alertThreshold: number; // percentage (0-100)
}

/** User profile from Google Auth */
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar: string;
    locale?: string;
}

/** User preferences (synced) */
export interface UserPreferences {
    theme: ThemeMode;
    currency: CurrencyCode;
    language: string;
    biometricEnabled: boolean;
    notificationsEnabled: boolean;
    monthlyBudget: number;
    budgetAlertThreshold: number;
    profileId: string;
}

/** Encrypted data wrapper for export/import */
export interface EncryptedPayload {
    version: number;
    salt: string;
    iv: string;
    data: string; // AES encrypted JSON
    checksum: string;
    exportedAt: number;
}

/** Dashboard statistics */
export interface DashboardStats {
    currentBalance: number;
    totalSpentMonth: number;
    totalSpentToday: number;
    budgetUsedPercent: number;
    categoryBreakdown: Array<{
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        categoryIcon: string;
        total: number;
        percent: number;
    }>;
    recentExpenses: Expense[];
    dailyTrend: Array<{
        date: string;
        total: number;
    }>;
}

/** Notification payment pattern */
export interface DetectedPayment {
    amount: number;
    merchant: string;
    date: number;
    rawText: string;
    confidence: number;
}

/** Export/Import result */
export interface DataTransferResult {
    success: boolean;
    message: string;
    recordCount?: number;
}

/** Filter parameters */
export interface ExpenseFilter {
    startDate?: number;
    endDate?: number;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    currency?: CurrencyCode;
}

/** Application state for context */
export interface AppState {
    user: UserProfile | null;
    preferences: UserPreferences;
    isAuthenticated: boolean;
    isOnline: boolean;
    isMobile: boolean;
    isPWA: boolean;
}
