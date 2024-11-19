import * as PIXI from 'pixi.js';
import { addBackground } from '../components/addBackground.js'
import { addWaterOverlay, animateWaterOverlay } from '../components/addWaterOverlay.js';
import { addDisplacementEffect } from '../components/addDisplacementEffect.js';
import { Player } from './Player.js';                             // Importamos la clase Player 
import { Fish } from './Fish.js';                                 // Importa la clase Fish
import { lerp } from '../components/Utils.js';
import { EchoPool } from "./EchoPool";
import { Predator } from './Predator.js';
import { Grid } from './Grid.js';

// Imagenes
import backgroundImage from '../sprites/sea_background.png';     // Usa la ruta relativa
import waveOverlay from '../sprites/wave_overlay.png';         // Usa la ruta relativa
import displacementMap from '../sprites/displacement_map.png';     // Usa la ruta relativa
import PlayerImage from '../sprites/dolphin/dolphin-0.png';  // Usa la ruta relativa

//frames para animaciones
import PlayerEating from '../sprites/dolphin/dolphin-eating.png';

import PlayerFrame1 from '../sprites/dolphin/dolphin-1.png';
import PlayerFrame2 from '../sprites/dolphin/dolphin-2.png';

import FishFrame1 from '../sprites/fish/fish-1.png';
import FishFrame2 from '../sprites/fish/fish-2.png';


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

        const CELL_SIZE = 100; // Ajusta el tamaño de la celda según el tamaño del mapa y número de peces
        this.grid = new Grid(CELL_SIZE, this.width, this.height); // Inicializar la grilla

        this.mainContainer = new PIXI.Container();
        this.ui = new PIXI.Container();

        this.player = null;
        this.fishes = [];

        this.fishesCountText = 0;
        this.fishCount = 1000;
        this.echoCharges = 3; // Inicializar cargas de eco
        this.maxEchoCharges = 3; // Cargas máximas de eco
        this.EchoPoolSize = 15
        this.echoTimer = 0; // Temporizador para recarga de eco
        this.predatorsQuantity = 2;
        this.predators = [];
        this.timeText = null;
        this.startTime = 0; // Tiempo de inicio
        this.totalSeconds = 60; // Tiempo total en segundos
        this.lives = 3; // Inicializar las vidas
        this.heartImages = []; // Array para almacenar los corazones
        this.gameOver = false;
        this.framenum = 0;
        this.fpsCounter = 0;
        this.lastTime = performance.now();
        this.AverageFPS = 60;
        this.ArrayLastFPS = []

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
            this.echoPool = new EchoPool(this, this.EchoPoolSize);

            // Cargo el Player 
            this.player = new Player(this.app.screen.width / 2, this.app.screen.height / 2, 'player', this, this.mainContainer);

            // Cargo Tiburones
            this.startPredators(this.predatorsQuantity);

            // Cargo Peces
            this.startFishes(this.fishCount-this.fishes-length);


            //Cargo el timer al final para que este en la ultima capa
            this.createUI();
            //this.createHearts(); // Mover la carga de corazones aquí

            this.app.ticker.add((time) => {
                // Lógica del juego aquí
                this.gameLoop(time);
            });
        });

        // Llama a esta función para comenzar la recarga de eco
        // this.startEchoRecharge();

        // Asignar la instancia actual a la propiedad estática
        Game.instance = this;
    }

    // Método para iniciar la recarga de eco ACA SE PODRIA CAMBIAR EL SET INTERVAL POR CONTADOR  DE FRAMES - Hecho
    startEchoRecharge() {
        // setInterval(() => {

        //     if (this.echoCharges < this.maxEchoCharges) {
        //         this.echoCharges++;
        //     }
        // }, 3000); // Cada 3 segundos
        if (this.framenum % 180 === 0 && this.echoCharges < this.maxEchoCharges) {
            this.echoCharges++;
        }
    }

    gameLoop(time) {

        //console.log(time)

        if (this.framenum === 0) { this.showFPS(); }

        this.framenum++;

        // Llama a esta función para comenzar la recarga de eco
        this.startEchoRecharge();

        // Contador de FPS para validar performance
        this.UpdateFPS();

        // Actualiza contador de Ecos
        this.updateEchoDisplay();

        // Actualizar el jugador     
        this.player.update(time, this.gameOver);

        // Actualizar cada pez
        for (let fish of this.fishes) {
            fish.update(time, this.fishes, this.player, this.framenum);
        }

        // Solo actualizar la grilla cada 2 frames
        if (this.framenum % 2 === 0) {
            this.grid.updateGrid(this.fishes);
        }

        // Actualiza el depredador
        if (!this.gameOver) {
            for (let preda of this.predators) {
                preda.update(time, this.player, this.fishes);
            }
        }

        // Animar el overlay de agua
        animateWaterOverlay(this.app, time);

        // Actualizar todas los ecos activos del pool
        this.echoPool.update(time);

        // Camara sigue personaje
        this.moveCamera();


        // Chequear colisión con el depredador
        for (let preda of this.predators) {
            if (this.checkCollideOfContainers(this.player, preda)) {
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
                if (this.checkCollideOfContainers(preda, echo)) {
                    preda.acceleration.set({ x: -2, y: -2 });
                    preda.velocity = ({ x: 0, y: 0 });
                }
            }
        }

        this.fishesCountText = this.fishes.length;
        this.capturedFishesText.text = this.fishesCountText;

        //Condición de Victoria
        if (this.fishes.length === 0 && !this.gameOver)  {
            console.log('You Win'); // Placeholder para lógica de fin de juego
            this.createWin();
        }

        //si no tiene mas vidas, no actualizo el tiempo
        if (this.startTime === 0) {
            this.startTime = this.app.ticker.lastTime; // Guarda el tiempo de inicio
            this.totalTime = 300; // 60 segundos para el temporizador (1 minuto)
        }

        // Calcula el tiempo transcurrido desde el inicio
        let elapsedTime = (this.app.ticker.lastTime - this.startTime) / 1000; // Tiempo en segundos

        // Calcula el tiempo restante
        let remainingTime = this.totalTime - Math.floor(elapsedTime);

        // Si el tiempo restante es mayor o igual a 0, actualiza el temporizador
        if (remainingTime >= 0) {
            this.timeText.text = this.formatTime(remainingTime); // Actualiza el texto del temporizador
        } else {
            this.timeText.text = '00:00'; // Si el tiempo se acaba, muestra 00:00
            
            if (!this.gameOver) {
                // Lógica para terminar el juego o reiniciar
                console.log('Game Over'); // Placeholder para lógica de fin de juego
                this.createGameOver();
            }
        }
    }

    resetPlayerPosition() {
        this.player.container.x = (this.app.screen.width / 2);
        this.player.container.y = (this.app.screen.height / 2);
        this.player.x = (this.app.screen.width / 2);
        this.player.y = (this.app.screen.width / 2);
        //this.resetTimer();
    }

    async preload() {
        const assets = [
            { alias: 'background', src: backgroundImage },
            { alias: 'overlay', src: waveOverlay },
            { alias: 'displacement', src: displacementMap },
            { alias: 'fish', src: FishImage },
            { alias: 'player', src: PlayerImage },
            { alias: 'player-frame-1', src: PlayerFrame1 },
            { alias: 'player-frame-2', src: PlayerFrame2 },
            { alias: 'fish-frame-1', src: FishFrame1 },
            { alias: 'fish-frame-2', src: FishFrame2 },
            { alias: 'player_eating', src: PlayerEating },
            { alias: 'echo', src: Echo },
            { alias: 'shark', src: SharkImage },
            { alias: 'heart_full', src: HeartFullImage }, // Cargar la imagen de corazones
            { alias: 'heart_half', src: HeartHalfImage }, // Cargar la imagen de corazones
            { alias: 'heart_empty', src: HeartEmptyImage } // Cargar la imagen de corazones
        ];

        // Usamos `PIXI.Assets.load` para cargar todos los recursos
        await PIXI.Assets.load(assets);
    }

    
    startPredators(quantity) {
        for (let i = 0; i < quantity; i++) {
            const predator = new Predator(Math.random() * this.width, Math.random() * this.height, 'shark', this)
            this.predators.push(predator);
        }
    }

    startFishes(quantity) {
        for (let i = 0; i < quantity; i++) {
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
    checkCollideOfContainers(entity1, entity2) {

        const rect1 = entity1.container.getBounds();
        const rect2 = entity2.container.getBounds();
        //quiza se pueda optimizar mejor ya que hay veces que no se hace correctamente la colision
        return (
            //divido el ancho y el alto a la mitad porque sino la "caja" de colision es muy grande y los container ni se tocan y lo toma como colision.
            rect1.x < rect2.x + (rect2.width / 2) &&
            rect1.x + (rect1.width / 2) > rect2.x &&
            rect1.y < rect2.y + (rect2.height / 2) &&
            rect1.y + (rect1.height / 2) > rect2.y
        );
    }

    //Creo el UI y lo agrego a un container diferente
    createUI() {
        this.ui.name = "UI";
        this.app.stage.addChild(this.ui);

        this.createTimeText();
        this.createHearts(); // Mover la carga de corazones aquí
        this.createEchoCounter(); // Crear el contador de eco

        this.createCapturedFishesText();
    }

    createTimeText() {
        this.timeText = new PIXI.Text();
        this.timeText.text = "01:00";
        this.timeText.style.fontSize = '40px'
        this.timeText.style.fontFamily = "PressStart2P-Regular";
        this.timeText.style.align = "center";
        this.timeText.x = window.innerWidth / 2 - this.timeText.width / 2;
        this.timeText.y = 30;
        this.timeText.style.fill = "white";
        this.ui.addChild(this.timeText);
    }

    createCapturedFishesText() {

        this.fishesCountText = this.fishes.length;
        this.capturedFishesText = new PIXI.Text();
        this.capturedFishesText.text = this.fishesCountText;
        this.capturedFishesText.style.fontSize = '40px'
        this.capturedFishesText.style.fontFamily = "PressStart2P-Regular";
        this.capturedFishesText.style.align = "center";
        this.capturedFishesText.x = (window.innerWidth / 2 - this.capturedFishesText.width / 2) - 200;
        this.capturedFishesText.y = 30;
        this.capturedFishesText.style.fill = "white";
        this.ui.addChild(this.capturedFishesText);
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

    showFPS() {
        this.FPSText = new PIXI.Text();
        this.FPSText.style.fontSize = '20px';
        //this.FPSText.style.fontFamily = "PressStart2P-Regular";
        this.FPSText.style.align = "center";
        this.FPSText.x = 0;//window.innerWidth / 2 - this.FPSText.width / 2;
        this.FPSText.y = window.innerHeight - this.FPSText.height;
        this.FPSText.style.fill = "white";
        this.FPSText.text = "FPS: ";
        this.ui.addChild(this.FPSText);
    }

    UpdateFPS() {
        const currentTime = performance.now();
        this.fpsCounter = 1000 / (currentTime - this.lastTime);
        this.lastTime = currentTime;
        // console.log(this.fpsCounter);
        this.FPSText.text = 'FPS:' + Math.round(this.fpsCounter).toString();
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
        this.gameOver = true;
        this.ui.addChild(this.gameoverText);
    }

    createWin() {
        this.WinText = new PIXI.Text();
        this.WinText.text = "YOU WIN\n press `R` to restart";
        this.WinText.style.fontSize = '60px'
        this.WinText.style.fontFamily = "PressStart2P-Regular";
        this.WinText.style.align = "center";
        this.WinText.x = window.innerWidth / 2 - this.WinText.width / 2;
        this.WinText.y = window.innerHeight / 2 - this.WinText.height / 2;
        this.WinText.style.fill = "white";
        this.gameOver = true;
        this.ui.addChild(this.WinText);
    }

    restartGame() {
        this.gameOver = false;     
        this.ui.removeChildAt((this.ui.children.length - 1));
        this.resetTimer();
        this.lives = 3;
        this.updateHeartDisplay();
        for (let preda of this.predators) {
            preda.SetStartPosition(Math.random() * this.width, Math.random() * this.height)
        }
        this.startFishes(this.fishCount-this.fishes-length);
    }
}