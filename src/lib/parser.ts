import type { DetectedPayment } from '../types';

/**
 * Parser de notificaciones bancarias comunes (Enfoque Chile)
 * Soporta formatos de Banco Estado, Santander, Chile, BCI, etc.
 */
export function parseBankNotification(text: string): DetectedPayment | null {
    if (!text) return null;

    // Patrón 1: Compra con tarjeta (Monto + Comercio)
    // Ejemplo: "Compra por $25.000 en LIDER el 03/03/2024..."
    const purchaseRegex = /(?:Compra|Cargo|Gasto|Pago)(?:\s+por)?\s+\$?([\d.]+)(?:\s+en)?\s+([^0-9]+?)(?:\s+el|\s+con|\s*$)/i;

    // Patrón 2: Transferencia (Monto + Destinatario)
    // Ejemplo: "Transf. por $5.000 a Pedro Perez..."
    const transferRegex = /(?:Transferencia|Transf\.|TEF)(?:\s+por)?\s+\$?([\d.]+)(?:\s+a)?\s+([^0-9]+?)(?:\s+el|\s*$)/i;

    // Intentar emparejar compra
    let match = text.match(purchaseRegex);
    if (!match) match = text.match(transferRegex);

    if (match) {
        const amountStr = match[1].replace(/\./g, ''); // Quitar puntos de miles "15.000" -> "15000"
        const merchant = match[2].trim();

        return {
            amount: parseInt(amountStr, 10),
            merchant: merchant.length > 30 ? merchant.substring(0, 30) : merchant,
            date: Date.now(),
            rawText: text,
            confidence: 0.9
        };
    }

    // Patrón genérico: Solo monto
    const amountOnlyRegex = /\$?([\d.]+)/;
    const amountMatch = text.match(amountOnlyRegex);
    if (amountMatch) {
        return {
            amount: parseInt(amountMatch[1].replace(/\./g, ''), 10),
            merchant: 'Comercio Desconocido',
            date: Date.now(),
            rawText: text,
            confidence: 0.5
        };
    }

    return null;
}
