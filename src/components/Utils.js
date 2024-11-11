export function lerp(a, b, t) {
    // Asegúrate de que t esté en el rango [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    return a + (b - a) * t;
}

export function calculateDistance(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    if (dx > dy) {
        return dx + 0.4 * dy;
    } else {
        return dy + 0.4 * dx;
    }
}