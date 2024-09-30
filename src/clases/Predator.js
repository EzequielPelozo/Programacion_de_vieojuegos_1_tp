import { Entity2D } from './Entity2D';
import * as PIXI from 'pixi.js';

export class Predator extends Entity2D {
    constructor(x, y, image, game) {
        super(x, y, image, game);
        this.name = "Predator";
        this.velocity = new PIXI.Point(Math.random() * 2 - 1, Math.random() * 2 - 1); // Dirección inicial aleatoria
        this.acceleration = new PIXI.Point(0, 0);
        this.maxForce = 0.05; // Fuerza máxima que puede aplicar
        this.pushForce = 1;    // Fuerza de empuje al colisionar
    }

    // Método que se llamará en cada frame
    update(delta, player) {
        if (!this.listo) return;

        //se calcula la fuerza de atraccion
        let cohesionForce = this.cohesion(player);

        //se settea fuerza de atraccion como aceleracion
        this.acceleration.set(
            cohesionForce.x,
            cohesionForce.y
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

        // Mover usando la velocidad
        this.sprite.x += this.velocity.x * delta.deltaTime;
        this.sprite.y += this.velocity.y * delta.deltaTime;

        // Actualizar la rotación en función de la dirección de la velocidad
        this.sprite.rotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2; // Se Suma es para que "miren" hacia adelante

        // Envuelve al enemigo alrededor de los bordes de la pantalla
        this.wrapAroundScreen();
    }

    //Mover hacia el centro de masa del jugador
    cohesion(player) {
        let centerOfMass = new PIXI.Point(0, 0);
        let count = 0;

        if (player !== this) {
            centerOfMass.x += player.sprite.x;
            centerOfMass.y += player.sprite.y;
            count++;
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
