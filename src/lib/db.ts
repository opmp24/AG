import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import { encryptData, decryptData } from './crypto';
import type { Expense, Category, Budget, ScheduledExpense } from '../types';

const DB_NAME = 'hogarsafe_db';
const DB_VERSION = 2; // Incremented for new store

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

export async function getExpenseById(id: string): Promise<Expense | null> {
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
