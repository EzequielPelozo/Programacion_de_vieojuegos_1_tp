import { Entity2D } from "./Entity2D";
import * as PIXI from 'pixi.js';

import playerFrame0 from '../sprites/dolphin/dolphin-0.png';  // Usa la ruta relativa
import playerFrame1 from '../sprites/dolphin/dolphin-1.png';
import playerFrame2 from '../sprites/dolphin/dolphin-2.png';

import PlayerEating from '../sprites/dolphin/dolphin-eating.png';

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

        this.eatingTexture = PIXI.Texture.from(PlayerEating); // Imagen para el estado "comiendo" (o cualquier otro)

        // Crear AnimatedSprite para la animación
        this.animatedTexture = new PIXI.AnimatedSprite([
            PIXI.Texture.from(playerFrame0),
            PIXI.Texture.from(playerFrame1),
            PIXI.Texture.from(playerFrame2),
            PIXI.Texture.from(playerFrame1)
        ]);

        // Configuración de la animación
        this.animatedTexture.animationSpeed = 0.1;
        this.animatedTexture.loop = true;
        this.animatedTexture.visible = false;

        this.playerAnimation = this.animatedTexture;
        this.playerAnimation.play();  

        this.playerAnimation.scale = this.sprite.scale;
        this.playerAnimation.anchor.set(0.5);  

        this.playerAnimation.x = this.sprite.x;
        this.playerAnimation.y = this.sprite.y;
        this.container.addChild(this.playerAnimation);

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    update(delta, gameOver) {
        super.update(delta);

        if (!this.listo) return;

        this.bounceOnEdges(delta);
        this.checkKeys(delta, gameOver);


        // Verificar colisión con peces
        const collidedFish = this.game.fishes.find(fish => this.checkCollisionWithFish(fish));

        if (this.keys['KeyE'] && collidedFish) {
            this.eatFish(collidedFish); // Lógica para comer al pez
        }

        const dy = Math.cos(this.container.rotation);
        const dx = Math.sin(this.container.rotation);

        this.container.x += dx * this.speed * delta.deltaTime;
        this.container.y -= dy * this.speed * delta.deltaTime;

        this.x = this.container.x;
        this.y = this.container.y;

        this.speed *= this.friction;

        // Actualiza el tiempo de vida de las ondas y los peces activados
        this.updateEchoes();
        this.updateActiveFishes();
        //Chequea la velocidad del jugador y cambia la velocidad de animacion 
        this.checkSpeedAndChangeAnimationSpeed();

    }

    onKeyDown(event) {
        if (!this.listo) return;
        this.keys[event.code] = true;
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
        if (event.code === 'KeyM' || event.code === 'Space') {
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
        if (this.keys['KeyA']) this.container.rotation -= this.rotationSpeed * delta.deltaTime;
        if (this.keys['KeyD']) this.container.rotation += this.rotationSpeed * delta.deltaTime;
    }

    handleAcceleration() {
        if (this.keys['KeyW']) this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        if (this.keys['KeyS']) this.speed = Math.max(this.speed - this.acceleration, 0);
    }

    handleShooting(delta) {
        if ((this.keys['KeyM'] || this.keys['Space']) && !this.isFiring && this.game.echoCharges > 0) {

            this.playerAnimation.visible = false;
            this.sprite.visible = true;
            
            //textura de comer
            this.sprite.texture = this.eatingTexture;
            this.isFiring = true;
            this.game.echoCharges--;
            this.game.echoPool.getEcho(this.container.x, this.container.y, this.container.rotation);

            this.createEchoWave();  // Genera la onda expansiva
            this.activateNearbyFish();
        } else if (!this.isFiring) {

            this.sprite.visible = false;
            this.playerAnimation.visible = true; 

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
        wave.x = this.container.x;
        wave.y = this.container.y;

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
    //         const distance = this.getDistanceTo(fish.Container);
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
            const distance = this.getDistanceTo(fish.container);
            if (distance < this.followdistance && !fish.isFollowing) {
                fish.activateFollow();
                this.activeFishes.push({ fish, startFrame: this.game.framenum, followFrames: this.game.fpsCounter * 7 }); // 7 segundos en frames (AverageFPS * 7)
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

    getDistanceTo(otherContainer) {
        const dx = this.container.x - otherContainer.x;
        const dy = this.container.y - otherContainer.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    getApproximateDistanceTo(otherContainer) {
        const dx = Math.abs(this.container.x - otherContainer.x);
        const dy = Math.abs(this.container.y - otherContainer.y);

        const maxDistance = Math.max(dx, dy);
        const minDistance = Math.min(dx, dy);

        return maxDistance * 0.7 + minDistance * 0.3;
    }

    checkSpeedAndChangeAnimationSpeed(){

        if(this.speed > 6 && this.speed < 10 ){
            this.animatedTexture.animationSpeed = 0.25;
        }else if(this.speed > 2 && this.speed < 6){
            this.animatedTexture.animationSpeed = 0.15;
        }else{
            this.animatedTexture.animationSpeed = 0.1;
        }
    }

    checkCollisionWithFish(fish) {
        const dx = this.container.x - fish.container.x; // Usar container en lugar de sprite
        const dy = this.container.y - fish.container.y;
        const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
        return distance < (this.sprite.width / 2 + fish.sprite.width / 2+10); // Verifica radio de colisión
    }
    
    eatFish(fish) {
        // Remueve el pez de la lista de peces
        const index = this.game.fishes.indexOf(fish);
        if (index !== -1) {
            this.game.fishes.splice(index, 1);
        }
    
        // Remueve el pez del contenedor principal
        this.mainContainer.removeChild(fish.container);
    
        // Sumar puntos y log adicional
        this.game.score += 10;
        console.log(`¡Te comiste un pez! Puntos: ${this.game.score}`);
    }
}