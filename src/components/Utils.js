export function lerp(a, b, t) {
    // Asegúrate de que t esté en el rango [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    return a + (b - a) * t;
}