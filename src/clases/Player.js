import { Entity2D } from "./Entity2D";
import * as PIXI from 'pixi.js';

export class Player extends Entity2D {
    constructor(x, y, image, game, mainContainer) {
        super(x, y, image, game);

        this.mainContainer = mainContainer;
        this.name = "Player";
        this.echoCharges = 3;
        this.followdistance = 500;
        this.keys = {};
        this.isFiring = false;
        this.echoes = []; // Array para almacenar las ondas activas
        this.activeFishes = []; // Array para peces activados con su tiempo de activación

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    update(delta, gameOver) {
        super.update(delta);

        if (!this.listo) return;

        this.bounceOnEdges(delta);
        this.checkKeys(delta, gameOver);

        const dy = Math.cos(this.sprite.rotation);
        const dx = Math.sin(this.sprite.rotation);

        this.sprite.x += dx * this.speed * delta.deltaTime;
        this.sprite.y -= dy * this.speed * delta.deltaTime;

        this.x = this.sprite.x;
        this.y = this.sprite.y;

        this.speed *= this.friction;

        // Actualiza el tiempo de vida de las ondas y los peces activados
        this.updateEchoes();
        this.updateActiveFishes();

    }

    onKeyDown(event) {
        if (!this.listo) return;
        this.keys[event.code] = true;
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
        if (event.code === 'KeyM') {
            this.isFiring = false;
        }
    }

    checkKeys(delta, gameOver) {
        if (!gameOver) {
            this.handleRotation(delta);
            this.handleAcceleration();
            this.handleShooting(delta);
        }
        this.handleRestart();
    }

    handleRotation(delta) {
        if (this.keys['KeyA']) this.sprite.rotation -= this.rotationSpeed * delta.deltaTime;
        if (this.keys['KeyD']) this.sprite.rotation += this.rotationSpeed * delta.deltaTime;
    }

    handleAcceleration() {
        if (this.keys['KeyW']) this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        if (this.keys['KeyS']) this.speed = Math.max(this.speed - this.acceleration, 0);
    }

    handleShooting(delta) {
        if (this.keys['KeyM'] && !this.isFiring && this.game.echoCharges > 0) {
            this.isFiring = true;
            this.game.echoCharges--;
            this.game.echoPool.getEcho(this.sprite.x, this.sprite.y, this.sprite.rotation);

            this.createEchoWave();  // Genera la onda expansiva
            this.activateNearbyFish();
        }
    }

    handleRestart() {
        if (this.keys['KeyR'] && this.game.gameOver) this.game.restartGame();
    }

    // Método para crear el efecto de onda expansiva
    createEchoWave() {
        const wave = new PIXI.Graphics();
        wave.beginFill(0xFFFFFF, 0.2);
        wave.drawCircle(0, 0, this.followdistance);
        wave.endFill();
        wave.x = this.sprite.x;
        wave.y = this.sprite.y;

        // Define el número de frames de vida del eco
        wave.startFrame = this.game.framenum;
        wave.lifeFrames = 60; // Duración en frames (60 frames, aproximadamente 1 segundo a 60 FPS)

        this.mainContainer.addChild(wave);
        this.echoes.push(wave); // Agrega el eco al array de ecos activos
    }

    // Actualiza y elimina las ondas según el contador de frames
    updateEchoes() {
        this.echoes = this.echoes.filter(wave => {
            const frameDiff = this.game.framenum - wave.startFrame;
            if (frameDiff >= wave.lifeFrames) {
                this.mainContainer.removeChild(wave); // Elimina el eco si superó su vida útil
                return false; // No mantener en el array
            }
            return true; // Mantener el eco en el array si aún tiene vida
        });
    }

    // activateNearbyFish() {
    //     this.game.fishes.forEach(fish => {
    //         const distance = this.getDistanceTo(fish.sprite);
    //         if (distance < this.followdistance) {
    //             fish.activateFollow();
    //             setTimeout(() => {
    //                 fish.deactivateFollow();
    //             }, 7000); // 7 segundos en milisegundos
    //         }
    //     });
    // }

    // Método para activar los peces cercanos
    activateNearbyFish() {
        this.game.fishes.forEach(fish => {
            const distance = this.getDistanceTo(fish.sprite);
            if (distance < this.followdistance && !fish.isFollowing) {
                fish.activateFollow();
                this.activeFishes.push({ fish, startFrame: this.game.framenum, followFrames: 420 }); // 7 segundos en frames (420 a 60 FPS)
            }
        });
    }

    // Actualiza el estado de los peces activados y los desactiva si han excedido su tiempo de vida
    updateActiveFishes() {
        this.activeFishes = this.activeFishes.filter(({ fish, startFrame, followFrames }) => {
            const frameDiff = this.game.framenum - startFrame;
            if (frameDiff >= followFrames) {
                fish.deactivateFollow(); // Desactiva el seguimiento si el tiempo ha expirado
                return false; // Elimina del array
            }
            return true; // Mantén en el array si aún debe seguir
        });
    }

    getDistanceTo(otherSprite) {
        const dx = this.sprite.x - otherSprite.x;
        const dy = this.sprite.y - otherSprite.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    getApproximateDistanceTo(otherSprite) {
        const dx = Math.abs(this.sprite.x - otherSprite.x);
        const dy = Math.abs(this.sprite.y - otherSprite.y);

        const maxDistance = Math.max(dx, dy);
        const minDistance = Math.min(dx, dy);

        return maxDistance * 0.7 + minDistance * 0.3;
    }
}
