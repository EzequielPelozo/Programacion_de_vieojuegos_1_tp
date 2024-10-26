import { Entity2D } from "./Entity2D";

export class Player extends Entity2D {
    constructor(x, y, image, game) {

        super(x, y, image, game);

        this.name = "Player";
        this.echoCharges = 3; // Inicializar cargas de eco

        this.keys = {}; // Objeto para manejar el estado de las teclas  

        this.isFiring = false;   // Controlar si ya se disparó el eco

        window.addEventListener('keydown', this.onKeyDown.bind(this)); // Configurar los eventos del teclado
        window.addEventListener('keyup', this.onKeyUp.bind(this));

    }

    update(delta) {
        super.update(delta);

        if (!this.listo) return;

        // Comentar esta línea si es necesaria la fricción después de mover
        // this.speed *= this.friction; 

        this.bounceOnEdges(delta);
        this.checkKeys(delta); // Chequear los inputs

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

    checkKeys(delta) {
        // Controlar rotación y aceleración basado en las teclas presionadas
        if (this.keys['KeyA']) {
            this.sprite.rotation -= this.rotationSpeed * delta.deltaTime;
        }
        if (this.keys['KeyD']) {
            this.sprite.rotation += this.rotationSpeed * delta.deltaTime;
        }
        if (this.keys['KeyW']) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }
        if (this.keys['KeyS']) {
            this.speed = Math.max(this.speed - this.acceleration, 0); // Evitar velocidad negativa
        }
        if (this.keys['KeyM']) {
            // Solo disparar si no se está disparando y tengo cargas
            if (!this.isFiring && this.game.echoCharges > -1) {
                this.isFiring = true; // Marcar que se está disparando

                this.game.echoCharges--; // Reducir cargas de eco
                //this.updateEchoDisplay();
                const { x, y, rotation } = this.sprite;
                this.game.echoPool.getEcho(x, y, rotation); // Disparar el eco


                // Activar el estado 'follow' en los peces cercanos
                this.game.fishes.forEach(fish => {
                    const distance = this.getDistance(fish.sprite);
                    if (distance < 500) { // Cambia 150 por la distancia que consideres adecuada
                        fish.activateFollow();
                        setTimeout(() => {
                            fish.deactivateFollow();
                        }, 10000); // 10 segundos en milisegundos
                    }
                });

            }
        }
        //reiniciar el juego solo si esta finalizado
        if (this.keys['KeyR']) {
            if (this.game.gameOver) {
                this.game.restartGame();
            }

        }
    }

    // Método para obtener la distancia hasta otro sprite
    getDistance(otherSprite) {
        const dx = this.sprite.x - otherSprite.x;
        const dy = this.sprite.y - otherSprite.y;
        return Math.sqrt(dx * dx + dy * dy);
    }



}