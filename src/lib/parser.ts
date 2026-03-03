import type { DetectedPayment } from '../types';

/**
 * Parser de notificaciones bancarias comunes (Enfoque Chile)
 * Soporta formatos de Banco Estado, Santander, Chile, BCI, etc.
 */
export function parseBankNotification(text: string): DetectedPayment | null {
    if (!text) return null;

    // Limpiar espacios extras
    const cleanText = text.trim();

    // Patrón 1: Compra con tarjeta (Monto + Comercio)
    // Ejemplo: "Compra por $25.000 en LIDER el 03/03/2024..."
    const purchaseRegex = /(?:Compra|Cargo|Gasto|Pago)(?:\s+por)?\s+\$?([\d.]+)(?:\s+en)?\s+([^0-9]+?)(?:\s+el|\s+con|\s*$)/i;

    // Patrón 2: Transferencia (Monto + Destinatario)
    // Ejemplo: "Transf. por $5.000 a Pedro Perez..."
    const transferRegex = /(?:Transferencia|Transf\.|TEF)(?:\s+por)?\s+\$?([\d.]+)(?:\s+a)?\s+([^0-9]+?)(?:\s+el|\s*$)/i;

    // Intentar emparejar compra
    let match = cleanText.match(purchaseRegex);
    if (!match) match = cleanText.match(transferRegex);

    if (match) {
        const amountStr = match[1].replace(/\./g, '');
        const merchant = match[2].trim();

        return {
            amount: parseInt(amountStr, 10),
            merchant: merchant.length > 30 ? merchant.substring(0, 30) : merchant,
            date: Date.now(),
            rawText: cleanText,
            confidence: 0.9
        };
    }

    // Patrón genérico: Solo monto (Último recurso si hay algo como "$15.000")
    const amountOnlyRegex = /\$?(\d{1,3}(?:\.\d{3})+)/; // Busca formato 1.000 o 15.000
    const amountMatch = cleanText.match(amountOnlyRegex);
    if (amountMatch) {
        return {
            amount: parseInt(amountMatch[1].replace(/\./g, ''), 10),
            merchant: 'Gasto Detectado',
            date: Date.now(),
            rawText: cleanText,
            confidence: 0.5
        };
    }

    return null;
}

/**
 * Parsea múltiples líneas de texto (ej. copiado de una cartola o lista de notificaciones)
 */
export function parseBulkBankMovements(text: string): DetectedPayment[] {
    if (!text) return [];

    // Separar por líneas
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 5);
    const results: DetectedPayment[] = [];

    lines.forEach(line => {
        const parsed = parseBankNotification(line);
        if (parsed && parsed.amount > 0) {
            results.push(parsed);
        }
    });

    return results;
}
