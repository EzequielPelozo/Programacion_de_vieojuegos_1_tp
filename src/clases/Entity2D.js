import * as PIXI from 'pixi.js';

export class Entity2D {
    constructor(x, y, image, game) {
        this.game = game;                                   // Guardamos la referencia al juego
        this.x = x;
        this.y = y;
        this.name = 'entity2d';
        
        this.container = new PIXI.Container();              // Cada entidad guarda una referencia al objeto del juego
        this.rotationSpeed = 0.1;                           // Velocidad de rotación
        this.speed = 0;                                     // Velocidad de desplazamiento inicial
        this.acceleration = 0.2;                            // Aceleración para aumentar/disminuir la velocidad
        this.maxSpeed = 8;                                  // Velocidad máxima de la entidad
        this.friction = 0.98;                               // Factor de fricción para reducir la velocidad gradualmente         
        this.listo = false;
        this.sprite = null;
        this.scale = 0.2;

        this.loadSprite(image);                             // cargar el sprite
       
    }

    SetStartPosition( x, y) {
         // Move the sprite to the screen position.
         this.sprite.x = x;
         this.sprite.y = y;
         // Cambiar la escala para que el sprite sea más pequeño
         this.sprite.scale.set(this.scale); // Aquí puedes ajustar el tamaño (0.5 es la mitad de su tamaño original)
    }

    async loadSprite(image) {
        // console.log(this.name);
        // Crear un sprite usando el alias de la image cargada 
        this.sprite = PIXI.Sprite.from(image);

        // Add to stage.
        this.game.app.stage.addChild(this.sprite);

        // Center the sprite's anchor point.
        this.sprite.anchor.set(0.5);  
        
        // Seteo en su posicion inicial
        this.SetStartPosition(this.x, this.y);

        this.listo = true;
    }

    update(delta) {
        
    }
   
    // Verificar colisiones 
    checkCollisions(other) {
        console.log(other);
        if(!this.isColliding(other)) return; 
        // TODO: Implement in subclass
        console.log("Checking collision");
        
    }

    // Método para verificar si el jugador está colisionando 
    isColliding(other) {
        const dx = this.sprite.x - other.sprite.x;
        const dy = this.sprite.y - other.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Colisión si la distancia es menor que la suma de los radios de ambos sprites
        return distance < (this.sprite.width / 2 + other.sprite.width / 2);
    }

    // Método para hacer que el sprite reaparezca al salir de la pantalla (pantalla envolvente)
    wrapAroundScreen() {
        if (this.sprite.x < 0) {
            this.sprite.x = this.game.app.screen.width;
        } else if (this.sprite.x > this.game.app.screen.width) {
            this.sprite.x = 0;
        }

        if (this.sprite.y < 0) {
            this.sprite.y = this.game.app.screen.height;
        } else if (this.sprite.y > this.game.app.screen.height) {
            this.sprite.y = 0;
        }
    }
}