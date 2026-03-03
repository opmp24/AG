import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import { encryptData, decryptData } from './crypto';
import type { Expense, Category, Budget } from '../types';

const DB_NAME = 'hogarsafe_db';
const DB_VERSION = 1;

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
}

let dbPromise: Promise<IDBPDatabase<HogarSafeDB>>;

export function initDB() {
    dbPromise = openDB<HogarSafeDB>(DB_NAME, DB_VERSION, {
        upgrade(db: any) {
            if (!db.objectStoreNames.contains('expenses')) {
                const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expenseStore.createIndex('by-date', 'date');
            }
            if (!db.objectStoreNames.contains('categories')) {
                db.createObjectStore('categories', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('budgets')) {
                db.createObjectStore('budgets', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        },
    });
}

initDB();

export async function saveExpense(expense: Expense): Promise<void> {
    const db = await dbPromise;
    const { encrypted, iv } = await encryptData(expense);
    await db.put('expenses', {
        id: expense.id,
        data: encrypted,
        iv: iv,
        date: expense.date
    });
}

export async function getAllExpenses(): Promise<Expense[]> {
    const db = await dbPromise;
    const rawExpenses = await db.getAll('expenses');
    const decryptedExpenses = await Promise.all(
        rawExpenses.map(async (item) => {
            return await decryptData(item.data, item.iv);
        })
    );
    return decryptedExpenses
        .filter(e => e !== null)
        .sort((a, b) => b.date - a.date);
}

export async function deleteExpense(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete('expenses', id);
}

export async function saveCategory(category: Category): Promise<void> {
    const db = await dbPromise;
    await db.put('categories', category);
}

export async function getCategories(): Promise<Category[]> {
    const db = await dbPromise;
    return await db.getAll('categories');
}
