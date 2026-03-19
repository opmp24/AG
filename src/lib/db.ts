import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import { encryptData, decryptData } from './crypto';
import type { Expense, Category, Budget, ScheduledExpense } from '../types';

const DB_NAME = 'hogarsafe_db';
const DB_VERSION = 3;

interface HogarSafeDB {
    expenses: {
        key: string;
        value: { id: string; data: string; iv: string; date: number };
    };
    categories: {
        key: string;
        value: Category;
    };
    budgets: {
        key: string;
        value: Budget;
    };
    settings: {
        key: string;
        value: any;
    };
    scheduled: {
        key: string;
        value: ScheduledExpense;
    };
    saving_goals: {
        key: string;
        value: import('../types').SavingGoal;
    };
}

let dbPromise: Promise<IDBPDatabase<HogarSafeDB>>;

export function initDB() {
    dbPromise = openDB<HogarSafeDB>(DB_NAME, DB_VERSION, {
        upgrade(db: any, oldVersion, newVersion) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                    expenseStore.createIndex('by-date', 'date');
                }
                if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('budgets')) db.createObjectStore('budgets', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
            }
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains('scheduled')) {
                    db.createObjectStore('scheduled', { keyPath: 'id' });
                }
            }
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains('saving_goals')) {
                    db.createObjectStore('saving_goals', { keyPath: 'id' });
                }
            }
        },
    });
}

initDB();

// --- Expenses ---
export async function saveExpense(expense: Expense): Promise<void> {
    const db = await dbPromise;
    const { encrypted, iv } = await encryptData(expense);
    await db.put('expenses', { id: expense.id, data: encrypted, iv: iv, date: expense.date });
}

export async function getAllExpenses(): Promise<Expense[]> {
    const db = await dbPromise;
    const rawExpenses = await db.getAll('expenses');
    const decryptedExpenses = await Promise.all(
        rawExpenses.map(async (item) => await decryptData(item.data, item.iv))
    );
    return decryptedExpenses.filter(e => e !== null).sort((a, b) => b.date - a.date);
}

export async function deleteExpense(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('expenses', id);
}

export async function getExpense(id: string): Promise<Expense | null> {
    const db = await dbPromise;
    const item = await db.get('expenses', id);
    if (!item) return null;
    return await decryptData(item.data, item.iv);
}

// --- Scheduled / Pending ---
export async function saveScheduledExpense(item: ScheduledExpense): Promise<void> {
    const db = await dbPromise;
    await db.put('scheduled', item);
}

export async function getAllScheduledExpenses(): Promise<ScheduledExpense[]> {
    const db = await dbPromise;
    const items = await db.getAll('scheduled');
    return items.filter(i => i.status === 'pending').sort((a, b) => a.dueDate - b.dueDate);
}

export async function deleteScheduledExpense(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('scheduled', id);
}

// --- Categories ---
export async function saveCategory(category: Category): Promise<void> {
    const db = await dbPromise;
    await db.put('categories', category);
}

export async function getCategories(): Promise<Category[]> {
    const db = await dbPromise;
    return await db.getAll('categories');
}

export async function deleteCategory(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('categories', id);
}

export async function reassignExpenses(oldCategoryId: string, newCategoryId: string): Promise<number> {
    const db = await dbPromise;
    const rawExpenses = await db.getAll('expenses');
    let count = 0;
    for (const item of rawExpenses) {
        const expense = await decryptData(item.data, item.iv);
        if (expense && expense.categoryId === oldCategoryId) {
            expense.categoryId = newCategoryId;
            const { encrypted, iv } = await encryptData(expense);
            await db.put('expenses', { ...item, data: encrypted, iv: iv });
            count++;
        }
    }
    return count;
}
// --- Saving Goals ---
export async function saveSavingGoal(goal: import('../types').SavingGoal): Promise<void> {
    const db = await dbPromise;
    await db.put('saving_goals', goal);
}

export async function getAllSavingGoals(): Promise<import('../types').SavingGoal[]> {
    const db = await dbPromise;
    return await db.getAll('saving_goals');
}

export async function deleteSavingGoal(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('saving_goals', id);
}

// --- Backup & Export ---
export async function exportData() {
    const db = await dbPromise;
    const expenses = await getAllExpenses();
    const categories = await db.getAll('categories');
    const scheduled = await db.getAll('scheduled');
    const goals = await db.getAll('saving_goals');

    return JSON.stringify({
        version: DB_VERSION,
        expenses,
        categories,
        scheduled,
        goals,
        exportedAt: Date.now()
    }, null, 2);
}

export async function importData(jsonString: string): Promise<boolean> {
    try {
        const data = JSON.parse(jsonString);
        if (!data.expenses || !data.categories) return false;

        for (const exp of data.expenses) await saveExpense(exp);
        for (const cat of data.categories) await saveCategory(cat);
        if (data.scheduled) {
            for (const item of data.scheduled) await saveScheduledExpense(item);
        }
        if (data.goals) {
            for (const goal of data.goals) await saveSavingGoal(goal);
        }
        return true;
    } catch (e) {
        console.error("Error al importar datos:", e);
        return false;
    }
}

export async function clearAllData(): Promise<void> {
    const db = await dbPromise;
    const stores: (keyof HogarSafeDB)[] = ['expenses', 'categories', 'scheduled', 'saving_goals', 'budgets'];
    for (const store of stores) {
        await db.clear(store);
    }
}

export async function exportToCSV() {
    const expenses = await getAllExpenses();
    const categories = await getCategories();

    const headers = ['ID', 'Fecha', 'Descripcion', 'Monto', 'Moneda', 'Categoria', 'Metodo Pago', 'Modo'];
    const rows = expenses.map(e => {
        const cat = categories.find(c => c.id === e.categoryId)?.name || 'Otros';
        return [
            e.id,
            new Date(e.date).toISOString().split('T')[0],
            `"${e.description.replace(/"/g, '""')}"`,
            e.amount,
            e.currency,
            `"${cat}"`,
            e.paymentMethod,
            e.source
        ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return csvContent;
}
