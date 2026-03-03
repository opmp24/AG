import type { DetectedPayment } from '../types';

/**
 * Parser avanzado de movimientos bancarios y tarjetas de crédito.
 */
export function parseBankNotification(text: string): DetectedPayment | null {
    if (!text) return null;

    const cleanText = text.trim();
    if (cleanText.toLowerCase().includes('fecha transacción') || cleanText.toLowerCase().includes('fecha de compras')) return null;

    // --- FILTRADO DE ABONOS (Ingresos) ---
    const incomeKeywords = ['recibida de', 'depósito', 'abono', 'reintegro', 'devolución'];
    if (incomeKeywords.some(kw => cleanText.toLowerCase().includes(kw))) {
        return null;
    }

    let result: Partial<DetectedPayment> = {
        date: Date.now(),
        rawText: cleanText,
        confidence: 0.5
    };

    // --- PATRÓN 1: TARJETA DE CRÉDITO (Formato Usuario) ---
    // Ej: "01/03/2026  COMPRA RedGloba*TZMULTISERVIC  Titular  $7.200  01/01  $7.200"
    const creditCardRegex = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+Titular\s+\$\s?([\d.]+)/i;
    const ccMatch = cleanText.match(creditCardRegex);

    if (ccMatch) {
        result.merchant = ccMatch[2].trim();
        result.amount = parseInt(ccMatch[3].replace(/\./g, ''), 10);
        result.confidence = 0.95;
    }
    // --- PATRÓN 2: FORMATO TABULAR (Cartola de Banco Cuenta Vista/Corriente) ---
    else {
        const tabularRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.]+)(?:\t|\s{2,}|$)/i;
        const tabularMatch = cleanText.match(tabularRegex);

        if (tabularMatch) {
            result.merchant = tabularMatch[3].trim();
            result.amount = parseInt(tabularMatch[4].replace(/\./g, ''), 10);
            result.confidence = 0.95;
        }
    }

    // --- PATRÓN 3: NOTIFICACIONES PUSH (Monto primero) ---
    if (!result.amount) {
        const pushRegex = /(?:Compra|Cargo|Gasto|Pago|Transferencia|Transf\.|TEF)(?:\s+por)?\s+\$?([\d.]+)(?:\s+en|\s+a|\s+con)?\s+([^0-9]+?)(?:\s+el|\s+con|\s*$)/i;
        const pushMatch = cleanText.match(pushRegex);
        if (pushMatch) {
            result.amount = parseInt(pushMatch[1].replace(/\./g, ''), 10);
            result.merchant = pushMatch[2].trim();
            result.confidence = 0.9;
        }
    }

    // --- PATRÓN 4: SOLO MONTO (Último recurso) ---
    if (!result.amount) {
        const amountOnlyRegex = /\$?(\d{1,3}(?:\.\d{3})+)/;
        const amountMatch = cleanText.match(amountOnlyRegex);
        if (amountMatch) {
            result.amount = parseInt(amountMatch[1].replace(/\./g, ''), 10);
            const possibleDesc = cleanText.replace(amountMatch[0], '').trim();
            result.merchant = possibleDesc && possibleDesc.length > 3 ? possibleDesc : 'Gasto Detectado';
        }
    }

    if (!result.amount) return null;

    // --- CATEGORIZACIÓN AUTOMÁTICA ---
    const lowerText = cleanText.toLowerCase();

    // Por defecto: Otros / Tarjeta
    result.categoryId = '6';
    result.paymentMethod = 'tarjeta';

    if (lowerText.includes('transferencia') || lowerText.includes('transf.') || lowerText.includes('tef')) {
        result.categoryId = '7'; // Pagos
        result.paymentMethod = 'transferencia';
    } else if (lowerText.includes('compra') || lowerText.includes('pago automatico') || lowerText.includes('pat') || lowerText.includes('pac')) {
        result.categoryId = '1'; // Si es comida (opcional, pero mejor dejar en Otros o detectar comercio)
        // Mantenemos Otros por defecto para compras, a menos que sea transferencia
        result.categoryId = '6';
        result.paymentMethod = 'tarjeta';
    }

    // Refinamiento por palabras clave en el comercio
    if (lowerText.includes('mercado') || lowerText.includes('lider') || lowerText.includes('jumbo') || lowerText.includes('unimarc')) {
        result.categoryId = '1'; // Alimentación
    }

    return result as DetectedPayment;
}

export function parseBulkBankMovements(text: string): DetectedPayment[] {
    if (!text) return [];
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 8);
    const results: DetectedPayment[] = [];
    lines.forEach(line => {
        const parsed = parseBankNotification(line);
        if (parsed && parsed.amount > 0) results.push(parsed);
    });
    return results;
}
