import { Entity2D } from './Entity2D';
import * as PIXI from 'pixi.js';

export class Fish extends Entity2D {
    constructor(x, y, image, game) {
        super(x, y, image, game);
        this.name = "Fish";
        this.velocity = new PIXI.Point(Math.random() * 2 - 1, Math.random() * 2 - 1); // Dirección inicial aleatoria
        this.acceleration = new PIXI.Point(0, 0);
        this.maxForce = 0.05; // Fuerza máxima que puede aplicar
        this.neighborRadius = 100; // Radio para considerar a otros peces cercanos
        this.avoidRadius = 150;    // Radio de evitación para el Player
        this.pushForce = 1;    // Fuerza de empuje al colisionar
    }

    // Método que se llamará en cada frame
    update(delta, fishes, player) {
        if (!this.listo) return;

        // Aplicar las 3 reglas de Boids
        let separationForce = this.separation(fishes);
        let alignmentForce = this.alignment(fishes);
        let cohesionForce = this.cohesion(fishes);

        // Nueva regla de evitación del jugador
        const avoidanceForce = this.avoidPlayer(player);

        // Sumar todas las fuerzas (incluida la evitación del jugador)
        this.acceleration.set(
            separationForce.x + alignmentForce.x + cohesionForce.x + avoidanceForce.x,
            separationForce.y + alignmentForce.y + cohesionForce.y + avoidanceForce.y
        );

        // Aplicar la aceleración a la velocidad
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        // Limitar la velocidad máxima
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }

        // Mover el pez usando la velocidad
        this.sprite.x += this.velocity.x * delta.deltaTime;
        this.sprite.y += this.velocity.y * delta.deltaTime;

        // Actualizar la rotación en función de la dirección de la velocidad
        this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2; // Se Suma es para que "miren" hacia adelante

        // Envolver el pez alrededor de los bordes de la pantalla
        this.wrapAroundScreen();
    }

     // Regla para evitar al jugador (Player)
     avoidPlayer(player) {
        let steer = new PIXI.Point(0, 0);
        const dx = this.sprite.x - player.sprite.x;
        const dy = this.sprite.y - player.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
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
    
    // Regla de separación: Evitar que los peces se acerquen demasiado
    separation(fishes) {
        let steer = new PIXI.Point(0, 0);
        let count = 0;

        for (let other of fishes) {
            let dx = this.sprite.x - other.sprite.x;
            let dy = this.sprite.y - other.sprite.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (other !== this && distance < 50) { // Distancia mínima de separación
                const diff = new PIXI.Point(dx / distance, dy / distance);
                steer.x += diff.x;
                steer.y += diff.y;
                count++;
            }
        }

        if (count > 0) {
            steer.x /= count;
            steer.y /= count;
        }

        if (Math.sqrt(steer.x * steer.x + steer.y * steer.y) > 0) {
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

        for (let other of fishes) {
            const distance = Math.sqrt(
                (this.sprite.x - other.sprite.x) ** 2 + 
                (this.sprite.y - other.sprite.y) ** 2
            );

            if (other !== this && distance < this.neighborRadius) {
                avgVelocity.x += other.velocity.x;
                avgVelocity.y += other.velocity.y;
                count++;
            }
        }

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

        for (let other of fishes) {
            const distance = Math.sqrt(
                (this.sprite.x - other.sprite.x) ** 2 + 
                (this.sprite.y - other.sprite.y) ** 2
            );

            if (other !== this && distance < this.neighborRadius) {
                centerOfMass.x += other.sprite.x;
                centerOfMass.y += other.sprite.y;
                count++;
            }
        }

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
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length > 0) {
            return new PIXI.Point(vector.x / length, vector.y / length);
        }
        return vector;
    }

    // Limita la magnitud de un vector
    limit(vector, max) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length > max) {
            return new PIXI.Point((vector.x / length) * max, (vector.y / length) * max);
        }
        return vector;
    }
}
