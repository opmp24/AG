/**
 * Lógica de períodos personalizados (Cierre de mes en día arbitrario)
 */
export function getBillingPeriodRange(date: Date, startDay: number) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();

    // El período comienza en día 'startDay'. 
    // Si hoy es día 5 y el ciclo empieza el 28, el período actual comenzó el 28 del mes pasado.
    // Si hoy es 30 y el ciclo empieza el 28, el período actual comenzó el 28 de este mes.

    let start, end;

    if (day >= startDay) {
        // Estamos en el período que comenzó este mes
        start = new Date(year, month, startDay, 0, 0, 0);
        end = new Date(year, month + 1, startDay - 1, 23, 59, 59);
    } else {
        // Estamos en el período que comenzó el mes pasado
        start = new Date(year, month - 1, startDay, 0, 0, 0);
        end = new Date(year, month, startDay - 1, 23, 59, 59);
    }

    return { start: start.getTime(), end: end.getTime() };
}

/**
 * Obtiene el nombre del periodo (ej: "Ciclo: 28 Jun - 27 Jul")
 */
export function formatPeriodName(start: number, end: number) {
    const s = new Date(start);
    const e = new Date(end);

    const sLabel = s.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const eLabel = e.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return `${sLabel} — ${eLabel}`;
}
