import { Entity2D } from './Entity2D';
import * as PIXI from 'pixi.js';

export class Fish extends Entity2D {
    constructor(x, y, image, game) {
        super(x, y, image, game);
        this.name = "Fish";
        this.velocity = new PIXI.Point(Math.random() * 2 - 1, Math.random() * 2 - 1); // Dirección inicial aleatoria
        this.acceleration = new PIXI.Point(0, 0);
        this.maxSpeed = 10;
        this.maxForce = 0.05; // Fuerza máxima que puede aplicar
        this.neighborRadius = 100; // Radio para considerar a otros peces cercanos
        this.avoidRadius = 150;    // Radio de evitación para el Player
        this.pushForce = 1;    // Fuerza de empuje al colisionar
        this.state = 'idle'; // Estado inicial

        // Reducir el tamaño del pez al 10%
        this.sprite.scale.set(0.1); // Escala en x e y
        
        // Propiedades para almacenar la última velocidad y posición calculadas
        this.lastVelocity = new PIXI.Point(this.velocity.x, this.velocity.y);
        this.lastPosition = new PIXI.Point(x, y); // Posición inicial del pez
    }

    // Método que se llamará en cada frame
    update(delta, fishes, player, framenum) {
        if (!this.listo) return;
    
        // Solo recalculamos aceleración y velocidad cada 3 frames
        if (framenum % 1 === 0) {
            if (this.state === 'idle') {
                // Aplicar las 3 reglas de Boids
                let separationForce = this.separation(fishes);
                let alignmentForce = this.alignment(fishes);
                let cohesionForce = this.cohesion(fishes);
                const avoidanceForce = this.avoidPlayer(player);
    
                this.acceleration.set(
                    separationForce.x + alignmentForce.x + cohesionForce.x + avoidanceForce.x,
                    separationForce.y + alignmentForce.y + cohesionForce.y + avoidanceForce.y
                );
            } else if (this.state === 'follow') {
                // Comportamiento al seguir al jugador
                this.followPlayer(player);
            }
    
            // Aplicar la aceleración a la velocidad
            this.velocity.x += this.acceleration.x;
            this.velocity.y += this.acceleration.y;
    
            // Limitar la velocidad máxima
            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (speed > this.maxSpeed) {
                this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
                this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
            }
    
            // Guardamos las últimas posiciones calculadas
            this.lastVelocity.set(this.velocity.x, this.velocity.y);
            this.lastPosition.set(this.sprite.x, this.sprite.y);
        }
    
        // Usamos las últimas velocidades calculadas en cada frame
        this.sprite.x += this.lastVelocity.x * delta.deltaTime;
        this.sprite.y += this.lastVelocity.y * delta.deltaTime;
    
        // Actualizar la rotación en función de la dirección de la velocidad
        this.sprite.rotation = Math.atan2(this.lastVelocity.y, this.lastVelocity.x) + Math.PI / 2;
    
        // Envolver el pez alrededor de los bordes de la pantalla
        this.wrapAroundScreen();
    }
    

     // Regla para evitar al jugador (Player)
     avoidPlayer(player) {
        let steer = new PIXI.Point(0, 0);
        const dx = this.sprite.x - player.sprite.x;
        const dy = this.sprite.y - player.sprite.y;
        const distance = this.getApproximateDistanceTo(player.sprite)
    
        const combinedRadii = (this.sprite.width / 2) + (player.sprite.width / 2); // Suma de los radios del Fish y el Player
    
        // Si el jugador está dentro del radio de evitación
        if (distance < this.avoidRadius) {
            // Generar fuerza de alejamiento (evitación)
            steer.set(dx / distance, dy / distance);  // Direccionamos la fuerza alejándose del player
    
            steer = this.normalize(steer); // Normalizamos el vector de evitación
            steer.x *= this.maxSpeed;
            steer.y *= this.maxSpeed;
    
            // Restar la velocidad actual para generar la fuerza de steer (dirección de movimiento)
            steer.x -= this.velocity.x;
            steer.y -= this.velocity.y;
    
            // Limitar la fuerza de evitación
            steer = this.limit(steer, this.maxForce);
    
            // Verificar si hay colisión (si están tocándose)
            if (distance < combinedRadii) {
                // Si están en colisión, aplicar empuje adicional
                const pushX = (dx / distance) * this.pushForce;
                const pushY = (dy / distance) * this.pushForce;
    
                // Ajustar posición para evitar penetración
                this.sprite.x += pushX;
                this.sprite.y += pushY;
    
                // Ajustar la velocidad para simular el empuje
                this.velocity.x += pushX;
                this.velocity.y += pushY;
            }
        }
    
        return steer; // Devolver la fuerza de evitación (si el jugador está cerca)
    }

    // Método para cambiar al estado follow
    followPlayer(player) {
        const targetPosition = new PIXI.Point(player.sprite.x, player.sprite.y);
        const distance = this.getApproximateDistanceTo(targetPosition);
        
        // Lógica para moverse hacia el jugador y alrededor de él
        if (distance > 50) { // Distancia mínima para acercarse
            this.acceleration = this.seek(targetPosition);
        } else {
            // Movimiento alrededor del jugador
            const offset = Math.random() * Math.PI * 2; // Ángulo aleatorio para distribuir los peces alrededor
            this.acceleration = new PIXI.Point(
                Math.cos(offset) * 0.5, // Ajustar la distancia alrededor
                Math.sin(offset) * 0.5
            );
        }
    }

    // Método para activar el estado follow
    activateFollow() {
        this.state = 'follow';
    }

    // Método para volver al estado idle (puedes llamarlo cuando sea necesario)
    deactivateFollow() {
        this.state = 'idle';
    }    
    
    // Regla de separación: Evitar que los peces se acerquen demasiado
    separation(fishes) {
        let steer = new PIXI.Point(0, 0);
        let count = 0;

        // Obtener los peces cercanos de la grilla
        const nearbyFishes = this.game.grid.getNeighbors(this);

        // Iterar solo sobre los peces cercanos en la grilla
        nearbyFishes.forEach(other => {
            if (other !== this) {
                let dx = this.sprite.x - other.sprite.x;
                let dy = this.sprite.y - other.sprite.y;
                let distance = this.getApproximateDistanceTo(other.sprite);

                if (distance < 50) { // Rango de separación
                    const diff = new PIXI.Point(dx / distance, dy / distance);
                    steer.x += diff.x;
                    steer.y += diff.y;
                    count++;
                }
            }
        });

        if (count > 0) {
            steer.x /= count;
            steer.y /= count;
        }

        if (steer.x ** 2 + steer.y ** 2 > 0) {
            steer = this.normalize(steer);
            steer.x *= this.maxSpeed;
            steer.y *= this.maxSpeed;

            steer.x -= this.velocity.x;
            steer.y -= this.velocity.y;

            steer = this.limit(steer, this.maxForce); // Limitar la fuerza aplicada
        }

        return steer;
    }

    // Regla de alineación: Alinear la dirección del pez con sus vecinos cercanos
    alignment(fishes) {
        let avgVelocity = new PIXI.Point(0, 0);
        let count = 0;

        // Obtener los peces cercanos de la grilla
        const nearbyFishes = this.game.grid.getNeighbors(this);

        // Iterar solo sobre los peces cercanos en la grilla
        nearbyFishes.forEach(other => {
            if (other !== this) {
                const distance = this.getDistanceTo(other.sprite);

                if (distance < this.neighborRadius) {
                    avgVelocity.x += other.velocity.x;
                    avgVelocity.y += other.velocity.y;
                    count++;
                }
            }
        });

        if (count > 0) {
            avgVelocity.x /= count;
            avgVelocity.y /= count;
            avgVelocity = this.normalize(avgVelocity);

            avgVelocity.x *= this.maxSpeed;
            avgVelocity.y *= this.maxSpeed;

            const steer = new PIXI.Point(
                avgVelocity.x - this.velocity.x,
                avgVelocity.y - this.velocity.y
            );

            return this.limit(steer, this.maxForce);
        }

        return new PIXI.Point(0, 0);
    }


    // Regla de cohesión: Moverse hacia el centro de masa de los vecinos cercanos
    cohesion(fishes) {
        let centerOfMass = new PIXI.Point(0, 0);
        let count = 0;

        // Obtener los peces cercanos de la grilla
        const nearbyFishes = this.game.grid.getNeighbors(this);

        // Iterar solo sobre los peces cercanos en la grilla
        nearbyFishes.forEach(other => {
            if (other !== this) {
                const distance = this.getDistanceTo(other.sprite);

                if (distance < this.neighborRadius) {
                    centerOfMass.x += other.sprite.x;
                    centerOfMass.y += other.sprite.y;
                    count++;
                }
            }
        });

        if (count > 0) {
            centerOfMass.x /= count;
            centerOfMass.y /= count;

            return this.seek(centerOfMass);
        }

        return new PIXI.Point(0, 0);
    }


    // Método para moverse hacia un objetivo
    seek(target) {
        let desired = new PIXI.Point(
            target.x - this.sprite.x,
            target.y - this.sprite.y
        );

        desired = this.normalize(desired);
        desired.x *= this.maxSpeed;
        desired.y *= this.maxSpeed;

        const steer = new PIXI.Point(
            desired.x - this.velocity.x,
            desired.y - this.velocity.y
        );

        return this.limit(steer, this.maxForce);
    }

    // Normaliza un vector para que tenga longitud 1
    normalize(vector) {
        const length = this.getVectorResult(vector);
        if (length > 0) {
            return new PIXI.Point(vector.x / length, vector.y / length);
        }
        return vector;
    }

    // Limita la magnitud de un vector
    limit(vector, max) {
        const length = this.getVectorResult(vector);
        if (length > max) {
            return new PIXI.Point((vector.x / length) * max, (vector.y / length) * max);
        }
        return vector;
    }

    // Método para obtener la resultante de un vector
    getVectorResult(vector){
        return Math.sqrt(vector.x ** 2 + vector.y ** 2);
    }

    // Método para obtener la distancia hasta un punto
    getDistanceTo(target) {
        const dx = this.sprite.x - target.x;
        const dy = this.sprite.y - target.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    // Método para obtener la distancia aproximada hasta un punto
    getApproximateDistanceTo(target) {
        const dx = Math.abs(this.sprite.x - target.x);
        const dy = Math.abs(this.sprite.y - target.y);
        
        // Determinar la distancia mayor y menor
        const maxDistance = Math.max(dx, dy);
        const minDistance = Math.min(dx, dy);
        
        // Aplicar la aproximación
        return maxDistance * 0.7 + minDistance * 0.3;
    }

}