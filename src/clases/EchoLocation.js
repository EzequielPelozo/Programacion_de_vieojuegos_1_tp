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
        const velocityY = Math.cos(this.container.rotation) * this.speed;
        const velocityX = Math.sin(this.container.rotation) * this.speed;

        this.container.x += velocityX * delta.deltaTime;
        this.container.y -= velocityY * delta.deltaTime;

        // Si la bala sale de la pantalla, desactivarla
        if (this.container.x < 0 || this.container.x > this.game.width ||
            this.container.y < 0 || this.container.y > this.game.height) {
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
    isColliding(otherContainer) {
        const dx = this.container.x - otherContainer.container.x;
        const dy = this.container.y - otherContainer.container.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Colisión si la distancia es menor que la suma de los radios
        return distance < (this.radius + otherContainer.radius);
    }

        // Método para activar la bala y dispararla
        fire(x, y, rotation) {
            if (!this.listo) return;

            console.log('fire', x, y, rotation)
    
            this.x = x;
            this.y = y;
            this.rotation = rotation;
    
            this.container.x = x;
            this.container.y = y;
            this.container .rotation = rotation;
    
            this.active = true;
            this.container.visible = true;  // Mostrar el eco
        }
    
        // Método para desactivar eco
        deactivate() {
            this.active = false;
            this.container.visible = false;  // Ocultar el eco
        }
}