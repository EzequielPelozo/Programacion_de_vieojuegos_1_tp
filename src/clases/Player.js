import { Entity2D } from "./Entity2D";
import * as PIXI from 'pixi.js';

export class Player extends Entity2D {
    constructor(x, y, image, game, mainContainer) {

        super(x, y, image, game);
        
        this.mainContainer = mainContainer;
        this.name = "Player";
        this.echoCharges = 3; // Inicializar cargas de eco
        this.followdistance = 500; // Inicializar cargas de eco

        this.keys = {}; // Objeto para manejar el estado de las teclas  

        this.isFiring = false;   // Controlar si ya se disparó el eco

        window.addEventListener('keydown', this.onKeyDown.bind(this)); // Configurar los eventos del teclado
        window.addEventListener('keyup', this.onKeyUp.bind(this));

    }

    update(delta, gameOver) {
        super.update(delta);

        if (!this.listo) return;

        // Comentar esta línea si es necesaria la fricción después de mover
        // this.speed *= this.friction; 

        this.bounceOnEdges(delta);
        this.checkKeys(delta,gameOver); // Chequear los inputs

        // Calcular el desplazamiento en los ejes X e Y basado en la velocidad y rotación
        const dy = Math.cos(this.sprite.rotation); // Direccion en Y
        const dx = Math.sin(this.sprite.rotation); // Direccion en X

        // Actualizar la posición del sprite
        this.sprite.x += dx * this.speed * delta.deltaTime;
        this.sprite.y -= dy * this.speed * delta.deltaTime; // Se resta porque Y aumenta hacia abajo

        this.x = this.sprite.x;
        this.y = this.sprite.y; // Actualizar la posición en variables locales         

        // Aplicar fricción aquí después de mover el jugador
        this.speed *= this.friction;
    }

    // Evento para cuando una tecla se presiona
    onKeyDown(event) {
        if (!this.listo) return;
        this.keys[event.code] = true;  // Marca la tecla como presionada
    }

    // Evento para cuando una tecla se suelta
    onKeyUp(event) {
        this.keys[event.code] = false; // Marca la tecla como no presionada

        // Cuando se suelte la tecla "M", permitir disparar de nuevo SI CAMBIO TECLA DE DISPARO CAMBIAR
        if (event.code === 'KeyM') {
            this.isFiring = false;  // Reiniciar el estado de disparo
        }
    }

    checkKeys(delta,gameOver) {
        if (!gameOver) {
            this.handleRotation(delta);
            this.handleAcceleration();
            this.handleShooting();
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

            this.createEchoWave(delta);  // Generar la onda expansiva
            this.activateNearbyFish();
        }
    }
    
    handleRestart() {
        if (this.keys['KeyR'] && this.game.gameOver) this.game.restartGame();
    }


    // Método para crear el efecto de onda expansiva
    createEchoWave(delta) {
        const wave = new PIXI.Graphics()
        wave.circle(0, 0, this.followdistance)
        wave.fill(0xFFFFFF,0.2);
        wave.x = this.sprite.x;
        wave.y = this.sprite.y;

        this.mainContainer.addChild(wave);

        setTimeout(() => {
            this.mainContainer.removeChild(wave); // Elimina el gráfico después de 1 segundo (ajusta el tiempo si es necesario)
        }, 1000);
    }
    
    activateNearbyFish(){
                    // Activar el estado 'follow' en los peces cercanos
                    this.game.fishes.forEach(fish => {
                        const distance = this.getDistanceTo(fish.sprite);
                        if (distance < this.followdistance) {
                            fish.activateFollow();
                            setTimeout(() => {
                                fish.deactivateFollow();
                            }, 7000); // 7 segundos en milisegundos
                        }
                    });
                }

    // Método para obtener la distancia hasta otro sprite
    getDistanceTo(otherSprite) {
        const dx = this.sprite.x - otherSprite.x;
        const dy = this.sprite.y - otherSprite.y;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }

    // Método para obtener la distancia aproximada hasta un punto
    getApproximateDistanceTo(otherSprite) {
        const dx = Math.abs(this.sprite.x - otherSprite.x);
        const dy = Math.abs(this.sprite.y - otherSprite.y);
        
        // Determinar la distancia mayor y menor
        const maxDistance = Math.max(dx, dy);
        const minDistance = Math.min(dx, dy);
        
        // Aplicar la aproximación
        return maxDistance * 0.7 + minDistance * 0.3;
    }
    

}