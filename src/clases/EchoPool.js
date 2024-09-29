import { Echocolocation } from './EchoLocation.js';

export class EchoPool {
    constructor(game, poolSize) {
        this.game = game;
        this.poolSize = poolSize;
        this.echoes = [];

        // Crear el pool de ecos
        for (let i = 0; i < poolSize; i++) {
            const echo = new Echocolocation(0, 0, 'echo', this.game)
            this.echoes.push(echo);
        }
    }

    // Obtener un eco del pool
    getEcho(x, y, rotation) {
       
        const echo = this.echoes.find(b => !b.active);
        // console.log(echo)
        if (echo) {
            echo.fire(x, y, rotation);  // Activar eco con posición y rotación
        }
    }

    // Actualizar todos los ecos
    update(delta) {
        for (const echo of this.echoes) {
            if (echo.active) {
                echo.update(delta);  // Actualizar solo ecos activas
            }
        }
    }
}