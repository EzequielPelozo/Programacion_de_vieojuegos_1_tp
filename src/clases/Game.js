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
        this.echoCount = 10;
        this.predator = null;

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
            addDisplacementEffect(this.app);

            // Instanciar el EcoPool 
            this.echoPool = new EchoPool(this, this.echoCount);

            // Cargo el Player 
            this.player = new Player(this.app.screen.width / 2, this.app.screen.height / 2, 'player', this);

            // Cargo Peces
            this.startFishes();

            //Cargo predator
            this.predator = new Predator(Math.random() * this.width, Math.random() * this.height, 'shark', this)

            this.app.ticker.add((time) => {
                // Lógica del juego aquí
                this.gameLoop(time);
            });
        });

        // Asignar la instancia actual a la propiedad estática
        Game.instance = this;
    }
    gameLoop(time) {

        // Actualizar el jugador        
        this.player.update(time);
        // Actualizar cada pez
        for (let fish of this.fishes) {
            fish.update(time, this.fishes, this.player);
        }
        // Actualiza el depredador
        this.predator.update(time, this.player);
        // Animar el overlay de agua
        animateWaterOverlay(this.app, time);

        // Actualizar todas los ecos activos del pool
        this.echoPool.update(time);

        // Camara sigue personaje
        this.moveCamera();

        //si colisionan vuelve al player al medio de la pantalla
        if (this.checkCollideOfSprites(this.player, this.predator)) {
            this.player.sprite.x = (this.app.screen.width / 2)
            this.player.sprite.y = (this.app.screen.height / 2)

            this.player.x = (this.app.screen.width / 2)
            this.player.y = (this.app.screen.width / 2)
        }

        //si colisionan se le aplica una desaceleracion a al predador y una velocidad = 0
        for (let echo of this.echoPool.echoes) {
            if (this.checkCollideOfSprites(this.predator, echo)) {
                this.predator.acceleration.set({ x: -2, y: -2 });
                this.predator.velocity = ({ x: 0, y: 0 });
            }
        }
    }

    async preload() {
        const assets = [
            { alias: 'background', src: backgroundImage },
            { alias: 'overlay', src: waveOverlay },
            { alias: 'displacement', src: displacementMap },
            { alias: 'fish', src: FishImage },
            { alias: 'player', src: PlayerImage },
            { alias: 'echo', src: Echo },
            { alias: 'shark', src: SharkImage }
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
}