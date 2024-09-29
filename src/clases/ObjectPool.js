export class ObjectPool {
    constructor(createFn, initialSize = 0) {
        this.createFn = createFn;  // Función que crea nuevos objetos
        this.pool = [];            // Array que actúa como el pool de objetos

        // Preinicializar el pool con una cantidad inicial de objetos
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    // Método para obtener un objeto del pool
    acquire(...args) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();  // Recuperar un objeto del pool
        } else {
            obj = this.createFn(...args);  // Crear un nuevo objeto si el pool está vacío
        }

        // Inicializar o resetear el objeto si es necesario (opcional)
        if (typeof obj.initialize === 'function') {
            obj.initialize(...args);
        }

        return obj;
    }

    // Método para devolver un objeto al pool
    release(obj) {
        if (typeof obj.reset === 'function') {
            obj.reset();  // Resetear el objeto si tiene un método reset
        }
        this.pool.push(obj);  // Devolver el objeto al pool
    }
}

// EJEMPLO DE IMPLEMENTACION DE POOL
// class Enemy {
//     constructor(x = 0, y = 0, health = 100) {
//         this.initialize(x, y, health);
//     }

//     initialize(x, y, health) {
//         this.x = x;
//         this.y = y;
//         this.health = health;
//         this.active = true;
//     }

//     reset() {
//         this.active = false;
//         this.x = 0;
//         this.y = 0;
//         this.health = 0;
//     }
// }

// // Crear un pool para enemigos con 10 enemigos preinicializados
// const enemyPool = new ObjectPool(() => new Enemy(), 10);

// // Adquirir un enemigo del pool
// const enemy1 = enemyPool.acquire(10, 20, 100);

// // Usar el enemigo en el juego
// console.log(enemy1);

// // Devolver el enemigo al pool cuando ya no se necesita
// enemyPool.release(enemy1);

// // Adquirir otro enemigo del pool
// const enemy2 = enemyPool.acquire(30, 40, 200);
