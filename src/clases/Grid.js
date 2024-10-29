export class Grid {
    constructor(cellSize, width, height) {
        this.cellSize = cellSize; // Tamaño de cada celda
        this.width = width;
        this.height = height;

        // Crear la grilla inicial
        this.grid = new Map();
    }

    // Función para obtener el índice de una celda basado en una posición
    getCellIndex(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`; // Índice único para la celda
    }

    // Función para agregar un pez a la grilla
    addFish(fish) {
        const index = this.getCellIndex(fish.sprite.x, fish.sprite.y);
        if (!this.grid.has(index)) {
            this.grid.set(index, []);
        }
        this.grid.get(index).push(fish);
    }

    // Función para limpiar y reorganizar la grilla
    updateGrid(fishes) {
        this.grid.clear();
        fishes.forEach(fish => this.addFish(fish));
    }

    // Obtener los vecinos cercanos de una posición específica
    getNeighbors(fish) {
        const neighbors = [];
        const index = this.getCellIndex(fish.sprite.x, fish.sprite.y);
        const [cellX, cellY] = index.split(',').map(Number);

        // Verificar las celdas adyacentes (incluyendo la celda actual)
        for (let x = cellX - 1; x <= cellX + 1; x++) {
            for (let y = cellY - 1; y <= cellY + 1; y++) {
                const neighborIndex = `${x},${y}`;
                if (this.grid.has(neighborIndex)) {
                    neighbors.push(...this.grid.get(neighborIndex));
                }
            }
        }
        return neighbors;
    }
}
