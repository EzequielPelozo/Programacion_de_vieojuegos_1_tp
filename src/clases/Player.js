import { Entity2D } from "./Entity2D";

export class Player extends Entity2D {
    constructor(x, y, image, game) {   
        
        super(x, y, image, game);

        this.name = "Player";

        this.keys = {}; // Objeto para manejar el estado de las teclas  
        
        this.isFiring = false;   // Controlar si ya se disparó el eco

        window.addEventListener('keydown', this.onKeyDown.bind(this)); // Configurar los eventos del teclado
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
    }   

    update(delta) {
        super.update(delta);

        if (!this.listo) return;       
        // console.log(this.name)
        // Revisar colisiones 
        // this.checkCollisions();

        // Hacer que el sprite reaparezca al salir de la pantalla (efecto de pantalla envolvente)
        // this.wrapAroundScreen();
        // Hacer que el sprite no pase de la pantalla
        this.bounceOnEdges(delta);
        
        // Aplicar fricción para que la velocidad se reduzca gradualmente
        this.speed *= this.friction;

        // Chequear los inputs
        this.checkKeys(delta)
        
         // Calcular el desplazamiento en los ejes X e Y basado en la velocidad y rotación
         const dy = Math.cos(this.sprite.rotation)          //* this.speed;  Direccion en X
         const dx = Math.sin(this.sprite.rotation)          //* this.speed;  Direccion en Y     
 
         // Actualizar la posición del sprite
         this.sprite.x += dx * this.speed * delta.deltaTime
         this.sprite.y -= dy * this.speed * delta.deltaTime // Se resta porque Y aumenta hacia abajo
 
         this.x = this.sprite.x
         this.y = this.sprite.y;                            // Actualizar la posición en variables locales         
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
             // Solo disparar si no se está disparando
             if (!this.isFiring) {
                this.isFiring = true; // Marcar que se está disparando
                const { x, y, rotation } = this.sprite;
                this.game.echoPool.getEcho(x, y, rotation); // Disparar el eco
            }
        }
    }
}