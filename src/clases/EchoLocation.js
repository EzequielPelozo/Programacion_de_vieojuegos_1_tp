import { Entity2D } from "./Entity2D";

export class Echocolocation extends Entity2D {
    constructor(x, y, image, game) {
        super(x, y, image, game);
        this.name = "Echo";     
        this.speed = 10;
        this.active = false; // Estado del eco, si está activa o no 
        this.radius = 5; // Radio del eco para la detección de colisiones   
    }

    update(delta) {
        if (!this.listo) return;
        if (!this.active) return;

        // Mover la bala hacia adelante en la dirección de la rotación
        const velocityY = Math.cos(this.sprite.rotation) * this.speed;
        const velocityX = Math.sin(this.sprite.rotation) * this.speed;

        this.sprite.x += velocityX * delta.deltaTime;
        this.sprite.y -= velocityY * delta.deltaTime;

        // Si la bala sale de la pantalla, desactivarla
        if (this.sprite.x < 0 || this.sprite.x > this.game.width ||
            this.sprite.y < 0 || this.sprite.y > this.game.height) {
            this.deactivate();
        } 
        
        // Verificar colisiones con los peces
        // this.checkCollisions();
    }  
    

    checkCollisions() {
        for (const fish of this.game.fishes) {
            if ( this.isColliding(fish)) {
                this.deactivate(); // Desactivar eco
                break; // Salir del bucle tras la colisión
            }
        }
    }

    // Verificar si la bala está colisionando con el asteroide
    isColliding(asteroid) {
        const dx = this.sprite.x - asteroid.sprite.x;
        const dy = this.sprite.y - asteroid.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Colisión si la distancia es menor que la suma de los radios
        return distance < (this.radius + asteroid.radius);
    }

        // Método para activar la bala y dispararla
        fire(x, y, rotation) {
            if (!this.listo) return;

            console.log('fire', x, y, rotation)
    
            this.x = x;
            this.y = y;
            this.rotation = rotation;
    
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.rotation = rotation;
    
            this.active = true;
            this.sprite.visible = true;  // Mostrar el eco
        }
    
        // Método para desactivar eco
        deactivate() {
            this.active = false;
            this.sprite.visible = false;  // Ocultar el eco
        }
}