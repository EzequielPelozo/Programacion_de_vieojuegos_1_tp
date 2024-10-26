import * as PIXI from 'pixi.js';
import { addBackground } from '../components/addBackground.js'
import { addWaterOverlay, animateWaterOverlay } from '../components/addWaterOverlay.js'
import { addDisplacementEffect } from '../components/addDisplacementEffect.js'
import { Player } from './Player.js';                             // Importamos la clase Player 
import { Fish } from './Fish.js';                                 // Importa la clase Fish
import { lerp } from '../components/Utils.js'
import { EchoPool } from "./EchoPool";
import { Predator } from './Predator.js';

// Imagenes
import backgroundImage from '../sprites/sea_background_1.png';     // Usa la ruta relativa
import waveOverlay from '../sprites/wave_overlay.png';         // Usa la ruta relativa
import displacementMap from '../sprites/displacement_map.png';     // Usa la ruta relativa
import PlayerImage from '../sprites/dopphin_top_view_ph.png';  // Usa la ruta relativa
import FishImage from '../sprites/fish_1_ph.png';            // Usa la ruta relativa
import Echo from '../sprites/echolocation.png';         // Usa la ruta relativa
import SharkImage from '../sprites/shark-tv.png';             // Usa la ruta relativa
import HeartFullImage from '../sprites/heart_full.png';            // Usa la ruta relativa
import HeartHalfImage from '../sprites/heart_half.png';            // Usa la ruta relativa
import HeartEmptyImage from '../sprites/heart_empty.png';            // Usa la ruta relativa
export class Game {
    // Propiedad estática que contendrá la única instancia de la clase (Singleton)
    static instance = null;

    constructor() {
        // Si ya existe una instancia, retornarla y no crear una nueva
        if (Game.instance) {
            return Game.instance;
        }
        // Si no existe, inicializar la instancia
        console.log('Game Init');
        this.app = new PIXI.Application();
        this.width = window.innerWidth * 4;
        this.height = window.innerHeight * 4;
        this.escale = 1

        this.mainContainer = new PIXI.Container();

        this.player = null;
        this.fishes = [];
        this.fishCount = 600;
        this.echoCharges = 3; // Inicializar cargas de eco
        this.maxEchoCharges = 3; // Cargas máximas de eco
        this.echoTimer = 0; // Temporizador para recarga de eco
        this.predator = null;
        this.timeText = null;
        this.startTime = 0; // Tiempo de inicio
        this.totalSeconds = 0; // Tiempo total en segundos
        this.lives = 3; // Inicializar las vidas
        this.heartImages = []; // Array para almacenar los corazones
        this.gameOver = false;

        let promise = this.app.init({ width: this.width, height: this.height });

        promise.then(async () => {
            document.body.appendChild(this.app.canvas);
            window.__PIXI_APP__ = this.app;

            // Esperar que los recursos se carguen antes de añadir el fondo
            await this.preload();

            this.mainContainer.name = "contenedorPrincipal";
            this.app.stage.addChild(this.mainContainer);

            // Cargar el Fondo
            addBackground(this);
            addWaterOverlay(this);
            //le paso el contenedor para tener la interfaz y el juego en diferentes contenedores ya que si estan en el mismo afecta a la interfaz el filtro.
            addDisplacementEffect(this.app, this.mainContainer);

            // Instanciar el EcoPool 
            this.echoPool = new EchoPool(this, this.echoCharges);

            // Cargo el Player 
            this.player = new Player(this.app.screen.width / 2, this.app.screen.height / 2, 'player', this);

            // Cargo Peces
            this.startFishes();

            //Cargo predator
            this.predator = new Predator(Math.random() * this.width, Math.random() * this.height, 'shark', this)

            //Cargo el timer al final para que este en la ultima capa
            this.createUI();
            //this.createHearts(); // Mover la carga de corazones aquí

            this.app.ticker.add((time) => {
                // Lógica del juego aquí
                this.gameLoop(time);
            });
        });

        // Llama a esta función para comenzar la recarga de eco
        this.startEchoRecharge();

        // Asignar la instancia actual a la propiedad estática
        Game.instance = this;
    }

    // Método para iniciar la recarga de eco
    startEchoRecharge() {
        setInterval(() => {

            if (this.echoCharges < this.maxEchoCharges) {
                this.echoCharges++;
                this.updateEchoDisplay();

            }
        }, 3000); // Cada 3 segundos
    }

    gameLoop(time) {

        // Actualizar el jugador        
        this.player.update(time);
        // Actualizar cada pez
        for (let fish of this.fishes) {
            fish.update(time, this.fishes, this.player);
        }
        // Actualiza el depredador
        this.predator.update(time, this.player, this.fishes);
        // Animar el overlay de agua
        animateWaterOverlay(this.app, time);

        // Actualizar todas los ecos activos del pool
        this.echoPool.update(time);

        // Camara sigue personaje
        this.moveCamera();


        // Chequear colisión con el depredador
        if (this.checkCollideOfSprites(this.player, this.predator)) {
            this.lives--; // Reducir vidas
            this.updateHeartDisplay(); // Actualizar visualización de vidas
            if (this.lives <= 0 && !this.gameOver) {
                // Lógica para terminar el juego o reiniciar
                console.log('Game Over'); // Placeholder para lógica de fin de juego
                this.createGameOver();
            } else {
                this.resetPlayerPosition(); // Resetear posición del jugador
            }
        }

        //si colisionan se le aplica una desaceleracion a al predador y una velocidad = 0
        for (let echo of this.echoPool.echoes) {
            if (this.checkCollideOfSprites(this.predator, echo)) {
                this.predator.acceleration.set({ x: -2, y: -2 });
                this.predator.velocity = ({ x: 0, y: 0 });
            }
        }

        //si no tiene mas vidas, no actualizo el tiempo
        if (this.lives > 0) {
            if (this.startTime === 0) {
                this.startTime = this.app.ticker.lastTime; // Guarda el tiempo inicial
            }

            this.totalSeconds = Math.floor((this.app.ticker.lastTime - this.startTime) / 1000);
            this.timeText.text = this.formatTime(this.totalSeconds);
        }
    }


    resetPlayerPosition() {
        this.player.sprite.x = (this.app.screen.width / 2);
        this.player.sprite.y = (this.app.screen.height / 2);
        this.player.x = (this.app.screen.width / 2);
        this.player.y = (this.app.screen.width / 2);
        this.resetTimer();
    }

    async preload() {
        const assets = [
            { alias: 'background', src: backgroundImage },
            { alias: 'overlay', src: waveOverlay },
            { alias: 'displacement', src: displacementMap },
            { alias: 'fish', src: FishImage },
            { alias: 'player', src: PlayerImage },
            { alias: 'echo', src: Echo },
            { alias: 'shark', src: SharkImage },
            { alias: 'heart_full', src: HeartFullImage }, // Cargar la imagen de corazones
            { alias: 'heart_half', src: HeartHalfImage }, // Cargar la imagen de corazones
            { alias: 'heart_empty', src: HeartEmptyImage } // Cargar la imagen de corazones
        ];

        // Usamos `PIXI.Assets.load` para cargar todos los recursos
        await PIXI.Assets.load(assets);
    }

    startFishes() {
        for (let i = 0; i < this.fishCount; i++) {
            const fish = new Fish(Math.random() * this.width, Math.random() * this.height, 'fish', this);
            this.fishes.push(fish);
        }
    }

    moveCamera() {

        // El valor objetivo de la cámara, centrado en el jugador
        let targetX = -this.player.x + window.innerWidth / 2;
        let targetY = -this.player.y + window.innerHeight / 2;

        // Suavizar el movimiento usando lerp
        this.mainContainer.x = lerp(this.mainContainer.x, targetX, 0.1);
        this.mainContainer.y = lerp(this.mainContainer.y, targetY, 0.1);

        // Ajustar la escala si es necesario
        this.mainContainer.scale.set(this.escale);
    }

    //Chequeo si colisionan dos entidades (aplica para el predador y el player, el predador y el echo, etc)
    checkCollideOfSprites(entity1, entity2) {

        const rect1 = entity1.sprite.getBounds();
        const rect2 = entity2.sprite.getBounds();
        //quiza se pueda optimizar mejor ya que hay veces que no se hace correctamente la colision
        return (
            //divido el ancho y el alto a la mitad porque sino la "caja" de colision es muy grande y los sprites ni se tocan y lo toma como colision.
            rect1.x < rect2.x + (rect2.width / 2) &&
            rect1.x + (rect1.width / 2) > rect2.x &&
            rect1.y < rect2.y + (rect2.height / 2) &&
            rect1.y + (rect1.height / 2) > rect2.y
        );
    }

    //Creo el UI y lo agrego a un container diferente
    createUI() {
        this.ui = new PIXI.Container();
        this.ui.name = "UI";
        this.app.stage.addChild(this.ui);

        this.createTimeText();
        this.createHearts(); // Mover la carga de corazones aquí
        this.createEchoCounter(); // Crear el contador de eco
    }

    createTimeText() {
        this.timeText = new PIXI.Text();
        this.timeText.text = "00:00";
        this.timeText.style.fontSize = '40px'
        this.timeText.style.fontFamily = "PressStart2P-Regular";
        this.timeText.style.align = "center";
        this.timeText.x = window.innerWidth / 2 - this.timeText.width / 2;
        this.timeText.y = 30;
        this.timeText.style.fill = "white";
        this.ui.addChild(this.timeText);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60); // Obtener los minutos
        const remainingSeconds = seconds % 60; // Obtener los segundos restantes
        //Devuelvo los minutos y segundos formateados.
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    resetTimer() {
        this.startTime = 0;
        this.totalSeconds = 0;
        this.timeText.text = this.formatTime(this.totalSeconds);
    }

    createHearts() {

        for (let i = 0; i < 1; i++) {
            const heart = new PIXI.Sprite(PIXI.Assets.get('heart_full')); // Usar el alias correcto
            heart.width = 50; // Ajusta el tamaño según sea necesario
            heart.height = 50;
            heart.x = 30 + (i * 60); // Espaciado entre corazones
            heart.y = 30; // Posición vertical

            this.heartImages.push(heart); // Almacenar la referencia del corazón
            this.ui.addChild(heart); // Agregar el corazón al contenedor de UI
        }

        this.updateHeartDisplay(); // Mostrar el estado inicial
    }


    updateHeartDisplay() {
        // Este método se llama para actualizar los corazones según las vidas restantes
        for (let i = 0; i < this.heartImages.length; i++) {
            const heart = this.heartImages[i];
            if (this.lives > 2) {
                heart.texture = PIXI.Assets.get('heart_full'); // Vida completa
            } else if (this.lives === 2) {
                heart.texture = PIXI.Assets.get('heart_half'); // Media vida
            } else if (this.lives === 1) {
                heart.texture = PIXI.Assets.get('heart_empty'); // Sin vida
            } else {
                heart.texture = PIXI.Texture.EMPTY; // Ocultar el corazón si no hay vidas
            }
        }
    }


    // Método para crear el contador de eco
    createEchoCounter() {
        // Cargar el sprite de eco
        const echoSprite = new PIXI.Sprite(PIXI.Assets.get('echo'));
        echoSprite.width = 50; // Ajusta el tamaño según sea necesario
        echoSprite.height = 30;
        echoSprite.x = window.innerWidth - 120;
        echoSprite.y = 25; // Posición vertical
        this.ui.addChild(echoSprite); // Agregar el eco al contenedor de UI

        // Crear el texto para el contador de cargas
        this.echoText = new PIXI.Text();
        this.echoText.text = this.echoCharges.toString();
        this.echoText.style.fontSize = '30px'
        this.echoText.style.fontFamily = "PressStart2P-Regular";
        this.echoText.style.align = "center";
        this.echoText.x = echoSprite.x + echoSprite.width + 10; // Espaciado entre sprite y texto
        this.echoText.y = 30;
        this.echoText.style.fill = "white";
        this.ui.addChild(this.echoText); // Agregar el texto al contenedor
    }

    // Método para actualizar la visualización del contador de eco
    updateEchoDisplay() {
        this.echoText.text = this.echoCharges.toString();
    }

    createGameOver() {
        this.gameoverText = new PIXI.Text();
        this.gameoverText.text = "GAME OVER\n press `R` to restart";
        this.gameoverText.style.fontSize = '60px'
        this.gameoverText.style.fontFamily = "PressStart2P-Regular";
        this.gameoverText.style.align = "center";
        this.gameoverText.x = window.innerWidth / 2 - this.gameoverText.width / 2;
        this.gameoverText.y = window.innerHeight / 2 - this.gameoverText.height / 2;
        this.gameoverText.style.fill = "white";
        this.timeText.text = "00:00";
        this.gameOver = true;
        this.ui.addChild(this.gameoverText);
    }

    restartGame() {
        this.gameOver = false;
        this.ui.removeChildAt((this.ui.children.length - 1));
        this.resetTimer();
        this.lives = 3;
        this.updateHeartDisplay();
        this.predator.SetStartPosition(Math.random() * this.width, Math.random() * this.height)
    }
}